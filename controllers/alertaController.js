const Alerta = require('../models/Alerta');
const Producto = require('../models/Producto');

/**
 * Genera alertas de stock para un producto.
 * @async
 * @function generarAlertasParaProducto
 * @param {string} productoId - ID del producto
 * @param {Object} [variante=null] - Variante específica
 */
const generarAlertasParaProducto = async (productoId, variante = null) => {
  try {
    const producto = await Producto.findById(productoId);
    if (!producto || !producto.activo) return;

    const variantesAFiltrar = variante ? [variante] : producto.variantes || [];

    for (const v of variantesAFiltrar) {
      const stockActual = v.stock || 0;
      const stockMinimo = producto.stockMinimo || 0;

      if (stockActual <= stockMinimo) {
        const alertaExistente = await Alerta.findOne({
          producto: productoId,
          variante: v,
          estado: 'activa'
        });

        if (!alertaExistente) {
          await Alerta.create({
            producto: productoId,
            variante: {
              color: v.color || '',
              capacidad: v.capacidad || ''
            },
            stockMinimo: stockMinimo,
            stockActual: stockActual,
            fechaAlerta: new Date(),
            estado: 'activa'
          });
        }
      } else {
        await Alerta.findOneAndDelete({
          producto: productoId,
          variante: v,
          estado: 'activa'
        });
      }
    }
  } catch (error) {
    console.error('Error generarAlertasParaProducto:', error.message);
  }
};

/**
 * Genera todas las alertas de stock.
 * @async
 * @function generarTodasLasAlertas
 */
const generarTodasLasAlertas = async () => {
  try {
    const productos = await Producto.find({ activo: true });
    
    await Alerta.deleteMany({ estado: 'activa' });

    for (const producto of productos) {
      for (const v of producto.variantes || []) {
        const stockActual = v.stock || 0;
        const stockMinimo = producto.stockMinimo || 0;

        if (stockActual <= stockMinimo) {
          await Alerta.create({
            producto: producto._id,
            variante: {
              color: v.color || '',
              capacidad: v.capacidad || ''
            },
            stockMinimo: stockMinimo,
            stockActual: stockActual,
            fechaAlerta: new Date(),
            estado: 'activa'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generarTodasLasAlertas:', error.message);
  }
};

/**
 * Obtiene alertas activas de stock bajo.
 * @async
 * @function getAlertasActivas
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getAlertasActivas = async (req, res) => {
  try {
    const alertas = await Alerta.find({ estado: 'activa' })
      .populate('producto', 'nombre sku marca precioVenta')
      .sort({ fechaAlerta: -1 });

    const alertasFormateadas = alertas.map(alerta => ({
      _id: alerta._id,
      producto: alerta.producto,
      variante: alerta.variante,
      stockMinimo: alerta.stockMinimo,
      stockActual: alerta.stockActual,
      fechaAlerta: alerta.fechaAlerta,
      estado: alerta.estado
    }));

    res.json(alertasFormateadas);
  } catch (error) {
    console.error('Error getAlertasActivas:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene alertas descartadas.
 * @async
 * @function getAlertasDescartadas
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getAlertasDescartadas = async (req, res) => {
  try {
    const alertas = await Alerta.find({ estado: 'descartada' })
      .populate('producto', 'nombre sku marca')
      .populate('descartadaPor', 'nombre username')
      .sort({ fechaDescartada: -1 });

    const alertasFormateadas = alertas.map(alerta => ({
      _id: alerta._id,
      producto: alerta.producto,
      variante: alerta.variante,
      stockMinimo: alerta.stockMinimo,
      stockActual: alerta.stockActual,
      fechaAlerta: alerta.fechaAlerta,
      estado: alerta.estado,
      fechaDescartada: alerta.fechaDescartada,
      descartadaPor: alerta.descartadaPor
    }));

    res.json(alertasFormateadas);
  } catch (error) {
    console.error('Error getAlertasDescartadas:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const getAlertas = async (req, res) => {
  try {
    const { estado } = req.query;
    const query = estado ? { estado } : {};

    const alertas = await Alerta.find(query)
      .populate('producto', 'nombre sku marca precioVenta')
      .populate('descartadaPor', 'nombre username')
      .sort({ fechaAlerta: -1 });

    res.json(alertas);
  } catch (error) {
    console.error('Error getAlertas:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const descartarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({ message: 'ID de alerta requerido' });
    }

    const alerta = await Alerta.findById(id);
    if (!alerta) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    if (alerta.estado === 'descartada') {
      return res.status(400).json({ message: 'La alerta ya fue descartada' });
    }

    alerta.estado = 'descartada';
    alerta.fechaDescartada = new Date();
    alerta.descartadaPor = userId;
    await alerta.save();

    const alertaPopulada = await Alerta.findById(id)
      .populate('producto', 'nombre sku')
      .populate('descartadaPor', 'nombre username');

    res.json({ success: true, data: alertaPopulada });
  } catch (error) {
    console.error('Error descartarAlerta:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const reincorporarAlerta = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await Alerta.findById(id);
    if (!alerta) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    alerta.estado = 'activa';
    alerta.fechaDescartada = null;
    alerta.descartadaPor = null;
    alerta.fechaAlerta = new Date();
    await alerta.save();

    res.json({ success: true, data: alerta });
  } catch (error) {
    console.error('Error reincorporarAlerta:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const verificarStockYActualizarAlertas = async (productoId, variante = null) => {
  try {
    await generarAlertasParaProducto(productoId, variante);
  } catch (error) {
    console.error('Error verificarStockYActualizarAlertas:', error.message);
  }
};

const getEstadisticasAlertas = async (req, res) => {
  try {
    const totalActivas = await Alerta.countDocuments({ estado: 'activa' });
    const totalDescartadas = await Alerta.countDocuments({ estado: 'descartada' });

    res.json({
      totalActivas,
      totalDescartadas
    });
  } catch (error) {
    console.error('Error getEstadisticasAlertas:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generarAlertasParaProducto,
  generarTodasLasAlertas,
  getAlertasActivas,
  getAlertasDescartadas,
  getAlertas,
  descartarAlerta,
  reincorporarAlerta,
  verificarStockYActualizarAlertas,
  getEstadisticasAlertas
};
