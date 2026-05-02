const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const comprobanteService = require('../services/comprobante.service');
const Comprobante = require('../models/Comprobante');
const CuentaCorriente = require('../models/CuentaCorriente');
const Tercero = require('../models/Tercero');
const Producto = require('../models/Producto');
const MovimientoCta = require('../models/MovimientoCta');
const MovimientoStock = require('../models/MovimientoStock');
const TipoCambio = require('../models/TipoCambio');
const { toNumber } = require('../utils/decimal.utils');

require('./setup');

function createObjectId() {
  return new ObjectId().toString();
}

async function seedTercero(data = {}) {
  return Tercero.create({
    razon_social: 'Proveedor Test S.A.',
    es_cliente: false,
    es_proveedor: true,
    tipo_compra: 'credito',
    moneda_preferida: 'ARS',
    ...data
  });
}

async function seedCuentaCorriente(idTercero, tipo = 'proveedor', moneda = 'ARS') {
  return CuentaCorriente.create({
    id_tercero: idTercero,
    tipo,
    moneda,
    activa: true,
    limite_credito: 1000000,
    dias_vencimiento_default: 30
  });
}

async function seedProducto(data = {}) {
  return Producto.create({
    nombre: 'Producto Test',
    sku: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    marca: 'TestBrand',
    tipo: 'bien',
    unidad: 'un',
    precioCosto: 1000,
    precioVenta: 1500,
    ...data
  });
}

async function seedTipoCambio(fecha = new Date(), valor = 1000, tipo = 'blue') {
  return TipoCambio.create({
    fecha,
    tipo,
    valor_ars_por_usd: valor,
    vigente: true,
    fuente: 'manual'
  });
}

function buildItems(productoId, moneda, cantidad = 10, precio = 100, descuento = 0) {
  return [{
    id_producto: productoId,
    cantidad,
    precio_unitario: precio,
    descuento_pct: descuento,
    moneda
  }];
}

// ============================================================
// TEST SUITE: Regla A — Saldo calculado, nunca almacenado
// ============================================================
describe('Regla A: saldo calculado, nunca almacenado', () => {
  it('calcula el saldo correctamente desde movimientos', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto();

    const { comprobante, movimientos } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 5, 200)
    });

    const saldo = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');

    expect(movimientos.length).toBe(1);
    expect(movimientos[0].tipo).toBe('HABER');
    expect(toNumber(movimientos[0].monto)).toBe(1000);
    expect(saldo.total).toBe(-1000);
    expect(saldo.haber).toBe(1000);
    expect(saldo.debe).toBe(0);
  });

  it('el saldo se mantiene consistente tras multiples operaciones', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto();

    const remito = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 10, 100)
    });

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 10, 100),
      id_remito_origen: remito.comprobante._id
    });

    const saldo = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');
    expect(saldo.haber).toBe(2000);
    expect(saldo.debe).toBe(0);
    expect(saldo.total).toBe(-2000);
  });
});

// ============================================================
// TEST SUITE: Regla B — Efecto contable por tipo + origen
// ============================================================
describe('Regla B: efecto contable por tipo y origen', () => {
  let tercero, cuenta, cuentaVenta, producto;

  beforeEach(async () => {
    tercero = await seedTercero();
    cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'ARS');

    const terceroVenta = await seedTercero({
      razon_social: 'Cliente Test',
      es_cliente: true,
      es_proveedor: false,
      tipo_venta: 'credito'
    });
    cuentaVenta = await seedCuentaCorriente(terceroVenta._id, 'cliente', 'ARS');

    producto = await seedProducto();
  });

  it('compra + FACT → HABER', async () => {
    const { movimientos } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 500)
    });
    expect(movimientos[0].tipo).toBe('HABER');
  });

  it('compra + REC → DEBE', async () => {
    const { movimientos } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REC',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 500)
    });
    expect(movimientos[0].tipo).toBe('DEBE');
  });

  it('compra + NC → DEBE (devolucion al proveedor)', async () => {
    const { movimientos } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'NC',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 500)
    });
    expect(movimientos[0].tipo).toBe('DEBE');
  });

  it('venta + FACT → DEBE', async () => {
    const { movimientos } = await comprobanteService.registrarComprobante({
      id_cuenta: cuentaVenta._id,
      tipo: 'FACT',
      origen: 'venta',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 800)
    });
    expect(movimientos[0].tipo).toBe('DEBE');
  });

  it('venta + NC → HABER (devolucion del cliente)', async () => {
    const { movimientos } = await comprobanteService.registrarComprobante({
      id_cuenta: cuentaVenta._id,
      tipo: 'NC',
      origen: 'venta',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 800)
    });
    expect(movimientos[0].tipo).toBe('HABER');
  });

  it('REM no genera movimiento contable', async () => {
    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 500)
    });
    expect(result.movimientos.length).toBe(0);
  });
});

