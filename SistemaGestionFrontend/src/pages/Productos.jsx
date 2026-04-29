import { useState, useEffect } from 'react';
import { productoService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import ProductoDetalle from '../components/ProductoDetalle';
import { exportProductosExcel } from '../utils/exportUtils';

// Estilos de sección
import '../styles/sections/productos.css';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [skuError, setSkuError] = useState('');
  const [form, setForm] = useState({
    nombre: '', sku: '', marca: '', categoria: '', descripcion: '',
    precioCosto: '', precioVenta: '', stockMinimo: '', garantiaMeses: '', variantes: []
  });
  const [variantForm, setVariantForm] = useState({ color: '', capacidad: '', stock: '' });

  useEffect(() => { fetchProductos(); }, []);

  const fetchProductos = async () => {
    try {
      const { data } = await productoService.getAll();
      setProductos(data);
    } catch (err) {
      toast.error('Error al cargar productos');
    }
  };

  const checkSkuUnique = async (sku) => {
    if (!sku || editingId) return;
    try {
      const { data } = await productoService.checkSku(sku);
      if (data.exists) {
        setSkuError('Este SKU ya está en uso');
      } else {
        setSkuError('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkuChange = (value) => {
    setForm({ ...form, sku: value });
    checkSkuUnique(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (skuError) {
      toast.error('Por favor corrige el SKU');
      return;
    }
    try {
      const payload = { ...form, precioCosto: Number(form.precioCosto), precioVenta: Number(form.precioVenta), stockMinimo: Number(form.stockMinimo), garantiaMeses: Number(form.garantiaMeses) };
      if (editingId) {
        await productoService.update(editingId, payload);
        toast.success('Producto actualizado');
      } else {
        await productoService.create(payload);
        toast.success('Producto creado');
      }
      setShowModal(false);
      resetForm();
      fetchProductos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (p) => {
    setForm(p);
    setEditingId(p._id);
    setSkuError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await confirm('¿Eliminar producto?', 'Esta acción no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await productoService.delete(id);
        toast.success('Producto eliminado');
        fetchProductos();
      } catch (err) {
        toast.error('Error al eliminar');
      }
    }
  };

  const handleVerDetalle = (p) => {
    setSelectedProducto(p);
    setShowDetalle(true);
  };

  const addVariant = () => {
    if (variantForm.color || variantForm.capacidad) {
      setForm({ ...form, variantes: [...form.variantes, { ...variantForm, stock: Number(variantForm.stock) }] });
      setVariantForm({ color: '', capacidad: '', stock: '' });
    }
  };

  const removeVariant = (index) => {
    setForm({ ...form, variantes: form.variantes.filter((_, i) => i !== index) });
  };

  const resetForm = () => {
    setForm({ nombre: '', sku: '', marca: '', categoria: '', descripcion: '', precioCosto: '', precioVenta: '', stockMinimo: '', garantiaMeses: '', variantes: [] });
    setEditingId(null);
    setSkuError('');
  };

  const getTotalStock = (p) => p.variantes.reduce((sum, v) => sum + (v.stock || 0), 0);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProductos = productos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(productos.length / itemsPerPage);

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0"><i className="bi bi-box me-2"></i>Productos</h2>
        <div className="d-flex gap-2">
          <button className="glass-btn" onClick={() => exportProductosExcel(productos)}><i className="bi bi-file-excel me-1"></i><span className="d-none d-sm-inline">Exportar Excel</span></button>
          <button className="glass-btn glass-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}><i className="bi bi-plus-circle me-1"></i><span className="d-none d-sm-inline">Nuevo</span></button>
        </div>
      </div>

      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Stock Total</th>
              <th>Stock Mínimo</th>
              <th>Precio Venta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentProductos.map(p => (
              <tr key={p._id}>
                <td>{p.sku}</td>
                <td>{p.nombre}</td>
                <td>{p.marca}</td>
                <td className={getTotalStock(p) <= p.stockMinimo ? 'text-danger fw-bold' : ''}>{getTotalStock(p)}</td>
                <td>{p.stockMinimo}</td>
              <td>${p.precioVenta}</td>
              <td>
                <button className="btn btn-secondary btn-sm me-1 productos-btn-icon" onClick={() => handleVerDetalle(p)} title="Ver detalle"><i className="bi bi-eye"></i></button>
                 <button className="btn btn-primary btn-sm me-1 productos-btn-icon" onClick={() => handleEdit(p)} title="Editar"><i className="bi bi-pencil"></i></button>
                 <button className="btn btn-danger btn-sm productos-btn-icon" onClick={() => handleDelete(p._id)} title="Eliminar"><i className="bi bi-trash"></i></button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

      {showModal && (
        <div className="modal show d-block glass-modal productos-modal-backdrop" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-box me-2"></i>{editingId ? 'Editar' : 'Nuevo'} Producto</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body productos-modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nombre *</label>
                      <input className="glass-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SKU *</label>
                      <input className={`glass-input ${skuError ? 'is-invalid' : ''}`} value={form.sku} onChange={e => handleSkuChange(e.target.value)} required disabled={!!editingId} />
                      {skuError && <div className="invalid-feedback">{skuError}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Marca</label>
                      <input className="glass-input" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Categoría</label>
                      <input className="glass-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Precio Costo</label>
                      <input type="number" className="glass-input" value={form.precioCosto} onChange={e => setForm({ ...form, precioCosto: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Precio Venta</label>
                      <input type="number" className="glass-input" value={form.precioVenta} onChange={e => setForm({ ...form, precioVenta: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Stock Mínimo</label>
                      <input type="number" className="glass-input" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Garantía (meses)</label>
                      <input type="number" className="glass-input" value={form.garantiaMeses} onChange={e => setForm({ ...form, garantiaMeses: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Descripción</label>
                      <textarea className="glass-input" rows="2" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}></textarea>
                    </div>
                  </div>

                  <hr />
                  <h6>Variantes</h6>
                  <div className="row g-2 mb-2">
                    <div className="col-md-3"><input className="form-control" placeholder="Color" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })} /></div>
                    <div className="col-md-3"><input className="form-control" placeholder="Capacidad" value={variantForm.capacidad} onChange={e => setVariantForm({ ...variantForm, capacidad: e.target.value })} /></div>
                    <div className="col-md-3"><input type="number" className="form-control" placeholder="Stock" value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: e.target.value })} /></div>
                    <div className="col-md-3"><button type="button" className="btn btn-secondary w-100" onClick={addVariant}>Agregar</button></div>
                  </div>
                  {form.variantes.length > 0 && (
                    <table className="table table-sm">
                      <thead><tr><th>Color</th><th>Capacidad</th><th>Stock</th><th></th></tr></thead>
                      <tbody>
                        {form.variantes.map((v, i) => (
                          <tr key={i}>
                            <td>{v.color}</td>
                            <td>{v.capacidad}</td>
                            <td>{v.stock}</td>
                            <td><button type="button" className="btn btn-sm btn-danger" onClick={() => removeVariant(i)}>×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetalle && selectedProducto && (
        <ProductoDetalle producto={selectedProducto} onClose={() => { setShowDetalle(false); setSelectedProducto(null); }} />
      )}
    </div>
  );
};

export default Productos;