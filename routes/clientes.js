const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
} = require('../controllers/clienteController');

router.get('/', auth, getClientes);
router.post('/', auth, createCliente);
router.put('/:id', auth, updateCliente);
router.delete('/:id', auth, deleteCliente);

module.exports = router;
