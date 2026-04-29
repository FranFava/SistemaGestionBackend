const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getCuentas,
  getCuentaById,
  createCuenta,
  updateCuenta,
  deleteCuenta,
  getCuentasPorNivel,
  getEstructuraCompleta
} = require('../controllers/planCuentaController');

router.get('/', auth, getCuentas);
router.get('/estructura', auth, getEstructuraCompleta);
router.get('/nivel', auth, getCuentasPorNivel);
router.get('/:id', auth, validateObjectId, getCuentaById);
router.post('/', auth, adminOnly, createCuenta);
router.put('/:id', auth, adminOnly, validateObjectId, updateCuenta);
router.delete('/:id', auth, adminOnly, validateObjectId, deleteCuenta);

module.exports = router;