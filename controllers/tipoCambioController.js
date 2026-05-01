const TipoCambio = require('../models/TipoCambio');

const getTiposCambio = async (req, res, next) => {
  try {
    const { tipo, fechaDesde, fechaHasta } = req.query || {};
    const query = { vigente: true };

    if (tipo) query.tipo = tipo;

    if (fechaDesde || fechaHasta) {
      query.fecha = {};
      if (fechaDesde) query.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) query.fecha.$lte = new Date(fechaHasta + 'T23:59:59');
    }

    const tiposCambio = await TipoCambio.find(query).sort({ fecha: -1 });

    return res.json({ success: true, data: tiposCambio });
  } catch (error) {
    console.error('Error getTiposCambio:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTipoCambio = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const tipoCambio = await TipoCambio.findById(id);

    if (!tipoCambio) {
      return res.status(404).json({ success: false, message: 'Tipo de cambio no encontrado' });
    }

    return res.json({ success: true, data: tipoCambio });
  } catch (error) {
    console.error('Error getTipoCambio:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTipoCambioPorFecha = async (req, res, next) => {
  try {
    const { fecha, tipo } = req.query;

    if (!fecha) {
      return res.status(400).json({ success: false, message: 'Fecha requerida (YYYY-MM-DD)' });
    }

    const query = {
      vigente: true,
      fecha: {
        $gte: new Date(fecha + 'T00:00:00'),
        $lte: new Date(fecha + 'T23:59:59')
      }
    };

    if (tipo) query.tipo = tipo;

    const resultados = await TipoCambio.find(query).sort({ tipo: 1 });

    return res.json({ success: true, data: resultados });
  } catch (error) {
    console.error('Error getTipoCambioPorFecha:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createTipoCambio = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { fecha, tipo, valor_ars_por_usd, fuente } = req.body || {};

    if (!fecha || !tipo || valor_ars_por_usd === undefined || valor_ars_por_usd === null) {
      return res.status(400).json({ success: false, message: 'Fecha, tipo y valor son requeridos' });
    }

    const valor = Number(valor_ars_por_usd);
    if (!valor || valor <= 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser mayor a 0' });
    }

    const tipoCambio = new TipoCambio({
      fecha: new Date(fecha),
      tipo,
      valor_ars_por_usd: valor,
      fuente: fuente || 'manual',
      vigente: true
    });

    await tipoCambio.save();

    return res.status(201).json({ success: true, data: tipoCambio });
  } catch (error) {
    console.error('Error createTipoCambio:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un registro para esa fecha y tipo' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTipoCambio = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const tipoCambio = await TipoCambio.findById(id);

    if (!tipoCambio) {
      return res.status(404).json({ success: false, message: 'Tipo de cambio no encontrado' });
    }

    const updateFields = req.body;

    if (updateFields.valor_ars_por_usd !== undefined) {
      const valor = Number(updateFields.valor_ars_por_usd);
      if (!valor || valor <= 0) {
        return res.status(400).json({ success: false, message: 'El valor debe ser mayor a 0' });
      }
    }

    if (updateFields.fecha) {
      updateFields.fecha = new Date(updateFields.fecha);
    }

    Object.assign(tipoCambio, updateFields);
    await tipoCambio.save();

    return res.json({ success: true, data: tipoCambio });
  } catch (error) {
    console.error('Error updateTipoCambio:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un registro para esa fecha y tipo' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTipoCambio = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID requerido' });
    }

    const tipoCambio = await TipoCambio.findByIdAndUpdate(id, { vigente: false }, { new: true });

    if (!tipoCambio) {
      return res.status(404).json({ success: false, message: 'Tipo de cambio no encontrado' });
    }

    return res.json({ success: true, message: 'Tipo de cambio eliminado' });
  } catch (error) {
    console.error('Error deleteTipoCambio:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTiposCambio,
  getTipoCambio,
  getTipoCambioPorFecha,
  createTipoCambio,
  updateTipoCambio,
  deleteTipoCambio
};
