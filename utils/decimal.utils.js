const mongoose = require('mongoose');

function toDecimal128(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof mongoose.Types.Decimal128) {
    return value;
  }
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) {
    throw new Error(`No se puede convertir a Decimal128: ${value}`);
  }
  return mongoose.Types.Decimal128.fromString(num.toFixed(2));
}

function toNumber(decimal) {
  if (!decimal) return 0;
  if (typeof decimal === 'number') return decimal;
  if (decimal instanceof mongoose.Types.Decimal128) {
    return parseFloat(decimal.toString());
  }
  if (typeof decimal.toString === 'function') {
    return parseFloat(decimal.toString());
  }
  return parseFloat(decimal) || 0;
}

function add(a, b) {
  const numA = toNumber(a);
  const numB = toNumber(b);
  return toDecimal128(numA + numB);
}

function multiply(a, b) {
  const numA = toNumber(a);
  const numB = toNumber(b);
  return toDecimal128(numA * numB);
}

function subtract(a, b) {
  const numA = toNumber(a);
  const numB = toNumber(b);
  return toDecimal128(numA - numB);
}

function divide(a, b) {
  const numA = toNumber(a);
  const numB = toNumber(b);
  if (numB === 0) throw new Error('Division por cero');
  return toDecimal128(numA / numB);
}

function round(decimal, decimals = 2) {
  const num = toNumber(decimal);
  const factor = Math.pow(10, decimals);
  return toDecimal128(Math.round(num * factor) / factor);
}

function abs(decimal) {
  const num = toNumber(decimal);
  return toDecimal128(Math.abs(num));
}

function min(a, b) {
  return toNumber(a) < toNumber(b) ? a : b;
}

function compare(a, b, tolerance = 0.005) {
  const diff = Math.abs(toNumber(a) - toNumber(b));
  return diff <= tolerance ? 0 : (toNumber(a) < toNumber(b) ? -1 : 1);
}

module.exports = {
  toDecimal128,
  toNumber,
  add,
  multiply,
  subtract,
  divide,
  round,
  abs,
  min,
  compare
};
