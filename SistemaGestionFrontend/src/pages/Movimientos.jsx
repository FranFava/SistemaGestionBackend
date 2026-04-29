import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { movimientoService, productoService, ppConfigService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportMovimientosExcel, exportToPDF } from '../utils/exportUtils';

// Estilos de sección
import '../styles/sections/movimientos.css';
import '../styles/sections/components.css';

const tipoMovimientoMap = {
  venta: 'salida',
  compra: 'entrada',
  'recibido_en_parte_de_pago': 'entrada',
  reserva: 'reserva'
};

const tipoMovimientoLabel = {
  entrada: 'Entrada',
  salida: 'Venta',
  reserva: 'Reserva'
};

const Movimientos = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [filters, setFilters] = useState({ fechaInicio: '', fechaFin: '', tipo: '', producto: '' });
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], tipoMovimiento: 'compra', producto: '', cantidad: '', numeroSerie: '', cliente: { nombre: '', apellido: '', telefono: '', instagram: '' }, registrarCaja: true, cajaTipo: 'ingreso', cajaMetodo: 'efectivo', cajaMoneda: 'ARS', origen: 'proveedor', estado: 'nuevo', ppData: { imei: '', capacidad: '', bateria: 100, tieneDetalles: false, detalles: '', origen: 'pp' }, reserva: { isReserva: false, senia: 0, porcentajeSenia: 5 } });
  const [productoSearch, setProductoSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [openPopover, setOpenPopover] = useState(null);
  const [popoverData, setPopoverData] = useState(null);
  const productInputRef = useRef(null);
  const productDropdownRef = useRef(null);
  const tableContainerRef = useRef(null);

  const handleTogglePopover = (e, movimiento) => {
    e.stopPropagation();
    if (openPopover === movimiento._id) {
      setOpenPopover(null);
      setPopoverData(null);
    } else {
      setPopoverData(movimiento.cliente);
      setOpenPopover(movimiento._id);
    }
  };

  const fetchMovimientos = async () => {
    try {
      const params = {};
      if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
      if (filters.fechaFin) params.fechaFin = filters.fechaFin;
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.producto) params.producto = filters.producto;
      
      const { data } = await movimientoService.getAll(params);
      setMovimientos(data);
    } catch {
      toast.error('Error al cargar movimientos');
    }
  };

  const fetchProductos = async () => {
    try {
      const { data } = await productoService.getAll();
      setProductos(data);
    } catch {
      console.error('Error al cargar productos');
    }
  };

  useEffect(() => {
    fetchMovimientos();
    fetchProductos();
  }, []);

  useEffect(() => {
    if (location.state?.producto && productos.length > 0) {
      const productoFromState = location.state.producto;
      const productoEncontrado = productos.find(p => p._id === productoFromState._id);
      
      if (productoEncontrado) {
        setForm(prev => ({
          ...prev,
          producto: productoEncontrado._id,
          cantidad: '',
          tipoMovimiento: 'compra',
          registrarCaja: true
        }));
        setProductoSearch(productoEncontrado.nombre);
        setShowModal(true);
        
        if (location.state.variante) {
          const varianteIndex = productoEncontrado.variantes?.findIndex(
            v => v.color === location.state.variante.color && v.capacidad === location.state.variante.capacidad
          );
          if (varianteIndex !== -1 && varianteIndex !== undefined) {
            setForm(prev => ({
              ...prev,
              varianteIndex
            }));
          }
        }
        
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, productos]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        productInputRef.current && !productInputRef.current.contains(e.target) &&
        productDropdownRef.current && !productDropdownRef.current.contains(e.target)
      ) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (productoSearch.length >= 1) {
      const filtered = productos.filter(p => 
        p.nombre.toLowerCase().includes(productoSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productoSearch.toLowerCase())
      );
      setFilteredProductos(filtered.slice(0, 10));
      setShowProductDropdown(true);
    } else {
      setFilteredProductos([]);
      setShowProductDropdown(false);
    }
  }, [productoSearch, productos]);

  const getCajaTipo = () => {
    if (form.tipoMovimiento === 'venta' || form.tipoMovimiento === 'recibido_en_parte_de_pago' || form.tipoMovimiento === 'aporte' || form.tipoMovimiento === 'reserva') {
      return 'ingreso';
    }
    return 'egreso';
  };

  const getCajaTipoLabel = () => {
    const tipo = getCajaTipo();
    return tipo === 'ingreso' ? 'Ingreso ↑' : 'Egreso ↓';
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovimientos();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const clienteData = form.cliente?.nombre ? {
        nombre: form.cliente.nombre,
        apellido: form.cliente.apellido || '',
        telefono: form.cliente.telefono || '',
        instagram: form.cliente.instagram || ''
      } : null;
      
      const movimientoData = {
        tipo: tipoMovimientoMap[form.tipoMovimiento],
        producto: form.producto,
        cantidad: form.cantidad,
        numeroSerie: form.numeroSerie,
        cliente: clienteData,
        registrarCaja: form.registrarCaja,
        cajaData: form.registrarCaja ? {
          tipo: getCajaTipo(),
          metodoPago: form.cajaMetodo,
          moneda: form.cajaMoneda
        } : null,
        origen: tipoMovimientoMap[form.tipoMovimiento] === 'entrada' ? form.origen : null,
        estado: tipoMovimientoMap[form.tipoMovimiento] === 'entrada' ? form.estado : null,
        ppData: form.tipoMovimiento === 'recibido_en_parte_de_pago' ? {
          imei: form.ppData?.imei || '',
          capacidad: form.ppData?.capacidad || '',
          bateria: form.ppData?.bateria || 100,
          tieneDetalles: form.ppData?.tieneDetalles || false,
          detalles: form.ppData?.detalles || '',
          origen: form.ppData?.origen || 'pp'
        } : null,
        reserva: form.tipoMovimiento === 'reserva' ? {
          isReserva: true,
          senia: form.reserva?.senia || 0,
          porcentajeSenia: form.reserva?.porcentajeSenia || 5,
          reservaFecha: new Date(),
          reservaExpiracion: calcularFechaExpiracion(form.reserva?.porcentajeSenia || 5),
          estado: 'reservado'
        } : null
      };

      const calcularFechaExpiracion = (porcentaje) => {
        const dias = porcentaje === 5 ? 2 : porcentaje === 10 ? 5 : porcentaje === 15 ? 7 : 2;
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + dias);
        return fecha;
      };
      if (editingMovimiento) {
        const updateData = {
          tipo: tipoMovimientoMap[form.tipoMovimiento],
          cantidad: form.cantidad,
          cliente: clienteData,
          numeroSerie: form.numeroSerie,
          origen: tipoMovimientoMap[form.tipoMovimiento] === 'entrada' ? form.origen : null,
          estado: tipoMovimientoMap[form.tipoMovimiento] === 'entrada' ? form.estado : null,
          ppData: form.tipoMovimiento === 'recibido_en_parte_de_pago' ? {
            imei: form.ppData?.imei || '',
            capacidad: form.ppData?.capacidad || '',
            bateria: form.ppData?.bateria || 100,
            tieneDetalles: form.ppData?.tieneDetalles || false,
            detalles: form.ppData?.detalles || '',
            origen: form.ppData?.origen || 'pp'
          } : null,
          reserva: form.tipoMovimiento === 'reserva' ? {
            isReserva: true,
            senia: form.reserva?.senia || 0,
            porcentajeSenia: form.reserva?.porcentajeSenia || 5,
            estado: 'reservado'
          } : null
        };
        await movimientoService.update(editingMovimiento._id, updateData);
        toast.success('Movimiento actualizado correctamente');
        setShowModal(false);
        setEditingMovimiento(null);
        setForm({ fecha: new Date().toISOString().split('T')[0], tipoMovimiento: 'compra', producto: '', cantidad: '', numeroSerie: '', cliente: { nombre: '', apellido: '', telefono: '', instagram: '' }, registrarCaja: true, cajaTipo: 'egreso', cajaMetodo: 'efectivo', cajaMoneda: 'ARS', origen: 'proveedor', estado: 'nuevo', ppData: { imei: '', capacidad: '', bateria: 100, tieneDetalles: false, detalles: '', origen: 'pp' }, reserva: { isReserva: false, senia: 0, porcentajeSenia: 5 } });
        setProductoSearch('');
        fetchMovimientos();
      } else {
        await movimientoService.create(movimientoData);
        toast.success(form.registrarCaja ? 'Movimiento y registro de caja creados' : 'Movimiento registrado');
        setShowModal(false);
        setForm({ fecha: new Date().toISOString().split('T')[0], tipoMovimiento: 'compra', producto: '', cantidad: '', numeroSerie: '', cliente: { nombre: '', apellido: '', telefono: '', instagram: '' }, registrarCaja: true, cajaTipo: 'egreso', cajaMetodo: 'efectivo', cajaMoneda: 'ARS', origen: 'proveedor', estado: 'nuevo', ppData: { imei: '', capacidad: '', bateria: 100, tieneDetalles: false, detalles: '', origen: 'pp' }, reserva: { isReserva: false, senia: 0, porcentajeSenia: 5 } });
        setProductoSearch('');
        fetchMovimientos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (movimiento) => {
    setEditingMovimiento(movimiento);
    const isPP = !!movimiento.ppData;
    const isReserva = movimiento.tipo === 'reserva';
    const tipoMovimiento = isReserva ? 'reserva' : (isPP ? 'recibido_en_parte_de_pago' : (movimiento.tipo === 'entrada' ? 'compra' : 'venta'));
    const producto = productos.find(p => p._id === movimiento.producto?._id);
    setForm({
      fecha: new Date(movimiento.fecha).toISOString().split('T')[0],
      tipoMovimiento,
      producto: movimiento.producto?._id || '',
      cantidad: movimiento.cantidad,
      numeroSerie: movimiento.numeroSerie || '',
      cliente: movimiento.cliente || { nombre: '', apellido: '', telefono: '', instagram: '' },
      registrarCaja: !!movimiento.cajaId,
      cajaTipo: 'ingreso',
      cajaMetodo: 'efectivo',
      cajaMoneda: 'ARS',
      origen: movimiento.origen || 'proveedor',
      estado: movimiento.estado || 'nuevo',
      ppData: movimiento.ppData || { imei: '', capacidad: '', bateria: 100, tieneDetalles: false, detalles: '', origen: 'pp' },
      reserva: movimiento.reserva || { isReserva: false, senia: 0, porcentajeSenia: 5 }
    });
    setProductoSearch(producto?.nombre || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('¿Estás seguro?', 'El movimiento será eliminado y el stock será revertido');
    if (result.isConfirmed) {
      try {
        await movimientoService.delete(id);
        toast.success('Movimiento eliminado correctamente');
        fetchMovimientos();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error al eliminar movimiento');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMovimiento(null);
    setForm({ fecha: new Date().toISOString().split('T')[0], tipoMovimiento: 'compra', producto: '', cantidad: '', numeroSerie: '', cliente: { nombre: '', apellido: '', telefono: '', instagram: '' }, registrarCaja: true, cajaTipo: 'egreso', cajaMetodo: 'efectivo', cajaMoneda: 'ARS', origen: 'proveedor', estado: 'nuevo', ppData: { imei: '', capacidad: '', bateria: 100, tieneDetalles: false, detalles: '', origen: 'pp' }, reserva: { isReserva: false, senia: 0, porcentajeSenia: 5 } });
    setProductoSearch('');
  };

  const selectedProducto = productos.find(p => p._id === form.producto);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentMovimientos = movimientos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(movimientos.length / itemsPerPage);

  const columns = [
    { key: 'fecha', header: 'Fecha' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'producto', header: 'Producto', accessor: (m) => m.producto?.nombre },
    { key: 'cantidad', header: 'Cantidad' },
    { key: 'cliente', header: 'Cliente', accessor: (m) => m.cliente ? `${m.cliente.nombre} ${m.cliente.apellido || ''}` : '-' },
    { key: 'usuario', header: 'Usuario', accessor: (m) => m.usuario?.nombre }
  ];

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0"><i className="bi bi-arrow-left-right me-2"></i>Movimientos</h2>
        <div className="d-flex flex-wrap gap-2">
          <button className="glass-btn" onClick={() => exportMovimientosExcel(movimientos)}><i className="bi bi-file-excel me-1"></i><span className="d-none d-sm-inline">Excel</span></button>
          <button className="glass-btn" onClick={() => exportToPDF(movimientos, 'movimientos', columns, 'Reporte de Movimientos')}><i className="bi bi-file-pdf me-1"></i><span className="d-none d-sm-inline">PDF</span></button>
          <button className="glass-btn glass-btn-primary" onClick={() => setShowModal(true)}><i className="bi bi-plus-circle me-1"></i>Nuevo</button>
        </div>
      </div>

      <form className="row g-2 mb-4" onSubmit={handleFilter}>
        <div className="col-6 col-sm-4 col-md-3">
          <label className="form-label small">Desde</label>
          <input type="date" className="glass-input form-control-sm" value={filters.fechaInicio} onChange={e => setFilters({ ...filters, fechaInicio: e.target.value })} />
        </div>
        <div className="col-6 col-sm-4 col-md-3">
          <label className="form-label small">Hasta</label>
          <input type="date" className="glass-input form-control-sm" value={filters.fechaFin} onChange={e => setFilters({ ...filters, fechaFin: e.target.value })} />
        </div>
        <div className="col-4 col-sm-3 col-md-2">
          <label className="form-label small">Tipo</label>
          <select className="form-select form-select-sm" value={filters.tipo} onChange={e => setFilters({ ...filters, tipo: e.target.value })}>
            <option value="">Todos</option>
            <option value="entrada">Compra</option>
            <option value="salida">Venta</option>
          </select>
        </div>
        <div className="col-6 col-sm-4 col-md-3">
          <label className="form-label small">Producto</label>
          <select className="form-select form-select-sm" value={filters.producto} onChange={e => setFilters({ ...filters, producto: e.target.value })}>
            <option value="">Todos</option>
            {productos.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="col-2 col-sm-1 d-flex align-items-end">
          <button type="submit" className="glass-btn w-100"><i className="bi bi-funnel"></i></button>
        </div>
      </form>

       <div className="glass-table component-table-container" ref={tableContainerRef}>
        <div className="table-responsive">
        <table className="table table-striped table-sm mb-0">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Origen</th>
              <th>Reserva</th>
              <th>Cliente</th>
              <th>Caja</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentMovimientos.map(m => (
              <tr key={m._id}>
                <td>{new Date(m.fecha).toLocaleString()}</td>
                <td><span className={`badge bg-${m.tipo === 'entrada' ? 'success' : m.tipo === 'reserva' ? 'info' : 'danger'}`}>{tipoMovimientoLabel[m.tipo]}</span></td>
                <td>{m.producto?.nombre}</td>
                <td>{m.cantidad}</td>
                <td>
                  {m.tipo === 'entrada' ? (
                    <span className={`badge ${
                      m.origen === 'proveedor' ? 'bg-primary' : 
                      m.origen === 'sellado' ? 'bg-info' : 
                      m.origen === 'pp' ? 'bg-warning' : 
                      m.origen === 'servicio_tecnico' ? 'bg-danger' : 'bg-secondary'
                    }`}>
                      {m.origen === 'proveedor' ? 'Proveedor' : 
                       m.origen === 'sellado' ? 'Sellado' : 
                       m.origen === 'pp' ? 'PP' : 
                       m.origen === 'servicio_tecnico' ? 'S.Técnico' : '-'}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  {m.reserva?.isReserva ? (
                    <div>
                      <span className={`badge ${
                        m.reserva.estado === 'reservado' ? 'bg-info' :
                        m.reserva.estado === 'confirmado' ? 'bg-success' :
                        m.reserva.estado === 'vencido' ? 'bg-warning' : 'bg-secondary'
                      }`}>
                        {m.reserva.estado === 'reservado' ? 'Reservado' :
                         m.reserva.estado === 'confirmado' ? 'Confirmado' :
                         m.reserva.estado === 'vencido' ? 'Vencido' : m.reserva.estado}
                      </span>
                      <div className="small mt-1">
                        <i className="bi bi-cash me-1"></i>${m.reserva.senia?.toLocaleString('es-AR')}
                      </div>
                      {m.reserva.reservaExpiracion && m.reserva.estado === 'reservado' && (
                        <small className="text-muted">
                          {new Date(m.reserva.reservaExpiracion) > new Date() 
                            ? `Expira: ${Math.ceil((new Date(m.reserva.reservaExpiracion) - new Date()) / (1000*60*60*24))} días`
                            : '¡Vencido!'}
                        </small>
                      )}
                    </div>
                  ) : '-'}
                </td>
                <td>
                  {m.cliente ? (
                       <span 
                         className="badge bg-info me-1 component-text-primary"
                         onClick={() => handleTogglePopover(e, m)}
                       >
                      {m.cliente.nombre} {m.cliente.apellido}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  {m.cajaId ? (
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i> Registrado
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      <i className="bi bi-x-circle me-1"></i> Sin caja
                    </span>
                  )}
                </td>
                <td>{m.usuario?.nombre}</td>
                <td>
                  <button className="btn btn-primary btn-sm me-1 component-btn-icon" onClick={() => handleEdit(m)} title="Editar"><i className="bi bi-pencil"></i></button>
                   <button className="btn btn-danger btn-sm component-btn-icon" onClick={() => handleDelete(m._id)} title="Eliminar"><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {openPopover && popoverData && (
        <div className="modal show d-block productos-modal-backdrop" tabIndex="-1">
           <div className="modal-dialog modal-sm">
             <div className="modal-content component-modal-content-rounded">
               <div className="modal-header">
                 <h5 className="modal-title"><i className="bi bi-person-badge me-2"></i>Datos del Cliente</h5>
                 <button type="button" className="btn-close" onClick={() => { setOpenPopover(null); setPopoverData(null); }}></button>
               </div>
               <div className="modal-body">
                 <div className="component-modal-header">
                   {popoverData.nombre} {popoverData.apellido}
                 </div>
                 {popoverData.telefono && (
                   <div className="component-modal-subtitle">
                     <i className="bi bi-telephone me-2"></i>
                    {popoverData.telefono}
                  </div>
                )}
                {popoverData.instagram && (
                  <div style={{ color: '#495057' }}>
                    <i className="bi bi-instagram me-2"></i>
                    @{popoverData.instagram}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      <p className="text-glass-muted">Mostrando {currentMovimientos.length} de {movimientos.length} registros</p>

      {showModal && (
        <div className="modal show d-block glass-modal productos-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-arrow-left-right me-2"></i>
                  {editingMovimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body productos-modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Fecha *</label>
                        <input type="date" className="glass-input" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Tipo de Movimiento *</label>
                        <div className="d-flex gap-2 flex-wrap">
                          <button type="button" className={`btn ${form.tipoMovimiento === 'compra' ? 'btn-success' : 'glass-btn'}`} onClick={() => setForm({ ...form, tipoMovimiento: 'compra' })}>Compra</button>
                          <button type="button" className={`btn ${form.tipoMovimiento === 'venta' ? 'btn-danger' : 'glass-btn'}`} onClick={() => setForm({ ...form, tipoMovimiento: 'venta' })}>Venta</button>
                          <button type="button" className={`btn ${form.tipoMovimiento === 'recibido_en_parte_de_pago' ? 'btn-warning' : 'glass-btn'}`} onClick={() => setForm({ ...form, tipoMovimiento: 'recibido_en_parte_de_pago' })}>Recibido en PP</button>
                          <button type="button" className={`btn ${form.tipoMovimiento === 'reserva' ? 'btn-info' : 'glass-btn'}`} onClick={() => setForm({ ...form, tipoMovimiento: 'reserva' })}>Reserva</button>
                        </div>
                      </div>
                      <div className="mb-3 position-relative">
                        <label className="form-label">Producto *</label>
                        <input 
                          type="text" 
                          className="glass-input" 
                          value={productoSearch} 
                          onChange={e => {
                            if (!editingMovimiento) {
                              setProductoSearch(e.target.value);
                              if (!e.target.value) {
                                setForm({ ...form, producto: '' });
                              }
                            }
                          }}
                          onFocus={() => !editingMovimiento && productoSearch.length >= 1 && setShowProductDropdown(true)}
                          placeholder={editingMovimiento ? selectedProducto?.nombre || 'Producto' : "Escribí para buscar..."}
                          ref={productInputRef}
                          disabled={!!editingMovimiento}
                          required
                        />
                        {selectedProducto && (
                          <small className="text-muted d-block mt-1">
                            Precio Venta: ${selectedProducto.precioVenta} | Precio Costo: ${selectedProducto.precioCosto}
                          </small>
                        )}
                        {showProductDropdown && filteredProductos.length > 0 && (
                           <ul className="dropdown-menu glass show w-100 movimientos-dropdown" ref={productDropdownRef}>
                            {filteredProductos.map(p => (
                              <li key={p._id}>
                                 <button type="button" className="dropdown-item" onClick={() => {
                                  setForm({ ...form, producto: p._id });
                                  setProductoSearch(p.nombre);
                                  setShowProductDropdown(false);
                                }}>
                                  <strong>{p.nombre}</strong> <small className="text-glass-muted">({p.sku})</small>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Cantidad *</label>
                        <div className="d-flex align-items-center gap-2">
                          <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, cantidad: Math.max(1, form.cantidad - 1) })}>-</button>
                           <input type="number" className="form-control text-center component-input-sm" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: Math.max(1, Number(e.target.value)) })} min="1" required />
                          <button type="button" className="btn btn-secondary" onClick={() => setForm({ ...form, cantidad: form.cantidad + 1 })}>+</button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Número de Serie/IMEI</label>
                        <input className="glass-input form-control" value={form.numeroSerie} onChange={e => setForm({ ...form, numeroSerie: e.target.value })} />
                      </div>
                      
                       {(form.tipoMovimiento === 'compra' || form.tipoMovimiento === 'recibido_en_parte_de_pago') && (
                         <div className="mb-3 p-2 border rounded component-bg-primary-light">
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label">Origen</label>
                              <select className="form-select" value={form.origen || 'proveedor'} onChange={e => setForm({ ...form, origen: e.target.value })}>
                                <option value="proveedor">Proveedor</option>
                                <option value="sellado">Sellado</option>
                                <option value="pp">Parte de Pago</option>
                                <option value="servicio_tecnico">Servicio Técnico</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label">Estado</label>
                              <select className="form-select" value={form.estado || 'nuevo'} onChange={e => setForm({ ...form, estado: e.target.value })}>
                                <option value="nuevo">Nuevo</option>
                                <option value="usado">Usado</option>
                                <option value="reacondicionado">Reacondicionado</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                      
                       {form.tipoMovimiento === 'recibido_en_parte_de_pago' && (
                         <div className="mb-3 p-3 border rounded component-bg-warning-light">
                          <h6 className="mb-3"><i className="bi bi-phone me-2"></i>Datos del Equipo (PP)</h6>
                          <div className="row g-2">
                            <div className="col-12">
                              <label className="form-label">IMEI</label>
                              <input className="glass-input form-control" placeholder="IMEI del equipo" value={form.ppData?.imei || ''} onChange={e => setForm({ ...form, ppData: { ...form.ppData, imei: e.target.value } })} />
                            </div>
                            <div className="col-6">
                              <label className="form-label">Capacidad</label>
                              <input className="glass-input form-control" placeholder="ej: 128GB" value={form.ppData?.capacidad || ''} onChange={e => setForm({ ...form, ppData: { ...form.ppData, capacidad: e.target.value } })} />
                            </div>
                            <div className="col-6">
                              <label className="form-label">Batería (%)</label>
                              <div className="d-flex align-items-center gap-2">
                                <input 
                                  type="range" 
                                  className="form-range" 
                                  min="0" 
                                  max="100" 
                                  value={form.ppData?.bateria || 100} 
                                  onChange={e => {
                                    const bateria = parseInt(e.target.value);
                                    setForm({ 
                                      ...form, 
                                      ppData: { 
                                        ...form.ppData, 
                                        bateria,
                                        origen: bateria < 85 ? 'servicio_tecnico' : 'pp'
                                      } 
                                    });
                                  }} 
                                />
                                <span className={`badge ${(form.ppData?.bateria || 100) < 85 ? 'bg-danger' : 'bg-success'}`}>
                                  {form.ppData?.bateria || 100}%
                                </span>
                              </div>
                              {(form.ppData?.bateria || 100) < 85 && (
                                <small className="text-warning d-block mt-1">
                                  <i className="bi bi-exclamation-triangle me-1"></i>Batería baja - Se enviará a Servicio Técnico
                                </small>
                              )}
                            </div>
                            <div className="col-12">
                              <div className="form-check form-switch">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  id="tieneDetalles" 
                                  checked={form.ppData?.tieneDetalles || false} 
                                  onChange={e => setForm({ ...form, ppData: { ...form.ppData, tieneDetalles: e.target.checked } })} 
                                />
                                <label className="form-check-label" htmlFor="tieneDetalles">
                                  Agregar detalles adicionales
                                </label>
                              </div>
                            </div>
                            {form.ppData?.tieneDetalles && (
                              <div className="col-12">
                                <textarea 
                                  className="glass-input form-control" 
                                  placeholder="Describe daños, accesorios incluidos, estado general..." 
                                  rows="2"
                                  value={form.ppData?.detalles || ''} 
                                  onChange={e => setForm({ ...form, ppData: { ...form.ppData, detalles: e.target.value } })} 
                                />
                              </div>
                            )}
                            <div className="col-12">
                              <label className="form-label">Origen</label>
                              <select 
                                className="form-select" 
                                value={form.ppData?.origen || 'pp'} 
                                onChange={e => setForm({ ...form, ppData: { ...form.ppData, origen: e.target.value } })}
                              >
                                <option value="pp">Parte de Pago</option>
                                <option value="sellado">Sellado</option>
                                <option value="proveedor">Proveedor</option>
                                <option value="servicio_tecnico">Servicio Técnico</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {form.tipoMovimiento === 'reserva' && (
                        <div className="mb-3 p-3 border rounded" style={{ backgroundColor: 'rgba(13,202,240,0.15)' }}>
                          <h6 className="mb-3"><i className="bi bi-calendar-check me-2"></i>Reserva con Seña</h6>
                          <div className="row g-2">
                            <div className="col-12">
                              <label className="form-label">Porcentaje de seña</label>
                              <div className="d-flex gap-2">
                                {[5, 10, 15].map(pct => (
                                  <button
                                    key={pct}
                                    type="button"
                                    className={`btn ${form.reserva?.porcentajeSenia === pct ? 'btn-info' : 'btn-outline-info'} flex-fill`}
                                    onClick={() => {
                                      const dias = pct === 5 ? 2 : pct === 10 ? 5 : 7;
                                      setForm({
                                        ...form,
                                        reserva: {
                                          ...form.reserva,
                                          porcentajeSenia: pct,
                                          senia: selectedProducto ? Math.round(selectedProducto.precioVenta * pct / 100) : 0
                                        }
                                      });
                                    }}
                                  >
                                    {pct}% ({pct === 5 ? '2 días' : pct === 10 ? '5 días' : '7 días'})
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="col-6">
                              <label className="form-label">Monto seña ($)</label>
                              <input
                                type="number"
                                className="glass-input form-control"
                                value={form.reserva?.senia || 0}
                                onChange={e => setForm({ ...form, reserva: { ...form.reserva, senia: parseInt(e.target.value) || 0 } })}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label">Precio total producto</label>
                              <input
                                type="text"
                                className="glass-input form-control"
                                value={selectedProducto ? `$${selectedProducto.precioVenta?.toLocaleString('es-AR')}` : '-'}
                                disabled
                              />
                            </div>
                            <div className="col-12">
                              <div className="alert alert-info mb-0 py-2">
                                <i className="bi bi-info-circle me-2"></i>
                                La seña se registrará como <strong>Ingreso</strong> en caja. Si el cliente no retira el equipo en el plazo, la seña no será reembolsada y el equipo quedará disponible.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <label className="form-label"><i className="bi bi-person me-1"></i>Datos del Cliente</label>
                        <div className="row g-2">
                          <div className="col-6">
                            <input className="glass-input form-control" placeholder="Nombre" value={form.cliente?.nombre || ''} onChange={e => setForm({ ...form, cliente: { ...form.cliente, nombre: e.target.value } })} />
                          </div>
                          <div className="col-6">
                            <input className="glass-input form-control" placeholder="Apellido" value={form.cliente?.apellido || ''} onChange={e => setForm({ ...form, cliente: { ...form.cliente, apellido: e.target.value } })} />
                          </div>
                          <div className="col-6">
                            <input className="glass-input form-control" placeholder="Teléfono" value={form.cliente?.telefono || ''} onChange={e => setForm({ ...form, cliente: { ...form.cliente, telefono: e.target.value } })} />
                          </div>
                          <div className="col-6">
                            <input className="glass-input form-control" placeholder="Instagram (sin @)" value={form.cliente?.instagram || ''} onChange={e => setForm({ ...form, cliente: { ...form.cliente, instagram: e.target.value } })} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 border-start">
                      <div className="form-check form-switch mb-3">
                        <input className="form-check-input" type="checkbox" id="registrarCaja" checked={form.registrarCaja} onChange={e => setForm({ ...form, registrarCaja: e.target.checked })} />
                        <label className="form-check-label" htmlFor="registrarCaja">
                          <strong>Registrar en Caja</strong>
                        </label>
                      </div>
                      {form.registrarCaja && (
                        <>
                          <div className="alert alert-info mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Tipo de caja: </strong>
                            <span className={getCajaTipo() === 'ingreso' ? 'text-success' : 'text-danger'}>
                              {getCajaTipoLabel()}
                            </span>
                            <small className="d-block text-muted mt-1">
                              (Se determina automáticamente según el tipo de movimiento)
                            </small>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Método de Pago *</label>
                            <div className="d-flex gap-2">
                              <button type="button" className={`btn ${form.cajaMetodo === 'efectivo' ? 'btn-primary' : 'btn-outline-primary'} flex-fill`} onClick={() => setForm({ ...form, cajaMetodo: 'efectivo' })}>
                                <i className="bi bi-cash me-1"></i>Efectivo
                              </button>
                              <button type="button" className={`btn ${form.cajaMetodo === 'transferencia' ? 'btn-primary' : 'btn-outline-primary'} flex-fill`} onClick={() => setForm({ ...form, cajaMetodo: 'transferencia' })}>
                                <i className="bi bi-bank me-1"></i>Transferencia
                              </button>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Moneda *</label>
                            <div className="d-flex gap-2">
                              <button type="button" className={`btn ${form.cajaMoneda === 'ARS' ? 'btn-warning' : 'btn-outline-warning'} flex-fill`} onClick={() => setForm({ ...form, cajaMoneda: 'ARS' })}>ARS</button>
                              <button type="button" className={`btn ${form.cajaMoneda === 'USD' ? 'btn-warning' : 'btn-outline-warning'} flex-fill`} onClick={() => setForm({ ...form, cajaMoneda: 'USD' })}>USD</button>
                            </div>
                          </div>
                          {selectedProducto && (
                            <div className="alert alert-info">
                              <strong>Monto estimado:</strong>
                              <br />
                              {form.tipoMovimiento === 'venta' ? 'Ingreso' : 'Egreso'}: {' '}
                              {form.cajaMoneda === 'USD' ? 'USD ' : '$'}{((form.tipoMovimiento === 'venta' ? (selectedProducto.precioVenta || 0) : (selectedProducto.precioCosto || 0)) * form.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              {form.cajaMoneda === 'USD' && ' (aprox.)'}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingMovimiento ? 'Actualizar' : 'Guardar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimientos;
