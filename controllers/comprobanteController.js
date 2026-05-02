const mongoose = require('mongoose');
const Comprobante = require('../models/Comprobante');
const CuentaCorriente = require('../models/CuentaCorriente');
const MovimientoCta = require('../models/MovimientoCta');
const Tercero = require('../models/Tercero');
const { auditar } = require('../middleware/audit');
const { toDecimal128, toNumber, round } = require('../utils/decimal.utils');
const { calcularEquivalentes, obtenerCotizacion } = require('../utils/cambio.utils');
const comprobanteService = require('../services/comprobante.service');

const getComprobantes = async (req, res) => {
  try {
    const { id_cuenta, tipo, estado, moneda, origen, desde, hasta } = req.query;
    const query = {};

    if (id_cuenta) query.id_cuenta = id_cuenta;
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (moneda) query.moneda = moneda;
    if (origen) query.origen = origen;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const comprobantes = await Comprobante.find(query)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .populate('id_senia_origen', 'nro_comprobante monto_original')
      .populate('id_remito_origen', 'nro_comprobante tipo fecha')
      .sort({ fecha: -1 });

    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComprobanteById = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .populate('id_senia_origen', 'nro_comprobante monto_original tipo')
      .populate('id_remito_origen', 'nro_comprobante tipo fecha')
      .populate('items.id_producto', 'nombre sku tipo activo');

    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    res.json({ success: true, data: comprobante });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createComprobante = async (req, res) => {
  try {
    const {
      id_cuenta,
      tipo,
      moneda,
      origen,
      fecha,
      fecha_vencimiento,
      cotizacion_usado,
      id_tipo_cambio,
      items,
      nro_comprobante,
      observaciones,
      es_senia,
      id_remito_origen
    } = req.body;

    if (!id_cuenta || !tipo || !moneda) {
      return res.status(400).json({
        success: false,
        message: 'id_cuenta, tipo y moneda son requeridos'
      });
    }

    const cuenta = await CuentaCorriente.findById(id_cuenta);
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta corriente no encontrada' });
    }

    if (cuenta.moneda !== moneda) {
      return res.status(400).json({
        success: false,
        message: `La moneda del comprobante (${moneda}) no coincide con la cuenta (${cuenta.moneda})`
      });
    }

    if (items && items.length > 0) {
      const result = await comprobanteService.registrarComprobante({
        id_cuenta, tipo, origen, moneda, fecha, fecha_vencimiento,
        cotizacion_usado, id_tipo_cambio, items, nro_comprobante,
        observaciones, es_senia, id_remito_origen
      });

      if (req.user?.id) {
        await auditar(req, {
          entidad: 'Comprobante',
          entidadId: result.comprobante._id,
          accion: 'create',
          datosNuevos: result.comprobante.toObject()
        });
      }

      return res.status(201).json({
        success: true,
        data: result.comprobante,
        movimientos: result.movimientos,
        movimientosStock: result.movimientosStock,
        diferenciasMatching: result.diferenciasMatching,
        saldo: result.saldo
      });
    }

    const { monto_original, equivalente_ars, equivalente_usd } = req.body;

    if (!monto_original || toNumber(monto_original) <= 0) {
      return res.status(400).json({ success: false, message: 'monto_original debe ser positivo' });
    }

    if (moneda === 'USD' && !cotizacion_usado) {
      return res.status(400).json({ success: false, message: 'cotizacion_usado es obligatorio para USD' });
    }

    let tc = null;
    let cotizacionDecimal = null;
    if (cotizacion_usado) {
      cotizacionDecimal = toDecimal128(cotizacion_usado);
      if (id_tipo_cambio) {
        tc = await mongoose.model('TipoCambio').findById(id_tipo_cambio);
      }
    }

    const montoDecimal = toDecimal128(monto_original);
    const equivalentes = calcularEquivalentes(montoDecimal, moneda, cotizacionDecimal);

    const nro = nro_comprobante || `${tipo}-${Date.now()}`;

    const comprobante = new Comprobante({
      id_cuenta,
      tipo,
      origen: origen || 'venta',
      moneda,
      monto_original: montoDecimal,
      fecha_vencimiento,
      id_tipo_cambio: tc ? tc._id : undefined,
      cotizacion_usado: cotizacionDecimal,
      equivalente_ars: equivalentes.equivalente_ars,
      equivalente_usd: equivalentes.equivalente_usd,
      es_senia: !!es_senia,
      nro_comprobante: nro,
      observaciones
    });

    await comprobante.save();

    await crearMovimientoCuenta(cuenta, comprobante);

    if (req.user?.id) {
      await auditar(req, {
        entidad: 'Comprobante',
        entidadId: comprobante._id,
        accion: 'create',
        datosNuevos: comprobante.toObject()
      });
    }

    const saldo = await MovimientoCta.calcularSaldo(id_cuenta);

    res.status(201).json({
      success: true,
      data: comprobante,
      saldo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const aplicarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto } = req.body;

    if (!monto || toNumber(monto) <= 0) {
      return res.status(400).json({ success: false, message: 'monto debe ser positivo' });
    }

    const result = await comprobanteService.aplicarPago(id, monto);

    res.json({ success: true, data: result.comprobante, saldo: result.saldo });
  } catch (error) {
    if (error.message.includes('excede') || error.message.includes('cancelado')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const aplicarSenia = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    const { id_senia } = req.body;
    if (!id_senia) {
      return res.status(400).json({ success: false, message: 'id_senia es requerido' });
    }

    const senia = await Comprobante.findById(id_senia);
    if (!senia) {
      return res.status(404).json({ success: false, message: 'Senia no encontrada' });
    }

    if (senia.tipo !== 'SENIA') {
      return res.status(400).json({ success: false, message: 'El comprobante indicado no es una senia' });
    }

    comprobante.aplicarSenia(senia);
    await comprobante.save();

    res.json({ success: true, data: comprobante });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const anularComprobante = async (req, res) => {
  try {
    const { motivo } = req.body;
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    if (comprobante.estado === 'cancelado') {
      return res.status(400).json({ success: false, message: 'No se puede anular un comprobante cancelado' });
    }

    comprobante.estado = 'cancelado';
    comprobante.observaciones = motivo
      ? `${comprobante.observaciones || ''} ANULADO: ${motivo}`.trim()
      : comprobante.observaciones;
    await comprobante.save();

    res.json({ success: true, data: comprobante });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComprobantesByCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { tipo, estado, origen, desde, hasta } = req.query;

    if (!mongoose.Types.ObjectId.isValid(cuentaId)) {
      return res.status(400).json({ success: false, message: 'ID de cuenta invalido' });
    }

    const query = { id_cuenta: cuentaId };
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (origen) query.origen = origen;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const comprobantes = await Comprobante.find(query)
      .sort({ fecha: -1 })
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .populate('id_senia_origen', 'nro_comprobante monto_original');

    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComprobantesVencidos = async (req, res) => {
  try {
    const hoy = new Date();
    const comprobantes = await Comprobante.find({
      estado: { $in: ['pendiente', 'parcial'] },
      fecha_vencimiento: { $lt: hoy }
    })
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .sort({ fecha_vencimiento: 1 });

    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProximoNumero = async (req, res) => {
  try {
    const { tipo, moneda } = req.query;
    if (!tipo) {
      return res.status(400).json({ success: false, message: 'tipo es requerido' });
    }

    const ultimo = await Comprobante.findOne({ tipo, moneda })
      .sort({ nro_comprobante: -1 });

    let siguiente = 1;
    if (ultimo && ultimo.nro_comprobante) {
      const parts = ultimo.nro_comprobante.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) siguiente = num + 1;
    }

    res.json({
      tipo,
      moneda: moneda || 'ARS',
      siguiente,
      formato: `${tipo}-${String(siguiente).padStart(6, '0')}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResumen = async (req, res) => {
  try {
    const { id_cuenta, desde, hasta } = req.query;
    const query = {};
    if (id_cuenta) query.id_cuenta = id_cuenta;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const comprobantes = await Comprobante.find(query);

    const resumen = {
      ARS: { pendiente: 0, pagado: 0, total: 0, cantidad: 0 },
      USD: { pendiente: 0, pagado: 0, total: 0, cantidad: 0 }
    };

    comprobantes.forEach(c => {
      const m = c.moneda;
      resumen[m].cantidad += 1;
      resumen[m].pendiente += toNumber(c.saldo_pendiente || 0);
      resumen[m].pagado += toNumber(c.monto_original || 0) - toNumber(c.saldo_pendiente || 0);
      resumen[m].total += toNumber(c.monto_original || 0);
    });

    ['ARS', 'USD'].forEach(m => {
      resumen[m].pendiente = Math.round(resumen[m].pendiente * 100) / 100;
      resumen[m].pagado = Math.round(resumen[m].pagado * 100) / 100;
      resumen[m].total = Math.round(resumen[m].total * 100) / 100;
    });

    res.json({ success: true, data: resumen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listarPendientes = async (req, res) => {
  try {
    const { id_tercero, origen, moneda } = req.query;
    const comprobantes = await comprobanteService.listarPendientes(id_tercero, origen, moneda);
    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaldoCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { moneda } = req.query;
    const saldo = await comprobanteService.getSaldoCuenta(id, moneda);
    res.json({ success: true, data: saldo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const calcularDiferenciaCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const { cotizacion } = req.body;

    if (!cotizacion) {
      return res.status(400).json({ success: false, message: 'cotizacion es requerida' });
    }

    const diff = await comprobanteService.calcularDiferenciaCambio(id, cotizacion);
    res.json({ success: true, data: diff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const matchingRemitoFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!id || !items) {
      return res.status(400).json({ success: false, message: 'id_remito_origen e items son requeridos' });
    }

    const remito = await Comprobante.findById(id);
    if (!remito) {
      return res.status(404).json({ success: false, message: 'Remito no encontrado' });
    }

    const diferencias = comprobanteService.matchingRemitoFactura(remito, items);
    res.json({ success: true, data: diferencias });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function crearMovimientoCuenta(cuenta, comprobante, tipoOverride, montoOverride, conceptoOverride) {
  let tipoMovimiento;
  let concepto;
  let monto;

  if (tipoOverride) {
    tipoMovimiento = tipoOverride;
    concepto = conceptoOverride || `${comprobante.tipo} ${comprobante.nro_comprobante}`;
    monto = montoOverride;
  } else {
    monto = comprobante.monto_original;
    concepto = `${comprobante.tipo} ${comprobante.nro_comprobante}`;

    switch (comprobante.tipo) {
      case 'FACT':
      case 'ND':
        tipoMovimiento = 'DEBE';
        break;
      case 'REC':
        tipoMovimiento = 'HABER';
        break;
      case 'NC':
        tipoMovimiento = 'HABER';
        break;
      case 'SENIA':
        tipoMovimiento = 'HABER';
        break;
      case 'REM':
        tipoMovimiento = 'DEBE';
        break;
      default:
        tipoMovimiento = 'DEBE';
    }
  }

  const movimiento = new MovimientoCta({
    id_cuenta: cuenta._id,
    id_comprobante: comprobante._id,
    tipo: tipoMovimiento,
    monto,
    moneda: cuenta.moneda,
    concepto,
    observaciones: comprobante.observaciones
  });

  await movimiento.save();
  return movimiento;
}

module.exports = {
  getComprobantes,
  getComprobanteById,
  createComprobante,
  aplicarPago,
  aplicarSenia,
  anularComprobante,
  getComprobantesByCuenta,
  getComprobantesVencidos,
  getProximoNumero,
  getResumen,
  listarPendientes,
  getSaldoCuenta,
  calcularDiferenciaCambio,
  matchingRemitoFactura
};
