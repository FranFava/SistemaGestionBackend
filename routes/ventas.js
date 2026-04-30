const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const { 
  crearVenta, 
  getVentas,
  getVentaById,
  confirmarReserva, 
  cancelarReserva,
  buscarCliente 
} = require('../controllers/ventaController');

router.post('/', auth, crearVenta);
router.get('/', auth, getVentas);
router.get('/buscar-cliente', auth, buscarCliente);
router.get('/:id', auth, validateObjectId, getVentaById);
router.post('/:id/confirmar', auth, validateObjectId, confirmarReserva);
router.post('/:id/cancelar', auth, validateObjectId, cancelarReserva);

module.exports = router;