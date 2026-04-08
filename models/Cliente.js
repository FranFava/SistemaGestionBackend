const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  rut: String,
  telefono: String,
  email: String,
  direccion: String,
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cliente', clienteSchema);
