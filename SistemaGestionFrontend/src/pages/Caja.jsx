/**
 * ============================================
 * Página de Caja
 * Gestión de movimientos de caja y saldos
 * Permite registrar ingresos/egresos y actualizar cotización del dólar
 * ============================================
 */

// React - Hooks
import { useState, useEffect } from 'react';

// Servicios - API de caja
import { cajaService } from '../services/api';

// Componentes - Notificaciones y paginación
import { toast } from '../components/Swal';
import Pagination from '../components/Pagination';

// Context - Cotización del dólar
import { useDollar } from '../context/DollarContext';

// Estilos de sección
import '../styles/sections/caja.css';
import '../styles/sections/components.css';

// ============================================
// Constantes - Definiciones estáticas
// ============================================

/**
 * Etiquetas para tipos de operación
 */
const tipoOperacionLabels = {
  venta: 'Venta',
  compra_proveedor: 'Compra a Proveedor',
  gasto: 'Gasto',
  compra_interna: 'Compra Interna',
  recibido_pp: 'Recibido en Parte de Pago',
  pago_cuenta: 'Pago de Cuenta'
};

/**
 * Colores para tipos de operación (Bootstrap)
 */
const tipoOperacionColores = {
  venta: 'success',
  compra_proveedor: 'primary',
  gasto: 'danger',
  compra_interna: 'info',
  recibido_pp: 'warning',
  pago_cuenta: 'secondary'
};

// ============================================
// Componente Principal
// ============================================

/**
 * Página de Caja
 * @description Gestiona los movimientos de caja, muestra saldos y permite
 * actualizar la cotización del dólar
 * @returns {JSX.Element} Interfaz de gestión de caja
 */
