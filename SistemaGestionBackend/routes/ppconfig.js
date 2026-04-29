const express = require('express');
const router = express.Router();
const PPConfig = require('../models/PPConfig');
const { validateObjectId } = require('../utils/validators');

router.get('/', async (req, res) => {
  try {
    const configs = await PPConfig.find({ activo: true }).sort({ modelo: 1, capacidad: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { modelo, capacidad, condicion, valor, descripcion } = req.body;
    
    const existing = await PPConfig.findOne({ modelo, capacidad: capacidad || '', condicion: condicion || 'standard' });
    if (existing) {
      existing.valor = valor;
      existing.descripcion = descripcion || '';
      await existing.save();
      return res.json(existing);
    }
    
    const config = new PPConfig({
      modelo,
      capacidad: capacidad || '',
      condicion: condicion || 'standard',
      valor,
      descripcion: descripcion || ''
    });
    
    await config.save();
    res.status(201).json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/buscar', async (req, res) => {
  try {
    const { modelo, capacidad } = req.query;
    const query = { activo: true };
    if (modelo) query.modelo = new RegExp(modelo, 'i');
    if (capacidad) query.capacidad = capacidad;
    
    const configs = await PPConfig.find(query).sort({ modelo: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', validateObjectId, async (req, res) => {
  try {
    const { valor, descripcion, activo } = req.body;
    const config = await PPConfig.findByIdAndUpdate(
      req.params.id,
      { valor, descripcion, activo },
      { new: true }
    );
    if (!config) return res.status(404).json({ message: 'No encontrado' });
    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', validateObjectId, async (req, res) => {
  try {
    const config = await PPConfig.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!config) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado lógicamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
