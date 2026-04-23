const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
} = require('../controllers/clienteController');

router.get('/', auth, getClientes);
router.post('/', auth, createCliente);
router.put('/:id', auth, validateObjectId, updateCliente);
router.delete('/:id', auth, validateObjectId, deleteCliente);

module.exports = router;
