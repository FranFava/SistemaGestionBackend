const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  rut: String,
  telefono: String,
  email: String,
  direccion: String,
  contacto: String,
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Proveedor', proveedorSchema);
