const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  marca: String,
  categoria: String,
  descripcion: String,
  precioCosto: Number,
  precioVenta: Number,
  stockMinimo: {
    type: Number,
    default: 0
  },
  garantiaMeses: Number,
  variantes: {
    type: [{
      color: String,
      capacidad: String,
      stock: {
        type: Number,
        default: 0
      }
    }],
    default: []
  },
  numeroSerie: [String],
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Producto', productoSchema);
