const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  pagarCuota,
  anularCuota,
  cancelarPrestamo,
  getCuotas,
  getCuotasVencidas,
  getProximasVencimientos,
  getResumen
} = require('../controllers/prestamoController');

router.use(auth);

router.get('/', getPrestamos);
router.get('/resumen', getResumen);
router.get('/cuotas-vencidas', getCuotasVencidas);
router.get('/proximas', getProximasVencimientos);
router.get('/:id', validateObjectId, getPrestamoById);
router.get('/:id/cuotas', validateObjectId, getCuotas);
router.post('/', createPrestamo);
router.post('/:id/cancelar', validateObjectId, cancelarPrestamo);
router.post('/:id/cuota/:nro/pagar', validateObjectId, pagarCuota);
router.post('/cuota/:id/anular', validateObjectId, anularCuota);

module.exports = router;
