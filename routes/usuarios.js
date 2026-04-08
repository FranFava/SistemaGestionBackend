const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getUsuarios, createUsuario, updateUsuario, deleteUsuario } = require('../controllers/usuarioController');

router.get('/', auth, getUsuarios);
router.post('/', auth, createUsuario);
router.put('/:id', auth, updateUsuario);
router.delete('/:id', auth, deleteUsuario);

module.exports = router;