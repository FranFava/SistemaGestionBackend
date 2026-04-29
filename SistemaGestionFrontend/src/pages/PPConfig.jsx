import { useState, useEffect } from 'react';
import { ppConfigService } from '../services/api';
import { toast } from '../components/Swal';

// Estilos de sección
import '../styles/sections/pp-config.css';

const PPConfig = () => {
  const [ppConfigs, setPPConfigs] = useState([]);
  const [ppForm, setPPForm] = useState({ modelo: '', capacidad: '', condicion: 'standard', valor: '', descripcion: '' });
  const [editingPPId, setEditingPPId] = useState(null);

  useEffect(() => { fetchPPConfigs(); }, []);

  const fetchPPConfigs = async () => {
    try {
      const { data } = await ppConfigService.getAll();
      setPPConfigs(data);
    } catch (err) {
      console.error('Error al cargar configs PP');
    }
  };

  const handlePPSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPPId) {
        await ppConfigService.update(editingPPId, ppForm);
        toast.success('Valor PP actualizado');
      } else {
        await ppConfigService.create(ppForm);
        toast.success('Valor PP agregado');
      }
      setPPForm({ modelo: '', capacidad: '', condicion: 'standard', valor: '', descripcion: '' });
      setEditingPPId(null);
      fetchPPConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar valor PP');
    }
  };

  const handleEditPP = (config) => {
    setPPForm({
      modelo: config.modelo,
      capacidad: config.capacidad,
      condicion: config.condicion,
      valor: config.valor,
      descripcion: config.descripcion
    });
    setEditingPPId(config._id);
  };

  const handleDeletePP = async (id) => {
    if (window.confirm('¿Eliminar este valor de PP?')) {
      try {
        await ppConfigService.delete(id);
        toast.success('Eliminado');
        fetchPPConfigs();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const condicionOptions = [
    { value: 'excelente', label: 'Excelente (90-100%)' },
    { value: 'bueno', label: 'Bueno (80-89%)' },
    { value: 'regular', label: 'Regular (70-79%)' },
    { value: 'service', label: 'Service (≤69%)' },
    { value: 'standard', label: 'Standard' }
  ];

  return (
    <div>
      <h2 className="mb-4"><i className="bi bi-phone me-2"></i>Valores de Parte de Pago</h2>
      
      <div className="glass-card card mb-4">
        <div className="card-body">
          <h5 className="mb-3">{editingPPId ? 'Editar Valor PP' : 'Agregar Valor PP'}</h5>
          <form onSubmit={handlePPSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Modelo *</label>
                <input className="glass-input" placeholder="ej: iPhone 13" value={ppForm.modelo} onChange={e => setPPForm({ ...ppForm, modelo: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="form-label">Capacidad</label>
                <input className="glass-input" placeholder="ej: 128GB" value={ppForm.capacidad} onChange={e => setPPForm({ ...ppForm, capacidad: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Condición</label>
                <select className="form-select" value={ppForm.condicion} onChange={e => setPPForm({ ...ppForm, condicion: e.target.value })}>
                  {condicionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Valor ($) *</label>
                <input type="number" className="glass-input" value={ppForm.valor} onChange={e => setPPForm({ ...ppForm, valor: e.target.value })} required />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="glass-btn glass-btn-primary w-100">
                  <i className="bi bi-plus-circle me-1"></i>{editingPPId ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
            {editingPPId && (
              <button type="button" className="btn btn-secondary mt-3" onClick={() => { setEditingPPId(null); setPPForm({ modelo: '', capacidad: '', condicion: 'standard', valor: '', descripcion: '' }); }}>
                Cancelar edición
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="glass-card card">
        <div className="card-body">
          <h5 className="mb-3">Valores PP Configurados</h5>
          {ppConfigs.length === 0 ? (
            <p className="text-muted">No hay valores PP configurados</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Capacidad</th>
                    <th>Condición</th>
                    <th>Valor</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ppConfigs.map(config => (
                    <tr key={config._id}>
                      <td>{config.modelo}</td>
                      <td>{config.capacidad || '-'}</td>
                      <td>
                        <span className={`badge ${config.condicion === 'service' ? 'bg-danger' : config.condicion === 'regular' ? 'bg-warning' : config.condicion === 'bueno' ? 'bg-info' : 'bg-success'}`}>
                          {condicionOptions.find(o => o.value === config.condicion)?.label || config.condicion}
                        </span>
                      </td>
                      <td>${config.valor?.toLocaleString('es-AR')}</td>
                      <td>
                        <button className="btn btn-primary btn-sm me-1" onClick={() => handleEditPP(config)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeletePP(config._id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PPConfig;
