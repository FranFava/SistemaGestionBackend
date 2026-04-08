const Proveedor = require('../models/Proveedor');

const getProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ activo: true });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProveedor = async (req, res) => {
  try {
    const proveedor = new Proveedor(req.body);
    await proveedor.save();
    res.status(201).json(proveedor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor
};
