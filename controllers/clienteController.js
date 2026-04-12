const Cliente = require('../models/Cliente');

/**
 * Obtiene todos los clientes activos.
 * @async
 * @function getClientes
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({ activo: true });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo cliente.
 * @async
 * @function createCliente
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createCliente = async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un cliente.
 * @async
 * @function updateCliente
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un cliente (soft delete).
 * @async
 * @function deleteCliente
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const deleteCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
};
