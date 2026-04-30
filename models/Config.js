const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  nombreTienda: { type: String, default: 'Sistema de Stock' },
  logo: { type: String, default: '' },
  direccion: { type: String, default: '' },
  telefono: { type: String, default: '' },
  email: { type: String, default: '' },
  ruc: { type: String, default: '' },
  cotizacionDolar: { type: Number, default: 1000 },
  fechaCotizacion: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Config', configSchema);
