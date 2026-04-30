const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const { getUsuarios, createUsuario, updateUsuario, deleteUsuario } = require('../controllers/usuarioController');

router.get('/', auth, getUsuarios);
router.post('/', auth, createUsuario);
router.put('/:id', auth, validateObjectId, updateUsuario);
router.delete('/:id', auth, validateObjectId, deleteUsuario);

module.exports = router;