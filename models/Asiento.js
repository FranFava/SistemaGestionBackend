const mongoose = require('mongoose');

const asientoSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true
  },
  ejercicio: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  concepto: {
    type: String,
    required: true
  },
  naturaleza: {
    type: String,
    enum: ['ingreso', 'egreso', 'transferencia', 'ajuste'],
    required: true
  },
  tipo: {
    type: String,
    enum: ['manual', 'automatico'],
    default: 'manual'
  },
  origen: {
    tipo: String,
    id: mongoose.Schema.Types.ObjectId
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  },
  lineas: [{
    cuenta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlanCuenta',
      required: true
    },
    cuentaCodigo: String,
    cuentaNombre: String,
    debe: {
      type: Number,
      default: 0
    },
    haber: {
      type: Number,
      default: 0
    },
    detalle: String,
    auxiliares: {
      cliente: mongoose.Schema.Types.ObjectId,
      proveedor: mongoose.Schema.Types.ObjectId,
      producto: mongoose.Schema.Types.ObjectId,
      comprobante: mongoose.Schema.Types.ObjectId
    }
  }],
  totalDebe: {
    type: Number,
    default: 0
  },
  totalHaber: {
    type: Number,
    default: 0
  },
  cuadrado: {
    type: Boolean,
    default: true
  },
  diferencia: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ['borrador', 'confirmado', 'anulado'],
    default: 'confirmado'
  },
  observaciones: String,
  referencia: String,
  tags: [String],
}, {
  timestamps: true
});

asientoSchema.index({ empresa: 1, ejercicio: 1, numero: 1 }, { unique: true });
asientoSchema.index({ empresa: 1, fecha: 1 });
asientoSchema.index({ origen: 1, 'origen.tipo': 1 });

asientoSchema.methods.cuadrar = function() {
  this.totalDebe = this.lineas.reduce((sum, l) => sum + (l.debe || 0), 0);
  this.totalHaber = this.lineas.reduce((sum, l) => sum + (l.haber || 0), 0);
  this.diferencia = Math.abs(this.totalDebe - this.totalHaber);
  this.cuadrado = this.diferencia < 0.01;
  return this.cuadrado;
};

asientoSchema.pre('save', function(next) {
  this.cuadrar();
  next();
});

module.exports = mongoose.model('Asiento', asientoSchema);