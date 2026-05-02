const ListaPrecio = require('../models/ListaPrecio');

const getListas = async (req, res) => {
  try {
    const { activa, moneda } = req.query;
    const query = {};
    if (activa !== undefined) query.activa = activa === 'true';
    if (moneda) query.moneda = moneda;

    const listas = await ListaPrecio.find(query).sort({ nombre: 1 });
    res.json({ success: true, data: listas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getListaById = async (req, res) => {
  try {
    const lista = await ListaPrecio.findById(req.params.id);
    if (!lista) {
      return res.status(404).json({ success: false, message: 'Lista de precio no encontrada' });
    }
    res.json({ success: true, data: lista });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLista = async (req, res) => {
  try {
    const { nombre, moneda, descripcion } = req.body;

    if (!nombre || !moneda) {
      return res.status(400).json({ success: false, message: 'nombre y moneda son requeridos' });
    }

    if (!['ARS', 'USD'].includes(moneda)) {
      return res.status(400).json({ success: false, message: 'moneda debe ser ARS o USD' });
    }

    const existente = await ListaPrecio.findOne({ nombre });
    if (existente) {
      return res.status(400).json({ success: false, message: 'Ya existe una lista con ese nombre' });
    }

    const lista = new ListaPrecio({ nombre, moneda, descripcion });
    await lista.save();

    res.status(201).json({ success: true, data: lista });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLista = async (req, res) => {
  try {
    const lista = await ListaPrecio.findById(req.params.id);
    if (!lista) {
      return res.status(404).json({ success: false, message: 'Lista de precio no encontrada' });
    }

    const { nombre, moneda, descripcion, activa } = req.body;

    if (nombre !== undefined && nombre !== lista.nombre) {
      const existente = await ListaPrecio.findOne({ nombre, _id: { $ne: lista._id } });
      if (existente) {
        return res.status(400).json({ success: false, message: 'Ya existe una lista con ese nombre' });
      }
      lista.nombre = nombre;
    }
    if (moneda !== undefined) {
      if (!['ARS', 'USD'].includes(moneda)) {
        return res.status(400).json({ success: false, message: 'moneda debe ser ARS o USD' });
      }
      lista.moneda = moneda;
    }
    if (descripcion !== undefined) lista.descripcion = descripcion;
    if (activa !== undefined) lista.activa = activa;

    await lista.save();
    res.json({ success: true, data: lista });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLista = async (req, res) => {
  try {
    const lista = await ListaPrecio.findById(req.params.id);
    if (!lista) {
      return res.status(404).json({ success: false, message: 'Lista de precio no encontrada' });
    }

    lista.activa = false;
    await lista.save();

    res.json({ success: true, message: 'Lista de precio eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getActivas = async (req, res) => {
  try {
    const listas = await ListaPrecio.find({ activa: true }).sort({ nombre: 1 });
    res.json({ success: true, data: listas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getListas,
  getListaById,
  createLista,
  updateLista,
  deleteLista,
  getActivas
};
