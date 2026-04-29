const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getMovimientosCaja,
  getSaldos,
  createMovimientoCaja,
  deleteMovimientoCaja,
  updateCotizacion,
  getCotizacion
} = require('../controllers/cajaController');

router.get('/cotizacion', auth, getCotizacion);

router.use(auth);

router.get('/', getMovimientosCaja);
router.get('/saldos', getSaldos);
router.post('/', createMovimientoCaja);
router.post('/cotizacion', updateCotizacion);
router.delete('/:id', validateObjectId, deleteMovimientoCaja);

module.exports = router;
