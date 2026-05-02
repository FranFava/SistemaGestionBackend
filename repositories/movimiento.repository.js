const mongoose = require('mongoose');
const MovimientoCta = require('../models/MovimientoCta');

class MovimientoRepository {
  async create(data, session = null) {
    const doc = new MovimientoCta(data);
    if (session) {
      await doc.save({ session });
    } else {
      await doc.save();
    }
    return doc;
  }

  async find(query, sort = { fecha: -1 }) {
    return MovimientoCta.find(query)
      .populate('id_cuenta', 'id_tercero tipo moneda')
      .populate('id_comprobante', 'tipo nro_comprobante fecha moneda monto_original')
      .sort(sort);
  }

  async findByCuenta(idCuenta, filters = {}) {
    const query = { id_cuenta: new mongoose.Types.ObjectId(idCuenta) };
    if (filters.tipo) query.tipo = filters.tipo;
    if (filters.moneda) query.moneda = filters.moneda;
    if (filters.desde || filters.hasta) {
      query.fecha = {};
      if (filters.desde) query.fecha.$gte = new Date(filters.desde);
      if (filters.hasta) query.fecha.$lte = new Date(filters.hasta + 'T23:59:59');
    }
    return this.find(query, { fecha: 1 });
  }

  async aggregateSaldo(idCuenta, moneda = null) {
    const query = { id_cuenta: new mongoose.Types.ObjectId(idCuenta) };
    if (moneda) query.moneda = moneda;

    const result = await MovimientoCta.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDebe: { $sum: { $cond: [{ $eq: ['$tipo', 'DEBE'] }, { $toDouble: '$monto' }, 0] } },
          totalHaber: { $sum: { $cond: [{ $eq: ['$tipo', 'HABER'] }, { $toDouble: '$monto' }, 0] } }
        }
      }
    ]);

    if (!result.length) {
      return { total: 0, debe: 0, haber: 0 };
    }

    const { totalDebe, totalHaber } = result[0];
    return {
      total: Math.round((totalDebe - totalHaber) * 100) / 100,
      debe: Math.round(totalDebe * 100) / 100,
      haber: Math.round(totalHaber * 100) / 100
    };
  }

  async findByComprobante(idComprobante) {
    return MovimientoCta.find({ id_comprobante: idComprobante })
      .populate('id_cuenta', 'id_tercero tipo moneda');
  }
}

module.exports = new MovimientoRepository();
