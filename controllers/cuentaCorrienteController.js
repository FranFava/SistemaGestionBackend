const mongoose = require('mongoose');
const CuentaCorriente = require('../models/CuentaCorriente');
const MovimientoCta = require('../models/MovimientoCta');
const Tercero = require('../models/Tercero');

const getCuentas = async (req, res) => {
  try {
    const { id_tercero, tipo, moneda, activa } = req.query;
    const query = {};

    if (id_tercero) query.id_tercero = id_tercero;
    if (tipo) query.tipo = tipo;
    if (moneda) query.moneda = moneda;
    if (activa !== undefined) query.activa = activa === 'true';

    const cuentas = await CuentaCorriente.find(query)
      .populate('id_tercero', 'razon_social nombre email telefono')
      .sort({ 'id_tercero.razon_social': 1, moneda: 1 });

    const resultado = [];
    for (const c of cuentas) {
      const saldo = await MovimientoCta.calcularSaldo(c._id);
      resultado.push({ ...c.toObject(), saldo });
    }

    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCuentaById = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id)
      .populate('id_tercero', 'razon_social nombre email telefono');

    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    const saldo = await MovimientoCta.calcularSaldo(cuenta._id);

    res.json({ success: true, data: { ...cuenta.toObject(), saldo } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCuenta = async (req, res) => {
  try {
    const { id_tercero, tipo, moneda, limite_credito, dias_vencimiento_default, permite_senia } = req.body;

    if (!id_tercero || !tipo || !moneda) {
      return res.status(400).json({ success: false, message: 'id_tercero, tipo y moneda son requeridos' });
    }

    if (!['cliente', 'proveedor'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'tipo debe ser cliente o proveedor' });
    }

    if (!['ARS', 'USD'].includes(moneda)) {
      return res.status(400).json({ success: false, message: 'moneda debe ser ARS o USD' });
    }

    const tercero = await Tercero.findById(id_tercero);
    if (!tercero) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado' });
    }

    if (tipo === 'cliente' && !tercero.es_cliente) {
      return res.status(400).json({ success: false, message: 'El tercero no es cliente' });
    }
    if (tipo === 'proveedor' && !tercero.es_proveedor) {
      return res.status(400).json({ success: false, message: 'El tercero no es proveedor' });
    }

    const existente = await CuentaCorriente.findOne({ id_tercero, tipo, moneda, activa: true });
    if (existente) {
      return res.status(400).json({ success: false, message: 'Ya existe una cuenta corriente para este tercero con esta moneda' });
    }

    const cuenta = new CuentaCorriente({
      id_tercero,
      tipo,
      moneda,
      limite_credito: limite_credito || 0,
      dias_vencimiento_default: dias_vencimiento_default || 30,
      permite_senia: !!permite_senia
    });

    await cuenta.save();

    res.status(201).json({ success: true, data: cuenta });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe una cuenta corriente para este tercero con esta moneda' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id);
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    const { limite_credito, dias_vencimiento_default, permite_senia, saldo_senia_disponible } = req.body;

    if (limite_credito !== undefined) cuenta.limite_credito = limite_credito;
    if (dias_vencimiento_default !== undefined) cuenta.dias_vencimiento_default = dias_vencimiento_default;
    if (permite_senia !== undefined) cuenta.permite_senia = permite_senia;
    if (saldo_senia_disponible !== undefined) cuenta.saldo_senia_disponible = saldo_senia_disponible;

    await cuenta.save();

    res.json({ success: true, data: cuenta });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cerrarCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id);
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    const saldo = await MovimientoCta.calcularSaldo(cuenta._id);
    if (saldo.saldo !== 0) {
      return res.status(400).json({ success: false, message: 'No se puede cerrar una cuenta con saldo pendiente', saldo });
    }

    cuenta.activa = false;
    await cuenta.save();

    res.json({ success: true, message: 'Cuenta cerrada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCuentasPorTercero = async (req, res) => {
  try {
    const { terceroId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(terceroId)) {
      return res.status(400).json({ success: false, message: 'ID de tercero invalido' });
    }

    const cuentas = await CuentaCorriente.find({ id_tercero: terceroId })
      .populate('id_tercero', 'razon_social nombre email')
      .sort({ tipo: 1, moneda: 1 });

    const resultado = [];
    for (const c of cuentas) {
      const saldo = await MovimientoCta.calcularSaldo(c._id);
      resultado.push({ ...c.toObject(), saldo });
    }

    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const buscarCuenta = async (req, res) => {
  try {
    const { q, tipo, moneda } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Busqueda requiere al menos 2 caracteres' });
    }

    const terceros = await Tercero.find({
      activo: true,
      $or: [
        { razon_social: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
        { apellido: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    const terceroIds = terceros.map(t => t._id);
    if (!terceroIds.length) {
      return res.json({ success: true, data: [] });
    }

    const query = { id_tercero: { $in: terceroIds }, activa: true };
    if (tipo) query.tipo = tipo;
    if (moneda) query.moneda = moneda;

    const cuentas = await CuentaCorriente.find(query)
      .populate('id_tercero', 'razon_social nombre email telefono')
      .sort({ 'id_tercero.razon_social': 1 });

    const resultado = [];
    for (const c of cuentas) {
      const saldo = await MovimientoCta.calcularSaldo(c._id);
      resultado.push({ ...c.toObject(), saldo });
    }

    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCuentasVencidas = async (req, res) => {
  try {
    const { tipo, moneda } = req.query;
    const query = { activa: true, limite_credito: { $gt: 0 } };
    if (tipo) query.tipo = tipo;
    if (moneda) query.moneda = moneda;

    const cuentas = await CuentaCorriente.find(query)
      .populate('id_tercero', 'razon_social nombre email');

    const vencidas = [];
    for (const c of cuentas) {
      const saldo = await MovimientoCta.calcularSaldo(c._id);
      const limite = c.verificarLimiteCredito(saldo.saldo);
      if (!limite.dentroLimite) {
        vencidas.push({ ...c.toObject(), saldo, limite });
      }
    }

    res.json({ success: true, data: vencidas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaldosResumen = async (req, res) => {
  try {
    const { id_tercero } = req.query;
    const query = { activa: true };
    if (id_tercero) query.id_tercero = id_tercero;

    const cuentas = await CuentaCorriente.find(query)
      .populate('id_tercero', 'razon_social nombre');

    const resumen = {
      cliente: {
        ARS: { cantidad: 0, totalDebe: 0, totalHaber: 0, totalSaldo: 0 },
        USD: { cantidad: 0, totalDebe: 0, totalHaber: 0, totalSaldo: 0 }
      },
      proveedor: {
        ARS: { cantidad: 0, totalDebe: 0, totalHaber: 0, totalSaldo: 0 },
        USD: { cantidad: 0, totalDebe: 0, totalHaber: 0, totalSaldo: 0 }
      }
    };

    for (const c of cuentas) {
      const saldo = await MovimientoCta.calcularSaldo(c._id);
      const key = c.tipo;
      const curr = c.moneda;

      resumen[key][curr].cantidad += 1;
      resumen[key][curr].totalDebe += saldo.debe;
      resumen[key][curr].totalHaber += saldo.haber;
      resumen[key][curr].totalSaldo += saldo.saldo;
    }

    Object.keys(resumen).forEach(tipo => {
      Object.keys(resumen[tipo]).forEach(moneda => {
        resumen[tipo][moneda].totalDebe = Math.round(resumen[tipo][moneda].totalDebe * 100) / 100;
        resumen[tipo][moneda].totalHaber = Math.round(resumen[tipo][moneda].totalHaber * 100) / 100;
        resumen[tipo][moneda].totalSaldo = Math.round(resumen[tipo][moneda].totalSaldo * 100) / 100;
      });
    });

    res.json({ success: true, data: resumen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function crearOObtenerCuenta(id_tercero, tipo, moneda, datos = {}) {
  let cuenta = await CuentaCorriente.findOne({ id_tercero, tipo, moneda, activa: true });

  if (!cuenta) {
    const tercero = await Tercero.findById(id_tercero);
    if (!tercero) return null;

    cuenta = new CuentaCorriente({
      id_tercero,
      tipo,
      moneda,
      limite_credito: datos.limite_credito || tercero.limite_credito_ars || 0,
      dias_vencimiento_default: datos.dias_vencimiento || 30,
      permite_senia: datos.permite_senia || false
    });
    await cuenta.save();
  }

  return cuenta;
}

module.exports = {
  getCuentas,
  getCuentaById,
  createCuenta,
  updateCuenta,
  cerrarCuenta,
  getCuentasPorTercero,
  buscarCuenta,
  getCuentasVencidas,
  getSaldosResumen,
  crearOObtenerCuenta
};
