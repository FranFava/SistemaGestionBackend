import { useState, useEffect } from 'react';
import { clienteService } from '../services/api';
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/exportUtils';

// Estilos de sección
import '../styles/sections/clientes.css';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [form, setForm] = useState({ nombre: '', rut: '', telefono: '', email: '', direccion: '' });

  useEffect(() => { fetchClientes(); }, []);

  const fetchClientes = async () => {
    try {
      const { data } = await clienteService.getAll();
      setClientes(data);
    } catch (err) {
      toast.error('Error al cargar clientes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await clienteService.update(editingId, form);
        toast.success('Cliente actualizado');
      } else {
        await clienteService.create(form);
        toast.success('Cliente creado');
      }
      setShowModal(false);
      resetForm();
      fetchClientes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (c) => { setForm(c); setEditingId(c._id); setShowModal(true); };

  const handleDelete = async (id) => {
    const result = await confirm('¿Eliminar cliente?', 'Esta acción no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await clienteService.delete(id);
        toast.success('Cliente eliminado');
        fetchClientes();
      } catch (err) {
        toast.error('Error al eliminar');
      }
    }
  };

  const resetForm = () => { setForm({ nombre: '', rut: '', telefono: '', email: '', direccion: '' }); setEditingId(null); };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentClientes = clientes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(clientes.length / itemsPerPage);

  const exportData = () => {
    const columns = ['Nombre', 'RUT', 'Teléfono', 'Email', 'Dirección'].map(h => ({ header: h, key: h.toLowerCase() }));
    const data = currentClientes.map(c => ({
      nombre: c.nombre, rut: c.rut, teléfono: c.telefono, email: c.email, dirección: c.direccion
    }));
    exportToExcel(data, 'clientes', columns);
  };

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0"><i className="bi bi-people me-2"></i>Clientes</h2>
        <div className="d-flex gap-2">
          <button className="glass-btn" onClick={exportData}><i className="bi bi-file-excel me-1"></i>Exportar</button>
          <button className="glass-btn glass-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}><i className="bi bi-plus-circle me-1"></i>Nuevo</button>
        </div>
      </div>

      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead><tr><th>Nombre</th><th>RUT</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Acciones</th></tr></thead>
          <tbody>
            {currentClientes.map(c => (
              <tr key={c._id}>
                <td>{c.nombre}</td>
                <td>{c.rut}</td>
                <td>{c.telefono}</td>
                <td>{c.email}</td>
                <td>{c.direccion}</td>
                <td>
                   <button className="btn btn-primary btn-sm me-1 clientes-btn-icon" onClick={() => handleEdit(c)} title="Editar"><i className="bi bi-pencil"></i></button>
                   <button className="btn btn-danger btn-sm clientes-btn-icon" onClick={() => handleDelete(c._id)} title="Eliminar"><i className="bi bi-trash"></i></button>
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
                <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>{editingId ? 'Editar' : 'Nuevo'} Cliente</h5>
                <button type="button" className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body productos-modal-body">
                  <div className="mb-3"><label className="form-label">Nombre *</label><input className="glass-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
                  <div className="mb-3"><label className="form-label">RUT</label><input className="glass-input" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Teléfono</label><input className="glass-input" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Email</label><input type="email" className="glass-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="mb-3"><label className="form-label">Dirección</label><input className="glass-input" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
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

export default Clientes;