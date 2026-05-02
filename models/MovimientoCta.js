const mongoose = require('mongoose');
const { toNumber } = require('../utils/decimal.utils');

const movimientoCtaSchema = new mongoose.Schema({
  id_cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CuentaCorriente',
    required: true
  },
  id_comprobante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comprobante',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  tipo: {
    type: String,
    enum: ['DEBE', 'HABER'],
    required: true
  },
  monto: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  concepto: {
    type: String,
    required: true
  },
  observaciones: String
}, {
  timestamps: true
});

movimientoCtaSchema.index({ id_cuenta: 1, fecha: -1 });
movimientoCtaSchema.index({ id_comprobante: 1 });
movimientoCtaSchema.index({ tipo: 1, moneda: 1 });
movimientoCtaSchema.index({ fecha: -1 });

movimientoCtaSchema.statics.calcularSaldo = async function (id_cuenta, moneda) {
  const query = { id_cuenta: new mongoose.Types.ObjectId(id_cuenta) };
  if (moneda) query.moneda = moneda;

  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalDebe: {
          $sum: {
            $cond: [{ $eq: ['$tipo', 'DEBE'] }, { $toDouble: '$monto' }, 0]
          }
        },
        totalHaber: {
          $sum: {
            $cond: [{ $eq: ['$tipo', 'HABER'] }, { $toDouble: '$monto' }, 0]
          }
        }
      }
    }
  ]);

  if (!result.length) {
    return { debe: 0, haber: 0, saldo: 0 };
  }

  const { totalDebe, totalHaber } = result[0];
  return {
    debe: Math.round(totalDebe * 100) / 100,
    haber: Math.round(totalHaber * 100) / 100,
    saldo: Math.round((totalDebe - totalHaber) * 100) / 100
  };
};

movimientoCtaSchema.statics.calcularSaldoPorMoneda = async function (id_cuenta) {
  const result = await this.aggregate([
    { $match: { id_cuenta: new mongoose.Types.ObjectId(id_cuenta) } },
    {
      $group: {
        _id: { moneda: '$moneda', tipo: '$tipo' },
        total: { $sum: { $toDouble: '$monto' } }
      }
    }
  ]);

  const saldo = {
    ARS: { debe: 0, haber: 0, saldo: 0 },
    USD: { debe: 0, haber: 0, saldo: 0 }
  };

  result.forEach(r => {
    const moneda = r._id.moneda;
    if (r._id.tipo === 'DEBE') {
      saldo[moneda].debe = Math.round(r.total * 100) / 100;
    } else {
      saldo[moneda].haber = Math.round(r.total * 100) / 100;
    }
    saldo[moneda].saldo = Math.round((saldo[moneda].debe - saldo[moneda].haber) * 100) / 100;
  });

  return saldo;
};

movimientoCtaSchema.statics.getEstadoCuenta = async function (id_cuenta, desde, hasta) {
  const query = { id_cuenta: new mongoose.Types.ObjectId(id_cuenta) };
  if (desde || hasta) {
    query.fecha = {};
    if (desde) query.fecha.$gte = new Date(desde);
    if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
  }

  const movimientos = await this.find(query)
    .populate('id_comprobante', 'tipo nro_comprobante moneda monto_original')
    .sort({ fecha: 1, _id: 1 });

  let saldoParcial = 0;
  return movimientos.map(m => {
    if (m.tipo === 'DEBE') {
      saldoParcial += toNumber(m.monto);
    } else {
      saldoParcial -= toNumber(m.monto);
    }
    return {
      ...m.toObject(),
      saldo_parcial: Math.round(saldoParcial * 100) / 100
    };
  });
};

module.exports = mongoose.model('MovimientoCta', movimientoCtaSchema);
