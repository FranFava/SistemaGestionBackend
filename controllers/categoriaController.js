const Categoria = require('../models/Categoria');

const getCategorias = async (req, res) => {
  try {
    const { activa } = req.query;
    const query = {};
    if (activa !== undefined) query.activa = activa === 'true';

    const categorias = await Categoria.find(query).sort({ id_padre: 1, nombre: 1 });

    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoriaById = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id)
      .populate('id_padre', 'nombre');

    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoria no encontrada' });
    }

    const path = await categoria.getPath();

    res.json({ success: true, data: { ...categoria.toObject(), breadcrumb: path } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCategoria = async (req, res) => {
  try {
    const { nombre, id_padre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'nombre es requerido' });
    }

    if (id_padre) {
      const padre = await Categoria.findById(id_padre);
      if (!padre) {
        return res.status(404).json({ success: false, message: 'Categoria padre no encontrada' });
      }
    }

    const categoria = new Categoria({ nombre, id_padre, descripcion });
    await categoria.save();

    res.status(201).json({ success: true, data: categoria });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoria no encontrada' });
    }

    const { nombre, id_padre, descripcion, activa } = req.body;

    if (nombre !== undefined) categoria.nombre = nombre;
    if (id_padre !== undefined) {
      if (id_padre && id_padre.toString() === categoria._id.toString()) {
        return res.status(400).json({ success: false, message: 'Una categoria no puede ser hija de si misma' });
      }
      if (id_padre) {
        const padre = await Categoria.findById(id_padre);
        if (!padre) {
          return res.status(404).json({ success: false, message: 'Categoria padre no encontrada' });
        }
      }
      categoria.id_padre = id_padre || null;
    }
    if (descripcion !== undefined) categoria.descripcion = descripcion;
    if (activa !== undefined) categoria.activa = activa;

    await categoria.save();

    res.json({ success: true, data: categoria });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoria no encontrada' });
    }

    const hijos = await Categoria.find({ id_padre: categoria._id, activa: true });
    if (hijos.length) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoria con hijos activos',
        hijos: hijos.length
      });
    }

    categoria.activa = false;
    await categoria.save();

    res.json({ success: true, message: 'Categoria eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getArbol = async (req, res) => {
  try {
    const roots = await Categoria.find({ id_padre: null, activa: true }).sort({ nombre: 1 });

    async function buildTree(node) {
      const children = await Categoria.find({ id_padre: node._id, activa: true }).sort({ nombre: 1 });
      const nodeData = node.toObject();
      if (children.length) {
        nodeData.hijos = await Promise.all(children.map(buildTree));
      } else {
        nodeData.hijos = [];
      }
      return nodeData;
    }

    const arbol = await Promise.all(roots.map(buildTree));

    res.json({ success: true, data: arbol });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPath = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ success: false, message: 'Categoria no encontrada' });
    }

    const path = await categoria.getPath();
    res.json({ success: true, data: { id: categoria._id, path } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getArbol,
  getPath
};
