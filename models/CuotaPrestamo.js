const mongoose = require('mongoose');

const cuotaPrestamoSchema = new mongoose.Schema({
  id_prestamo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestamo',
    required: true
  },
  nro_cuota: {
    type: Number,
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  monto_capital: Number,
  monto_interes: Number,
  vencimiento: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'pagada', 'vencida', 'anulada'],
    default: 'pendiente'
  },
  fecha_pago: Date,
  id_caja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja'
  },
  observaciones: String
}, {
  timestamps: true
});

cuotaPrestamoSchema.index({ id_prestamo: 1, nro_cuota: 1 }, { unique: true });
cuotaPrestamoSchema.index({ estado: 1, vencimiento: 1 });
cuotaPrestamoSchema.index({ vencimiento: 1 });

cuotaPrestamoSchema.pre('save', function (next) {
  if (this.estado === 'pendiente' && this.vencimiento < new Date()) {
    this.estado = 'vencida';
  }
  next();
});

cuotaPrestamoSchema.set('toJSON', { virtuals: true });
cuotaPrestamoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CuotaPrestamo', cuotaPrestamoSchema);
