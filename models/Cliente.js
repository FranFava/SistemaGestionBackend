const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: String,
  telefono: String,
  instagram: String,
  email: String,
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

clienteSchema.index({ nombre: 1, apellido: 1 });
clienteSchema.index({instagram: 1 }, { sparse: true });

module.exports = mongoose.model('Cliente', clienteSchema);