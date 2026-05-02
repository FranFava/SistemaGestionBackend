const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../utils/validators');
const stockRepo = require('../repositories/stock.repository');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { id_producto, tipo, deposito } = req.query;
    const query = {};
    if (id_producto) query.id_producto = id_producto;
    if (tipo) query.tipo = tipo;
    if (deposito) query.deposito = deposito;
    const movimientos = await stockRepo.find(query, { fecha: -1 });
    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/producto/:productoId', validateObjectId, async (req, res) => {
  try {
    const { tipo, deposito } = req.query;
    const filters = {};
    if (tipo) filters.tipo = tipo;
    if (deposito) filters.deposito = deposito;
    const movimientos = await stockRepo.findByProducto(req.params.productoId, filters);
    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/comprobante/:comprobanteId', validateObjectId, async (req, res) => {
  try {
    const movimientos = await stockRepo.findByComprobante(req.params.comprobanteId);
    res.json({ success: true, data: movimientos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stock/:productoId', validateObjectId, async (req, res) => {
  try {
    const { deposito } = req.query;
    const stock = await stockRepo.getStockActual(req.params.productoId, deposito || 'Central');
    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/por-deposito', async (req, res) => {
  try {
    const stock = await stockRepo.getStockPorDeposito();
    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
