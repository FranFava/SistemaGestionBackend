const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getMovimientosCaja,
  getSaldos,
  createMovimientoCaja,
  deleteMovimientoCaja,
  updateCotizacion,
  getCotizacion
} = require('../controllers/cajaController');

router.get('/cotizacion', getCotizacion);

router.use(auth);

router.get('/', getMovimientosCaja);
router.get('/saldos', getSaldos);
router.post('/', createMovimientoCaja);
router.post('/cotizacion', updateCotizacion);
router.delete('/:id', deleteMovimientoCaja);

module.exports = router;
