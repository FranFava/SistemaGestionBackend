import { useState, useEffect } from 'react';
import { proveedorService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/exportUtils';

// Estilos de sección
import '../styles/sections/proveedores.css';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [form, setForm] = useState({ nombre: '', rut: '', telefono: '', email: '', direccion: '', contacto: '' });

  useEffect(() => { fetchProveedores(); }, []);

  const fetchProveedores = async () => {
    try {
      const { data } = await proveedorService.getAll();
      setProveedores(data);
    } catch (err) {
      toast.error('Error al cargar proveedores');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await proveedorService.update(editingId, form);
        toast.success('Proveedor actualizado');
      } else {
        await proveedorService.create(form);
        toast.success('Proveedor creado');
      }
      setShowModal(false);
      resetForm();
      fetchProveedores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (p) => { setForm(p); setEditingId(p._id); setShowModal(true); };

  const handleDelete = async (id) => {
    const result = await confirm('¿Eliminar proveedor?', 'Esta acción no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await proveedorService.delete(id);
        toast.success('Proveedor eliminado');
        fetchProveedores();
      } catch (err) {
        toast.error('Error al eliminar');
      }
    }
  };

  const resetForm = () => { setForm({ nombre: '', rut: '', telefono: '', email: '', direccion: '', contacto: '' }); setEditingId(null); };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProveedores = proveedores.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(proveedores.length / itemsPerPage);

  const exportData = () => {
    const columns = ['Nombre', 'RUT', 'Teléfono', 'Email', 'Dirección', 'Contacto'].map(h => ({ header: h, key: h.toLowerCase() }));
    const data = currentProveedores.map(p => ({
      nombre: p.nombre, rut: p.rut, teléfono: p.telefono, email: p.email, dirección: p.direccion, contacto: p.contacto
    }));
    exportToExcel(data, 'proveedores', columns);
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0"><i className="bi bi-truck me-2"></i>Proveedores</h2>
        <div className="d-flex gap-2">
          <button className="glass-btn" onClick={exportData}><i className="bi bi-file-excel me-1"></i>Exportar</button>
          <button className="glass-btn glass-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}><i className="bi bi-plus-circle me-1"></i>Nuevo</button>
        </div>
      </div>

      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead><tr><th>Nombre</th><th>RUT</th><th>Teléfono</th><th>Email</th><th>Contacto</th><th>Acciones</th></tr></thead>
          <tbody>
            {currentProveedores.map(p => (
              <tr key={p._id}>
                <td>{p.nombre}</td>
                <td>{p.rut}</td>
                <td>{p.telefono}</td>
                <td>{p.email}</td>
                <td>{p.contacto}</td>
                <td>
                   <button className="btn btn-primary btn-sm me-1 proveedores-btn-icon" onClick={() => handleEdit(p)} title="Editar"><i className="bi bi-pencil"></i></button>
                   <button className="btn btn-danger btn-sm proveedores-btn-icon" onClick={() => handleDelete(p._id)} title="Eliminar"><i className="bi bi-trash"></i></button>
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
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-truck me-2"></i>{editingId ? 'Editar' : 'Nuevo'} Proveedor</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body productos-modal-body">
                  <div className="mb-3"><label className="form-label">Nombre *</label><input className="glass-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
                  <div className="mb-3"><label className="form-label">RUT</label><input className="glass-input" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Teléfono</label><input className="glass-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Email</label><input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Dirección</label><input className="glass-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Persona de Contacto</label><input className="glass-input" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} /></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="glass-btn" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</button>
                  <button type="submit" className="glass-btn glass-btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;