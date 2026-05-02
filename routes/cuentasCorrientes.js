const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getCuentas,
  getCuentaById,
  createCuenta,
  updateCuenta,
  cerrarCuenta,
  getCuentasPorTercero,
  buscarCuenta,
  getCuentasVencidas,
  getSaldosResumen
} = require('../controllers/cuentaCorrienteController');

router.use(auth);

router.get('/', getCuentas);
router.get('/saldos', getSaldosResumen);
router.get('/vencidas', getCuentasVencidas);
router.get('/buscar', buscarCuenta);
router.get('/tercero/:terceroId', getCuentasPorTercero);
router.get('/:id', validateObjectId, getCuentaById);
router.post('/', adminOnly, createCuenta);
router.put('/:id', validateObjectId, updateCuenta);
router.delete('/:id', adminOnly, validateObjectId, cerrarCuenta);

module.exports = router;
