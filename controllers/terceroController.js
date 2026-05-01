const Tercero = require('../models/Tercero');

const getTerceros = async (req, res, next) => {
  try {
    const { es_cliente, es_proveedor } = req.query || {};
    const query = { activo: true };

    if (es_cliente !== undefined) query.es_cliente = es_cliente === 'true';
    if (es_proveedor !== undefined) query.es_proveedor = es_proveedor === 'true';

    const terceros = await Tercero.find(query).sort({ razon_social: 1 });

    return res.json({ success: true, data: terceros });
  } catch (error) {
    console.error('Error getTerceros:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTercero = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const tercero = await Tercero.findById(id);

    if (!tercero) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado' });
    }

    return res.json({ success: true, data: tercero });
  } catch (error) {
    console.error('Error getTercero:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTercero = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const {
      razon_social, es_cliente, es_proveedor,
      tipo_venta, tipo_compra, limite_credito_ars, limite_credito_usd,
      moneda_preferida, nombre, apellido, telefono, instagram, email,
      rut, direccion, contacto
    } = req.body || {};

    if (!razon_social || (!es_cliente && !es_proveedor)) {
      return res.status(400).json({ success: false, message: 'Razon social y al menos un tipo (cliente o proveedor) son requeridos' });
    }

    const tercero = new Tercero({
      razon_social,
      es_cliente: !!es_cliente,
      es_proveedor: !!es_proveedor,
      tipo_venta: tipo_venta || 'ambos',
      tipo_compra: tipo_compra || 'ambos',
      limite_credito_ars: limite_credito_ars || 0,
      limite_credito_usd: limite_credito_usd || 0,
      moneda_preferida: moneda_preferida || 'ARS',
      nombre,
      apellido,
      telefono,
      instagram,
      email,
      rut,
      direccion,
      contacto
    });

    await tercero.save();

    return res.status(201).json({ success: true, data: tercero });
  } catch (error) {
    console.error('Error createTercero:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un tercero con ese valor unico' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTercero = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const tercero = await Tercero.findById(id);

    if (!tercero) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado' });
    }

    const updateFields = req.body;

    if (updateFields.es_cliente !== undefined || updateFields.es_proveedor !== undefined) {
      const esCliente = updateFields.es_cliente !== undefined ? updateFields.es_cliente : tercero.es_cliente;
      const esProveedor = updateFields.es_proveedor !== undefined ? updateFields.es_proveedor : tercero.es_proveedor;
      if (!esCliente && !esProveedor) {
        return res.status(400).json({ success: false, message: 'Al menos un tipo (cliente o proveedor) debe ser verdadero' });
      }
    }

    Object.assign(tercero, updateFields);
    await tercero.save();

    return res.json({ success: true, data: tercero });
  } catch (error) {
    console.error('Error updateTercero:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un tercero con ese valor unico' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTercero = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const tercero = await Tercero.findByIdAndUpdate(id, { activo: false }, { new: true });

    if (!tercero) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado' });
    }

    return res.json({ success: true, message: 'Tercero eliminado' });
  } catch (error) {
    console.error('Error deleteTercero:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const buscarTercero = async (req, res, next) => {
  try {
    const { q, es_cliente, es_proveedor } = req.query || {};

    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Busqueda requiere al menos 2 caracteres' });
    }

    const query = {
      activo: true,
      $or: [
        { razon_social: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
        { apellido: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { instagram: { $regex: q, $options: 'i' } }
      ]
    };

    if (es_cliente !== undefined) query.es_cliente = es_cliente === 'true';
    if (es_proveedor !== undefined) query.es_proveedor = es_proveedor === 'true';

    const terceros = await Tercero.find(query).sort({ razon_social: 1 }).limit(20);

    return res.json({ success: true, data: terceros });
  } catch (error) {
    console.error('Error buscarTercero:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTerceros,
  getTercero,
  createTercero,
  updateTercero,
  deleteTercero,
  buscarTercero
};
