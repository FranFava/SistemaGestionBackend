const mongoose = require('mongoose');

const cajaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia'],
    required: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    default: 'ARS'
  },
  monto: {
    type: Number,
    required: true
  },
  montoUSD: {
    type: Number,
    default: 0
  },
  concepto: {
    type: String,
    required: true
  },
  tipoOperacion: {
    type: String,
    enum: ['venta', 'compra_proveedor', 'gasto', 'compra_interna', 'recibido_pp', 'pago_cuenta'],
    required: true
  },
  referencia: {
    tipo: String,
    id: mongoose.Schema.Types.ObjectId
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Caja', cajaSchema);
