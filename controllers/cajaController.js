const Caja = require('../models/Caja');
const Config = require('../models/Config');

/**
 * Obtiene movimientos de caja con filtros.
 * @async
 * @function getMovimientosCaja
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware
 */
const getMovimientosCaja = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, tipo, metodoPago, moneda } = req.query || {};
    const query = {};

    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) query.fecha.$lte = new Date(fechaFin + 'T23:59:59');
    }
    if (tipo) query.tipo = tipo;
    if (metodoPago) query.metodoPago = metodoPago;
    if (moneda) query.moneda = moneda;
    query.activo = true;

    const movimientos = await Caja.find(query)
      .populate('usuario', 'nombre username')
      .populate('referencia')
      .sort({ fecha: -1 });
    
    return res.json({ success: true, data: movimientos });
  } catch (error) {
    console.error('Error getMovimientosCaja:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtiene los saldos de caja.
 * @async
 * @function getSaldos
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Next middleware
 */
const getSaldos = async (req, res, next) => {
  try {
    const config = await Config.findOne() || { cotizacionDolar: 1000 };
    let movimientos = [];
    try {
      movimientos = await Caja.find({ activo: true });
    } catch (cajaError) {
      console.error('Error al buscar movimientos de caja:', cajaError.message);
    }

    let saldoPesosEfectivo = 0;
    let saldoPesosTransfer = 0;
    let saldoDolaresEfectivo = 0;
    let saldoDolaresTransfer = 0;

    movimientos.forEach(m => {
      const monto = m.moneda === 'USD' ? (m.montoUSD || 0) : (m.monto || 0);
      const esIngreso = m.tipo === 'ingreso';
      
      if (m.moneda === 'ARS') {
        if (m.metodoPago === 'efectivo') {
          esIngreso ? (saldoPesosEfectivo += monto) : (saldoPesosEfectivo -= monto);
        } else {
          esIngreso ? (saldoPesosTransfer += monto) : (saldoPesosTransfer -= monto);
        }
      } else {
        if (m.metodoPago === 'efectivo') {
          esIngreso ? (saldoDolaresEfectivo += monto) : (saldoDolaresEfectivo -= monto);
        } else {
          esIngreso ? (saldoDolaresTransfer += monto) : (saldoDolaresTransfer -= monto);
        }
      }
    });

    return res.json({
      success: true,
      data: {
        saldoPesosEfectivo,
        saldoPesosTransfer,
        saldoDolaresEfectivo,
        saldoDolaresTransfer,
        saldoTotalPesos: saldoPesosEfectivo + saldoPesosTransfer,
        saldoTotalDolares: saldoDolaresEfectivo + saldoDolaresTransfer,
        cotizacionDolar: config.cotizacionDolar || 1000
      }
    });
  } catch (error) {
    console.error('Error getSaldos:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createMovimientoCaja = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { tipo, metodoPago, moneda, monto, montoUSD, concepto, tipoOperacion } = req.body || {};
    
    if (!tipo || !metodoPago || !moneda || !monto || !concepto || !tipoOperacion) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
    }

    const movimiento = new Caja({
      tipo,
      metodoPago,
      moneda,
      monto: Number(monto) || 0,
      montoUSD: moneda === 'USD' ? (Number(montoUSD) || 0) : 0,
      concepto,
      tipoOperacion,
      usuario: req.user.id
    });

    await movimiento.save();
    return res.status(201).json({ success: true, data: movimiento });
  } catch (error) {
    console.error('Error createMovimientoCaja:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMovimientoCaja = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { id } = req.params || {};
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const movimiento = await Caja.findById(id);
    
    if (!movimiento) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    if (!movimiento.activo) {
      return res.status(400).json({ success: false, message: 'Movimiento ya eliminado' });
    }

    movimiento.activo = false;
    movimiento.eliminadoPor = req.user.id;
    movimiento.fechaEliminacion = new Date();
    await movimiento.save();
    
    return res.json({ success: true, message: 'Movimiento eliminado' });
  } catch (error) {
    console.error('Error deleteMovimientoCaja:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCotizacion = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const cotizacion = Number(req.body?.cotizacion);
    
    if (!cotizacion || cotizacion <= 0) {
      return res.status(400).json({ success: false, message: 'Cotizacion invalida' });
    }

    let config = await Config.findOne();
    
    if (!config) {
      config = new Config({
        nombreTienda: 'Stock Nextech',
        cotizacionDolar: cotizacion,
        fechaCotizacion: new Date()
      });
    } else {
      config.cotizacionDolar = cotizacion;
      config.fechaCotizacion = new Date();
    }
    
    await config.save();
    
    return res.json({ 
      success: true, 
      data: { 
        cotizacionDolar: config.cotizacionDolar,
        fechaCotizacion: config.fechaCotizacion
      }
    });
  } catch (error) {
    console.error('Error updateCotizacion:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCotizacion = async (req, res, next) => {
  try {
    let cotizacionDolar = null;
    let fechaActualizacion = null;

    // 1. Intentar obtener cotización en vivo desde DolarAPI
    try {
      const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (response.ok) {
        const data = await response.json();
        cotizacionDolar = data.venta;
        fechaActualizacion = data.fechaActualizacion;
        console.log(`[DolarAPI] USD oficial → compra: $${data.compra}, venta: $${data.venta}`);
      }
    } catch (apiError) {
      console.warn('[DolarAPI] No se pudo obtener cotización, usando fallback:', apiError.message);
    }

    // 2. Obtener config local
    let config = await Config.findOne();

    // 3. Si obtuvimos cotización en vivo, actualizar Config
    if (cotizacionDolar) {
      if (!config) {
        config = new Config({
          cotizacionDolar,
          fechaCotizacion: new Date(fechaActualizacion || Date.now())
        });
      } else {
        config.cotizacionDolar = cotizacionDolar;
        config.fechaCotizacion = new Date(fechaActualizacion || Date.now());
      }
      await config.save();
    }

    // 4. Retornar resultado
    return res.json({
      success: true,
      data: {
        cotizacionDolar: cotizacionDolar || config?.cotizacionDolar || 1000,
        fechaCotizacion: fechaActualizacion ? new Date(fechaActualizacion) : config?.fechaCotizacion,
        fuente: cotizacionDolar ? 'dolarapi' : 'config'
      }
    });
  } catch (error) {
    console.error('Error getCotizacion:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMovimientosCaja,
  getSaldos,
  createMovimientoCaja,
  deleteMovimientoCaja,
  updateCotizacion,
  getCotizacion
};
