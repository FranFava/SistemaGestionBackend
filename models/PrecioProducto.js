const mongoose = require('mongoose');

const precioProductoSchema = new mongoose.Schema({
  id_producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  id_lista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ListaPrecio',
    required: true
  },
  precio: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  moneda: {
    type: String,
    enum: ['ARS', 'USD'],
    required: true
  },
  vigencia_desde: {
    type: Date,
    required: true
  },
  vigencia_hasta: {
    type: Date,
    default: null
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

precioProductoSchema.index({ id_producto: 1, id_lista: 1, vigencia_desde: -1 });
precioProductoSchema.index({ id_producto: 1, id_lista: 1, vigente: 1 }, {
  partialFilterExpression: { activo: true }
});

precioProductoSchema.virtual('vigente').get(function () {
  const ahora = new Date();
  if (!this.vigencia_desde || this.vigencia_desde > ahora) return false;
  if (this.vigencia_hasta && this.vigencia_hasta < ahora) return false;
  return this.activo;
});

precioProductoSchema.statics.getPrecioVigente = async function (id_producto, id_lista, fecha = new Date()) {
  const precio = await this.findOne({
    id_producto,
    id_lista,
    activo: true,
    vigencia_desde: { $lte: fecha },
    $or: [
      { vigencia_hasta: null },
      { vigencia_hasta: { $gte: fecha } }
    ]
  }).populate('id_lista', 'nombre moneda').sort({ vigencia_desde: -1 });

  return precio;
};

precioProductoSchema.set('toJSON', { virtuals: true });
precioProductoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PrecioProducto', precioProductoSchema);
