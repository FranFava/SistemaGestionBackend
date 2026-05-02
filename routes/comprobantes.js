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
  getResumen,
  listarPendientes,
  getSaldoCuenta,
  calcularDiferenciaCambio,
  matchingRemitoFactura
} = require('../controllers/comprobanteController');

router.use(auth);

router.get('/', getComprobantes);
router.get('/vencidos', getComprobantesVencidos);
router.get('/pendientes', listarPendientes);
router.get('/proximo', getProximoNumero);
router.get('/resumen', getResumen);
router.get('/cuenta/:cuentaId', getComprobantesByCuenta);
router.get('/cuenta/:id/saldo', validateObjectId, getSaldoCuenta);
router.get('/:id', validateObjectId, getComprobanteById);
router.post('/', createComprobante);
router.post('/:id/pago', validateObjectId, aplicarPago);
router.post('/:id/senia', validateObjectId, aplicarSenia);
router.post('/:id/anular', validateObjectId, anularComprobante);
router.post('/:id/diferencia-cambio', validateObjectId, calcularDiferenciaCambio);
router.post('/matching', matchingRemitoFactura);

module.exports = router;
