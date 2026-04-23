const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getEmpresas,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getConfiguracion
} = require('../controllers/empresaController');

router.get('/', auth, getEmpresas);
router.get('/:id', auth, getEmpresaById);
router.get('/:id/configuracion', auth, getConfiguracion);
router.post('/', auth, adminOnly, createEmpresa);
router.put('/:id', auth, adminOnly, updateEmpresa);
router.delete('/:id', auth, adminOnly, deleteEmpresa);

module.exports = router;