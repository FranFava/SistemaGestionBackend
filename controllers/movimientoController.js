const Movimiento = require('../models/Movimiento');
const Producto = require('../models/Producto');
const Caja = require('../models/Caja');
const Config = require('../models/Config');
const { verificarStockYActualizarAlertas } = require('./alertaController');

/**
 * Actualiza el stock de un producto.
 * @async
 * @function actualizarStockProducto
 * @param {string} producto - ID del producto
 * @param {Object} variante - Variante del producto
 * @param {number} cantidad - Cantidad a sumar/restar
 * @param {string} tipo - Tipo de movimiento
 * @param {string} [operacion='sumar'] - Operación: 'sumar' o 'restar'
 * @returns {Promise<Object>}
 */
const actualizarStockProducto = async (producto, variante, cantidad, tipo, operacion = 'sumar') => {
  const productoDoc = await Producto.findById(producto);
  if (!productoDoc) return { success: false, message: 'Producto no encontrado' };

  if (variante && productoDoc.variantes && productoDoc.variantes.length > 0) {
    const idx = productoDoc.variantes.findIndex(
      v => v.color === variante.color && v.capacidad === variante.capacidad
    );
    if (idx !== -1) {
      if (operacion === 'sumar') {
        productoDoc.variantes[idx].stock += cantidad;
      } else if (operacion === 'restar') {
        productoDoc.variantes[idx].stock = Math.max(0, productoDoc.variantes[idx].stock - cantidad);
      }
    }
  } else if (!variante && productoDoc.variantes && productoDoc.variantes.length > 0) {
    const stockActual = productoDoc.variantes.reduce((s, v) => s + (v.stock || 0), 0);
    if (operacion === 'sumar') {
      productoDoc.variantes[0].stock = stockActual + cantidad;
    } else if (operacion === 'restar') {
      productoDoc.variantes[0].stock = Math.max(0, stockActual - cantidad);
    }
  }
  await productoDoc.save();
  return { success: true };
};

