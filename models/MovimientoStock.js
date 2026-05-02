const mongoose = require('mongoose');

const movimientoStockSchema = new mongoose.Schema({
  id_producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  id_comprobante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comprobante',
    required: true
  },
  id_item_idx: {
    type: Number,
    required: true
  },
  tipo: {
    type: String,
    enum: ['entrada', 'salida', 'ajuste'],
    required: true
  },
  cantidad: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  deposito: {
    type: String,
    default: 'Central'
  }
}, {
  timestamps: true
});

movimientoStockSchema.index({ id_comprobante: 1 });
movimientoStockSchema.index({ id_producto: 1, fecha: -1 });
movimientoStockSchema.index({ deposito: 1, fecha: -1 });

module.exports = mongoose.model('MovimientoStock', movimientoStockSchema);
