const mongoose = require('mongoose');

const movimientoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['entrada', 'salida', 'ajuste', 'reserva'],
    required: true
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  variante: {
    color: String,
    capacidad: String
  },
  cantidad: {
    type: Number,
    required: true
  },
  numeroSerie: String,
  cliente: {
    nombre: String,
    apellido: String,
    telefono: String,
    instagram: String
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  registrarCaja: {
    type: Boolean,
    default: false
  },
  cajaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja'
  },
  origen: {
    type: String,
    enum: ['sellado', 'proveedor', 'pp', 'servicio_tecnico'],
    default: null
  },
  estado: {
    type: String,
    enum: ['nuevo', 'usado', 'reacondicionado', null],
    default: null
  },
  ppData: {
    imei: String,
    capacidad: String,
    bateria: Number,
    tieneDetalles: Boolean,
    detalles: String,
    origen: {
      type: String,
      enum: ['sellado', 'proveedor', 'pp', 'servicio_tecnico'],
      default: 'pp'
    }
  },
  reserva: {
    isReserva: { type: Boolean, default: false },
    senia: { type: Number, default: 0 },
    seniaCajaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caja' },
    reservaFecha: { type: Date },
    reservaExpiracion: { type: Date },
    estado: { type: String, enum: ['reservado', 'confirmado', 'cancelado', 'vencido'], default: null },
    porcentajeSenia: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Movimiento', movimientoSchema);
