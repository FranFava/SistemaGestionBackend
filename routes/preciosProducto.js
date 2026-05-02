const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getPrecios,
  getPrecioById,
  createPrecio,
  updatePrecio,
  deletePrecio,
  getVigente,
  getByProducto,
  getByLista
} = require('../controllers/precioProductoController');

router.use(auth);

router.get('/vigente/:productoId/:listaId', getVigente);
router.get('/producto/:productoId', getByProducto);
router.get('/lista/:listaId', getByLista);
router.get('/', getPrecios);
router.get('/:id', validateObjectId, getPrecioById);
router.post('/', createPrecio);
router.put('/:id', validateObjectId, updatePrecio);
router.delete('/:id', validateObjectId, deletePrecio);

module.exports = router;
