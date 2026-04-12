const Usuario = require('../models/Usuario');

/**
 * Obtiene todos los usuarios activos.
 * @async
 * @function getUsuarios
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({ activo: true }).select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo usuario.
 * @async
 * @function createUsuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createUsuario = async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;
    const existe = await Usuario.findOne({ username });
    if (existe) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }
    const usuario = new Usuario({ username, password, nombre, rol });
    await usuario.save();
    const result = usuario.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un usuario.
 * @async
 * @function updateUsuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const updateUsuario = async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;
    const updateData = { nombre, rol };
    if (password) {
      const usuario = await Usuario.findById(req.params.id);
      usuario.password = password;
      await usuario.save();
    }
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un usuario (soft delete).
 * @async
 * @function deleteUsuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const deleteUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario
};