const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  checkSku
} = require('../controllers/productoController');

router.get('/', auth, getProductos);
router.get('/check-sku/:sku', auth, checkSku);
router.get('/:id', auth, getProductoById);
router.post('/', auth, createProducto);
router.put('/:id', auth, updateProducto);
router.delete('/:id', auth, deleteProducto);

module.exports = router;
