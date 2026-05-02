const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getArbol,
  getPath
} = require('../controllers/categoriaController');

router.use(auth);

router.get('/arbol', getArbol);
router.get('/path/:id', validateObjectId, getPath);
router.get('/', getCategorias);
router.get('/:id', validateObjectId, getCategoriaById);
router.post('/', createCategoria);
router.put('/:id', validateObjectId, updateCategoria);
router.delete('/:id', validateObjectId, deleteCategoria);

module.exports = router;
