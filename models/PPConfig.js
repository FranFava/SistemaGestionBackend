const mongoose = require('mongoose');

const ppConfigSchema = new mongoose.Schema({
  modelo: { type: String, required: true },
  capacidad: { type: String, default: '' },
  condicion: { type: String, default: 'standard' },
  valor: { type: Number, required: true },
  descripcion: { type: String, default: '' },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true
});

ppConfigSchema.index({ modelo: 1, capacidad: 1, condicion: 1 }, { unique: true });

module.exports = mongoose.model('PPConfig', ppConfigSchema);
