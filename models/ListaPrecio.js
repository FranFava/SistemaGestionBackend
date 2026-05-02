const mongoose = require('mongoose');

const listaPrecioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  descripcion: String,
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

listaPrecioSchema.index({ activa: 1, moneda: 1 });

module.exports = mongoose.model('ListaPrecio', listaPrecioSchema);
