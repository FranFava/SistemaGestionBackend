const mongoose = require('mongoose');
const Prestamo = require('../models/Prestamo');
const CuotaPrestamo = require('../models/CuotaPrestamo');
const Caja = require('../models/Caja');

const getPrestamos = async (req, res) => {
  try {
    const { estado, moneda, acreedor } = req.query;
    const query = {};

    if (estado) query.estado = estado;
    if (moneda) query.moneda = moneda;
    if (acreedor) query.acreedor = { $regex: acreedor, $options: 'i' };

    const prestamos = await Prestamo.find(query).sort({ fecha_inicio: -1 });

    res.json({ success: true, data: prestamos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPrestamoById = async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id);

    if (!prestamo) {
      return res.status(404).json({ success: false, message: 'Prestamo no encontrado' });
    }

    const cuotas = await CuotaPrestamo.find({ id_prestamo: prestamo._id }).sort({ nro_cuota: 1 });

    res.json({ success: true, data: { ...prestamo.toObject(), cuotas } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPrestamo = async (req, res) => {
  try {
    const { acreedor, monto_capital, moneda, tasa_interes, cuotas_total, tipo_sistema, fecha_inicio, observaciones } = req.body;

    if (!acreedor || !monto_capital || !moneda || tasa_interes === undefined || !cuotas_total) {
      return res.status(400).json({
        success: false,
        message: 'acreedor, monto_capital, moneda, tasa_interes y cuotas_total son requeridos'
      });
    }

    const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + cuotas_total);

    const prestamo = new Prestamo({
      acreedor,
      monto_capital,
      moneda,
      tasa_interes,
      cuotas_total,
      tipo_sistema: tipo_sistema || 'frances',
      fecha_inicio: inicio,
      fecha_vto_fin: fin,
      observaciones
    });

    await prestamo.save();

    const plan = prestamo.calcularPlanAmortizacion();
    await CuotaPrestamo.insertMany(plan);

    res.status(201).json({ success: true, data: prestamo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const pagarCuota = async (req, res) => {
  try {
    const { id, nro } = req.params;
    const { metodoPago } = req.body;

    const prestamo = await Prestamo.findById(id);
    if (!prestamo) {
      return res.status(404).json({ success: false, message: 'Prestamo no encontrado' });
    }

    const cuota = await CuotaPrestamo.findOne({ id_prestamo: id, nro_cuota: parseInt(nro) });
    if (!cuota) {
      return res.status(404).json({ success: false, message: 'Cuota no encontrada' });
    }

    if (cuota.estado === 'pagada') {
      return res.status(400).json({ success: false, message: 'Cuota ya pagada' });
    }

    const movimientoCaja = new Caja({
      tipo: 'ingreso',
      metodoPago: metodoPago || 'efectivo',
      moneda: prestamo.moneda,
      monto: cuota.monto,
      montoUSD: prestamo.moneda === 'USD' ? cuota.monto : 0,
      concepto: `Pago cuota ${cuota.nro_cuota} prestamo ${prestamo.acreedor}`,
      tipoOperacion: 'pago_prestamo',
      usuario: req.user?.id,
      referencia: { tipo: 'cuota_prestamo', id: cuota._id }
    });

    await movimientoCaja.save();

    cuota.estado = 'pagada';
    cuota.fecha_pago = new Date();
    cuota.id_caja = movimientoCaja._id;
    await cuota.save();

    prestamo.marcarCuotaPagada();
    await prestamo.save();

    res.json({ success: true, data: { prestamo, cuota } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const anularCuota = async (req, res) => {
  try {
    const cuota = await CuotaPrestamo.findById(req.params.id);

    if (!cuota || cuota.estado !== 'pagada') {
      return res.status(400).json({ success: false, message: 'Cuota no pagada' });
    }

    if (cuota.id_caja) {
      await Caja.findByIdAndUpdate(cuota.id_caja, { activo: false, fechaEliminacion: new Date() });
    }

    cuota.estado = 'pendiente';
    cuota.fecha_pago = null;
    cuota.id_caja = null;
    await cuota.save();

    const prestamo = await Prestamo.findById(cuota.id_prestamo);
    if (prestamo.cuotas_pagadas > 0) {
      prestamo.cuotas_pagadas--;
      if (prestamo.estado === 'cancelado') {
        prestamo.estado = 'vigente';
      }
      await prestamo.save();
    }

    res.json({ success: true, data: cuota });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelarPrestamo = async (req, res) => {
  try {
    const prestamo = await Prestamo.findById(req.params.id);

    if (!prestamo) {
      return res.status(404).json({ success: false, message: 'Prestamo no encontrado' });
    }

    await CuotaPrestamo.updateMany(
      { id_prestamo: prestamo._id, estado: 'pendiente' },
      { estado: 'anulada' }
    );

    prestamo.cancelar();
    await prestamo.save();

    res.json({ success: true, data: prestamo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCuotas = async (req, res) => {
  try {
    const cuotas = await CuotaPrestamo.find({ id_prestamo: req.params.id }).sort({ nro_cuota: 1 });
    res.json({ success: true, data: cuotas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCuotasVencidas = async (req, res) => {
  try {
    const cuotas = await CuotaPrestamo.find({
      estado: { $in: ['pendiente', 'vencida'] },
      vencimiento: { $lt: new Date() }
    })
      .populate('id_prestamo', 'acreedor moneda')
      .sort({ vencimiento: 1 });

    res.json({ success: true, data: cuotas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProximasVencimientos = async (req, res) => {
  try {
    const { dias } = req.query;
    const limite = new Date();
    limite.setDate(limite.getDate() + parseInt(dias || 30));

    const cuotas = await CuotaPrestamo.find({
      estado: 'pendiente',
      vencimiento: { $lte: limite }
    })
      .populate('id_prestamo', 'acreedor moneda')
      .sort({ vencimiento: 1 })
      .limit(50);

    res.json({ success: true, data: cuotas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResumen = async (req, res) => {
  try {
    const prestamos = await Prestamo.find({ estado: { $in: ['vigente', 'atrasado'] } });

    const resumen = {
      ARS: { vigente: 0, atrasado: 0, capital: 0, cuotas_pendientes: 0 },
      USD: { vigente: 0, atrasado: 0, capital: 0, cuotas_pendientes: 0 }
    };

    prestamos.forEach(p => {
      const m = p.moneda;
      const key = p.estado === 'atrasado' ? 'atrasado' : 'vigente';
      resumen[m][key] += 1;
      resumen[m].capital += p.monto_capital;
      resumen[m].cuotas_pendientes += p.cuotas_pendientes;
    });

    Object.keys(resumen).forEach(m => {
      resumen[m].capital = Math.round(resumen[m].capital * 100) / 100;
    });

    res.json({ success: true, data: resumen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  pagarCuota,
  anularCuota,
  cancelarPrestamo,
  getCuotas,
  getCuotasVencidas,
  getProximasVencimientos,
  getResumen
};
