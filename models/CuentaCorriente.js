const mongoose = require('mongoose');

const cuentaCorrienteSchema = new mongoose.Schema({
  id_tercero: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tercero',
    required: true
  },
  tipo: {
    type: String,
    enum: ['cliente', 'proveedor'],
    required: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  fecha_apertura: {
    type: Date,
    default: Date.now
  },
  activa: {
    type: Boolean,
    default: true
  },
  limite_credito: {
    type: Number,
    default: 0
  },
  dias_vencimiento_default: {
    type: Number,
    default: 30
  },
  permite_senia: {
    type: Boolean,
    default: false
  },
  saldo_senia_disponible: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

cuentaCorrienteSchema.index({ id_tercero: 1, tipo: 1, moneda: 1 }, { unique: true });
cuentaCorrienteSchema.index({ id_tercero: 1, activa: 1 });
cuentaCorrienteSchema.index({ tipo: 1, moneda: 1, activa: 1 });

cuentaCorrienteSchema.methods.verificarLimiteCredito = function (saldo) {
  if (!this.activa) {
    return { dentroLimite: false, motivo: 'Cuenta inactiva' };
  }
  if (this.limite_credito <= 0) {
    return { dentroLimite: true };
  }
  if (saldo > this.limite_credito) {
    return {
      dentroLimite: false,
      motivo: 'Limite de credito excedido',
      saldo,
      limite: this.limite_credito,
      diferencia: Math.round((saldo - this.limite_credito) * 100) / 100
    };
  }
  return { dentroLimite: true, saldo };
};

cuentaCorrienteSchema.set('toJSON', { virtuals: true });
cuentaCorrienteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CuentaCorriente', cuentaCorrienteSchema);