/**
 * Obtiene movimientos con filtros opcionales.
 * @async
 * @function getMovimientos
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getMovimientos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipo, producto } = req.query;
    const query = {};

    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) query.fecha.$lte = new Date(fechaFin + 'T23:59:59');
    }
    if (tipo) query.tipo = tipo;
    if (producto) query.producto = producto;

    const movimientos = await Movimiento.find(query)
      .populate('producto', 'nombre sku precioVenta precioCosto')
      .populate('usuario', 'nombre username')
      .populate('cajaId')
      .sort({ fecha: -1 });
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene movimientos de un producto específico.
 * @async
 * @function getMovimientosByProducto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getMovimientosByProducto = async (req, res) => {
  try {
    const movimientos = await Movimiento.find({ producto: req.params.id })
      .populate('usuario', 'nombre username')
      .sort({ fecha: -1 });
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo movimiento.
 * @async
 * @function createMovimiento
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createMovimiento = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { tipo, producto, variante, cantidad, numeroSerie, cliente, registrarCaja, cajaData } = req.body || {};
    
    if (!tipo || !producto || !cantidad) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const movimiento = new Movimiento({
      tipo,
      producto,
      variante,
      cantidad: Number(cantidad),
      numeroSerie,
      cliente,
      usuario: req.user.id,
      registrarCaja: registrarCaja || false
    });

    const productoDoc = await Producto.findById(producto);
    
    if (!productoDoc) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    if (registrarCaja && cajaData) {
      try {
        const config = await Config.findOne();
        const cotizacion = config?.cotizacionDolar || 1000;
        
        let monto = 0;
        let montoUSD = 0;
        let tipoOperacionCaja = tipo === 'salida' ? 'venta' : 'compra_proveedor';
        
        if (tipo === 'salida') {
          monto = productoDoc?.precioVenta ? productoDoc.precioVenta * cantidad : 0;
        } else {
          monto = productoDoc?.precioCosto ? productoDoc.precioCosto * cantidad : 0;
        }
        
        if (cajaData.moneda === 'USD') {
          montoUSD = monto / cotizacion;
        }
        
        const cajaMovimiento = new Caja({
          tipo: cajaData.tipo || 'ingreso',
          metodoPago: cajaData.metodoPago || 'efectivo',
          moneda: cajaData.moneda || 'ARS',
          monto,
          montoUSD,
          concepto: `${productoDoc?.nombre || 'Producto'} x${cantidad} - ${motivo || tipoOperacionCaja}`,
          tipoOperacion: tipoOperacionCaja,
          referencia: { tipo: 'movimiento', id: movimiento._id },
          usuario: req.user.id
        });
        
        await cajaMovimiento.save();
        movimiento.cajaId = cajaMovimiento._id;
      } catch (cajaErr) {
        console.error('Error al crear movimiento de caja:', cajaErr.message);
      }
    }

    await movimiento.save();

    if (variante && productoDoc.variantes && productoDoc.variantes.length > 0) {
      const idx = productoDoc.variantes.findIndex(
        v => v.color === variante.color && v.capacidad === variante.capacidad
      );
      if (idx !== -1) {
        if (tipo === 'entrada') {
          productoDoc.variantes[idx].stock += cantidad;
        } else if (tipo === 'salida') {
          if (productoDoc.variantes[idx].stock < cantidad) {
            return res.status(400).json({ success: false, message: `Stock insuficiente. Stock actual: ${productoDoc.variantes[idx].stock}` });
          }
          productoDoc.variantes[idx].stock -= cantidad;
        } else {
          productoDoc.variantes[idx].stock = cantidad;
        }
      } else if (tipo === 'entrada') {
        productoDoc.variantes.push({ ...variante, stock: cantidad });
      }
    } else if (!variante) {
      if (tipo === 'entrada') {
        if (!productoDoc.variantes) productoDoc.variantes = [];
        productoDoc.variantes.push({ stock: cantidad });
      } else if (tipo === 'salida') {
        const stockActual = productoDoc.variantes && productoDoc.variantes.length > 0 
          ? productoDoc.variantes.reduce((s, v) => s + (v.stock || 0), 0) 
          : 0;
        if (stockActual < cantidad) {
          return res.status(400).json({ success: false, message: `Stock insuficiente. Stock actual: ${stockActual}` });
        }
        if (productoDoc.variantes && productoDoc.variantes.length > 0) {
          let remaining = cantidad;
          for (let i = 0; i < productoDoc.variantes.length && remaining > 0; i++) {
            const available = productoDoc.variantes[i].stock || 0;
            const toDeduct = Math.min(available, remaining);
            productoDoc.variantes[i].stock -= toDeduct;
            remaining -= toDeduct;
          }
        }
      } else if (tipo === 'ajuste') {
        if (productoDoc.variantes && productoDoc.variantes.length > 0) {
          productoDoc.variantes[0].stock = cantidad;
        } else {
          if (!productoDoc.variantes) productoDoc.variantes = [];
          productoDoc.variantes.push({ stock: cantidad });
        }
      }
    }
    await productoDoc.save();
    await verificarStockYActualizarAlertas(producto, variante);

    const movimientoPopulated = await Movimiento.findById(movimiento._id)
      .populate('producto', 'nombre sku')
      .populate('usuario', 'nombre username')
      .populate('cajaId');

    return res.status(201).json({ success: true, data: movimientoPopulated });
  } catch (error) {
    console.error('Error createMovimiento:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAlertas = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true });
    const alertas = [];

    productos.forEach(producto => {
      const variantes = producto.variantes || [];
      if (variantes.length > 0) {
        variantes.forEach(v => {
          if ((v.stock || 0) <= producto.stockMinimo) {
            alertas.push({
              producto: producto._id,
              nombre: producto.nombre,
              sku: producto.sku,
              variante: v,
              stockMinimo: producto.stockMinimo
            });
          }
        });
      }
    });

    res.json(alertas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMovimiento = async (req, res) => {
  try {
    const { tipo, cantidad, motivo, numeroSerie, variante, cliente } = req.body;
    const movimientoId = req.params.id;

    const movimiento = await Movimiento.findById(movimientoId);
    if (!movimiento) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    const cantidadAnterior = movimiento.cantidad;
    const tipoAnterior = movimiento.tipo;
    const productoId = movimiento.producto;
    const varianteAnterior = movimiento.variante;
    const cajaIdAnterior = movimiento.cajaId;

    if (cantidad !== undefined) movimiento.cantidad = Number(cantidad);
    if (tipo) movimiento.tipo = tipo;
    if (cliente !== undefined) movimiento.cliente = cliente;
    if (numeroSerie !== undefined) movimiento.numeroSerie = numeroSerie;
    if (variante) movimiento.variante = variante;

    await movimiento.save();

    let resultadoStock;
    if (tipoAnterior === 'entrada') {
      resultadoStock = await actualizarStockProducto(productoId, varianteAnterior, cantidadAnterior, tipoAnterior, 'restar');
    } else if (tipoAnterior === 'salida') {
      resultadoStock = await actualizarStockProducto(productoId, varianteAnterior, cantidadAnterior, tipoAnterior, 'sumar');
    }

    const nuevoTipo = tipo || tipoAnterior;
    const nuevaCantidad = cantidad !== undefined ? cantidad : cantidadAnterior;
    const nuevaVariante = variante || varianteAnterior;

    if (nuevoTipo === 'entrada') {
      resultadoStock = await actualizarStockProducto(productoId, nuevaVariante, nuevaCantidad, nuevoTipo, 'sumar');
    } else if (nuevoTipo === 'salida') {
      resultadoStock = await actualizarStockProducto(productoId, nuevaVariante, nuevaCantidad, nuevoTipo, 'restar');
    }

    const movimientoActualizado = await Movimiento.findById(movimientoId)
      .populate('producto', 'nombre sku')
      .populate('usuario', 'nombre username')
      .populate('cajaId');

    res.json({ success: true, data: movimientoActualizado, message: 'Movimiento actualizado correctamente' });
  } catch (error) {
    console.error('Error updateMovimiento:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMovimiento = async (req, res) => {
  try {
    const movimientoId = req.params.id;

    const movimiento = await Movimiento.findById(movimientoId);
    if (!movimiento) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    const cantidad = movimiento.cantidad;
    const tipo = movimiento.tipo;
    const productoId = movimiento.producto;
    const variante = movimiento.variante;
    const cajaId = movimiento.cajaId;

    if (tipo === 'entrada') {
      await actualizarStockProducto(productoId, variante, cantidad, tipo, 'restar');
    } else if (tipo === 'salida') {
      await actualizarStockProducto(productoId, variante, cantidad, tipo, 'sumar');
    }

    if (cajaId) {
      await Caja.findByIdAndDelete(cajaId);
    }

    await Movimiento.findByIdAndDelete(movimientoId);
    await verificarStockYActualizarAlertas(productoId, variante);

    res.json({ success: true, message: 'Movimiento eliminado correctamente' });
  } catch (error) {
    console.error('Error deleteMovimiento:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMovimientos,
  getMovimientosByProducto,
  createMovimiento,
  updateMovimiento,
  deleteMovimiento,
  getAlertas
};
