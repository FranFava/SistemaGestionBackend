const mongoose = require('mongoose');
const Comprobante = require('../models/Comprobante');
const MovimientoCta = require('../models/MovimientoCta');
const MovimientoStock = require('../models/MovimientoStock');
const Producto = require('../models/Producto');
const CuentaCorriente = require('../models/CuentaCorriente');
const Tercero = require('../models/Tercero');
const TipoCambio = require('../models/TipoCambio');

const comprobanteRepo = require('../repositories/comprobante.repository');
const movimientoRepo = require('../repositories/movimiento.repository');
const stockRepo = require('../repositories/stock.repository');
const { toDecimal128, toNumber, multiply, subtract, round, divide, add } = require('../utils/decimal.utils');
const { obtenerCotizacion, calcularEquivalentes } = require('../utils/cambio.utils');

const EFECTO_CONTABLE = {
  compra: {
    FACT: 'HABER',
    REC: 'DEBE',
    NC: 'DEBE',
    ND: 'HABER',
    SENIA: 'DEBE',
    REM: null
  },
  venta: {
    FACT: 'DEBE',
    REC: 'HABER',
    NC: 'HABER',
    ND: 'DEBE',
    SENIA: 'HABER',
    REM: null
  }
};

const TIPO_MOVIMIENTO_STOCK = {
  compra: {
    FACT: 'entrada',
    REM: 'entrada',
    NC: 'salida'
  },
  venta: {
    FACT: 'salida',
    REM: 'salida',
    NC: 'entrada'
  }
};

