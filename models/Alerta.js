const mongoose = require('mongoose');

const alertaSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  variante: {
    color: String,
    capacidad: String
  },
  stockMinimo: {
    type: Number,
    required: true
  },
  stockActual: {
    type: Number,
    required: true
  },
  fechaAlerta: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['activa', 'descartada'],
    default: 'activa'
  },
  fechaDescartada: {
    type: Date,
    default: null
  },
  descartadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, {
  timestamps: true
});

alertaSchema.index({ producto: 1, variante: 1, estado: 1 });

module.exports = mongoose.model('Alerta', alertaSchema);
