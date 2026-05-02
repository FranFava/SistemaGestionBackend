const mongoose = require('mongoose');
const PrecioProducto = require('../models/PrecioProducto');
const { toDecimal128, toNumber, round } = require('../utils/decimal.utils');

const getPrecios = async (req, res) => {
  try {
    const { id_producto, id_lista, moneda, activo } = req.query;
    const query = {};

    if (id_producto) query.id_producto = id_producto;
    if (id_lista) query.id_lista = id_lista;
    if (moneda) query.moneda = moneda;
    if (activo !== undefined) query.activo = activo === 'true';

    const precios = await PrecioProducto.find(query)
      .populate('id_producto', 'nombre sku')
      .populate('id_lista', 'nombre moneda')
      .sort({ vigencia_desde: -1 });

    res.json({ success: true, data: precios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPrecioById = async (req, res) => {
  try {
    const precio = await PrecioProducto.findById(req.params.id)
      .populate('id_producto', 'nombre sku')
      .populate('id_lista', 'nombre moneda');

    if (!precio) {
      return res.status(404).json({ success: false, message: 'Precio no encontrado' });
    }

    res.json({ success: true, data: precio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPrecio = async (req, res) => {
  try {
    const { id_producto, id_lista, precio, moneda, vigencia_desde, vigencia_hasta } = req.body;

    if (!id_producto || !id_lista || precio === undefined || !moneda || !vigencia_desde) {
      return res.status(400).json({
        success: false,
        message: 'id_producto, id_lista, precio, moneda y vigencia_desde son requeridos'
      });
    }

    if (!['ARS', 'USD'].includes(moneda)) {
      return res.status(400).json({ success: false, message: 'moneda debe ser ARS o USD' });
    }

    const precioDecimal = toDecimal128(precio);
    const desde = new Date(vigencia_desde);
    const hasta = vigencia_hasta ? new Date(vigencia_hasta) : null;

    const precioDoc = new PrecioProducto({
      id_producto,
      id_lista,
      precio: precioDecimal,
      moneda,
      vigencia_desde: desde,
      vigencia_hasta: hasta
    });

    await precioDoc.save();

    res.status(201).json({ success: true, data: precioDoc });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un precio vigente para este producto y lista' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePrecio = async (req, res) => {
  try {
    const precio = await PrecioProducto.findById(req.params.id);
    if (!precio) {
      return res.status(404).json({ success: false, message: 'Precio no encontrado' });
    }

    const { precio: nuevoPrecio, vigencia_desde, vigencia_hasta, activo } = req.body;

    if (nuevoPrecio !== undefined) precio.precio = toDecimal128(nuevoPrecio);
    if (vigencia_desde !== undefined) precio.vigencia_desde = new Date(vigencia_desde);
    if (vigencia_hasta !== undefined) precio.vigencia_hasta = vigencia_hasta ? new Date(vigencia_hasta) : null;
    if (activo !== undefined) precio.activo = activo;

    await precio.save();
    res.json({ success: true, data: precio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePrecio = async (req, res) => {
  try {
    const precio = await PrecioProducto.findById(req.params.id);
    if (!precio) {
      return res.status(404).json({ success: false, message: 'Precio no encontrado' });
    }

    precio.activo = false;
    await precio.save();

    res.json({ success: true, message: 'Precio eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVigente = async (req, res) => {
  try {
    const { productoId, listaId } = req.params;
    const { fecha } = req.query;

    const fechaConsulta = fecha ? new Date(fecha) : new Date();

    const precio = await PrecioProducto.getPrecioVigente(productoId, listaId, fechaConsulta);

    if (!precio) {
      return res.status(404).json({ success: false, message: 'No hay precio vigente para este producto y lista' });
    }

    res.json({ success: true, data: precio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { fecha } = req.query;

    const fechaConsulta = fecha ? new Date(fecha) : new Date();

    const precios = await PrecioProducto.find({
      id_producto: productoId,
      activo: true,
      vigencia_desde: { $lte: fechaConsulta },
      $or: [
        { vigencia_hasta: null },
        { vigencia_hasta: { $gte: fechaConsulta } }
      ]
    })
      .populate('id_lista', 'nombre moneda')
      .sort({ 'id_lista.nombre': 1 });

    res.json({ success: true, data: precios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByLista = async (req, res) => {
  try {
    const { listaId } = req.params;
    const { fecha } = req.query;

    const fechaConsulta = fecha ? new Date(fecha) : new Date();

    const precios = await PrecioProducto.find({
      id_lista: listaId,
      activo: true,
      vigencia_desde: { $lte: fechaConsulta },
      $or: [
        { vigencia_hasta: null },
        { vigencia_hasta: { $gte: fechaConsulta } }
      ]
    })
      .populate('id_producto', 'nombre sku marca')
      .sort({ 'id_producto.nombre': 1 });

    res.json({ success: true, data: precios });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPrecios,
  getPrecioById,
  createPrecio,
  updatePrecio,
  deletePrecio,
  getVigente,
  getByProducto,
  getByLista
};