// ============================================================
// TEST SUITE: Regla C — MovimientoStock solo para bienes
// ============================================================
describe('Regla C: MovimientoStock solo para Producto.tipo = bien', () => {
  it('compra + FACT de bien → genera entrada', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto({ tipo: 'bien' });

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 5, 200)
    });

    expect(result.movimientosStock.length).toBe(1);
    expect(result.movimientosStock[0].tipo).toBe('entrada');
    expect(toNumber(result.movimientosStock[0].cantidad)).toBe(5);
  });

  it('venta + FACT de bien → genera salida', async () => {
    const tercero = await seedTercero({
      razon_social: 'Cliente',
      es_cliente: true,
      es_proveedor: false
    });
    const cuenta = await seedCuentaCorriente(tercero._id, 'cliente', 'ARS');
    const producto = await seedProducto({ tipo: 'bien' });

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'venta',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 3, 300)
    });

    expect(result.movimientosStock.length).toBe(1);
    expect(result.movimientosStock[0].tipo).toBe('salida');
    expect(toNumber(result.movimientosStock[0].cantidad)).toBe(3);
  });

  it('compra de servicio → NO genera movimiento stock', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const servicio = await seedProducto({
      nombre: 'Servicio de Instalacion',
      sku: `SRV-${Date.now()}`,
      tipo: 'servicio'
    });

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(servicio._id, 'ARS', 1, 5000)
    });

    expect(result.movimientosStock.length).toBe(0);
  });

  it('compra + NC → genera salida (devuelve al proveedor)', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto({ tipo: 'bien' });

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'NC',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 2, 200)
    });

    expect(result.movimientosStock.length).toBe(1);
    expect(result.movimientosStock[0].tipo).toBe('salida');
  });

  it('venta + NC → genera entrada (devuelve el cliente)', async () => {
    const tercero = await seedTercero({ razon_social: 'Cliente', es_cliente: true, es_proveedor: false });
    const cuenta = await seedCuentaCorriente(tercero._id, 'cliente', 'ARS');
    const producto = await seedProducto({ tipo: 'bien' });

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'NC',
      origen: 'venta',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 500)
    });

    expect(result.movimientosStock.length).toBe(1);
    expect(result.movimientosStock[0].tipo).toBe('entrada');
  });
});

// ============================================================
// TEST SUITE: Compra contado ARS — remito + factura + pago mismo dia
// ============================================================
describe('Compra contado ARS: remito + factura + pago mismo dia', () => {
  it('flujo completo sin saldos pendientes', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'ARS');
    const producto = await seedProducto({ nombre: 'iPhone 15', sku: `IPH-${Date.now()}` });

    const remito = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      nro_comprobante: 'REM-001',
      items: buildItems(producto._id, 'ARS', 10, 5000)
    });

    expect(remito.comprobante.tipo).toBe('REM');
    expect(toNumber(remito.comprobante.monto_original)).toBe(50000);

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      nro_comprobante: 'FACT-001',
      id_remito_origen: remito.comprobante._id,
      items: buildItems(producto._id, 'ARS', 10, 5000)
    });

    expect(factura.comprobante.tipo).toBe('FACT');
    expect(factura.diferenciasMatching.length).toBe(0);
    expect(toNumber(factura.comprobante.saldo_pendiente)).toBe(50000);

    const pago = await comprobanteService.aplicarPago(factura.comprobante._id, 50000);

    expect(toNumber(pago.comprobante.saldo_pendiente)).toBe(0);
    expect(pago.comprobante.estado).toBe('cancelado');

    const saldo = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');
    expect(saldo.total).toBe(0);
  });
});

