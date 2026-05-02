const Comprobante = require('../models/Comprobante');

class ComprobanteRepository {
  async create(data, session = null) {
    const doc = new Comprobante(data);
    if (session) {
      await doc.save({ session });
    } else {
      await doc.save();
    }
    return doc;
  }

  async findById(id, populate = ['id_cuenta', 'id_tipo_cambio', 'id_senia_origen', 'id_remito_origen']) {
    let query = Comprobante.findById(id);
    populate.forEach(field => {
      query = query.populate(field, '_id tipo moneda razon_social nro_comprobante');
    });
    return query;
  }

  async find(query, sort = { fecha: -1 }) {
    return Comprobante.find(query)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_tipo_cambio', 'fecha tipo valor_ars_por_usd')
      .sort(sort);
  }

  async update(id, data, session = null) {
    if (session) {
      return Comprobante.findByIdAndUpdate(id, data, { new: true, session });
    }
    return Comprobante.findByIdAndUpdate(id, data, { new: true });
  }

  async findByCuenta(idCuenta, filters = {}) {
    const query = { id_cuenta: idCuenta };
    if (filters.tipo) query.tipo = filters.tipo;
    if (filters.estado) query.estado = filters.estado;
    if (filters.moneda) query.moneda = filters.moneda;
    if (filters.origen) query.origen = filters.origen;
    if (filters.desde || filters.hasta) {
      query.fecha = {};
      if (filters.desde) query.fecha.$gte = new Date(filters.desde);
      if (filters.hasta) query.fecha.$lte = new Date(filters.hasta + 'T23:59:59');
    }
    return this.find(query);
  }

  async findPendientes(idTercero, origen, moneda) {
    const query = {
      estado: { $in: ['pendiente', 'parcial'] }
    };
    if (origen) query.origen = origen;
    if (moneda) query.moneda = moneda;

    return Comprobante.find(query)
      .populate({
        path: 'id_cuenta',
        populate: { path: 'id_tercero', select: 'razon_social nombre email' }
      })
      .sort({ fecha_vencimiento: 1 });
  }

  async findOne(query) {
    return Comprobante.findOne(query);
  }

  async findRemitosByTercero(idCuenta, session = null) {
    const query = { id_cuenta: idCuenta, tipo: 'REM' };
    let q = Comprobante.find(query)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .sort({ fecha: -1 });
    if (session) {
      q = q.session(session);
    }
    return q;
  }
}

module.exports = new ComprobanteRepository();
