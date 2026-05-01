const mongoose = require('mongoose');

const tipoCambioSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true
  },
  tipo: {
    type: String,
    enum: ['oficial', 'blue', 'MEP', 'CCL'],
    required: true
  },
  valor_ars_por_usd: {
    type: Number,
    required: true,
    min: 0
  },
  fuente: {
    type: String,
    enum: ['manual', 'API', 'BCRA'],
    default: 'manual'
  },
  vigente: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

tipoCambioSchema.index({ fecha: 1, tipo: 1 }, { unique: true });
tipoCambioSchema.index({ fecha: -1 });
tipoCambioSchema.index({ tipo: 1, vigente: 1 });

module.exports = mongoose.model('TipoCambio', tipoCambioSchema);
