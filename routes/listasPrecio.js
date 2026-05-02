const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getListas,
  getListaById,
  createLista,
  updateLista,
  deleteLista,
  getActivas
} = require('../controllers/listaPrecioController');

router.use(auth);

router.get('/activas', getActivas);
router.get('/', getListas);
router.get('/:id', validateObjectId, getListaById);
router.post('/', createLista);
router.put('/:id', validateObjectId, updateLista);
router.delete('/:id', validateObjectId, deleteLista);

module.exports = router;
