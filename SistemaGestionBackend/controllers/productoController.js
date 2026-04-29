const Producto = require('../models/Producto');

/**
 * Obtiene todos los productos activos.
 * @async
 * @function getProductos
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const getProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene un producto por su ID.
 * @async
 * @function getProductoById
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const getProductoById = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo producto.
 * @async
 * @function createProducto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const createProducto = async (req, res) => {
  try {
    const producto = new Producto(req.body);
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un producto existente.
 * @async
 * @function updateProducto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const updateProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un producto (soft delete).
 * @async
 * @function deleteProducto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const deleteProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verifica si un SKU existe.
 * @async
 * @function checkSku
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const checkSku = async (req, res) => {
  try {
    const producto = await Producto.findOne({ sku: req.params.sku, activo: true });
    if (producto) {
      res.json({ exists: true, producto });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene productos para la tienda pública (sin precios).
 * @async
 * @function getProductosPublic
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */
const getProductosPublic = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true })
      .select('nombre sku marca categoria descripcion variantes garantia createdAt');
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductos,
  getProductosPublic,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  checkSku
};
