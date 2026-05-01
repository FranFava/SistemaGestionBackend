const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getTiposCambio,
  getTipoCambio,
  getTipoCambioPorFecha,
  createTipoCambio,
  updateTipoCambio,
  deleteTipoCambio
} = require('../controllers/tipoCambioController');

router.use(auth);

router.get('/por-fecha', getTipoCambioPorFecha);
router.get('/', getTiposCambio);
router.get('/:id', validateObjectId, getTipoCambio);
router.post('/', createTipoCambio);
router.put('/:id', validateObjectId, updateTipoCambio);
router.delete('/:id', validateObjectId, deleteTipoCambio);

module.exports = router;
