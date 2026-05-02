const mongoose = require('mongoose');

const prestamoSchema = new mongoose.Schema({
  acreedor: {
    type: String,
    required: true
  },
  monto_capital: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  tasa_interes: {
    type: Number,
    required: true
  },
  fecha_inicio: {
    type: Date,
    default: Date.now
  },
  fecha_vto_fin: {
    type: Date
  },
  cuotas_total: {
    type: Number,
    required: true
  },
  cuotas_pagadas: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ['vigente', 'cancelado', 'atrasado'],
    default: 'vigente'
  },
  tipo_sistema: {
    type: String,
    enum: ['frances', 'aleman'],
    default: 'frances'
  },
  tipo_operacion: {
    type: String,
    enum: ['mercado', 'otro'],
    default: 'mercado'
  },
  observaciones: String
}, {
  timestamps: true
});

prestamoSchema.index({ estado: 1, moneda: 1 });
prestamoSchema.index({ fecha_inicio: -1 });
prestamoSchema.index({ acreedor: 1 });

prestamoSchema.virtual('cuotas_pendientes').get(function () {
  return Math.max(0, this.cuotas_total - this.cuotas_pagadas);
});

prestamoSchema.virtual('monto_total_estimado').get(function () {
  if (this.tipo_sistema === 'frances') {
    const tasa = this.tasa_interes / 100;
    const cuota = this.monto_capital * (tasa * Math.pow(1 + tasa, this.cuotas_total)) / (Math.pow(1 + tasa, this.cuotas_total) - 1);
    return Math.round(cuota * this.cuotas_total * 100) / 100;
  }
  return Math.round((this.monto_capital + (this.monto_capital * this.tasa_interes / 100 * this.cuotas_total)) * 100) / 100;
});

prestamoSchema.methods.calcularPlanAmortizacion = function () {
  const cuotas = [];
  const tasa = this.tasa_interes / 100;
  const inicio = this.fecha_inicio || new Date();

  if (this.tipo_sistema === 'frances') {
    const cuotaFija = this.monto_capital * (tasa * Math.pow(1 + tasa, this.cuotas_total)) / (Math.pow(1 + tasa, this.cuotas_total) - 1);
    let saldoRestante = this.monto_capital;

    for (let i = 1; i <= this.cuotas_total; i++) {
      const interes = saldoRestante * tasa;
      const capital = cuotaFija - interes;
      saldoRestante -= capital;
      const vencimiento = new Date(inicio);
      vencimiento.setMonth(vencimiento.getMonth() + i);

      cuotas.push({
        id_prestamo: this._id,
        nro_cuota: i,
        monto: Math.round(cuotaFija * 100) / 100,
        monto_capital: Math.round(capital * 100) / 100,
        monto_interes: Math.round(interes * 100) / 100,
        vencimiento,
        estado: 'pendiente'
      });
    }
  } else {
    const capitalFijo = this.monto_capital / this.cuotas_total;
    let saldoRestante = this.monto_capital;

    for (let i = 1; i <= this.cuotas_total; i++) {
      const interes = saldoRestante * tasa;
      const monto = capitalFijo + interes;
      saldoRestante -= capitalFijo;
      const vencimiento = new Date(inicio);
      vencimiento.setMonth(vencimiento.getMonth() + i);

      cuotas.push({
        id_prestamo: this._id,
        nro_cuota: i,
        monto: Math.round(monto * 100) / 100,
        monto_capital: Math.round(capitalFijo * 100) / 100,
        monto_interes: Math.round(interes * 100) / 100,
        vencimiento,
        estado: 'pendiente'
      });
    }
  }

  return cuotas;
};

prestamoSchema.methods.marcarCuotaPagada = function () {
  this.cuotas_pagadas = Math.min(this.cuotas_pagadas + 1, this.cuotas_total);
  if (this.cuotas_pagadas >= this.cuotas_total) {
    this.estado = 'cancelado';
  }
  return this;
};

prestamoSchema.methods.cancelar = function () {
  this.estado = 'cancelado';
  return this;
};

prestamoSchema.set('toJSON', { virtuals: true });
prestamoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Prestamo', prestamoSchema);
