const mongoose = require('mongoose');
const Comprobante = require('../models/Comprobante');
const CuentaCorriente = require('../models/CuentaCorriente');
const { auditar } = require('../middleware/audit');

const getComprobantes = async (req, res) => {
  try {
    const { id_cuenta, tipo, estado, moneda, desde, hasta } = req.query;
    const query = {};

    if (id_cuenta) query.id_cuenta = id_cuenta;
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (moneda) query.moneda = moneda;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const comprobantes = await Comprobante.find(query)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .populate('id_senia_origen', 'nro_comprobante monto_original')
      .sort({ fecha: -1 });

    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComprobanteById = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .populate('id_senia_origen', 'nro_comprobante monto_original tipo');

    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    res.json({ success: true, data: comprobante });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createComprobante = async (req, res) => {
  try {
    const {
      id_cuenta,
      tipo,
      moneda,
      monto_original,
      fecha_vencimiento,
      id_tipo_cambio,
      cotizacion_usado,
      equivalente_ars,
      equivalente_usd,
      es_senia,
      nro_comprobante,
      observaciones
    } = req.body;

    if (!id_cuenta || !tipo || !moneda || !monto_original) {
      return res.status(400).json({
        success: false,
        message: 'id_cuenta, tipo, moneda y monto_original son requeridos'
      });
    }

    if (monto_original <= 0) {
      return res.status(400).json({ success: false, message: 'monto_original debe ser positivo' });
    }

    const cuenta = await CuentaCorriente.findById(id_cuenta);
    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta corriente no encontrada' });
    }

    if (cuenta.moneda !== moneda) {
      return res.status(400).json({
        success: false,
        message: `La moneda del comprobante (${moneda}) no coincide con la moneda de la cuenta (${cuenta.moneda})`
      });
    }

    const nro = nro_comprobante || `${String(tipo).padEnd(6)}-${Date.now()}`;

    let equivalenteArs = equivalente_ars;
    let equivalenteUsd = equivalente_usd;

    if (moneda === 'USD' && !equivalenteArs && cotizacion_usado) {
      equivalenteArs = Math.round(monto_original * cotizacion_usado * 100) / 100;
    }
    if (moneda === 'ARS' && !equivalenteUsd && cotizacion_usado) {
      equivalenteUsd = Math.round((monto_original / cotizacion_usado) * 100) / 100;
    }

    const comprobante = new Comprobante({
      id_cuenta,
      tipo,
      moneda,
      monto_original,
      fecha_vencimiento,
      id_tipo_cambio,
      cotizacion_usado,
      equivalente_ars: equivalenteArs,
      equivalente_usd: equivalenteUsd,
      es_senia: !!es_senia,
      nro_comprobante: nro,
      observaciones
    });

    await comprobante.save();

    const cuentaActualizada = await agregarMovimientoACuenta(cuenta, comprobante);

    if (req.user?.id) {
      await auditar(req, {
        entidad: 'Comprobante',
        entidadId: comprobante._id,
        accion: 'create',
        datosNuevos: comprobante.toObject()
      });
    }

    res.status(201).json({
      success: true,
      data: comprobante,
      saldo_cuenta: cuentaActualizada.saldo_calculado
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const aplicarPago = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    if (comprobante.estado === 'cancelado') {
      return res.status(400).json({ success: false, message: 'Comprobante ya cancelado' });
    }

    const { monto } = req.body;
    if (!monto || monto <= 0) {
      return res.status(400).json({ success: false, message: 'monto debe ser positivo' });
    }

    if (monto > comprobante.saldo_pendiente) {
      return res.status(400).json({
        success: false,
        message: 'El pago excede el saldo pendiente',
        saldo_pendiente: comprobante.saldo_pendiente
      });
    }

    comprobante.aplicarPago(monto);
    await comprobante.save();

    const cuenta = await CuentaCorriente.findById(comprobante.id_cuenta);
    if (cuenta) {
      cuenta.agregarMovimiento({
        tipo: 'abono',
        concepto: `Pago ${comprobante.nro_comprobante}`,
        importe: monto,
        origen: { tipo: 'comprobante', id: comprobante._id }
      });
      await cuenta.save();
    }

    res.json({ success: true, data: comprobante, saldo_cuenta: cuenta?.saldo_calculado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const aplicarSenia = async (req, res) => {
  try {
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    const { id_senia } = req.body;
    if (!id_senia) {
      return res.status(400).json({ success: false, message: 'id_senia es requerido' });
    }

    const senia = await Comprobante.findById(id_senia);
    if (!senia) {
      return res.status(404).json({ success: false, message: 'Senia no encontrada' });
    }

    if (senia.tipo !== 'SENIA') {
      return res.status(400).json({ success: false, message: 'El comprobante indicado no es una senia' });
    }

    comprobante.aplicarSenia(senia);
    await comprobante.save();

    res.json({ success: true, data: comprobante });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const anularComprobante = async (req, res) => {
  try {
    const { motivo } = req.body;
    const comprobante = await Comprobante.findById(req.params.id);
    if (!comprobante) {
      return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
    }

    if (comprobante.estado === 'cancelado') {
      return res.status(400).json({ success: false, message: 'No se puede anular un comprobante cancelado' });
    }

    comprobante.estado = 'cancelado';
    comprobante.observaciones = motivo
      ? `${comprobante.observaciones || ''} ANULADO: ${motivo}`.trim()
      : comprobante.observaciones;
    await comprobante.save();

    res.json({ success: true, data: comprobante });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComprobantesByCuenta = async (req, res) => {
  try {
    const { cuentaId } = req.params;
    const { tipo, estado, desde, hasta } = req.query;

    if (!mongoose.Types.ObjectId.isValid(cuentaId)) {
      return res.status(400).json({ success: false, message: 'ID de cuenta invalido' });
    }

    const query = { id_cuenta: cuentaId };
    if (tipo) query.tipo = tipo;
    if (estado) query.estado = estado;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const comprobantes = await Comprobante.find(query)
      .sort({ fecha: -1 })
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .populate('id_senia_origen', 'nro_comprobante monto_original');

    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComprobantesVencidos = async (req, res) => {
  try {
    const hoy = new Date();
    const comprobantes = await Comprobante.find({
      estado: { $in: ['pendiente', 'parcial'] },
      fecha_vencimiento: { $lt: hoy }
    })
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .sort({ fecha_vencimiento: 1 });

    res.json({ success: true, data: comprobantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProximoNumero = async (req, res) => {
  try {
    const { tipo, moneda } = req.query;
    if (!tipo) {
      return res.status(400).json({ success: false, message: 'tipo es requerido' });
    }

    const ultimo = await Comprobante.findOne({ tipo, moneda })
      .sort({ nro_comprobante: -1 });

    let siguiente = 1;
    if (ultimo && ultimo.nro_comprobante) {
      const parts = ultimo.nro_comprobante.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) siguiente = num + 1;
    }

    res.json({
      tipo,
      moneda: moneda || 'ARS',
      siguiente,
      formato: `${tipo}-${String(siguiente).padStart(6, '0')}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getResumen = async (req, res) => {
  try {
    const { id_cuenta, desde, hasta } = req.query;
    const query = {};
    if (id_cuenta) query.id_cuenta = id_cuenta;
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta + 'T23:59:59');
    }

    const comprobantes = await Comprobante.find(query);

    const resumen = {
      ARS: { pendiente: 0, pagado: 0, total: 0, cantidad: 0 },
      USD: { pendiente: 0, pagado: 0, total: 0, cantidad: 0 }
    };

    comprobantes.forEach(c => {
      const m = c.moneda;
      resumen[m].cantidad += 1;
      resumen[m].pendiente += c.saldo_pendiente || 0;
      resumen[m].pagado += (c.monto_original || 0) - (c.saldo_pendiente || 0);
      resumen[m].total += c.monto_original || 0;
    });

    ['ARS', 'USD'].forEach(m => {
      resumen[m].pendiente = Math.round(resumen[m].pendiente * 100) / 100;
      resumen[m].pagado = Math.round(resumen[m].pagado * 100) / 100;
      resumen[m].total = Math.round(resumen[m].total * 100) / 100;
    });

    res.json({ success: true, data: resumen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function agregarMovimientoACuenta(cuenta, comprobante) {
  let tipoMovimiento;
  let concepto;

  switch (comprobante.tipo) {
    case 'FACT':
    case 'ND':
      tipoMovimiento = 'cargo';
      concepto = `Factura ${comprobante.nro_comprobante}`;
      break;
    case 'REC':
      tipoMovimiento = 'abono';
      concepto = `Recibo ${comprobante.nro_comprobante}`;
      break;
    case 'NC':
      tipoMovimiento = 'abono';
      concepto = `Nota de credito ${comprobante.nro_comprobante}`;
      break;
    case 'SENIA':
      tipoMovimiento = 'senia';
      concepto = `Senia ${comprobante.nro_comprobante}`;
      break;
    case 'REM':
      tipoMovimiento = 'cargo';
      concepto = `Remito ${comprobante.nro_comprobante}`;
      break;
    default:
      tipoMovimiento = 'cargo';
      concepto = `Comprobante ${comprobante.nro_comprobante}`;
  }

  cuenta.agregarMovimiento({
    tipo: tipoMovimiento,
    concepto,
    importe: comprobante.monto_original,
    origen: { tipo: 'comprobante', id: comprobante._id },
    comprobante: comprobante.nro_comprobante
  });

  await cuenta.save();
  return cuenta;
}

module.exports = {
  getComprobantes,
  getComprobanteById,
  createComprobante,
  aplicarPago,
  aplicarSenia,
  anularComprobante,
  getComprobantesByCuenta,
  getComprobantesVencidos,
  getProximoNumero,
  getResumen
};
