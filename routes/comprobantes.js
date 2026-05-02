const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getComprobantes,
  getComprobanteById,
  createComprobante,
  aplicarPago,
  aplicarSenia,
  anularComprobante,
  getComprobantesByCuenta,
  getComprobantesVencidos,
  getProximoNumero,
  getResumen
} = require('../controllers/comprobanteController');

router.use(auth);

router.get('/', getComprobantes);
router.get('/vencidos', getComprobantesVencidos);
router.get('/proximo', getProximoNumero);
router.get('/resumen', getResumen);
router.get('/cuenta/:cuentaId', getComprobantesByCuenta);
router.get('/:id', validateObjectId, getComprobanteById);
router.post('/', createComprobante);
router.post('/:id/pago', validateObjectId, aplicarPago);
router.post('/:id/senia', validateObjectId, aplicarSenia);
router.post('/:id/anular', validateObjectId, anularComprobante);

module.exports = router;
