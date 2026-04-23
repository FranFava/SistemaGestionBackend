const Movimiento = require('../models/Movimiento');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Caja = require('../models/Caja');
const Config = require('../models/Config');

const crearVenta = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { 
      cliente: clienteData, 
      items, 
      metodoPago, 
      formaPago,
      generarReserva,
      senia,
      observacion
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Agrega al menos un producto' });
    }

    const cliente = await crearOBuscarCliente(clienteData, res);
    if (!cliente) return;

    const config = await Config.findOne();
    const cotizacion = config?.cotizacionDolar || 1000;

    const garantiaProductos = [];
    const movimientosCreados = [];
    let totalVenta = 0;

    for (const item of items) {
      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ success: false, message: `Producto no encontrado: ${item.productoId}` });
      }

      let stockActual = 0;
      if (item.variante && producto.variantes?.length > 0) {
        const idx = producto.variantes.findIndex(
          v => v.color === item.variante?.color && v.capacidad === item.variante?.capacidad
        );
        if (idx !== -1) stockActual = producto.variantes[idx].stock;
      } else if (producto.variantes?.length > 0) {
        stockActual = producto.variantes.reduce((s, v) => s + (v.stock || 0), 0);
      }

      if (stockActual < item.cantidad) {
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuficiente: ${producto.nombre}. Stock: ${stockActual}` 
        });
      }

      const tipoMovimiento = generarReserva ? 'reserva' : 'salida';
      const datosMovimiento = {
        tipo: tipoMovimiento,
        producto: producto._id,
        variante: item.variante,
        cantidad: item.cantidad,
        cliente: {
          nombre: cliente.nombre,
          documento: cliente.documento,
          telefono: cliente.telefono
        },
        numeroSerie: item.numeroSerie,
        usuario: req.user.id,
        registrarCaja: false
      };

      if (generarReserva) {
        datosMovimiento.reserva = {
          isReserva: true,
          senia: senia || 0,
          porcentajeSenia: 10,
          reservaFecha: new Date(),
          reservaExpiracion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          estado: 'reservado'
        };
      }

      const movimiento = new Movimiento(datosMovimiento);
      await movimiento.save();

      await decrementarStock(producto, item);

      if (garantiaProductos.length < item.cantidad) {
        const meses = producto.garantiaMeses || producto.garantia?.meses || 12;
        garantiaProductos.push({
          producto: producto.nombre,
          meses,
          vencimiento: new Date(Date.now() + meses * 30 * 24 * 60 * 60 * 1000),
          terminos: producto.garantia?.terminos || 'Garantía oficial del fabricante',
          requiereTicket: producto.garantia?.requiereTicket !== false
        });
      }

      movimientosCreados.push(movimiento);
      totalVenta += (producto.precioVenta || 0) * item.cantidad;
    }

    let montoCaja = 0;
    if (!generarReserva || (senia && senia > 0)) {
      const montoIngreso = generarReserva ? senia : totalVenta;
      const tipoCaja = generarReserva ? 'egreso' : 'ingreso';
      
      const movimientoCaja = new Caja({
        tipo: tipoCaja,
        metodoPago: metodoPago || 'efectivo',
        moneda: 'ARS',
        monto: montoIngreso,
        montoUSD: 0,
        concepto: generarReserva ? `Seña reserva` : `Venta productos`,
        tipoOperacion: generarReserva ? 'recibido_pp' : 'venta',
        usuario: req.user.id,
        referencia: { tipo: 'venta', id: movimientosCreados[0]._id }
      });
      await movimientoCaja.save();

      if (generarReserva && movimientosCreados[0].reserva) {
        movimientosCreados[0].reserva.seniaCajaId = movimientoCaja._id;
        await movimientosCreados[0].save();
      }
    }

    const ticket = {
      numero: `${String(config?.habilitaciones?.puntoVenta || 1).padStart(4, '0')}-${String(Date.now()).slice(-8)}`,
      items: items.map((item, i) => ({
        ...item,
        garantia: garantiaProductos[i] || null
      })),
      subtotal: totalVenta,
      iva: Math.round(totalVenta * 0.21),
      total: totalVenta,
      garantia: garantiaProductos
    };

    res.json({
      success: true,
      ticket,
      cliente: { _id: cliente._id, nombre: cliente.nombre },
      movimientos: movimientosCreados,
      reserva: generarReserva ? { senia, estado: 'reservado', vencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) } : null
    });
  } catch (error) {
    console.error('Error crearVenta:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const crearOBuscarCliente = async (clienteData, res) => {
  if (!clienteData) return null;

  if (clienteData._id) {
    const existente = await Cliente.findById(clienteData._id);
    if (existente) return existente;
  }

  if (clienteData.documento) {
    const existente = await Cliente.findOne({ documento: clienteData.documento, activo: true });
    if (existente) return existente;
  }

  if (clienteData.crear && clienteData.nombre) {
    const nuevoCliente = new Cliente({
      nombre: clienteData.nombre,
      documento: clienteData.documento || '',
      telefono: clienteData.telefono || '',
      email: clienteData.email || '',
      condicionIVA: clienteData.condicionIVA || 'consumidor',
      activo: true
    });
    await nuevoCliente.save();
    return nuevoCliente;
  }

  return null;
};

const decrementarStock = async (producto, item) => {
  if (item.variante && producto.variantes?.length > 0) {
    const idx = producto.variantes.findIndex(
      v => v.color === item.variante.color && v.capacidad === item.variante.capacidad
    );
    if (idx !== -1) {
      producto.variantes[idx].stock = Math.max(0, producto.variantes[idx].stock - item.cantidad);
    }
  } else if (producto.variantes?.length > 0) {
    let remaining = item.cantidad;
    for (let i = 0; i < producto.variantes.length && remaining > 0; i++) {
      const toDeduct = Math.min(producto.variantes[i].stock || 0, remaining);
      producto.variantes[i].stock -= toDeduct;
      remaining -= toDeduct;
    }
  }
  await producto.save();
};

const confirmarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movimiento = await Movimiento.findById(id);
    if (!movimiento) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    if (movimiento.tipo !== 'reserva' || !movimiento.reserva?.isReserva) {
      return res.status(400).json({ success: false, message: 'No es una reserva' });
    }

    if (movimiento.reserva.estado !== 'reservado') {
      return res.status(400).json({ success: false, message: `Reserva ya ${movimiento.reserva.estado}` });
    }

    movimiento.tipo = 'salida';
    movimiento.reserva.estado = 'confirmado';
    await movimiento.save();

    res.json({ success: true, message: 'Reserva confirmada', movimiento });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movimiento = await Movimiento.findById(id);
    if (!movimiento) {
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    }

    if (movimiento.tipo !== 'reserva' || !movimiento.reserva?.isReserva) {
      return res.status(400).json({ success: false, message: 'No es una reserva' });
    }

    if (movimiento.reserva.estado === 'confirmado') {
      return res.status(400).json({ success: false, message: 'Reserva ya confirmada, no se puede cancelar' });
    }

    const producto = await Producto.findById(movimiento.producto);
    if (producto && movimiento.variante) {
      const idx = producto.variantes.findIndex(
        v => v.color === movimiento.variante.color && v.capacidad === movimiento.variante.capacidad
      );
      if (idx !== -1) {
        producto.variantes[idx].stock += movimiento.cantidad;
        await producto.save();
      }
    }

    if (movimiento.reserva.seniaCajaId) {
      await Caja.findByIdAndDelete(movimiento.reserva.seniaCajaId);
    }

    movimiento.reserva.estado = 'cancelado';
    await movimiento.save();

    res.json({ success: true, message: 'Reserva cancelada', movimiento });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const buscarCliente = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const clientes = await Cliente.find({
      activo: true,
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { documento: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.json(clientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  crearVenta,
  confirmarReserva,
  cancelarReserva,
  buscarCliente
};