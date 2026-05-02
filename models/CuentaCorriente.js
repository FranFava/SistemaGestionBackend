const mongoose = require('mongoose');

const movimientoSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now
  },
  tipo: {
    type: String,
    enum: ['cargo', 'abono', 'ajuste', 'senia'],
    required: true
  },
  concepto: {
    type: String,
    required: true
  },
  origen: {
    tipo: String,
    id: mongoose.Schema.Types.ObjectId
  },
  comprobante: String,
  importe: {
    type: Number,
    required: true
  },
  observaciones: String
}, { _id: true });

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
  },
  movimientos: [movimientoSchema]
}, {
  timestamps: true
});

cuentaCorrienteSchema.index({ id_tercero: 1, tipo: 1, moneda: 1 }, { unique: true });
cuentaCorrienteSchema.index({ id_tercero: 1, activa: 1 });
cuentaCorrienteSchema.index({ tipo: 1, moneda: 1, activa: 1 });

cuentaCorrienteSchema.virtual('saldo_calculado').get(function () {
  let debe = 0;
  let haber = 0;
  this.movimientos.forEach(m => {
    if (m.tipo === 'cargo' || m.tipo === 'ajuste') {
      debe += m.importe || 0;
    } else {
      haber += m.importe || 0;
    }
  });
  return {
    debe: Math.round(debe * 100) / 100,
    haber: Math.round(haber * 100) / 100,
    saldo: Math.round((debe - haber) * 100) / 100
  };
});

cuentaCorrienteSchema.methods.recalcularSaldo = function () {
  return this.saldo_calculado;
};

cuentaCorrienteSchema.methods.verificarLimiteCredito = function () {
  if (!this.activa) {
    return { dentroLimite: false, motivo: 'Cuenta inactiva' };
  }
  if (this.limite_credito <= 0) {
    return { dentroLimite: true };
  }
  const { saldo } = this.saldo_calculado;
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

cuentaCorrienteSchema.methods.agregarMovimiento = function (data) {
  if (!this.activa) {
    throw new Error('No se pueden agregar movimientos a una cuenta inactiva');
  }

  const movimiento = {
    fecha: data.fecha || new Date(),
    tipo: data.tipo,
    concepto: data.concepto,
    origen: data.origen,
    comprobante: data.comprobante,
    importe: data.importe,
    observaciones: data.observaciones
  };

  this.movimientos.push(movimiento);

  if (data.tipo === 'senia') {
    this.saldo_senia_disponible = (this.saldo_senia_disponible || 0) + data.importe;
  }

  return this;
};

cuentaCorrienteSchema.methods.getEstadoCuenta = function (desde, hasta) {
  let filtrados = this.movimientos;
  if (desde) {
    const fechaDesde = new Date(desde);
    filtrados = filtrados.filter(m => new Date(m.fecha) >= fechaDesde);
  }
  if (hasta) {
    const fechaHasta = new Date(hasta);
    fechaHasta.setHours(23, 59, 59, 999);
    filtrados = filtrados.filter(m => new Date(m.fecha) <= fechaHasta);
  }

  let saldoAcumulado = 0;
  const movimientosConSaldo = filtrados.map(m => {
    if (m.tipo === 'cargo' || m.tipo === 'ajuste') {
      saldoAcumulado += m.importe || 0;
    } else {
      saldoAcumulado -= m.importe || 0;
    }
    return {
      ...m.toObject ? m.toObject() : m,
      saldo_parcial: Math.round(saldoAcumulado * 100) / 100
    };
  });

  return movimientosConSaldo;
};

cuentaCorrienteSchema.set('toJSON', { virtuals: true });
cuentaCorrienteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CuentaCorriente', cuentaCorrienteSchema);