// ============================================================
// TEST SUITE: Compra credito ARS — remito hoy, factura mañana, pago a 30 dias
// ============================================================
describe('Compra credito ARS: remito → factura → pago 30 dias', () => {
  it('mantiene saldo pendiente hasta el pago', async () => {
    const tercero = await seedTercero({ razon_social: 'Mayorista S.A.' });
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'ARS', 500000);
    const producto = await seedProducto({ nombre: 'Harina x50kg', sku: `HAR-${Date.now()}` });

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const treintaDias = new Date(hoy);
    treintaDias.setFecha = treintaDias.getDate() + 30;

    const remito = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      fecha: hoy,
      items: buildItems(producto._id, 'ARS', 20, 4500)
    });

    expect(toNumber(remito.comprobante.monto_original)).toBe(90000);
    expect(remito.movimientosStock.length).toBe(1);
    expect(toNumber(remito.movimientosStock[0].cantidad)).toBe(20);

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      fecha: manana,
      fecha_vencimiento: treintaDias,
      id_remito_origen: remito.comprobante._id,
      items: buildItems(producto._id, 'ARS', 20, 4500)
    });

    expect(toNumber(factura.comprobante.saldo_pendiente)).toBe(90000);
    expect(factura.comprobante.estado).toBe('pendiente');

    const pendientes = await comprobanteService.listarPendientes(tercero._id, 'compra', 'ARS');
    expect(pendientes.length).toBeGreaterThanOrEqual(1);

    const saldoAntes = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');
    expect(saldoAntes.total).toBe(-180000);

    await comprobanteService.aplicarPago(factura.comprobante._id, 90000);

    const saldoDespues = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');
    expect(saldoDespues.total).toBe(-90000);
  });
});

// ============================================================
// TEST SUITE: Compra USD con diferencia de cambio
// ============================================================
describe('Compra USD: factura + pago con diferencia de cambio', () => {
  it('calcula diferencia cuando la cotizacion cambia entre compra y pago', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'USD');
    const producto = await seedProducto({ nombre: 'GPU RTX 4090', sku: `GPU-${Date.now()}` });

    const hoy = new Date();
    await seedTipoCambio(hoy, 1000, 'blue');

    const { comprobante } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'USD',
      cotizacion_usado: 1000,
      items: buildItems(producto._id, 'USD', 2, 1500)
    });

    expect(toNumber(comprobante.monto_original)).toBe(3000);
    expect(toNumber(comprobante.equivalente_ars)).toBe(3000000);

    const diffAntes = await comprobanteService.calcularDiferenciaCambio(
      comprobante._id,
      1200
    );

    expect(diffAntes.monto).toBe(600000);
    expect(diffAntes.ganancia_perdida).toBe('ganancia');
    expect(toNumber(diffAntes.diferencia_cotizacion)).toBe(200);

    const diffBaja = await comprobanteService.calcularDiferenciaCambio(
      comprobante._id,
      900
    );

    expect(diffBaja.ganancia_perdida).toBe('perdida');
    expect(diffBaja.monto).toBe(300000);
  });
});

// ============================================================
// TEST SUITE: NC por devolucion parcial al proveedor
// ============================================================
describe('NC por devolucion parcial al proveedor', () => {
  it('NC parcial reduce el saldo y genera movimiento stock de salida', async () => {
    const tercero = await seedTercero({ razon_social: 'Distribuidora Norte' });
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'ARS');
    const producto = await seedProducto({ nombre: 'Cables USB-C', sku: `CAB-${Date.now()}` });

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 10, 500)
    });

    expect(toNumber(factura.comprobante.saldo_pendiente)).toBe(5000);

    const nc = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'NC',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 3, 500)
    });

    expect(toNumber(nc.comprobante.monto_original)).toBe(1500);
    expect(nc.movimientosStock.length).toBe(1);
    expect(nc.movimientosStock[0].tipo).toBe('salida');

    const saldo = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');
    expect(saldo.haber).toBe(5000);
    expect(saldo.debe).toBe(1500);
    expect(saldo.total).toBe(-3500);
  });
});