async function registrarComprobante(payload) {
  const {
    id_cuenta,
    tipo,
    origen = 'compra',
    moneda,
    nro_comprobante,
    fecha,
    fecha_vencimiento,
    cotizacion_usado,
    id_tipo_cambio,
    items = [],
    observaciones,
    es_senia = false,
    id_remito_origen
  } = payload;

  if (!id_cuenta || !tipo || !moneda || !items.length) {
    throw new Error('id_cuenta, tipo, moneda e items son requeridos');
  }

  if (!['venta', 'compra'].includes(origen)) {
    throw new Error('origen debe ser venta o compra');
  }

  if (!['ARS', 'USD'].includes(moneda)) {
    throw new Error('moneda debe ser ARS o USD');
  }

  const cuenta = await CuentaCorriente.findById(id_cuenta);
  if (!cuenta) {
    throw new Error('Cuenta corriente no encontrada');
  }

  if (cuenta.moneda !== moneda) {
    throw new Error(`La moneda del comprobante (${moneda}) no coincide con la cuenta (${cuenta.moneda})`);
  }

  if (moneda === 'USD' && !cotizacion_usado) {
    throw new Error('cotizacion_usado es obligatorio para comprobantes en USD');
  }

  const cotizacionDecimal = cotizacion_usado ? toDecimal128(cotizacion_usado) : null;

  const fechaComprobante = fecha ? new Date(fecha) : new Date();
  let tc = null;

  if (id_tipo_cambio) {
    tc = await TipoCambio.findById(id_tipo_cambio);
  } else if (cotizacionDecimal && moneda === 'USD') {
    const cotizacionNum = toNumber(cotizacionDecimal);
    tc = await TipoCambio.findOne({
      valor_ars_por_usd: cotizacionNum,
      fecha: { $lte: fechaComprobante, $gte: new Date(fechaComprobante.getTime() - 3 * 24 * 60 * 60 * 1000) },
      vigente: true
    });
  }

  const productos = await Producto.find({
    _id: { $in: items.map(i => i.id_producto) }
  });

  const productoMap = {};
  productos.forEach(p => { productoMap[p._id.toString()] = p; });

  const itemsProcesados = items.map((item, idx) => {
    const cant = toDecimal128(item.cantidad);
    const precio = toDecimal128(item.precio_unitario);
    const desc = item.descuento_pct ? toDecimal128(item.descuento_pct) : toDecimal128(0);
    const bruto = multiply(cant, precio);
    const descuento = multiply(bruto, divide(desc, toDecimal128(100)));
    const subtotal = round(subtract(bruto, descuento));

    const prod = productoMap[item.id_producto.toString?.() || item.id_producto];
    const monedaItem = item.moneda || moneda;

    let cotizacionUso = null;
    if (monedaItem === 'USD') {
      cotizacionUso = cotizacion_usado ? toDecimal128(cotizacion_usado) : toDecimal128(1);
    }

    return {
      id_producto: item.id_producto,
      cantidad: cant,
      precio_unitario: precio,
      descuento_pct: desc,
      subtotal,
      moneda: monedaItem,
      cotizacion_uso: cotizacionUso
    };
  });

  const montoTotal = Comprobante.calcularMontoOriginal(itemsProcesados);

  const equivalentes = calcularEquivalentes(montoTotal, moneda, cotizacionDecimal);

  const nro = nro_comprobante || `${tipo}-${Date.now()}`;

  const comprobanteData = {
    id_cuenta,
    tipo,
    origen,
    moneda,
    nro_comprobante: nro,
    fecha: fechaComprobante,
    monto_original: montoTotal,
    fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
    es_senia,
    id_remito_origen: id_remito_origen || undefined,
    id_tipo_cambio: tc ? tc._id : undefined,
    cotizacion_usado: cotizacionDecimal,
    equivalente_ars: equivalentes.equivalente_ars,
    equivalente_usd: equivalentes.equivalente_usd,
    observaciones,
    items: itemsProcesados
  };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const comprobante = await comprobanteRepo.create(comprobanteData, session);

    const efectoContable = EFECTO_CONTABLE[origen]?.[tipo];

    let movimientos = [];
    if (efectoContable) {
      const concepto = `${tipo} ${nro}${observaciones ? ' - ' + observaciones : ''}`;
      const movimiento = await movimientoRepo.create({
        id_cuenta,
        id_comprobante: comprobante._id,
        fecha: fechaComprobante,
        tipo: efectoContable,
        monto: montoTotal,
        moneda,
        concepto,
        observaciones
      }, session);
      movimientos.push(movimiento);
    }

    let movimientosStock = [];
    if (TIPO_MOVIMIENTO_STOCK[origen]?.[tipo]) {
      const tipoMovStock = TIPO_MOVIMIENTO_STOCK[origen][tipo];

      const itemsConStock = itemsProcesados
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => {
          const prod = productoMap[item.id_producto.toString?.() || item.id_producto];
          return prod && prod.tipo === 'bien';
        });

      for (const { item, idx } of itemsConStock) {
        await stockRepo.create({
          id_producto: item.id_producto,
          id_comprobante: comprobante._id,
          id_item_idx: idx,
          tipo: tipoMovStock,
          cantidad: item.cantidad,
          fecha: fechaComprobante,
          deposito: 'Central'
        }, session);
      }

      movimientosStock = await stockRepo.findByComprobante(comprobante._id);
    }

    let diferenciasMatching = [];
    if (id_remito_origen) {
      const remito = await Comprobante.findById(id_remito_origen).session(session);
      if (remito && remito.tipo === 'REM') {
        diferenciasMatching = matchingRemitoFactura(remito, itemsProcesados);
      }
    }

    await session.commitTransaction();

    const saldo = await movimientoRepo.aggregateSaldo(id_cuenta, moneda);

    return {
      comprobante,
      movimientos,
      movimientosStock,
      diferenciasMatching,
      saldo
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function listarPendientes(idTercero, origen, moneda) {
  const query = { estado: { $in: ['pendiente', 'parcial'] } };
  if (origen) query.origen = origen;
  if (moneda) query.moneda = moneda;

  if (idTercero) {
    const cuentas = await CuentaCorriente.find({ id_tercero: idTercero, activa: true });
    const cuentaIds = cuentas.map(c => c._id);
    if (cuentaIds.length) {
      query.id_cuenta = { $in: cuentaIds };
    } else {
      return [];
    }
  }

  return Comprobante.find(query)
    .populate({
      path: 'id_cuenta',
      populate: { path: 'id_tercero', select: 'razon_social nombre email' }
    })
    .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
    .sort({ fecha_vencimiento: 1 });
}

async function getSaldoCuenta(idCuenta, moneda = null) {
  return movimientoRepo.aggregateSaldo(idCuenta, moneda);
}

function calcularDiferenciaCambio(idComprobante, cotizacionPago) {
  return (async () => {
    const comprobante = await Comprobante.findById(idComprobante);
    if (!comprobante) {
      throw new Error('Comprobante no encontrado');
    }

    if (!comprobante.cotizacion_usado) {
      throw new Error('El comprobante no tiene cotizacion_usado');
    }

    const cotizacionPagoDecimal = typeof cotizacionPago === 'number'
      ? toDecimal128(cotizacionPago)
      : toDecimal128(cotizacionPago);

    const diffCotizacion = subtract(cotizacionPagoDecimal, comprobante.cotizacion_usado);
    const diferencia = multiply(diffCotizacion, comprobante.monto_original);
    const numDiff = toNumber(diferencia);

    return {
      id_comprobante: comprobante._id,
      nro_comprobante: comprobante.nro_comprobante,
      moneda: comprobante.moneda,
      monto_original: comprobante.monto_original,
      cotizacion_original: comprobante.cotizacion_usado,
      cotizacion_pago: cotizacionPagoDecimal,
      diferencia_cotizacion: round(diffCotizacion),
      diferencia_monto: round(diferencia),
      ganancia_perdida: numDiff >= 0 ? 'ganancia' : 'perdida',
      monto: Math.abs(numDiff)
    };
  })();
}

function matchingRemitoFactura(remito, itemsFactura) {
  if (!remito || !remito.items || !remito.items.length) {
    return [];
  }

  const remitoMap = {};
  remito.items.forEach(item => {
    const key = item.id_producto.toString();
    remitoMap[key] = {
      id_producto: item.id_producto,
      cantidad_remito: toNumber(item.cantidad)
    };
  });

  const facturaMap = {};
  itemsFactura.forEach(item => {
    const key = item.id_producto.toString();
    facturaMap[key] = {
      id_producto: item.id_producto,
      cantidad_factura: toNumber(item.cantidad)
    };
  });

  const diferencias = [];
  const allKeys = new Set([...Object.keys(remitoMap), ...Object.keys(facturaMap)]);

  for (const key of allKeys) {
    const rem = remitoMap[key] || { cantidad_remito: 0 };
    const fac = facturaMap[key] || { cantidad_factura: 0 };

    const diff = Math.round((fac.cantidad_factura - rem.cantidad_remito) * 100) / 100;

    if (diff !== 0) {
      diferencias.push({
        id_producto: fac.id_producto || rem.id_producto,
        cant_remito: rem.cantidad_remito,
        cant_factura: fac.cantidad_factura,
        diferencia: diff,
        signo: diff > 0 ? 'mayor' : 'menor'
      });
    }
  }

  return diferencias;
}

async function getComprobanteWithSaldo(idComprobante) {
  const comprobante = await comprobanteRepo.findById(idComprobante);
  if (!comprobante) return null;

  const saldo = await movimientoRepo.aggregateSaldo(comprobante.id_cuenta, comprobante.moneda);
  return { comprobante, saldo };
}

async function aplicarPago(idComprobante, monto) {
  const comprobante = await Comprobante.findById(idComprobante)
    .populate('id_cuenta');
  if (!comprobante) {
    throw new Error('Comprobante no encontrado');
  }

  if (comprobante.estado === 'cancelado') {
    throw new Error('Comprobante ya cancelado');
  }

  const montoDecimal = toDecimal128(monto);
  const montoNum = toNumber(montoDecimal);

  if (montoNum <= 0) {
    throw new Error('monto debe ser positivo');
  }

  const saldoNum = toNumber(comprobante.saldo_pendiente);
  if (montoNum > saldoNum) {
    throw new Error('El pago excede el saldo pendiente');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    comprobante.aplicarPago(monto);
    await comprobante.save({ session });

    const concepto = `Pago ${comprobante.tipo} ${comprobante.nro_comprobante}`;
    await movimientoRepo.create({
      id_cuenta: comprobante.id_cuenta._id,
      id_comprobante: comprobante._id,
      fecha: new Date(),
      tipo: 'HABER',
      monto: montoDecimal,
      moneda: comprobante.moneda,
      concepto
    }, session);

    await session.commitTransaction();

    const saldo = await movimientoRepo.aggregateSaldo(comprobante.id_cuenta._id, comprobante.moneda);

    return { comprobante, saldo };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = {
  registrarComprobante,
  listarPendientes,
  getSaldoCuenta,
  calcularDiferenciaCambio,
  matchingRemitoFactura,
  getComprobanteWithSaldo,
  aplicarPago
};
