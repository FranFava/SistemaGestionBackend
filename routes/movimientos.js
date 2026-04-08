const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getMovimientos,
  getMovimientosByProducto,
  createMovimiento,
  updateMovimiento,
  deleteMovimiento,
  getAlertas
} = require('../controllers/movimientoController');

router.get('/', auth, getMovimientos);
router.get('/producto/:id', auth, getMovimientosByProducto);
router.get('/alertas', auth, getAlertas);
router.post('/', auth, createMovimiento);
router.put('/:id', auth, updateMovimiento);
router.delete('/:id', auth, deleteMovimiento);

module.exports = router;
