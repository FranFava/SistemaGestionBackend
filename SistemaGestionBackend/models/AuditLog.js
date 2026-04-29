const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa'
  },
  entidad: {
    type: String,
    required: true
  },
  entidadId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  accion: {
    type: String,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'restore', 'export', 'import'],
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  usuarioNombre: String,
  ip: String,
  userAgent: String,
  datosAnteriores: mongoose.Schema.Types.Mixed,
  datosNuevos: mongoose.Schema.Types.Mixed,
  cambios: [{
    campo: String,
    valorAnterior: mongoose.Schema.Types.Mixed,
    valorNuevo: mongoose.Schema.Types.Mixed
  }],
  descripcion: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: false
});

auditLogSchema.index({ empresa: 1, entidad: 1, entidadId: 1 });
auditLogSchema.index({ empresa: 1, usuario: 1, createdAt: -1 });
auditLogSchema.index({ empresa: 1, createdAt: -1 });
auditLogSchema.index({ 'cambios.campo': 1 });

auditLogSchema.statics.registrar = async function(data) {
  const cambios = [];
  
  if (data.datosAnteriores && data.datosNuevos) {
    Object.keys(data.datosNuevos).forEach(campo => {
      if (data.datosAnteriores[campo] !== data.datosNuevos[campo]) {
        cambios.push({
          campo,
          valorAnterior: data.datosAnteriores[campo],
          valorNuevo: data.datosNuevos[campo]
        });
      }
    });
  }
  
  return this.create({
    empresa: data.empresa,
    entidad: data.entidad,
    entidadId: data.entidadId,
    accion: data.accion,
    usuario: data.usuario,
    usuarioNombre: data.usuarioNombre,
    ip: data.ip,
    userAgent: data.userAgent,
    datosAnteriores: data.datosAnteriores,
    datosNuevos: data.datosNuevos,
    cambios,
    descripcion: data.descripcion,
    metadata: data.metadata
  });
};

auditLogSchema.statics.obtenerPorEntidad = async function(entidad, entidadId, opciones = {}) {
  const query = { entidad, entidadId };
  if (opciones.empresa) query.empresa = opciones.empresa;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(opciones.limit || 50);
};

auditLogSchema.statics.obtenerPorUsuario = async function(usuarioId, opciones = {}) {
  const query = { usuario: usuarioId };
  if (opciones.empresa) query.empresa = opciones.empresa;
  if (opciones.accion) query.accion = opciones.accion;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(opciones.limit || 100);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);