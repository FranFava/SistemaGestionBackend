const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
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
router.get('/:id', auth, validateObjectId, getComprobanteById);
router.post('/', auth, createComprobante);
router.put('/:id', auth, validateObjectId, updateComprobante);
router.post('/:id/emitir', auth, validateObjectId, emitrComprobante);
router.post('/:id/anular', auth, validateObjectId, anulrComprobante);

module.exports = router;