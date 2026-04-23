const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getComprobantes,
  getComprobanteById,
  createComprobante,
  updateComprobante,
  emitrComprobante,
  anulrComprobante,
  getProximoNumero,
  getEstadisticas
} = require('../controllers/comprobanteController');

router.get('/', auth, getComprobantes);
router.get('/proximo', auth, getProximoNumero);
router.get('/estadisticas', auth, getEstadisticas);
router.get('/:id', auth, getComprobanteById);
router.post('/', auth, createComprobante);
router.put('/:id', auth, updateComprobante);
router.post('/:id/emitir', auth, emitrComprobante);
router.post('/:id/anular', auth, anulrComprobante);

module.exports = router;