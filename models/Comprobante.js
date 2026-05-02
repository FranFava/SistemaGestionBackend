const mongoose = require('mongoose');

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
    type: Number,
    required: true
  },
  saldo_pendiente: {
    type: Number,
    default: 0
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
    type: Number
  },
  equivalente_ars: {
    type: Number
  },
  equivalente_usd: {
    type: Number
  },
  es_senia: {
    type: Boolean,
    default: false
  },
  id_senia_origen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comprobante'
  },
  nro_comprobante: {
    type: String,
    required: true
  },
  observaciones: String
}, {
  timestamps: true
});

comprobanteSchema.index({ id_cuenta: 1, fecha: -1 });
comprobanteSchema.index({ tipo: 1, estado: 1 });
comprobanteSchema.index({ estado: 1, fecha_vencimiento: 1 });
comprobanteSchema.index({ nro_comprobante: 1 }, { sparse: true });
comprobanteSchema.index({ id_senia_origen: 1 });

comprobanteSchema.pre('save', function (next) {
  if (this.isNew) {
    this.saldo_pendiente = this.monto_original;
  }
  next();
});

comprobanteSchema.methods.aplicarPago = function (monto) {
  if (monto <= 0) {
    throw new Error('El monto debe ser positivo');
  }
  if (monto > this.saldo_pendiente) {
    throw new Error('El pago excede el saldo pendiente');
  }
  this.saldo_pendiente = Math.round((this.saldo_pendiente - monto) * 100) / 100;
  this.estado = this.saldo_pendiente === 0 ? 'cancelado' : 'parcial';
  return this.saldo_pendiente;
};

comprobanteSchema.methods.aplicarSenia = function (seniaComprobante) {
  if (!seniaComprobante || seniaComprobante.tipo !== 'SENIA' || seniaComprobante.estado !== 'cancelado') {
    throw new Error('La senia debe estar cancelada para ser aplicada');
  }
  const montoSenia = seniaComprobante.monto_original;
  if (montoSenia > this.saldo_pendiente) {
    throw new Error('La senia excede el saldo pendiente de la factura');
  }
  this.saldo_pendiente = Math.round((this.saldo_pendiente - montoSenia) * 100) / 100;
  this.id_senia_origen = seniaComprobante._id;
  this.estado = this.saldo_pendiente === 0 ? 'cancelado' : 'parcial';
  return this.saldo_pendiente;
};

comprobanteSchema.virtual('porcentaje_pagado').get(function () {
  if (!this.monto_original || this.monto_original === 0) return 0;
  return Math.round(((this.monto_original - this.saldo_pendiente) / this.monto_original) * 100);
});

comprobanteSchema.virtual('monto_pagado').get(function () {
  return Math.round((this.monto_original - this.saldo_pendiente) * 100) / 100;
});

comprobanteSchema.set('toJSON', { virtuals: true });
comprobanteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comprobante', comprobanteSchema);
