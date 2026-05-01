const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const {
  getTerceros,
  getTercero,
  createTercero,
  updateTercero,
  deleteTercero,
  buscarTercero
} = require('../controllers/terceroController');

router.use(auth);

router.get('/buscar', buscarTercero);
router.get('/', getTerceros);
router.get('/:id', validateObjectId, getTercero);
router.post('/', createTercero);
router.put('/:id', validateObjectId, updateTercero);
router.delete('/:id', validateObjectId, deleteTercero);

module.exports = router;
