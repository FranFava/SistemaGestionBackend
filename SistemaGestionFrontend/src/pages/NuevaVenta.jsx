import { useState, useEffect, useRef } from 'react';
import { productoService, clienteService, ventaService, configService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import { guardarTicket } from '../utils/ticketPDF';

// Estilos de sección
import '../styles/sections/nueva-venta.css';

const NuevaVenta = () => {
  const [step, setStep] = useState(1);
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', apellido: '', telefono: '', instagram: '', email: '' });
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const productoRef = useRef(null);
  const clienteRef = useRef(null);

  useEffect(() => {
    fetchProductos();
    fetchConfig();
  }, []);

  const fetchProductos = async () => {
    try {
      const { data } = await productoService.getAll();
      setProductos(data.filter(p => p.activo));
    } catch { toast.error('Error al cargar productos'); }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await configService.get();
      setConfig(data);
    } catch {}
  };

  const buscarProductos = (texto) => {
    if (!texto) {
      setSugerenciasProductos([]);
      return;
    }
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      p.sku?.toLowerCase().includes(texto.toLowerCase())
    ).slice(0, 8);
    setSugerenciasProductos(filtrados);
  };

  const buscarClientes = async (texto) => {
    if (!texto || texto.length < 2) {
      setSugerenciasClientes([]);
      return;
    }
    try {
      const { data } = await ventaService.buscarCliente(texto);
      setSugerenciasClientes(data);
    } catch {}
  };

  const agregarProducto = (producto) => {
    const existente = carrito.find(c => c.productoId === producto._id);
    
    let stockTotal = producto.variantes?.reduce((s, v) => s + (v.stock || 0), 0) || 0;

    if (existente) {
      if (existente.cantidad < stockTotal) {
        setCarrito(carrito.map(c => 
          c.productoId === producto._id ? { ...c, cantidad: c.cantidad + 1 } : c
        ));
      } else {
        toast.warning('Stock insuficiente');
        return;
      }
    } else {
      setCarrito([...carrito, {
        productoId: producto._id,
        nombre: producto.nombre,
        precioUnitario: producto.precioVenta,
        cantidad: 1,
        sku: producto.sku,
        garantiaMeses: producto.garantiaMeses || 12
      }]);
    }
    setBusquedaProducto('');
    setSugerenciasProductos([]);
  };

  const quitarProducto = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCarrito(carrito.map((c, i) => i === index ? { ...c, cantidad: nuevaCantidad } : c));
  };

  const seleccionarCliente = (c) => {
    setCliente(c);
    setBusquedaCliente(c.nombre);
    setSugerenciasClientes([]);
  };

  const crearNuevoCliente = () => {
    if (!nuevoCliente.nombre) {
      toast.warning('Ingresa nombre del cliente');
      return;
    }
    setCliente({ ...nuevoCliente, _id: 'nuevo', crear: true });
    setMostrarNuevoCliente(false);
  };

  const calcularTotal = () => {
    const subtotal = carrito.reduce((s, c) => s + (c.precioUnitario * c.cantidad), 0);
    const iva = Math.round(subtotal * 0.21);
    return { subtotal, iva, total: subtotal + iva };
  };

  const confirmarVenta = async (esReserva = false) => {
    if (carrito.length === 0) {
      toast.warning('Agrega productos al carrito');
      return;
    }

    const confirmados = await confirm(
      esReserva ? '¿Confirmar como RESERVA (10% seña)?' : '¿Confirmar la VENTA?'
    );
    if (!confirmados) return;

    setLoading(true);
    try {
      const payload = {
        cliente: cliente || {},
        items: carrito.map(c => ({
          productoId: c.productoId,
          cantidad: c.cantidad,
          precioUnitario: c.precioUnitario,
          descripcion: c.nombre
        })),
        metodoPago,
        formaPago: 'contado',
        generarReserva: esReserva,
        senia: esReserva ? Math.round(calcularTotal().total * 0.1) : 0
      };

      const { data } = await ventaService.crear(payload);
      toast.success(esReserva ? 'Reserva creada!' : 'Venta confirmada!');
      
      if (data.ticket) {
        try { guardarTicket(data.ticket, config, cliente); } 
        catch { console.error('Error al generar PDF'); }
      }

      setCarrito([]);
      setCliente(null);
      setBusquedaCliente('');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al confirmar');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, iva, total } = calcularTotal();

  const steps = [
    { num: 1, label: 'Productos', icon: 'bag' },
    { num: 2, label: 'Cliente', icon: 'person' },
    { num: 3, label: 'Confirmar', icon: 'check-circle' }
  ];

  return (
    <div className="container-fluid py-3">
      <div className="glass-card card mb-3">
        <div className="card-body py-2">
          <div className="d-flex justify-content-between align-items-center">
            {steps.map((s, i) => (
              <div key={s.num} className="d-flex align-items-center flex-fill">
                <div className={`d-flex align-items-center justify-content-center rounded-circle ${step >= s.num ? 'bg-success' : 'bg-secondary'} text-white step-circle`}>
                  <i className={`bi bi-${s.icon}-fill`}></i>
                </div>
                <span className={`ms-2 d-none d-md-inline ${step >= s.num ? 'fw-bold' : 'text-muted'}`}>{s.label}</span>
                  {i < steps.length - 1 && (
                   <div className={`flex-fill mx-2 ${step > s.num ? 'bg-success' : 'bg-secondary'} step-divider`}></div>
                 )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="glass-card card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Seleccionar Productos</h5>
                <span className="badge bg-primary">{carrito.length} items</span>
              </div>
              <div className="card-body">
                <div className="position-relative mb-3">
                  <input
                    type="text"
                    className="glass-input form-control"
                    placeholder="Buscar por nombre o SKU..."
                    value={busquedaProducto}
                    onChange={e => { setBusquedaProducto(e.target.value); buscarProductos(e.target.value); }}
                    onBlur={() => setTimeout(() => setSugerenciasProductos([]), 200)}
                    ref={productoRef}
                  />
                   {sugerenciasProductos.length > 0 && (
                     <div className="position-absolute w-100 glass-card rounded-bottom venta-dropdown">
                      {sugerenciasProductos.map(p => (
                        <div key={p._id} className="p-2 border-bottom cursor-pointer hover-bg" onClick={() => agregarProducto(p)}>
                          <div className="d-flex justify-content-between">
                            <div>
                              <div className="fw-bold">{p.nombre}</div>
                              <small className="text-muted">{p.sku}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-success">${p.precioVenta}</div>
                              <small className="text-muted">Stock: {p.variantes?.reduce((s, v) => s + v.stock, 0) || 0}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {carrito.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-cart-x display-1"></i>
                    <p className="mt-2">Agrega productos usando el buscador</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Producto</th>
                          <th className="text-end">Precio</th>
                               <th className="text-center" style={{ width: '70px' }}>Cant</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrito.map((item, i) => (
                          <tr key={i}>
                            <td><button className="btn btn-sm btn-outline-danger" onClick={() => quitarProducto(i)}><i className="bi bi-x"></i></button></td>
                            <td>
                              <div className="fw-bold">{item.nombre}</div>
                              <small className="text-muted">{item.sku}</small>
                            </td>
                            <td className="text-end">${item.precioUnitario.toLocaleString()}</td>
                               <td className="text-center">
                                 <input type="number" className="form-control form-control-sm text-center venta-cantidad-input" value={item.cantidad} onChange={e => actualizarCantidad(i, parseInt(e.target.value) || 1)} min={1} />
                               </td>
                            <td className="text-end fw-bold">${(item.precioUnitario * item.cantidad).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="glass-card card sticky-top" style={{ top: '70px' }}>
              <div className="card-header"><h5 className="mb-0">Resumen</h5></div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2"><span>Subtotal:</span><span>${subtotal.toLocaleString()}</span></div>
                <div className="d-flex justify-content-between mb-2"><span>IVA (21%):</span><span>${iva.toLocaleString()}</span></div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong className="fs-4">TOTAL:</strong>
                  <strong className="fs-4 text-success">${total.toLocaleString()}</strong>
                </div>
                <button className="btn btn-success w-100 btn-lg mb-2" onClick={() => setStep(2)} disabled={carrito.length === 0}>
                  <i className="bi bi-arrow-right me-2"></i>Continuar
                </button>
                <button className="btn btn-outline-secondary w-100" onClick={() => { setCarrito([]); setStep(1); }}>
                  <i className="bi bi-trash me-2"></i>Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="glass-card card">
              <div className="card-header"><h5 className="mb-0"><i className="bi bi-person-fill me-2"></i>Datos del Cliente</h5></div>
              <div className="card-body">
                <div className="position-relative mb-3">
                  <input type="text" className="glass-input form-control" placeholder="Buscar cliente..." value={busquedaCliente} onChange={e => { setBusquedaCliente(e.target.value); buscarClientes(e.target.value); }} onBlur={() => setTimeout(() => setSugerenciasClientes([]), 200)} ref={clienteRef} />
                   {sugerenciasClientes.length > 0 && (
                     <div className="position-absolute w-100 glass-card rounded-bottom movimientos-dropdown">
                      {sugerenciasClientes.map(c => <div key={c._id} className="p-2 border-bottom cursor-pointer" onClick={() => seleccionarCliente(c)}><div className="fw-bold">{c.nombre}</div><small className="text-muted">{c.documento}</small></div>)}
                    </div>
                  )}
                </div>
                <button className="btn btn-outline-info w-100 mb-3" onClick={() => setMostrarNuevoCliente(!mostrarNuevoCliente)}>
                  <i className="bi bi-plus-circle me-2"></i>Nuevo Cliente
                </button>
                {mostrarNuevoCliente && (
                  <div className="p-3 border rounded">
                    <div className="row g-2">
                      <div className="col-6">
                        <input type="text" className="form-control" placeholder="Nombre *" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                      </div>
                      <div className="col-6">
                        <input type="text" className="form-control" placeholder="Apellido" value={nuevoCliente.apellido} onChange={e => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })} />
                      </div>
                      <div className="col-6">
                        <input type="text" className="form-control" placeholder="@Instagram" value={nuevoCliente.instagram} onChange={e => setNuevoCliente({ ...nuevoCliente, instagram: e.target.value })} />
                      </div>
                      <div className="col-6">
                        <input type="text" className="form-control" placeholder="Celular" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
                      </div>
                      <div className="col-12">
                        <input type="email" className="form-control" placeholder="Email (opcional)" value={nuevoCliente.email || ''} onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
                      </div>
                    </div>
                    <button className="btn btn-primary w-100 mt-2" onClick={crearNuevoCliente}>Agregar Cliente</button>
                  </div>
                )}
                {cliente && !mostrarNuevoCliente && (
                  <div className="mt-3 p-3 border rounded bg-light">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle p-2 me-3"><i className="bi bi-check-lg text-white"></i></div>
                      <div>
                        <div className="fw-bold">{cliente.nombre} {cliente.apellido}</div>
                        {cliente.instagram && <small className="text-muted d-block">@{cliente.instagram}</small>}
                        {cliente.telefono && <small className="text-muted d-block">{cliente.telefono}</small>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="glass-card card">
              <div className="card-header"><h5 className="mb-0">Método de Pago</h5></div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  {[{ value: 'efectivo', label: 'Efectivo', icon: 'cash' }, { value: 'transferencia', label: 'Transferencia', icon: 'bank' }, { value: 'cta_cte', label: 'Cuenta Corriente', icon: 'person-lines-fill' }].map(m => (
                    <button key={m.value} className={`btn btn-lg d-flex align-items-center p-3 ${metodoPago === m.value ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => setMetodoPago(m.value)}>
                      <i className={`bi bi-${m.icon}-fill fs-4 me-3`}></i>
                      <span className="fs-5">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-outline-secondary flex-fill" onClick={() => setStep(1)}>
                <i className="bi bi-arrow-left me-2"></i>Volver
              </button>
              <button className="btn btn-success flex-fill" onClick={() => setStep(3)} disabled={!cliente}>
                <i className="bi bi-arrow-right me-2"></i>Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="glass-card card">
              <div className="card-header"><h5 className="mb-0">Confirmar Venta</h5></div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead><tr><th>Cant</th><th>Producto</th><th className="text-end">Precio</th><th className="text-end">Subtotal</th></tr></thead>
                    <tbody>
                      {carrito.map((item, i) => (
                        <tr key={i}><td>{item.cantidad}</td><td>{item.nombre}</td><td className="text-end">${item.precioUnitario.toLocaleString()}</td><td className="text-end">${(item.precioUnitario * item.cantidad).toLocaleString()}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="p-3 border rounded">
                      <div className="text-muted small">Cliente</div>
                      <div className="fw-bold">{cliente?.nombre}</div>
                      {cliente?.documento && <div className="small text-muted">{cliente.documento}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded">
                      <div className="text-muted small">Método de Pago</div>
                      <div className="fw-bold text-capitalize">{metodoPago}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
             <div className="glass-card card sticky-top venta-sticky-sidebar">
               <div className="card-header bg-success text-white"><h5 className="mb-0">Total a Pagar</h5></div>
              <div className="card-body text-center">
                <div className="display-4 fw-bold text-success mb-3">${total.toLocaleString()}</div>
                <div className="d-grid gap-2">
                  <button className="btn btn-success btn-lg" onClick={() => confirmarVenta(false)} disabled={loading}>
                    <i className="bi bi-check-circle me-2"></i>CONFIRMAR VENTA
                  </button>
                  <button className="btn btn-info btn-lg" onClick={() => confirmarVenta(true)} disabled={loading}>
                    <i className="bi bi-calendar-check me-2"></i>RESERVA (10%)
                  </button>
                </div>
                <small className="text-muted d-block mt-2">La reserva dura 5 días con seña del 10%</small>
                <button className="btn btn-link w-100 mt-2" onClick={() => setStep(2)}>Cambiar datos</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaVenta;