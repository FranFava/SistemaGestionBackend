/**
 * ============================================
 * Página Dashboard
 * Panel principal que muestra estadísticas y alertas
 * ============================================
 */

// React - Hooks
import { useState, useEffect } from 'react';

// Servicios - API
import { productoService, movimientoService, alertaService } from '../services/api';

// Estilos de sección
import '../styles/sections/dashboard.css';

/**
 * Página Dashboard
 * @description Muestra estadísticas generales, movimientos recientes y alertas de stock
 * @returns {JSX.Element} Panel de control principal
 */
const Dashboard = () => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================
  
  // Estadísticas
  const [stats, setStats] = useState({ 
    productos: 0, 
    movimientos: 0, 
    alertas: 0, 
    stockTotal: 0 
  });
  
  // Movimientos recientes
  const [recentMovements, setRecentMovements] = useState([]);
  
  // Productos con stock bajo
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // ============================================
  // Efectos - Efectos secundarios
  // ============================================

  /**
   * Efecto: Cargar datos iniciales
   * @description Obtiene productos, movimientos y alertas al montar el componente
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productos, movimientos, alertas] = await Promise.all([
          productoService.getAll(),
          movimientoService.getAll({}),
          alertaService.getActivas()
        ]);
        
        const stockTotal = productos.data.reduce((sum, p) => sum + (p.variantes || []).reduce((s, v) => s + (v.stock || 0), 0), 0);
        
        setStats({
          productos: productos.data.length,
          movimientos: movimientos.data.length,
          alertas: alertas.data.length,
          stockTotal
        });
        setRecentMovements(movimientos.data.slice(0, 8));
        setLowStockProducts(alertas.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // ============================================
  // Utilidades - Funciones de ayuda
  // ============================================

  /**
   * Obtener color según tipo de movimiento
   * @param {string} tipo - Tipo de movimiento
   * @returns {string} Color del badge
   */
  const getTipoColor = (tipo) => {
    switch(tipo) {
      case 'entrada': return 'success';
      case 'salida': return 'danger';
      case 'ajuste': return 'warning';
      default: return 'secondary';
    }
  };

  // ============================================
  // Render - Renderizado del componente
  // ============================================
  
  return (
    <div>
      {/* Título */}
      <h2 className="mb-4">
        <i className="bi bi-grid me-2"></i>
        Dashboard
      </h2>
      
      {/* Tarjetas de estadísticas */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="glass-card card h-100">
            <div className="card-body text-center">
              <i className="bi bi-box text-primary dashboard-icon"></i>
              <h6 className="card-title text-glass-muted mt-2">Productos</h6>
              <h2 className="text-white">{stats.productos}</h2>
              <small className="text-glass-muted">en catálogo</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100">
            <div className="card-body text-center">
              <i className="bi bi-box-seam text-success dashboard-icon"></i>
              <h6 className="card-title text-glass-muted mt-2">Stock Total</h6>
              <h2 className="text-white">{stats.stockTotal}</h2>
              <small className="text-glass-muted">unidades</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100">
            <div className="card-body text-center">
              <i className="bi bi-arrow-left-right text-info dashboard-icon"></i>
              <h6 className="card-title text-glass-muted mt-2">Movimientos</h6>
              <h2 className="text-white">{stats.movimientos}</h2>
              <small className="text-glass-muted">registrados</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`glass-card card h-100 ${stats.alertas > 0 ? 'border-danger' : ''}`}>
            <div className="card-body text-center">
              <i className={`bi bi-exclamation-triangle ${stats.alertas > 0 ? 'text-danger' : 'text-secondary'} dashboard-icon`}></i>
              <h6 className="card-title text-glass-muted mt-2">Alertas</h6>
              <h2 className="text-white">{stats.alertas}</h2>
              <small className="text-glass-muted">{stats.alertas > 0 ? 'stock bajo' : 'sin alertas'}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Movimientos y Alertas */}
      <div className="row g-4">
        {/* Movimientos recientes */}
        <div className="col-lg-8">
          <div className="glass-card card">
            <div className="card-header glass">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Movimientos Recientes
              </h5>
            </div>
            <div className="card-body">
              {recentMovements.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover table-sm mb-0">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMovements.map(m => (
                        <tr key={m._id}>
                          <td>{new Date(m.fecha).toLocaleDateString()}</td>
                          <td><span className={`badge bg-${getTipoColor(m.tipo)}`}>{m.tipo}</span></td>
                          <td>{m.producto?.nombre || '-'}</td>
                          <td>{m.cantidad}</td>
                          <td>{m.usuario?.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-glass-muted mb-0">No hay movimientos registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Alertas de stock */}
        <div className="col-lg-4">
          <div className="glass-card card">
            <div className="card-header glass border-danger">
              <h5 className="mb-0 text-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Alertas de Stock
              </h5>
            </div>
            <div className="card-body">
              {lowStockProducts.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {lowStockProducts.map((a, i) => (
                    <li key={i} className="list-group-item glass d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-white">{a.producto?.nombre}</strong>
                        <br />
                        <small className="text-glass-muted">{a.producto?.sku}</small>
                        {a.variante?.color && <small className="text-glass-muted"> - {a.variante.color}</small>}
                      </div>
                      <span className={`badge ${a.stockActual === 0 ? 'bg-secondary' : 'bg-danger'}`}>
                        {a.stockActual}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-success mb-0">
                  <i className="bi bi-check-circle me-2"></i>
                  Sin alertas de stock
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
