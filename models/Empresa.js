const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  razonSocial: String,
  nombreFantasia: String,
  cuil: {
    type: String,
    required: true,
    unique: true
  },
  iva: String,
  direccion: {
    calle: String,
    numero: String,
    piso: String,
    departamento: String,
    localidad: String,
    provincia: String,
    codigoPostal: String
  },
  contacto: {
    telefono: String,
    email: String,
    web: String
  },
  habilitaciones: {
    ini: Number,
    puntoVenta: {
      default: 1,
      type: Number
    },
    facturaElectronica: {
      type: Boolean,
      default: false
    }
  },
  responsableIVA: {
    type: String,
    enum: ['consumidor', 'responsable', 'monotributista', 'exento'],
    default: 'consumidor'
  },
  categoriaIVA: {
    type: String,
    default: 'Responsable Inscripto'
  },
  logo: String,
  colores: {
    primario: String,
    secundario: String
  },
  configuraciones: {
    monedaPrincipal: {
      type: String,
      default: 'ARS'
    },
    monedaSecundaria: {
      type: String,
      default: 'USD'
    },
    formatoComprobante: String,
    pieComprobante: String,
    mostrarLogo: {
      type: Boolean,
      default: true
    }
  },
  cuentas: {
    banco: String,
    cbu: String,
    alias: String,
    cuentaContable: String
  },
  activa: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Empresa', empresaSchema);