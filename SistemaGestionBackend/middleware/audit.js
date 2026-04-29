const AuditLog = require('../models/AuditLog');

const auditMiddleware = (modelo, opciones = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      res.send = originalSend;
      
      const esError = res.statusCode >= 400;
      const esExito = res.statusCode >= 200 && res.statusCode < 300;
      
      if ((esExito || esError) && req.user && req.user.id) {
        const entidad = opciones.entidad || modelo;
        const entidadId = req.params.id || (req.body && req.body._id);
        
        if (entidadId && esExito) {
          const accion = req.method === 'POST' ? 'create' : 
                      req.method === 'PUT' || req.method === 'PATCH' ? 'update' : 
                      req.method === 'DELETE' ? 'delete' : null;
          
          if (accion && entidadId) {
            const datosAnteriores = req.method !== 'POST' ? req.body : null;
            const datosNuevos = req.method !== 'DELETE' ? body : null;
            
            AuditLog.registrar({
              empresa: req.body.empresa || req.user.empresa,
              entidad,
              entidadId,
              accion,
              usuario: req.user.id,
              usuarioNombre: req.user.nombre || req.user.username,
              ip: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent'),
              datosAnteriores,
              datosNuevos,
              descripcion: `${req.method} ${req.originalUrl}`
            }).catch(err => console.error('Error al registrar auditoría:', err.message));
          }
        }
      }
      
      return res.send(body);
    };
    
    next();
  };
};

const auditar = async (req, datos) => {
  try {
    await AuditLog.registrar({
      empresa: req.user?.empresa,
      entidad: datos.entidad,
      entidadId: datos.entidadId,
      accion: datos.accion,
      usuario: req.user?.id,
      usuarioNombre: req.user?.nombre || req.user?.username,
      ip: req.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
      datosAnteriores: datos.datosAnteriores,
      datosNuevos: datos.datosNuevos,
      descripcion: datos.descripcion,
      metadata: datos.metadata
    });
  } catch (err) {
    console.error('Error en auditoría:', err.message);
  }
};

const auditarOperacion = async (datos) => {
  try {
    await AuditLog.registrar({
      empresa: datos.empresa,
      entidad: datos.entidad,
      entidadId: datos.entidadId,
      accion: datos.accion,
      usuario: datos.usuario,
      usuarioNombre: datos.usuarioNombre,
      ip: datos.ip,
      descripcion: datos.descripcion,
      metadata: datos.metadata
    });
  } catch (err) {
    console.error('Error en auditoría:', err.message);
  }
};

module.exports = { auditMiddleware, auditar, auditarOperacion, AuditLog };