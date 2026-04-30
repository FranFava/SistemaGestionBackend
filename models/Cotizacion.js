const mongoose = require('mongoose');

const cotizacionSchema = new mongoose.Schema({
  monedaOrigen: {
    type: String,
    enum: ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'],
    required: true
  },
  monedaDestino: {
    type: String,
    enum: ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'],
    default: 'ARS'
  },
  venta: {
    type: Number,
    required: true
  },
  compra: Number,
  fecha: {
    type: Date,
    default: Date.now
  },
  origen: {
    type: String,
    enum: ['bcra', 'galicia', 'nacion', 'oficial', 'blue', 'oficial'],
    default: 'bcra'
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa'
  },
  activa: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

cotizacionSchema.index({ empresa: 1, monedaOrigen: 1, monedaDestino: 1, fecha: -1 });

cotizacionSchema.statics.obtenerActual = async function(monedaOrigen, monedaDestino = 'ARS', empresa = null) {
  const query = { monedaOrigen, monedaDestino, activa: true };
  if (empresa) query.empresa = empresa;
  
  return this.findOne(query).sort({ fecha: -1 });
};

cotizacionSchema.statics.convertir = async function(monto, monedaOrigen, monedaDestino, empresa = null) {
  if (monedaOrigen === monedaDestino) return monto;
  
  const cotizacion = await this.obtenerActual(monedaOrigen, monedaDestino, empresa);
  if (!cotizacion) return null;
  
  return monto * cotizacion.venta;
};

module.exports = mongoose.model('Cotizacion', cotizacionSchema);