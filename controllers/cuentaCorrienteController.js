const CuentaCorriente = require('../models/CuentaCorriente');

const getCuentas = async (req, res) => {
  try {
    const { empresa, tipo, estado, busca } = req.query;
    const query = { activa: true };
    
    if (empresa) query.empresa = empresa;
    if (tipo) query['titular.tipo'] = tipo;
    if (estado) query.estado = estado;
    if (busca) {
      query['titular.nombre'] = { $regex: busca, $options: 'i' };
    }
    
    const cuentas = await CuentaCorriente.find(query)
      .populate('empresa', 'nombre')
      .sort({ 'titular.nombre': 1 });
    
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCuentaById = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id)
      .populate('empresa', 'nombre');
    
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCuentaPorEntidad = async (req, res) => {
  try {
    const { empresa, tipo, entidad } = req.query;
    
    const cuenta = await CuentaCorriente.findOne({
      empresa,
      'titular.tipo': tipo,
      'titular.entidad': entidad,
      activa: true
    });
    
    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta no encontrada' });
    }
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCuenta = async (req, res) => {
  try {
    const { empresa, titular } = req.body;
    
    const existente = await CuentaCorriente.findOne({
      empresa,
      'titular.tipo': titular.tipo,
      'titular.entidad': titular.entidad,
      activa: true
    });
    
    if (existente) {
      return res.status(400).json({ message: 'Ya existe una cuenta corriente para esta entidad' });
    }
    
    const cuenta = new CuentaCorriente(req.body);
    await cuenta.save();
    res.status(201).json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const agregarMovimiento = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    
    await cuenta.agregarMovimiento(req.body);
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bloquearCuenta = async (req, res) => {
  try {
    const { motivo } = req.body;
    const cuenta = await CuentaCorriente.findById(req.params.id);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    
    cuenta.bloqueo = {
      activo: true,
      motivo,
      fecha: new Date(),
      por: req.user?.id
    };
    cuenta.estado = 'bloqueada';
    
    await cuenta.save();
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const desbloquearCuenta = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    
    cuenta.bloqueo = { activo: false };
    cuenta.estado = 'activa';
    
    await cuenta.save();
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMovimientos = async (req, res) => {
  try {
    const cuenta = await CuentaCorriente.findById(req.params.id);
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    
    const { desde, hasta } = req.query;
    let movimientos = cuenta.movimientos;
    
    if (desde || hasta) {
      movimientos = movimientos.filter(m => {
        if (desde && new Date(m.fecha) < new Date(desde)) return false;
        if (hasta && new Date(m.fecha) > new Date(hasta)) return false;
        return true;
      });
    }
    
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSaldos = async (req, res) => {
  try {
    const { empresa, tipo } = req.query;
    const query = { empresa, activa: true };
    if (tipo) query['titular.tipo'] = tipo;
    
    const cuentas = await CuentaCorriente.find(query);
    
    const saldos = {
      ARS: { total: 0, aFavor: 0, enContra: 0 },
      USD: { total: 0, aFavor: 0, enContra: 0 }
    };
    
    cuentas.forEach(c => {
      saldos.ARS.total += c.saldo.ARS;
      saldos.USD.total += c.saldo.USD;
      
      if (c.saldo.ARS > 0) saldos.ARS.aFavor += c.saldo.ARS;
      else saldos.ARS.enContra += Math.abs(c.saldo.ARS);
      
      if (c.saldo.USD > 0) saldos.USD.aFavor += c.saldo.USD;
      else saldos.USD.enContra += Math.abs(c.saldo.USD);
    });
    
    res.json(saldos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCuentas,
  getCuentaById,
  getCuentaPorEntidad,
  createCuenta,
  updateCuenta,
  agregarMovimiento,
  bloquearCuenta,
  desbloquearCuenta,
  getMovimientos,
  getSaldos
};