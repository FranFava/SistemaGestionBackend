const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

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
