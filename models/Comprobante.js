const mongoose = require('mongoose');
const { toDecimal128, toNumber, multiply, subtract, round } = require('../utils/decimal.utils');

const itemComprobanteSchema = new mongoose.Schema({
  id_producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  cantidad: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  precio_unitario: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  descuento_pct: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0
  },
  subtotal: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  cotizacion_uso: {
    type: mongoose.Schema.Types.Decimal128,
    default: null
  }
}, { _id: true });

const comprobanteSchema = new mongoose.Schema({
  id_cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CuentaCorriente',
    required: true
  },
  tipo: {
    type: String,
    enum: ['FACT', 'REC', 'NC', 'ND', 'SENIA', 'REM'],
    required: true
  },
  origen: {
    type: String,
    enum: ['venta', 'compra'],
    default: 'venta'
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  monto_original: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  saldo_pendiente: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  fecha_vencimiento: {
    type: Date
  },
  estado: {
    type: String,
    enum: ['pendiente', 'parcial', 'cancelado'],
    default: 'pendiente'
  },
  id_tipo_cambio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoCambio'
  },
  cotizacion_usado: {
    type: mongoose.Schema.Types.Decimal128
  },
  equivalente_ars: {
    type: mongoose.Schema.Types.Decimal128
  },
  equivalente_usd: {
    type: mongoose.Schema.Types.Decimal128
  },
  es_senia: {
    type: Boolean,
    default: false
  },
  id_senia_origen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comprobante'
  },
  id_remito_origen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comprobante'
  },
  nro_comprobante: {
    type: String,
    required: true
  },
  observaciones: String,
  items: [itemComprobanteSchema]
}, {
  timestamps: true
});

comprobanteSchema.index({ id_cuenta: 1, fecha: -1 });
comprobanteSchema.index({ tipo: 1, estado: 1 });
comprobanteSchema.index({ estado: 1, fecha_vencimiento: 1 });
comprobanteSchema.index({ nro_comprobante: 1 }, { sparse: true });
comprobanteSchema.index({ id_senia_origen: 1 });
comprobanteSchema.index({ id_remito_origen: 1 });
comprobanteSchema.index({ origen: 1, moneda: 1, estado: 1 });

comprobanteSchema.pre('save', function (next) {
  if (this.isNew) {
    this.saldo_pendiente = this.monto_original;
  }
  next();
});

comprobanteSchema.statics.calcularMontoOriginal = function (items) {
  if (!items || !items.length) return toDecimal128(0);

  let total = toDecimal128(0);
  for (const item of items) {
    const cant = item.cantidad || toDecimal128(0);
    const precio = item.precio_unitario || toDecimal128(0);
    const desc = item.descuento_pct || toDecimal128(0);

    const bruto = multiply(cant, precio);
    const descuento = multiply(bruto, divide(desc, toDecimal128(100)));
    item.subtotal = round(subtract(bruto, descuento));

    total = round(toDecimal128(toNumber(total) + toNumber(item.subtotal)));
  }
  return total;
};

comprobanteSchema.methods.aplicarPago = function (monto) {
  const montoDecimal = typeof monto === 'number' ? toDecimal128(monto) : monto;
  const montoNum = toNumber(montoDecimal);
  const saldoNum = toNumber(this.saldo_pendiente);

  if (montoNum <= 0) {
    throw new Error('El monto debe ser positivo');
  }
  if (montoNum > saldoNum) {
    throw new Error('El pago excede el saldo pendiente');
  }

  this.saldo_pendiente = round(subtract(this.saldo_pendiente, montoDecimal));
  this.estado = toNumber(this.saldo_pendiente) === 0 ? 'cancelado' : 'parcial';
  return toNumber(this.saldo_pendiente);
};

comprobanteSchema.methods.aplicarSenia = function (seniaComprobante) {
  if (!seniaComprobante || seniaComprobante.tipo !== 'SENIA' || seniaComprobante.estado !== 'cancelado') {
    throw new Error('La senia debe estar cancelada para ser aplicada');
  }
  const montoSenia = seniaComprobante.monto_original;
  if (toNumber(montoSenia) > toNumber(this.saldo_pendiente)) {
    throw new Error('La senia excede el saldo pendiente de la factura');
  }
  this.saldo_pendiente = round(subtract(this.saldo_pendiente, montoSenia));
  this.id_senia_origen = seniaComprobante._id;
  this.estado = toNumber(this.saldo_pendiente) === 0 ? 'cancelado' : 'parcial';
  return toNumber(this.saldo_pendiente);
};

comprobanteSchema.virtual('porcentaje_pagado').get(function () {
  const original = toNumber(this.monto_original);
  if (!original || original === 0) return 0;
  return Math.round(((original - toNumber(this.saldo_pendiente)) / original) * 100);
});

comprobanteSchema.virtual('monto_pagado').get(function () {
  return Math.round((toNumber(this.monto_original) - toNumber(this.saldo_pendiente)) * 100) / 100;
});

comprobanteSchema.set('toJSON', { virtuals: true });
comprobanteSchema.set('toObject', { virtuals: true });

function divide(a, b) {
  return toDecimal128(toNumber(a) / toNumber(b));
}

module.exports = mongoose.model('Comprobante', comprobanteSchema);
