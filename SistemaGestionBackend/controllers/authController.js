const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Autentica un usuario y retorna token JWT.
 * @async
 * @function login
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const usuario = await Usuario.findOne({ username, activo: true });
    
    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Registra un nuevo usuario.
 * @async
 * @function register
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware
 */
const register = async (req, res, next) => {
  try {
    const { username, password, nombre, rol } = req.body;
    const usuario = new Usuario({ username, password, nombre, rol });
    await usuario.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Valida un token JWT y retorna el usuario.
 * @async
 * @function validateToken
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const validateToken = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      token = req.headers['x-auth-token'];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo' });
    }

    res.json({
      usuario: {
        id: usuario._id,
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, register, validateToken };
