const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor
} = require('../controllers/proveedorController');

router.get('/', auth, getProveedores);
router.post('/', auth, createProveedor);
router.put('/:id', auth, validateObjectId, updateProveedor);
router.delete('/:id', auth, validateObjectId, deleteProveedor);

module.exports = router;
