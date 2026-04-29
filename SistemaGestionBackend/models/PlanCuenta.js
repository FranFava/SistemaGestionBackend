const mongoose = require('mongoose');

const planCuentaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'orden'],
    required: true
  },
  naturaleza: {
    type: String,
    enum: ['deudora', 'acreedora'],
    required: true
  },
  nivel: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  padre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanCuenta'
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa'
  },
  permiteMovimientos: {
    type: Boolean,
    default: false
  },
  permiteAuxiliares: {
    type: Boolean,
    default: false
  },
  auxiliarDe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PlanCuenta'
  },
  saldoInicial: {
    ARS: { type: Number, default: 0 },
    USD: { type: Number, default: 0 }
  },
  saldo: {
    ARS: { type: Number, default: 0 },
    USD: { type: Number, default: 0 }
  },
  calculaSaldo: {
    type: Boolean,
    default: true
  },
  esrauditada: {
    type: Boolean,
    default: true
  },
  configurable: {
    type: Boolean,
    default: true
  },
  descripcion: String,
  grupo: String,
  posicionOrden: Number,
  activa: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

planCuentaSchema.index({ codigo: 1, empresa: 1 }, { unique: true });
planCuentaSchema.index({ empresa: 1, tipo: 1 });
planCuentaSchema.index({ padre: 1 });

planCuentaSchema.virtual('hijos', {
  ref: 'PlanCuenta',
  localField: '_id',
  foreignField: 'padre'
});

planCuentaSchema.virtual('auxiliares', {
  ref: 'PlanCuenta',
  localField: '_id',
  foreignField: 'auxiliarDe'
});

planCuentaSchema.set('toJSON', { virtuals: true });
planCuentaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PlanCuenta', planCuentaSchema);