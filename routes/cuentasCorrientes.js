const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getCuentas,
  getCuentaById,
  getCuentaPorEntidad,
  createCuenta,
  updateCuenta,
  agregarMovimiento,
  bloquearCuenta,
  desbloquearCuenta,
  getMovimientos,
  getSaldos
} = require('../controllers/cuentaCorrienteController');

router.get('/', auth, getCuentas);
router.get('/saldos', auth, getSaldos);
router.get('/entidad', auth, getCuentaPorEntidad);
router.get('/:id', auth, getCuentaById);
router.get('/:id/movimientos', auth, getMovimientos);
router.post('/', auth, createCuenta);
router.put('/:id', auth, updateCuenta);
router.post('/:id/movimiento', auth, agregarMovimiento);
router.post('/:id/bloquear', auth, adminOnly, bloquearCuenta);
router.post('/:id/desbloquear', auth, adminOnly, desbloquearCuenta);

module.exports = router;