const TipoCambio = require('../models/TipoCambio');
const { toDecimal128, toNumber, multiply, subtract, round } = require('./decimal.utils');

async function obtenerCotizacion(fecha, tipo = 'blue') {
  const targetDate = fecha ? new Date(fecha) : new Date();

  let tc = await TipoCambio.findOne({
    fecha: { $lte: targetDate },
    tipo,
    vigente: true
  }).sort({ fecha: -1 });

  if (!tc) {
    tc = await TipoCambio.findOne({
      tipo,
      vigente: true
    }).sort({ fecha: -1 });
  }

  if (!tc) {
    throw new Error(`No se encontro cotizacion para tipo '${tipo}' en fecha ${targetDate.toISOString().split('T')[0]}`);
  }

  return tc;
}

async function getCotizacionParaComprobante(moneda, fecha, tipoCambio) {
  if (moneda === 'ARS') return null;

  if (tipoCambio) {
    if (typeof tipoCambio === 'string' && mongoose.Types.ObjectId.isValid(tipoCambio)) {
      const tc = await TipoCambio.findById(tipoCambio);
      if (tc) return tc;
    }
  }

  return obtenerCotizacion(fecha);
}

function calcularDiferenciaCambio(cotizacion_pago, cotizacion_usado, monto_original) {
  if (!cotizacion_pago || !cotizacion_usado || !monto_original) {
    return { diferencia: 0, ganancia_perdida: 0 };
  }

  const diffCotizacion = subtract(cotizacion_pago, cotizacion_usado);
  const diferencia = multiply(diffCotizacion, monto_original);
  const numDiff = toNumber(diferencia);

  return {
    diferencia: round(diferencia),
    cotizacion_diff: round(diffCotizacion),
    ganancia_perdida: numDiff >= 0 ? 'ganancia' : 'perdida',
    monto: Math.abs(numDiff)
  };
}

function calcularEquivalentes(monto_original, moneda, cotizacion) {
  if (!monto_original || !moneda || !cotizacion) {
    return { equivalente_ars: null, equivalente_usd: null };
  }

  if (moneda === 'USD') {
    return {
      equivalente_ars: round(multiply(monto_original, cotizacion)),
      equivalente_usd: monto_original
    };
  }

  if (moneda === 'ARS') {
    return {
      equivalente_ars: monto_original,
      equivalente_usd: round(monto_original / cotizacion)
    };
  }

  return { equivalente_ars: null, equivalente_usd: null };
}

const mongoose = require('mongoose');

module.exports = {
  obtenerCotizacion,
  getCotizacionParaComprobante,
  calcularDiferenciaCambio,
  calcularEquivalentes
};
