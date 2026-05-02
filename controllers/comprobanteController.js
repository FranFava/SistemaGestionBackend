const Comprobante = require('../models/Comprobante');
const Empresa = require('../models/Empresa');
const CuentaCorriente = require('../models/CuentaCorriente');
const Tercero = require('../models/Tercero');
const { auditar } = require('../middleware/audit');

const getComprobantes = async (req, res) => {
  try {
    const { empresa, tipo, letra, estado, cliente, desde, hasta } = req.query;
    const query = { empresa };
    
    if (tipo) query.tipo = tipo;
    if (letra) query.letra = letra;
    if (estado) query.estado = estado;
    if (cliente) query['cliente.clienteId'] = cliente;
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta + 'T23:59:59');
    }
    
    const comprobantes = await Comprobante.find(query)
      .populate('empresa', 'nombre cuil')
      .sort({ createdAt: -1 });
    
    res.json(comprobantes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComprobanteById = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id)
      .populate('empresa', 'nombre cuil habilitaciones puntoVenta')
      .populate('items.producto', 'nombre sku precioVenta garantia');
    
    if (!comprobante) return res.status(404).json({ message: 'Comprobante no encontrado' });
    res.json(comprobante);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createComprobante = async (req, res) => {
  try {
    const { empresa: empresaId, letra, cliente, items, formaPago, garantia } = req.body;
    
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
    
    let letraValida = letra;
    if (!letraValida) {
      letraValida = cliente?.condicionIVA === 'responsable' ? 'A' : 'B';
    }
    
    const ultimo = await Comprobante.findOne({ empresa: empresaId, tipo: req.body.tipo, letra: letraValida })
      .sort({ numero: -1 });
    const numeroSiguiente = ultimo ? ultimo.numero + 1 : 1;
    const puntoVenta = req.body.puntoVenta || empresa.habilitaciones.puntoVenta || 1;
    
    const comprobante = new Comprobante({
      ...req.body,
      numero: numeroSiguiente,
      puntoVenta,
      letra: letraValida
    });
    
    await comprobante.save();
    
    if (formaPago?.tipo === 'cta_cte' && cliente?.clienteId) {
      try {
        const moneda = req.body.moneda || 'ARS';
        const tercero = await Tercero.findById(cliente.clienteId);

        if (!tercero) {
          console.error('Tercero no encontrado para ctacte:', cliente.clienteId);
        } else {
          let ctacte = await CuentaCorriente.findOne({
            id_tercero: cliente.clienteId,
            tipo: 'cliente',
            moneda,
            activa: true
          });

          if (!ctacte) {
            ctacte = new CuentaCorriente({
              id_tercero: cliente.clienteId,
              tipo: 'cliente',
              moneda,
              limite_credito: tercero.limite_credito_ars || 0,
              dias_vencimiento_default: 30,
              permite_senia: false
            });
            await ctacte.save();
          }

          ctacte.agregarMovimiento({
            tipo: 'cargo',
            concepto: `${req.body.tipo} ${letraValida} ${puntoVenta}-${numeroSiguiente}`,
            origen: { tipo: 'comprobante', id: comprobante._id },
            comprobante: `${String(puntoVenta).padStart(4, '0')}-${String(numeroSiguiente).padStart(8, '0')}`,
            importe: moneda === 'USD' ? (req.body.totalUSD || comprobante.total) : comprobante.total,
            observaciones: `Venta a credito en ${moneda}`
          });

          await ctacte.save();
        }
      } catch (err) {
        console.error('Error al actualizar ctacte:', err.message);
      }
    }
    
    if (req.user?.id) {
      await auditar(req, {
        entidad: 'Comprobante',
        entidadId: comprobante._id,
        accion: 'create',
        datosNuevos: comprobante.toObject()
      });
    }
    
    res.status(201).json(comprobante);
  } catch (error) {
    console.error('Error createComprobante:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateComprobante = async (req, res) => {
  try {
    const comprobante = await Comprobante.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!comprobante) return res.status(404).json({ message: 'Comprobante no encontrado' });
    
    res.json(comprobante);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const emitrComprobante = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) return res.status(404).json({ message: 'Comprobante no encontrado' });
    
    if (comprobante.estado !== 'borrador' && comprobante.estado !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden emitir comprobantes en estado borrador' });
    }
    
    comprobante.estado = 'emitido';
    await comprobante.save();
    
    res.json(comprobante);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const anulrComprobante = async (req, res) => {
  try {
    const { motivo } = req.body;
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) return res.status(404).json({ message: 'Comprobante no encontrado' });
    
    if (comprobante.estado === 'anulado') {
      return res.status(400).json({ message: 'Comprobante ya anulado' });
    }
    
    if (comprobante.estado === 'pagado') {
      return res.status(400).json({ message: 'No se puede anular un comprobante pagado' });
    }
    
    comprobante.estado = 'anulado';
    comprobante.motivo = motivo;
    await comprobante.save();
    
    res.json(comprobante);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProximoNumero = async (req, res) => {
  try {
    const { empresa, tipo, letra } = req.query;
    
    const empresaDoc = await Empresa.findById(empresa);
    if (!empresaDoc) return res.status(404).json({ message: 'Empresa no encontrada' });
    
    const ultimo = await Comprobante.findOne({ empresa, tipo, letra })
      .sort({ numero: -1 });
    
    const numero = ultimo ? ultimo.numero + 1 : 1;
    const puntoVenta = empresaDoc.habilitaciones.puntoVenta || 1;
    
    res.json({
      puntoVenta,
      numero,
      siguiente: `${String(puntoVenta).padStart(4, '0')}-${String(numero).padStart(8, '0')}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEstadisticas = async (req, res) => {
  try {
    const { empresa, desde, hasta } = req.query;
    const query = { empresa, estado: { $in: ['emitido', 'pagado'] } };
    
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta + 'T23:59:59');
    }
    
    const comprobantes = await Comprobante.find(query);
    
    const stats = {
      cantidad: comprobantes.length,
      total: 0,
      porTipo: {},
      porLetra: {},
      porEstado: {}
    };
    
    comprobantes.forEach(c => {
      stats.total += c.total;
      stats.porTipo[c.tipo] = (stats.porTipo[c.tipo] || 0) + c.total;
      stats.porLetra[c.letra] = (stats.porLetra[c.letra] || 0) + c.total;
      stats.porEstado[c.estado] = (stats.porEstado[c.estado] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getComprobantes,
  getComprobanteById,
  createComprobante,
  updateComprobante,
  emitrComprobante,
  anulrComprobante,
  getProximoNumero,
  getEstadisticas
};