const Caja = () => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================
  
  // Context de cotización
  const { cotizacionDolar, updateCotizacion } = useDollar();
  
  // Lista de movimientos
  const [movimientos, setMovimientos] = useState([]);
  
  // Saldos de caja
  const [saldos, setSaldos] = useState({
    saldoPesosEfectivo: 0,
    saldoPesosTransfer: 0,
    saldoDolaresEfectivo: 0,
    saldoDolaresTransfer: 0,
    saldoTotalPesos: 0,
    saldoTotalDolares: 0,
    cotizacionDolar: 1000
  });
  
  // Control de modales
  const [showModal, setShowModal] = useState(false);
  const [showCotizacionModal, setShowCotizacionModal] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  // Filtros
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: '',
    metodoPago: '',
    moneda: ''
  });
  
  // Formulario de movimiento
  const [form, setForm] = useState({
    tipo: 'ingreso',
    metodoPago: 'efectivo',
    moneda: 'ARS',
    monto: '',
    montoUSD: '',
    concepto: '',
    tipoOperacion: 'venta'
  });
  
  // Formulario de cotización
  const [nuevaCotizacion, setNuevaCotizacion] = useState(() => cotizacionDolar.toString());

  // ============================================
  // Funciones de Fetch - Obtención de datos
  // ============================================

  /**
   * Fetch de movimientos
   * @description Obtiene los movimientos de caja con los filtros aplicados
   */
  const fetchMovimientos = async () => {
    try {
      const params = {};
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
      if (filters.fechaFin) params.fechaFin = filters.fechaFin;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.metodoPago) params.metodoPago = filters.metodoPago;
      if (filters.moneda) params.moneda = filters.moneda;

      const response = await cajaService.getAll(params);
      const data = response.data?.data || response.data || [];
      setMovimientos(Array.isArray(data) ? data : []);
    } catch {
      setMovimientos([]);
      toast.error('Error al cargar movimientos de caja');
    }
  };

  /**
   * Fetch de saldos
   * @description Obtiene los saldos actuales de caja desde el servidor
   */
  const fetchSaldos = async () => {
    try {
      const response = await cajaService.getSaldos();
      const data = response.data?.data || response.data || {};
      setSaldos({
        saldoPesosEfectivo: data.saldoPesosEfectivo || 0,
        saldoPesosTransfer: data.saldoPesosTransfer || 0,
        saldoDolaresEfectivo: data.saldoDolaresEfectivo || 0,
        saldoDolaresTransfer: data.saldoDolaresTransfer || 0,
        saldoTotalPesos: data.saldoTotalPesos || 0,
        saldoTotalDolares: data.saldoTotalDolares || 0,
        cotizacionDolar: data.cotizacionDolar || 1000
      });
      setNuevaCotizacion((data.cotizacionDolar || 1000).toString());
    } catch {
      toast.error('Error al cargar saldos');
    }
  };

  // ============================================
  // Efectos - Efectos secundarios
  // ============================================

  /**
   * Efecto: Carga inicial
   * @description Carga movimientos y saldos al montar el componente
   */
  useEffect(() => {
    fetchMovimientos();
    fetchSaldos();
  }, []);

  /**
   * Efecto: Actualizar cotización
   * @description Sincroniza el input de cotización cuando cambia el contexto
   */
  useEffect(() => {
    console.log('[Caja] Cotización del dólar actualizada:', cotizacionDolar);
    setNuevaCotizacion(cotizacionDolar.toString());
  }, [cotizacionDolar]);

  // ============================================
  // Handlers - Funciones manejadoras
  // ============================================

  /**
   * Aplicar filtros
   * @param {Event} e - Evento del formulario
   */
  const handleFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovimientos();
  };

  /**
   * Enviar formulario de movimiento
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cajaService.create({
        ...form,
        monto: Number(form.monto),
        montoUSD: form.moneda === 'USD' ? Number(form.montoUSD) : 0
      });
      toast.success('Movimiento registrado');
      setShowModal(false);
      setForm({
        tipo: 'ingreso',
        metodoPago: 'efectivo',
        moneda: 'ARS',
        monto: '',
        montoUSD: '',
        concepto: '',
        tipoOperacion: 'venta'
      });
      fetchMovimientos();
      fetchSaldos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear movimiento');
    }
  };

  /**
   * Actualizar cotización del dólar
   * @param {Event} e - Evento del formulario
   */
  const handleUpdateCotizacion = async (e) => {
    e.preventDefault();
    try {
      await updateCotizacion(Number(nuevaCotizacion));
      toast.success('Cotizacion actualizada a ' + Number(nuevaCotizacion).toLocaleString('es-AR') + ' ARS');
      setShowCotizacionModal(false);
      fetchSaldos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar cotizacion');
    }
  };

  /**
   * Eliminar movimiento
   * @param {string} id - ID del movimiento a eliminar
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Estas seguro de eliminar este movimiento?')) return;
    try {
      await cajaService.delete(id);
      toast.success('Movimiento eliminado');
      fetchMovimientos();
      fetchSaldos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  /**
   * Cambiar tipo de moneda
   * @param {string} moneda - Moneda seleccionada (ARS/USD)
   */
  const handleMonedaChange = (moneda) => {
    setForm({ ...form, moneda });
    if (moneda === 'USD') {
      const montoUSD = form.monto && cotizacionDolar
        ? (Number(form.monto) / cotizacionDolar).toFixed(2)
        : '';
      setForm(prev => ({ ...prev, moneda, montoUSD }));
    }
  };

  // ============================================
  // Utilidades - Funciones de ayuda
  // ============================================

  // Paginación
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMovimientos = movimientos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(movimientos.length / itemsPerPage);

  /**
   * Formatear moneda
   * @param {number} value - Valor a formatear
   * @param {string} moneda - Moneda (ARS/USD)
   * @returns {string} Valor formateado
   */
  const formatCurrency = (value, moneda) => {
    return `${moneda === 'USD' ? 'USD' : '$'}${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  // ============================================
  // Render - Renderizado del componente
  // ============================================
  
  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0"><i className="bi bi-cash-coin me-2"></i>Caja</h2>
        <button 
          className="glass-btn glass-btn-primary btn" 
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Nuevo
        </button>
      </div>

      {/* Banner de cotización */}
      <div className="glass-alert alert d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <span className="mb-2 mb-sm-0">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Cotización:</strong> 1 USD = {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
        </span>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => setShowCotizacionModal(true)}
        >
          <i className="bi bi-pencil-square me-1"></i>
          Actualizar
        </button>
      </div>

      {/* Tarjetas de saldos */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted">
                <i className="bi bi-cash text-success me-1"></i> Efectivo ARS
              </h6>
              <h4 className="text-success">{formatCurrency(saldos.saldoPesosEfectivo, 'ARS')}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted">
                <i className="bi bi-bank text-info me-1"></i> Transferencia ARS
              </h6>
              <h4 className="text-info">{formatCurrency(saldos.saldoPesosTransfer, 'ARS')}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted">
                <i className="bi bi-currency-dollar text-warning me-1"></i> Efectivo USD
              </h6>
              <h4 className="text-warning">{formatCurrency(saldos.saldoDolaresEfectivo, 'USD')}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="glass-card card h-100 border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted">
                <i className="bi bi-credit-card text-light me-1"></i> Transferencia USD
              </h6>
              <h4 className="text-light">{formatCurrency(saldos.saldoDolaresTransfer, 'USD')}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Totales */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="glass-card card border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted">
                <i className="bi bi-currency-exchange me-1"></i> Total en Pesos (ARS)
              </h6>
              <h3 className="text-white">{formatCurrency(saldos.saldoTotalPesos, 'ARS')}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="glass-card card border-0">
            <div className="card-body text-center">
              <h6 className="card-title text-glass-muted">
                <i className="bi bi-currency-bitcoin me-1"></i> Total en Dólares (USD)
              </h6>
              <h3 className="text-white">{formatCurrency(saldos.saldoTotalDolares, 'USD')}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <form className="row g-2 mb-4" onSubmit={handleFilter}>
        <div className="col-6 col-sm-4 col-md-2">
          <input 
            type="date" 
            className="glass-input form-control-sm" 
            value={filters.fechaInicio} 
            onChange={e => setFilters({ ...filters, fechaInicio: e.target.value })} 
          />
        </div>
        <div className="col-6 col-sm-4 col-md-2">
          <input 
            type="date" 
            className="glass-input form-control-sm" 
            value={filters.fechaFin} 
            onChange={e => setFilters({ ...filters, fechaFin: e.target.value })} 
          />
        </div>
        <div className="col-4 col-sm-4 col-md-2">
          <select 
            className="form-select form-select-sm" 
            value={filters.tipo} 
            onChange={e => setFilters({ ...filters, tipo: e.target.value })}
          >
            <option value="">Tipo</option>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div className="col-4 col-sm-4 col-md-2">
          <select 
            className="form-select form-select-sm" 
            value={filters.metodoPago} 
            onChange={e => setFilters({ ...filters, metodoPago: e.target.value })}
          >
            <option value="">Método</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div className="col-4 col-sm-4 col-md-2">
          <select 
            className="form-select form-select-sm" 
            value={filters.moneda} 
            onChange={e => setFilters({ ...filters, moneda: e.target.value })}
          >
            <option value="">Moneda</option>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="col-4 col-sm-4 col-md-2">
          <button type="submit" className="glass-btn w-100">
            <i className="bi bi-funnel"></i>
          </button>
        </div>
      </form>

      {/* Tabla de movimientos */}
      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-striped table-sm mb-0">
          <thead>
            <tr>
              <th><i className="bi bi-calendar3 me-1"></i>Fecha</th>
              <th><i className="bi bi-arrow-left-right me-1"></i>Tipo</th>
              <th><i className="bi bi-gear me-1"></i>Operación</th>
              <th><i className="bi bi-box me-1"></i>Producto</th>
              <th><i className="bi bi-person me-1"></i>Cliente</th>
              <th><i className="bi bi-credit-card me-1"></i>Método</th>
              <th><i className="bi bi-currency-exchange me-1"></i>Moneda</th>
              <th><i className="bi bi-cash me-1"></i>Monto</th>
              <th><i className="bi bi-text-left me-1"></i>Concepto</th>
              <th><i className="bi bi-person me-1"></i>Usuario</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentMovimientos.map(mov => (
              <tr key={mov._id}>
                <td>{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className={`badge bg-${mov.tipo === 'ingreso' ? 'success' : 'danger'}`}>
                    {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                  </span>
                </td>
                <td>
                  <span className={`badge bg-${tipoOperacionColores[mov.tipoOperacion]}`}>
                    {tipoOperacionLabels[mov.tipoOperacion]}
                  </span>
                </td>
                <td>
                  {mov.referencia?.id?.producto?.nombre || '-'}
                </td>
                <td>
                  {mov.referencia?.id?.cliente ? 
                    `${mov.referencia.id.cliente.nombre} ${mov.referencia.id.cliente.apellido || ''}` 
                    : '-'}
                </td>
                <td>{mov.metodoPago}</td>
                <td>{mov.moneda}</td>
                <td>{formatCurrency(mov.monto, mov.moneda)}</td>
                <td>{mov.concepto}</td>
                <td>{mov.usuario?.nombre || mov.usuario?.username || '-'}</td>
                <td>
                  <button 
                     className="btn btn-danger btn-sm component-btn-icon" 
                     onClick={() => handleDelete(mov._id)}
                     title="Eliminar"
                   >
                     <i className="bi bi-trash"></i>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      )}
      <p className="text-glass-muted">
        Mostrando {currentMovimientos.length} de {movimientos.length} registros
      </p>

      {/* Modal: Nuevo Movimiento */}
      {showModal && (
        <div 
          className="modal show d-block glass-modal" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-cash-coin me-2"></i>
                  Nuevo Movimiento de Caja
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                 <div className="modal-body productos-modal-body">
                  {/* Tipo: Ingreso/Egreso */}
                  <div className="mb-3">
                    <label className="form-label">Tipo *</label>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className={`btn ${form.tipo === 'ingreso' ? 'btn-success' : 'glass-btn'} flex-fill`} 
                        onClick={() => setForm({ ...form, tipo: 'ingreso' })}
                      >
                        <i className="bi bi-arrow-down-circle me-1"></i>Ingreso
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${form.tipo === 'egreso' ? 'btn-danger' : 'glass-btn'} flex-fill`} 
                        onClick={() => setForm({ ...form, tipo: 'egreso' })}
                      >
                        <i className="bi bi-arrow-up-circle me-1"></i>Egreso
                      </button>
                    </div>
                  </div>
                  
                  {/* Operación */}
                  <div className="mb-3">
                    <label className="form-label">Operación *</label>
                    <select 
                      className="form-select" 
                      value={form.tipoOperacion} 
                      onChange={e => setForm({ ...form, tipoOperacion: e.target.value })} 
                      required
                    >
                      <option value="venta">Venta</option>
                      <option value="compra_proveedor">Compra a Proveedor</option>
                      <option value="compra_interna">Compra Interna</option>
                      <option value="gasto">Gasto</option>
                      <option value="recibido_pp">Recibido en Parte de Pago</option>
                      <option value="pago_cuenta">Pago de Cuenta</option>
                    </select>
                  </div>
                  
                  {/* Método de pago */}
                  <div className="mb-3">
                    <label className="form-label">Método de Pago *</label>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className={`btn ${form.metodoPago === 'efectivo' ? 'btn-primary' : 'glass-btn'} flex-fill`} 
                        onClick={() => setForm({ ...form, metodoPago: 'efectivo' })}
                      >
                        <i className="bi bi-cash me-1"></i>Efectivo
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${form.metodoPago === 'transferencia' ? 'btn-primary' : 'glass-btn'} flex-fill`} 
                        onClick={() => setForm({ ...form, metodoPago: 'transferencia' })}
                      >
                        <i className="bi bi-bank me-1"></i>Transferencia
                      </button>
                    </div>
                  </div>
                  
                  {/* Moneda */}
                  <div className="mb-3">
                    <label className="form-label">Moneda *</label>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        className={`btn ${form.moneda === 'ARS' ? 'btn-warning' : 'glass-btn'} flex-fill`} 
                        onClick={() => handleMonedaChange('ARS')}
                      >
                        ARS
                      </button>
                      <button 
                        type="button" 
                        className={`btn ${form.moneda === 'USD' ? 'btn-warning' : 'glass-btn'} flex-fill`} 
                        onClick={() => handleMonedaChange('USD')}
                      >
                        USD
                      </button>
                    </div>
                    {form.moneda === 'USD' && (
                      <small className="text-glass-muted">
                        Cotización: 1 USD = {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
                      </small>
                    )}
                  </div>
                  
                  {/* Monto */}
                  <div className="mb-3">
                    <label className="form-label">Monto *</label>
                    <div className="input-group">
                      <span className="input-group-text glass">
                        {form.moneda === 'USD' ? 'USD' : '$'}
                      </span>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={form.monto} 
                        onChange={e => {
                          const monto = e.target.value;
                          setForm(prev => {
                            if (prev.moneda === 'USD' && cotizacionDolar) {
                              return { 
                                ...prev, 
                                monto, 
                                montoUSD: monto ? (Number(monto) / cotizacionDolar).toFixed(2) : '' 
                              };
                            }
                            return { ...prev, monto };
                          });
                        }} 
                        min="0" 
                        step="0.01" 
                        required 
                      />
                    </div>
                  </div>
                  
                  {/* Monto USD */}
                  {form.moneda === 'USD' && (
                    <div className="mb-3">
                      <label className="form-label">Monto en Dólares</label>
                      <div className="input-group">
                        <span className="input-group-text glass">USD</span>
                        <input 
                          type="number" 
                          className="glass-input" 
                          value={form.montoUSD} 
                          onChange={e => setForm({ ...form, montoUSD: e.target.value })} 
                          min="0" 
                          step="0.01" 
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Concepto */}
                  <div className="mb-3">
                    <label className="form-label">Concepto *</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={form.concepto} 
                      onChange={e => setForm({ ...form, concepto: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                
                {/* Footer del modal */}
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="glass-btn" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="glass-btn glass-btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Actualizar Cotización */}
      {showCotizacionModal && (
        <div 
           className="modal show d-block glass-modal productos-modal-backdrop" 
           tabIndex="-1" 
         >
           <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-currency-exchange me-2"></i>
                  Actualizar Cotización USD
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCotizacionModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateCotizacion}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Cotización del Día (ARS)</label>
                    <div className="input-group">
                      <span className="input-group-text glass">$</span>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={nuevaCotizacion} 
                        onChange={e => setNuevaCotizacion(e.target.value)} 
                        min="1" 
                        required 
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="glass-btn" 
                    onClick={() => setShowCotizacionModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="glass-btn glass-btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
