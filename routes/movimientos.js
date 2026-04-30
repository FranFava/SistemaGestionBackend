const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getMovimientos,
  getMovimientosByProducto,
  createMovimiento,
  updateMovimiento,
  deleteMovimiento,
  getAlertas
} = require('../controllers/movimientoController');

router.get('/', auth, getMovimientos);
router.get('/producto/:id', auth, validateObjectId('id'), getMovimientosByProducto);
router.get('/alertas', auth, getAlertas);
router.post('/', auth, createMovimiento);
router.put('/:id', auth, validateObjectId, updateMovimiento);
router.delete('/:id', auth, validateObjectId, deleteMovimiento);

module.exports = router;
