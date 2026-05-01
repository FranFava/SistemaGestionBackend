const mongoose = require('mongoose');

const terceroSchema = new mongoose.Schema({
  razon_social: {
    type: String,
    required: true,
    trim: true
  },
  es_cliente: {
    type: Boolean,
    default: false
  },
  es_proveedor: {
    type: Boolean,
    default: false
  },
  tipo_venta: {
    type: String,
    enum: ['contado', 'credito', 'ambos'],
    default: 'ambos'
  },
  tipo_compra: {
    type: String,
    enum: ['contado', 'credito', 'ambos'],
    default: 'ambos'
  },
  limite_credito_ars: {
    type: Number,
    default: 0
  },
  limite_credito_usd: {
    type: Number,
    default: 0
  },
  moneda_preferida: {
    type: String,
    enum: ['ARS', 'USD'],
    default: 'ARS'
  },
  // Campos heredados de Cliente
  nombre: String,
  apellido: String,
  telefono: String,
  instagram: String,
  email: String,
  // Campos heredados de Proveedor
  rut: String,
  direccion: String,
  contacto: String,
  // Estado
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

terceroSchema.index({ razon_social: 1 });
terceroSchema.index({ email: 1 }, { sparse: true });
terceroSchema.index({ instagram: 1 }, { sparse: true });
terceroSchema.index({ rut: 1 }, { sparse: true });
terceroSchema.index({ es_cliente: 1, es_proveedor: 1 });

module.exports = mongoose.model('Tercero', terceroSchema);
