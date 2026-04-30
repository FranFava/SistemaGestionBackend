const mongoose = require('mongoose');

const tipoMovimientoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  nombreCorto: String,
  tipoOperacion: {
    type: String,
    enum: ['ingreso', 'egreso', 'transferencia', 'ajuste'],
    required: true
  },
  naturaleza: String,
  afectaCaja: {
    type: Boolean,
    default: false
  },
  afectaStock: {
    type: Boolean,
    default: false
  },
  afectaCtacte: {
    type: Boolean,
    default: false
  },
  afectaIVA: {
    type: Boolean,
    default: false
  },
  generaComprobante: {
    type: Boolean,
    default: false
  },
  tipoComprobante: {
    type: String,
    enum: ['factura', 'nota_credito', 'nota_debito', 'ticket', 'recibo', 'ninguno'],
    default: 'ninguno'
  },
  letraComprobante: {
    type: String,
    enum: ['A', 'B', 'C', 'M', 'ninguno']
  },
  requiereCliente: {
    type: Boolean,
    default: false
  },
  requiereProveedor: {
    type: Boolean,
    default: false
  },
  requiereProducto: {
    type: Boolean,
    default: false
  },
  permiteMultipleItems: {
    type: Boolean,
    default: false
  },
  cuentas: {
    principal: String,
    iva: String,
    costo: String,
    descuento: String,
    recargo: String
  },
  afectarStock: {
    tipo: String,
    operacion: String
  },
  afectaGarantia: {
    type: Boolean,
    default: false
  },
  estadoInicial: String,
  permiteSecuencia: {
    type: Boolean,
    default: false
  },
  secuenciaSiguiente: Number,
  empresa: mongoose.Schema.Types.ObjectId,
  posicionOrden: Number,
  color: String,
  icono: String,
  activa: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

tipoMovimientoSchema.index({ empresa: 1, codigo: 1 }, { unique: true });
tipoMovimientoSchema.index({ empresa: 1, tipoOperacion: 1 });

module.exports = mongoose.model('TipoMovimiento', tipoMovimientoSchema);