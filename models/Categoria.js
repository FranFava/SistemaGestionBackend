const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  id_padre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    default: null
  },
  descripcion: String,
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categoriaSchema.index({ activa: 1 });
categoriaSchema.index({ id_padre: 1 });

categoriaSchema.methods.getPath = async function () {
  const path = [this];
  let current = this;
  while (current.id_padre) {
    const parent = await mongoose.model('Categoria').findById(current.id_padre);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path.map(c => c.nombre).join(' > ');
};

categoriaSchema.methods.getChildrenRecursive = async function () {
  const children = await mongoose.model('Categoria').find({ id_padre: this._id, activa: true });
  const result = [];
  for (const child of children) {
    result.push(child);
    const subChildren = await child.getChildrenRecursive();
    result.push(...subChildren);
  }
  return result;
};

categoriaSchema.virtual('hijos').get(function () {
  return this._hijos || [];
});

categoriaSchema.set('toJSON', { virtuals: true });
categoriaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Categoria', categoriaSchema);
