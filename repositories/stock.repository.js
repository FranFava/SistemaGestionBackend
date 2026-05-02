const mongoose = require('mongoose');
const MovimientoStock = require('../models/MovimientoStock');

class StockRepository {
  async create(data, session = null) {
    const doc = new MovimientoStock(data);
    if (session) {
      await doc.save({ session });
    } else {
      await doc.save();
    }
    return doc;
  }

  async createMany(dataArray, session = null) {
    if (session) {
      const docs = await MovimientoStock.insertMany(dataArray, { session });
      return docs;
    }
    return MovimientoStock.insertMany(dataArray);
  }

  async find(query, sort = { fecha: -1 }) {
    return MovimientoStock.find(query)
      .populate('id_producto', 'nombre sku tipo activo')
      .populate('id_comprobante', 'tipo origen nro_comprobante fecha')
      .sort(sort);
  }

  async findByProducto(idProducto, filters = {}) {
    const query = { id_producto: new mongoose.Types.ObjectId(idProducto) };
    if (filters.tipo) query.tipo = filters.tipo;
    if (filters.desde || filters.hasta) {
      query.fecha = {};
      if (filters.desde) query.fecha.$gte = new Date(filters.desde);
      if (filters.hasta) query.fecha.$lte = new Date(filters.hasta + 'T23:59:59');
    }
    return this.find(query);
  }

  async findByComprobante(idComprobante) {
    return MovimientoStock.find({ id_comprobante: idComprobante })
      .populate('id_producto', 'nombre sku tipo')
      .sort({ id_item_idx: 1 });
  }

  async getStockActual(idProducto, deposito = 'Central') {
    const result = await MovimientoStock.aggregate([
      {
        $match: {
          id_producto: new mongoose.Types.ObjectId(idProducto),
          deposito
        }
      },
      {
        $group: {
          _id: null,
          entradas: {
            $sum: {
              $cond: [{ $eq: ['$tipo', 'entrada'] }, { $toDouble: '$cantidad' }, 0]
            }
          },
          salidas: {
            $sum: {
              $cond: [{ $eq: ['$tipo', 'salida'] }, { $toDouble: '$cantidad' }, 0]
            }
          }
        }
      }
    ]);

    if (!result.length) return { entradas: 0, salidas: 0, stock: 0 };

    const { entradas, salidas } = result[0];
    return {
      entradas: Math.round(entradas * 100) / 100,
      salidas: Math.round(salidas * 100) / 100,
      stock: Math.round((entradas - salidas) * 100) / 100
    };
  }

  async getStockPorDeposito() {
    return MovimientoStock.aggregate([
      {
        $group: {
          _id: { deposito: '$deposito', producto: '$id_producto' },
          entradas: {
            $sum: {
              $cond: [{ $eq: ['$tipo', 'entrada'] }, { $toDouble: '$cantidad' }, 0]
            }
          },
          salidas: {
            $sum: {
              $cond: [{ $eq: ['$tipo', 'salida'] }, { $toDouble: '$cantidad' }, 0]
            }
          }
        }
      },
      {
        $project: {
          deposito: '$_id.deposito',
          id_producto: '$_id.producto',
          stock: { $subtract: ['$entradas', '$salidas'] }
        }
      }
    ]);
  }
}

module.exports = new StockRepository();
