const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAlertasActivas,
  getAlertasDescartadas,
  getAlertas,
  descartarAlerta,
  reincorporarAlerta,
  generarTodasLasAlertas,
  getEstadisticasAlertas
} = require('../controllers/alertaController');

router.use(auth);

router.get('/activas', getAlertasActivas);
router.get('/descartadas', getAlertasDescartadas);
router.get('/estadisticas', getEstadisticasAlertas);
router.get('/', getAlertas);
router.post('/generar', generarTodasLasAlertas);
router.patch('/:id/descartar', descartarAlerta);
router.patch('/:id/reincorporar', reincorporarAlerta);

module.exports = router;
