const mongoose = require('mongoose');

const comprobanteSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['factura', 'nota_credito', 'nota_debito', 'ticket', 'recibo', 'presupuesto'],
    required: true
  },
  letra: {
    type: String,
    enum: ['A', 'B', 'C', 'M'],
    required: true
  },
  puntoVenta: {
    type: Number,
    required: true
  },
  numero: {
    type: Number,
    required: true
  },
  codigoBarra: String,
  cae: String,
  vencimientoCAE: Date,
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: true
  },
  cliente: {
    tipoDocumento: {
      type: String,
      enum: ['DNI', 'CUIT', 'CUIL', 'PAS', 'ninguno'],
      default: 'ninguno'
    },
    numeroDocumento: String,
    nombre: String,
    condicionIVA: {
      type: String,
      enum: ['consumidor', 'responsable', 'monotributista', 'exento', 'ninguno'],
      default: 'consumidor'
    },
    direccion: String,
    telefono: String,
    email: String,
    clienteId: mongoose.Schema.Types.ObjectId
  },
  proveedor: {
    tipoDocumento: String,
    numeroDocumento: String,
    nombre: String,
    condicionIVA: String,
    proveedorId: mongoose.Schema.Types.ObjectId
  },
  items: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto'
    },
    variante: {
      color: String,
      capacidad: String
    },
    sku: String,
    descripcion: String,
    cantidad: {
      type: Number,
      required: true
    },
    unidad: {
      type: String,
      default: 'un'
    },
    precioUnitario: Number,
    costoUnitario: Number,
    descuento: {
      porcentaje: Number,
      importe: Number
    },
    iva: {
      porcentaje: {
        type: Number,
        default: 21
      },
      importe: Number
    },
    total: Number
  }],
  subtotal: Number,
  descuento: {
    porcentaje: { type: Number, default: 0 },
    importe: { type: Number, default: 0 }
  },
  ivaTotal: Number,
  percepcionIVA: Number,
  total: Number,
  totalMostrar: Number,
  observaciones: String,
  formaPago: {
    tipo: {
      type: String,
      enum: ['contado', 'cta_cte', 'tarjeta', 'cheque', 'mp', 'mixto'],
      default: 'contado'
    },
    metodo: String,
    cuotas: { type: Number, default: 1 },
    detalles: [{
      metodo: String,
      importe: Number,
      cuota: Number
    }]
  },
  garantia: {
    productos: [{
      producto: mongoose.Schema.Types.ObjectId,
      meses: Number,
      vencimiento: Date,
      terminos: String,
      numeroSerie: String
    }]
  },
  estado: {
    type: String,
    enum: ['borrador', 'pendiente', 'emitido', 'pagado', 'anulado', 'vencido'],
    default: 'borrador'
  },
  pagado: {
    type: Boolean,
    default: false
  },
  fechaPago: Date,
  fechaVto: Date,
  motivo: String,
  etiquetas: [String],
  documentoOriginal: {
    tipo: String,
    id: mongoose.Schema.Types.ObjectId
  },
}, {
  timestamps: true
});

comprobanteSchema.index({ empresa: 1, tipo: 1, letra: 1, puntoVenta: 1, numero: 1 }, { unique: true });
comprobanteSchema.index({ empresa: 1, 'cliente.clienteId': 1 });
comprobanteSchema.index({ empresa: 1, 'cliente.numeroDocumento': 1 });
comprobanteSchema.index({ empresa: 1, estado: 1 });
comprobanteSchema.index({ empresa: 1, createdAt: -1 });

comprobanteSchema.virtual('comprobanteCompleto').get(function() {
  return `${String(this.puntoVenta).padStart(4, '0')}-${String(this.numero).padStart(8, '0')}`;
});

comprobanteSchema.methods.calcularTotales = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  
  this.items.forEach(item => {
    item.descuento = item.descuento || {};
    item.iva = item.iva || { porcentaje: 21 };
    
    if (item.descuento.porcentaje > 0) {
      item.descuento.importe = (item.cantidad * item.precioUnitario * item.descuento.porcentaje) / 100;
    }
    if (item.iva && item.iva.porcentaje > 0) {
      const base = (item.cantidad * item.precioUnitario) - (item.descuento.importe || 0);
      item.iva.importe = (base * item.iva.porcentaje) / 100;
    }
    item.total = (item.cantidad * item.precioUnitario) - (item.descuento.importe || 0) + (item.iva.importe || 0);
  });
  
  this.subtotal = this.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario) - (item.descuento.importe || 0), 0);
  this.ivaTotal = this.items.reduce((sum, item) => sum + (item.iva.importe || 0), 0);
  this.total = this.subtotal + this.ivaTotal;
  
  if (this.descuento.porcentaje > 0) {
    this.descuento.importe = (this.total * this.descuento.porcentaje) / 100;
  }
  this.total = this.total - (this.descuento.importe || 0);
  this.totalMostrar = this.total;
  
  return this.total;
};

comprobanteSchema.pre('save', function(next) {
  this.calcularTotales();
  next();
});

comprobanteSchema.set('toJSON', { virtuals: true });
comprobanteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comprobante', comprobanteSchema);