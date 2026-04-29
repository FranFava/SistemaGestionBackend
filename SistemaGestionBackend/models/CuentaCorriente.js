const mongoose = require('mongoose');

const cuentaCorrienteSchema = new mongoose.Schema({
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  },
  titular: {
    tipo: {
      type: String,
      enum: ['cliente', 'proveedor'],
      required: true
    },
    entidad: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    nombre: String,
    documento: String,
    telefono: String,
    email: String,
    direccion: String,
    condicionIVA: String
  },
  saldo: {
    ARS: { type: Number, default: 0 },
    USD: { type: Number, default: 0 }
  },
  saldoContable: {
    ARS: { type: Number, default: 0 },
    USD: { type: Number, default: 0 }
  },
  limites: {
    credito: {
      ARS: { type: Number, default: 0 },
      USD: { type: Number, default: 0 }
    },
    alerta: {
      ARS: { type: Number, default: 0 },
      USD: { type: Number, default: 0 }
    }
  },
  bloqueo: {
    activo: { type: Boolean, default: false },
    motivo: String,
    fecha: Date,
    por: mongoose.Schema.Types.ObjectId
  },
  movimientos: [{
    fecha: Date,
    tipo: {
      type: String,
      enum: ['cargo', 'abono', 'ajuste'],
      required: true
    },
    concepto: String,
    origen: {
      tipo: String,
      id: mongoose.Schema.Types.ObjectId
    },
    comprobante: String,
    importe: {
      ARS: { type: Number, required: true },
      USD: { type: Number, default: 0 }
    },
    moneda: {
      type: String,
      default: 'ARS'
    },
    saldoAnterior: {
      ARS: Number,
      USD: Number
    },
    saldoNuevo: {
      ARS: Number,
      USD: Number
    },
    observaciones: String
  }],
  estado: {
    type: String,
    enum: ['activa', 'bloqueada', 'cerrada', 'suspendida'],
    default: 'activa'
  },
  ultimoMovimiento: Date,
  activa: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

cuentaCorrienteSchema.index({ empresa: 1, 'titular.tipo': 1, 'titular.entidad': 1 }, { unique: true });
cuentaCorrienteSchema.index({ empresa: 1, ultimoMovimiento: -1 });
cuentaCorrienteSchema.index({ empresa: 1, 'saldo.ARS': 1 });

cuentaCorrienteSchema.methods.actualizarSaldo = function() {
  let saldoARS = 0;
  let saldoUSD = 0;
  this.movimientos.forEach(m => {
    if (m.tipo === 'cargo') {
      saldoARS += m.importe.ARS;
      saldoUSD += m.importe.USD;
    } else {
      saldoARS -= m.importe.ARS;
      saldoUSD -= m.importe.USD;
    }
  });
  this.saldo = { ARS: saldoARS, USD: saldoUSD };
  this.saldoContable = { ARS: saldoARS, USD: saldoUSD };
  return this.saldo;
};

cuentaCorrienteSchema.methods.agregarMovimiento = async function(data) {
  const saldoAnterior = { ...this.saldo };
  
  this.movimientos.push({
    fecha: data.fecha || new Date(),
    tipo: data.tipo,
    concepto: data.concepto,
    origen: data.origen,
    comprobante: data.comprobante,
    importe: data.importe,
    moneda: data.moneda || 'ARS',
    saldoAnterior,
    saldoNuevo: this.saldo,
    observaciones: data.observaciones
  });
  
  if (data.importe.ARS) {
    data.tipo === 'cargo' 
      ? (this.saldo.ARS += data.importe.ARS)
      : (this.saldo.ARS -= data.importe.ARS);
  }
  if (data.importe.USD) {
    data.tipo === 'cargo'
      ? (this.saldo.USD += data.importe.USD)
      : (this.saldo.USD -= data.importe.USD);
  }
  
  this.ultimoMovimiento = new Date();
  await this.save();
  return this;
};

cuentaCorrienteSchema.set('toJSON', { virtuals: true });
cuentaCorrienteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CuentaCorriente', cuentaCorrienteSchema);