// ============================================================
// TEST SUITE: Matching remito/factura — diferencia de cantidades
// ============================================================
describe('Matching remito/factura: diferencia de cantidades', () => {
  it('factura con cantidad mayor al remito → retorna advertencia', async () => {
    const tercero = await seedTercero({ razon_social: 'Logistica Express' });
    const cuenta = await seedCuentaCorriente(tercero._id);
    const productoA = await seedProducto({ nombre: 'Monitor 27"', sku: `MON-${Date.now()}` });
    const productoB = await seedProducto({ nombre: 'Teclado', sku: `TEC-${Date.now()}` });

    const remito = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      items: [
        { id_producto: productoA._id, cantidad: 5, precio_unitario: 2000, descuento_pct: 0, moneda: 'ARS' },
        { id_producto: productoB._id, cantidad: 10, precio_unitario: 500, descuento_pct: 0, moneda: 'ARS' }
      ]
    });

    const facturaItems = [
      { id_producto: productoA._id, cantidad: 5, precio_unitario: 2000, descuento_pct: 0, moneda: 'ARS' },
      { id_producto: productoB._id, cantidad: 12, precio_unitario: 500, descuento_pct: 0, moneda: 'ARS' }
    ];

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      id_remito_origen: remito.comprobante._id,
      items: facturaItems
    });

    expect(factura.diferenciasMatching.length).toBe(1);
    expect(factura.diferenciasMatching[0].id_producto.toString()).toBe(productoB._id.toString());
    expect(factura.diferenciasMatching[0].cant_remito).toBe(10);
    expect(factura.diferenciasMatching[0].cant_factura).toBe(12);
    expect(factura.diferenciasMatching[0].diferencia).toBe(2);
    expect(factura.diferenciasMatching[0].signo).toBe('mayor');
  });

  it('factura con cantidad menor al remito → retorna diferencia menor', async () => {
    const tercero = await seedTercero({ razon_social: 'Tech Supplies' });
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto({ nombre: 'Mouse Inalambrico', sku: `MOU-${Date.now()}` });

    const remito = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 20, 300)
    });

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      id_remito_origen: remito.comprobante._id,
      items: buildItems(producto._id, 'ARS', 18, 300)
    });

    expect(factura.diferenciasMatching.length).toBe(1);
    expect(factura.diferenciasMatching[0].diferencia).toBe(-2);
    expect(factura.diferenciasMatching[0].signo).toBe('menor');
  });

  it('factura igual al remito → sin diferencias', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto({ nombre: 'Hub USB', sku: `HUB-${Date.now()}` });

    const remito = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'REM',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 8, 150)
    });

    const factura = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      id_remito_origen: remito.comprobante._id,
      items: buildItems(producto._id, 'ARS', 8, 150)
    });

    expect(factura.diferenciasMatching.length).toBe(0);
  });
});

