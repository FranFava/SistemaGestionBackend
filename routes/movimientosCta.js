const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getMovimientos,
  getMovimientoById,
  createMovimiento,
  getByCuenta,
  getSaldo,
  getEstadoCuenta,
  getResumen
} = require('../controllers/movimientoCtaController');

router.use(auth);

router.get('/', getMovimientos);
router.get('/resumen', getResumen);
router.get('/cuenta/:cuentaId', getByCuenta);
router.get('/cuenta/:cuentaId/saldo', validateObjectId, getSaldo);
router.get('/cuenta/:cuentaId/estado', validateObjectId, getEstadoCuenta);
router.get('/:id', validateObjectId, getMovimientoById);
router.post('/', createMovimiento);

module.exports = router;
