/**
 * ============================================
 * Componente ProductoDetalle
 * Muestra los detalles de un producto con su historial de movimientos
 * ============================================
 */

// React - Hooks
import { useState, useEffect } from 'react';

// Servicios - API
import { movimientoService } from '../services/api';

// Estilos de sección
import '../styles/sections/components.css';

/**
 * Componente de Detalle de Producto
 * @description Muestra información detallada de un producto, sus variantes,
 * stock y historial de movimientos
 * @param {Object} producto - Objeto del producto a mostrar
 * @param {Function} onClose - Función para cerrar el modal
 * @returns {JSX.Element} Modal con detalles del producto
 */
const ProductoDetalle = ({ producto, onClose }) => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================
  
  // Lista de movimientos del producto
  const [movimientos, setMovimientos] = useState([]);

  // ============================================
  // Efectos - Efectos secundarios
  // ============================================

  /**
   * Efecto: Cargar movimientos
   * @description Obtiene los movimientos del producto al montar el componente
   */
  useEffect(() => {
    if (producto._id) {
      fetchMovimientos();
    }
  }, [producto._id]);

  // ============================================
  // Funciones de Fetch - Obtención de datos
  // ============================================

  /**
   * Fetch de movimientos
   * @description Obtiene el historial de movimientos del producto
   */
  const fetchMovimientos = async () => {
    try {
      const { data } = await movimientoService.getByProducto(producto._id);
      setMovimientos(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================
  // Utilidades - Cálculos
  // ============================================

  // Total de entradas
  const totalEntradas = movimientos
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + m.cantidad, 0);
    
  // Total de salidas
  const totalSalidas = movimientos
    .filter(m => m.tipo === 'salida')
    .reduce((sum, m) => sum + m.cantidad, 0);
    
  // Stock actual total
  const stockActual = producto.variantes?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

  // ============================================
  // Render - Renderizado del componente
  // ============================================
  
  return (
    <div className="modal show d-block glass-modal productos-modal-backdrop" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          {/* Header del modal */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-box-seam me-2"></i>
              {producto.nombre}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          {/* Body del modal */}
          <div className="modal-body">
            {/* Información básica */}
            <div className="row mb-4">
              <div className="col-md-6">
                <p><strong className="text-white">SKU:</strong> <span className="text-glass">{producto.sku}</span></p>
                <p><strong className="text-white">Marca:</strong> <span className="text-glass">{producto.marca || '-'}</span></p>
                <p><strong className="text-white">Categoría:</strong> <span className="text-glass">{producto.categoria || '-'}</span></p>
                <p><strong className="text-white">Precio Costo:</strong> <span className="text-glass">${producto.precioCosto || 0}</span></p>
                <p><strong className="text-white">Precio Venta:</strong> <span className="text-glass">${producto.precioVenta || 0}</span></p>
              </div>
              <div className="col-md-6">
                <p><strong className="text-white">Stock Mínimo:</strong> <span className="text-glass">{producto.stockMinimo}</span></p>
                <p><strong className="text-white">Garantía:</strong> <span className="text-glass">{producto.garantiaMeses || 0} meses</span></p>
                <p><strong className="text-white">Descripción:</strong> <span className="text-glass">{producto.descripcion || '-'}</span></p>
              </div>
            </div>

            {/* Variantes del producto */}
            {producto.variantes?.length > 0 && (
              <>
                <h6 className="text-white mb-3">
                  <i className="bi bi-palette me-2"></i>
                  Variantes
                </h6>
                <div className="glass-table mb-4">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Color</th>
                        <th>Capacidad</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {producto.variantes.map((v, i) => (
                        <tr key={i}>
                          <td className="text-white">{v.color || '-'}</td>
                          <td className="text-white">{v.capacidad || '-'}</td>
                          <td>
                            <span className={`badge ${(v.stock || 0) <= producto.stockMinimo ? 'bg-danger' : 'bg-success'}`}>
                              {v.stock || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Tarjetas de totales */}
            <div className="row mt-4">
              <div className="col-md-4">
                <div className="glass-card card">
                  <div className="card-body text-center">
                    <i className="bi bi-arrow-down-circle text-success component-icon-lg"></i>
                    <h6 className="text-glass-muted mt-2">Total Entradas</h6>
                    <h4 className="text-white">{totalEntradas}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-card card">
                  <div className="card-body text-center">
                    <i className="bi bi-arrow-up-circle text-danger component-icon-lg"></i>
                    <h6 className="text-glass-muted mt-2">Total Salidas</h6>
                    <h4 className="text-white">{totalSalidas}</h4>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="glass-card card">
                  <div className="card-body text-center">
                    <i className="bi bi-box-seam text-primary component-icon-lg"></i>
                    <h6 className="text-glass-muted mt-2">Stock Actual</h6>
                    <h4 className="text-white">{stockActual}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de movimientos */}
            <h6 className="text-white mt-4 mb-3">
              <i className="bi bi-clock-history me-2"></i>
              Historial de Movimientos
            </h6>
            {movimientos.length > 0 ? (
              <div className="glass-table">
                <table className="table table-sm table-striped mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Motivo</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.slice(0, 20).map(m => (
                      <tr key={m._id}>
                        <td className="text-white">{new Date(m.fecha).toLocaleString()}</td>
                        <td>
                          <span className={`badge bg-${m.tipo === 'entrada' ? 'success' : m.tipo === 'salida' ? 'danger' : 'warning'}`}>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="text-white">{m.cantidad}</td>
                        <td className="text-glass">{m.motivo || '-'}</td>
                        <td className="text-white">{m.usuario?.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-glass-muted">Sin movimientos registrados</p>
            )}
          </div>
          
          {/* Footer del modal */}
          <div className="modal-footer">
            <button type="button" className="glass-btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;