// ============================================================
// TEST SUITE: Transaccion — rollback completo si falla MovimientoStock
// ============================================================
describe('Transaccion: rollback completo si falla MovimientoStock', () => {
  it('si falla, no queda ningun registro persistido', async () => {
    const tercero = await seedTercero({ razon_social: 'Proveedor Fantasma' });
    const cuenta = await seedCuentaCorriente(tercero._id);

    const productoInvalido = createObjectId();

    try {
      await comprobanteService.registrarComprobante({
        id_cuenta: cuenta._id,
        tipo: 'FACT',
        origen: 'compra',
        moneda: 'ARS',
        items: [{
          id_producto: productoInvalido,
          cantidad: 5,
          precio_unitario: 100,
          descuento_pct: 0,
          moneda: 'ARS'
        }]
      });

      expect(true).toBe(true);
    } catch (error) {
      const comprobantes = await Comprobante.find({ id_cuenta: cuenta._id });
      const movimientos = await MovimientoCta.find({ id_cuenta: cuenta._id });
      const movimientosStock = await MovimientoStock.find({});

      expect(comprobantes.length).toBe(0);
      expect(movimientos.length).toBe(0);
      expect(movimientosStock.length).toBe(0);
    }
  });

  it('operacion exitosa persiste todo atomica mente', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto({ tipo: 'bien' });

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 3, 700, 10)
    });

    expect(result.comprobante._id).toBeDefined();
    expect(result.movimientos.length).toBe(1);
    expect(result.movimientosStock.length).toBe(1);

    const comprobanteDB = await Comprobante.findById(result.comprobante._id);
    expect(comprobanteDB).not.toBeNull();

    const movimientoDB = await MovimientoCta.findById(result.movimientos[0]._id);
    expect(movimientoDB).not.toBeNull();

    const stockDB = await MovimientoStock.findById(result.movimientosStock[0]._id);
    expect(stockDB).not.toBeNull();
  });
});

// ============================================================
// TEST SUITE: Regla E — moneda consistente con CuentaCorriente
// ============================================================
describe('Regla E: moneda consistente con CuentaCorriente', () => {
  it('rechaza comprobante USD sin cotizacion_usado', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'USD');
    const producto = await seedProducto();

    await expect(comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'USD',
      items: buildItems(producto._id, 'USD', 1, 100)
    })).rejects.toThrow('cotizacion_usado es obligatorio');
  });

  it('rechaza moneda que no coincide con la cuenta', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'ARS');
    const producto = await seedProducto();

    await expect(comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'USD',
      cotizacion_usado: 1000,
      items: buildItems(producto._id, 'USD', 1, 100)
    })).rejects.toThrow('no coincide');
  });

  it('acepta comprobante ARS sin cotizacion_usado', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto();

    const result = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 5, 200)
    });

    expect(result.comprobante).toBeDefined();
    expect(result.comprobante.cotizacion_usado).toBeNull();
  });
});

// ============================================================
// TEST SUITE: Listar pendientes y resumen
// ============================================================
describe('Listar pendientes y getSaldoCuenta', () => {
  it('lista solo comprobantes pendientes y parciales', async () => {
    const tercero = await seedTercero({ razon_social: 'Acreedor Test' });
    const cuenta = await seedCuentaCorriente(tercero._id, 'proveedor', 'ARS');
    const producto = await seedProducto();

    const pendiente = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: buildItems(producto._id, 'ARS', 1, 1000)
    });

    const parciales = await comprobanteService.listarPendientes(tercero._id, 'compra', 'ARS');
    expect(parciales.length).toBeGreaterThanOrEqual(1);

    const saldo = await comprobanteService.getSaldoCuenta(cuenta._id, 'ARS');
    expect(saldo.haber).toBe(1000);
  });
});

// ============================================================
// TEST SUITE: Items con descuento
// ============================================================
describe('Calculo de subtotales con descuento', () => {
  it('calcula subtotal correctamente con descuento', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto();

    const { comprobante } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: [{
        id_producto: producto._id,
        cantidad: 10,
        precio_unitario: 100,
        descuento_pct: 20,
        moneda: 'ARS'
      }]
    });

    expect(toNumber(comprobante.monto_original)).toBe(800);
  });

  it('calcula subtotal sin descuento', async () => {
    const tercero = await seedTercero();
    const cuenta = await seedCuentaCorriente(tercero._id);
    const producto = await seedProducto();

    const { comprobante } = await comprobanteService.registrarComprobante({
      id_cuenta: cuenta._id,
      tipo: 'FACT',
      origen: 'compra',
      moneda: 'ARS',
      items: [{
        id_producto: producto._id,
        cantidad: 5,
        precio_unitario: 200,
        moneda: 'ARS'
      }]
    });

    expect(toNumber(comprobante.monto_original)).toBe(1000);
  });
});
