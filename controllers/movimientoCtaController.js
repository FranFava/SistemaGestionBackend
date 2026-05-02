const mongoose = require('mongoose');
const MovimientoCta = require('../models/MovimientoCta');
const CuentaCorriente = require('../models/CuentaCorriente');

const getMovimientos = async (req, res) => {
  try {
    const { id_cuenta, tipo, moneda, desde, hasta } = req.query;
    const query = {};

    if (id_cuenta) query.id_cuenta = id_cuenta;
    if (tipo) query.tipo = tipo;
    if (moneda) query.moneda = moneda;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const movimientos = await MovimientoCta.find(query)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_comprobante', 'tipo nro_comprobante')
      .sort({ fecha: -1 });

    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMovimientoById = async (req, res) => {
  try {
    const movimiento = await MovimientoCta.findById(req.params.id)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_comprobante', 'tipo nro_comprobante fecha moneda monto_original');

    if (!movimiento) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    res.json({ success: true, data: movimiento });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createMovimiento = async (req, res) => {
  try {
    const { id_cuenta, id_comprobante, tipo, monto, moneda, fecha, concepto, observaciones } = req.body;

    if (!id_cuenta || !id_comprobante || !tipo || !monto || !moneda || !concepto) {
      return res.status(400).json({ success: false, message: 'id_cuenta, id_comprobante, tipo, monto, moneda y concepto son requeridos' });
    }

    if (!['DEBE', 'HABER'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'tipo debe ser DEBE o HABER' });
    }

    if (!['ARS', 'USD'].includes(moneda)) {
      return res.status(400).json({ success: false, message: 'moneda debe ser ARS o USD' });
    }

    if (monto <= 0) {
      return res.status(400).json({ success: false, message: 'monto debe ser positivo' });
    }

    const cuenta = await CuentaCorriente.findById(id_cuenta);
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta corriente no encontrada' });
    }

    if (cuenta.moneda !== moneda) {
      return res.status(400).json({
        success: false,
        message: `La moneda del movimiento (${moneda}) no coincide con la cuenta (${cuenta.moneda})`
      });
    }

    const movimiento = new MovimientoCta({
      id_cuenta,
      id_comprobante,
      tipo,
      monto,
      moneda,
      fecha: fecha || new Date(),
      concepto,
      observaciones
    });

    await movimiento.save();

    const saldo = await MovimientoCta.calcularSaldo(id_cuenta);

    res.status(201).json({ success: true, data: movimiento, saldo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cuentaId)) {
      return res.status(400).json({ success: false, message: 'ID de cuenta invalido' });
    }

    const movimientos = await MovimientoCta.find({ id_cuenta: cuentaId })
      .populate('id_comprobante', 'tipo nro_comprobante')
      .sort({ fecha: -1 });

    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaldo = async (req, res) => {
  try {
    const { cuentaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cuentaId)) {
      return res.status(400).json({ success: false, message: 'ID de cuenta invalido' });
    }

    const saldo = await MovimientoCta.calcularSaldo(cuentaId);
    const saldoPorMoneda = await MovimientoCta.calcularSaldoPorMoneda(cuentaId);

    res.json({ success: true, data: { id_cuenta: cuentaId, saldo, por_moneda: saldoPorMoneda } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEstadoCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { desde, hasta } = req.query;

    if (!mongoose.Types.ObjectId.isValid(cuentaId)) {
      return res.status(400).json({ success: false, message: 'ID de cuenta invalido' });
    }

    const movimientos = await MovimientoCta.getEstadoCuenta(cuentaId, desde, hasta);
    const saldo = await MovimientoCta.calcularSaldo(cuentaId);

    res.json({ success: true, data: { id_cuenta: cuentaId, saldo, movimientos } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResumen = async (req, res) => {
  try {
    const { id_cuenta, desde, hasta } = req.query;

    const query = {};
    if (id_cuenta) query.id_cuenta = id_cuenta;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const movimientos = await MovimientoCta.find(query);

    const resumen = {
      ARS: { debe: 0, haber: 0, saldo: 0, cantidad: 0 },
      USD: { debe: 0, haber: 0, saldo: 0, cantidad: 0 }
    };

    movimientos.forEach(m => {
      const moneda = m.moneda;
      if (m.tipo === 'DEBE') {
        resumen[moneda].debe += m.monto;
      } else {
        resumen[moneda].haber += m.monto;
      }
      resumen[moneda].cantidad += 1;
    });

    ['ARS', 'USD'].forEach(moneda => {
      resumen[moneda].debe = Math.round(resumen[moneda].debe * 100) / 100;
      resumen[moneda].haber = Math.round(resumen[moneda].haber * 100) / 100;
      resumen[moneda].saldo = Math.round((resumen[moneda].debe - resumen[moneda].haber) * 100) / 100;
    });

    res.json({ success: true, data: resumen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMovimientos,
  getMovimientoById,
  createMovimiento,
  getByCuenta,
  getSaldo,
  getEstadoCuenta,
  getResumen
};
