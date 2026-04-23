const mongoose = require('mongoose');

/**
 * Esquema de Producto para MongoDB
 * @typedef {Object} ProductoSchema
 * @property {string} nombre - Nombre del producto
 * @property {string} sku - SKU único del producto
 * @property {string} marca - Marca del producto
 * @property {string} categoria - Categoría del producto
 * @property {string} descripcion - Descripción del producto
 * @property {number} precioCosto - Precio de costo
 * @property {number} precioVenta - Precio de venta
 * @property {number} stockMinimo - Stock mínimo para alertas
 * @property {number} garantiaMeses - Meses de garantía
 * @property {Object} garantiext - Garantía extendida
 * @property {Array} variantes - Variantes del producto (color, capacidad, stock)
 * @property {Array} numeroSerie - Números de serie registrados
 * @property {boolean} activo - Si el producto está activo (soft delete)
 * @property {string} empresa - ID de empresa (multi-empresa)
 */

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

productoSchema.index({ sku: 1 }, { unique: true });
productoSchema.index({ empresa: 1, activo: 1 });
productoSchema.index({ categoria: 1, activo: 1 });

module.exports = mongoose.model('Producto', productoSchema);