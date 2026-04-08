const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor
} = require('../controllers/proveedorController');

router.get('/', auth, getProveedores);
router.post('/', auth, createProveedor);
router.put('/:id', auth, updateProveedor);
router.delete('/:id', auth, deleteProveedor);

module.exports = router;
