const PlanCuenta = require('../models/PlanCuenta');

const getCuentas = async (req, res) => {
  try {
    const { empresa, tipo, nivel, padre, busca } = req.query;
    const query = { activa: true };
    
    if (empresa) query.empresa = empresa;
    if (tipo) query.tipo = tipo;
    if (nivel) query.nivel = nivel;
    if (padre) query.padre = padre;
    if (busca) {
      query.$or = [
        { nombre: { $regex: busca, $options: 'i' } },
        { codigo: { $regex: busca, $options: 'i' } }
      ];
    }
    
    const cuentas = await PlanCuenta.find(query)
      .populate('padre', 'codigo nombre')
      .populate('empresa', 'nombre')
      .sort({ codigo: 1 });
    
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCuentaById = async (req, res) => {
  try {
    const cuenta = await PlanCuenta.findById(req.params.id)
      .populate('padre', 'codigo nombre')
      .populate('empresa', 'nombre');
    
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCuenta = async (req, res) => {
  try {
    const { empresa } = req.body;
    const existente = await PlanCuenta.findOne({ empresa, codigo: req.body.codigo });
    if (existente) {
      return res.status(400).json({ message: 'Ya existe una cuenta con ese código para esta empresa' });
    }
    
    const cuenta = new PlanCuenta(req.body);
    await cuenta.save();
    res.status(201).json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCuenta = async (req, res) => {
  try {
    const cuenta = await PlanCuenta.findByIdAndUpdate(
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

const deleteCuenta = async (req, res) => {
  try {
    const tieneHijos = await PlanCuenta.countDocuments({ padre: req.params.id, activa: true });
    if (tieneHijos > 0) {
      return res.status(400).json({ message: 'No puedes eliminar una cuenta que tiene subcuentas' });
    }
    
    const cuenta = await PlanCuenta.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );
    if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
    res.json({ message: 'Cuenta eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCuentasPorNivel = async (req, res) => {
  try {
    const { empresa, nivel } = req.query;
    const cuentas = await PlanCuenta.find({
      empresa,
      nivel: parseInt(nivel),
      activa: true
    }).sort({ codigo: 1 });
    
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEstructuraCompleta = async (req, res) => {
  try {
    const { empresa } = req.query;
    const cuentas = await PlanCuenta.find({ empresa, activa: true }).sort({ codigo: 1 });
    
    const estructura = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
    cuentas.forEach(c => {
      if (!estructura[c.nivel]) estructura[c.nivel] = {};
      estructura[c.nivel][c.codigo] = c;
    });
    
    res.json(estructura);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCuentas,
  getCuentaById,
  createCuenta,
  updateCuenta,
  deleteCuenta,
  getCuentasPorNivel,
  getEstructuraCompleta
};