const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
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
router.get('/:id/movimientos', auth, validateObjectId, getMovimientos);
router.get('/:id', auth, validateObjectId, getCuentaById);
router.post('/', auth, createCuenta);
router.put('/:id', auth, validateObjectId, updateCuenta);
router.post('/:id/movimiento', auth, validateObjectId, agregarMovimiento);
router.post('/:id/bloquear', auth, adminOnly, validateObjectId, bloquearCuenta);
router.post('/:id/desbloquear', auth, adminOnly, validateObjectId, desbloquearCuenta);

module.exports = router;