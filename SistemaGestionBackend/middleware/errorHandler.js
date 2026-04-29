const errorHandler = (err, req, res, next) => {
  console.error('═══════════════════════════════════════════');
  console.error('❌ ERROR EN RUTA:', req.method, req.originalUrl);
  console.error('📝 Mensaje:', err.message);
  console.error('🔍 Tipo:', err.name);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error('📋 Stack:', err.stack);
  }
  console.error('═══════════════════════════════════════════');

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validacion',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalido'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Valor duplicado'
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
};

module.exports = errorHandler;
