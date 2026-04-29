const jwt = require('jsonwebtoken');

const auth = function(req, res, next) {
  try {
    const token = req.header('x-auth-token') || req.headers['x-auth-token'];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }
    return res.status(401).json({ success: false, message: 'Error de autenticacion' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ success: false, message: 'Solo administradores pueden realizar esta acción' });
  }
  next();
};

module.exports = { auth, adminOnly };
