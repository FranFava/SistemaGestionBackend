const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  crearVenta, 
  confirmarReserva, 
  cancelarReserva,
  buscarCliente 
} = require('../controllers/ventaController');

router.post('/', auth, crearVenta);
router.post('/:id/confirmar', auth, confirmarReserva);
router.post('/:id/cancelar', auth, cancelarReserva);
router.get('/buscar-cliente', auth, buscarCliente);

module.exports = router;