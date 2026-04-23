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
  garantiaMeses: {
    type: Number,
    default: 12
  },
  garantia: {
    tipo: {
      type: String,
      enum: ['propia', 'fabricante', 'extendida', 'ninguna'],
      default: 'propia'
    },
    meses: {
      type: Number,
      default: 12
    },
    terminos: String,
    origen: {
      type: String,
      enum: ['nacional', 'importado'],
      default: 'nacional'
    },
    documentacionRequerida: {
      type: Boolean,
      default: false
    },
    requiereTicket: {
      type: Boolean,
      default: true
    }
  },
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
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa'
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productoSchema.index({ empresa: 1, activo: 1 });
productoSchema.index({ categoria: 1, activo: 1 });

module.exports = mongoose.model('Producto', productoSchema);