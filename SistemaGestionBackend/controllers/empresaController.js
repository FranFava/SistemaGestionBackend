const Empresa = require('../models/Empresa');

const getEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.find({ activa: true });
    res.json(empresas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmpresaById = async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id);
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEmpresa = async (req, res) => {
  try {
    const empresa = new Empresa(req.body);
    await empresa.save();
    res.status(201).json(empresa);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe una empresa con ese CUIT' });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json({ message: 'Empresa eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConfiguracion = async (req, res) => {
  try {
    const empresa = await Empresa.findById(req.params.id);
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
    res.json({
      puntoVenta: empresa.habilitaciones.puntoVenta,
      responsableIVA: empresa.responsableIVA,
      categoriaIVA: empresa.categoriaIVA,
      configuraciones: empresa.configuraciones
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getConfiguracion
};