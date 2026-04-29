import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertaService } from '../services/api';
import { toast } from '../components/Swal';

// Estilos de sección
import '../styles/sections/alertas.css';

const Alertas = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activas');
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [alertasDescartadas, setAlertasDescartadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertas();
  }, [activeTab]);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      if (activeTab === 'activas') {
        const { data } = await alertaService.getActivas();
        setAlertasActivas(data);
      } else {
        const { data } = await alertaService.getDescartadas();
        setAlertasDescartadas(data);
      }
    } catch {
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleDescartar = async (id) => {
    try {
      await alertaService.descartar(id);
      toast.success('Alerta descartada');
      fetchAlertas();
    } catch {
      toast.error('Error al descartar alerta');
    }
  };

  const handleReincorporar = async (id) => {
    try {
      await alertaService.reincorporar(id);
      toast.success('Alerta reincorporada');
      fetchAlertas();
    } catch {
      toast.error('Error al reincorporar alerta');
    }
  };

  const handleReponer = (alerta) => {
    navigate('/movimientos', {
      state: {
        producto: alerta.producto,
        variante: alerta.variante
      }
    });
  };

  const getDiasTranscurridos = (fecha) => {
    const ahora = new Date();
    const fechaAlerta = new Date(fecha);
    const diffTime = Math.abs(ahora - fechaAlerta);
    const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    if (diffDias < 30) {
      const semanas = Math.floor(diffDias / 7);
      return semanas === 1 ? 'Hace 1 semana' : `Hace ${semanas} semanas`;
    }
    const meses = Math.floor(diffDias / 30);
    return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;
  };

  const alertasAMostrar = activeTab === 'activas' ? alertasActivas : alertasDescartadas;

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0">
          <i className="bi bi-exclamation-triangle text-warning me-2"></i>
          Alertas de Stock
        </h2>
        <button 
          className="glass-btn"
          onClick={async () => {
            try {
              await alertaService.generarTodas();
              toast.success('Alertas regeneradas');
              fetchAlertas();
            } catch {
              toast.error('Error al regenerar alertas');
            }
          }}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Regenerar
        </button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'activas' ? 'active' : ''}`}
            onClick={() => setActiveTab('activas')}
          >
            <i className="bi bi-exclamation-circle me-2"></i>
            Activas
            {alertasActivas.length > 0 && (
              <span className="badge bg-danger ms-2">{alertasActivas.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'descartadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('descartadas')}
          >
            <i className="bi bi-check-circle me-2"></i>
            Descartadas
            {alertasDescartadas.length > 0 && (
              <span className="badge bg-secondary ms-2">{alertasDescartadas.length}</span>
            )}
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : alertasAMostrar.length === 0 ? (
        <div className="glass-alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          {activeTab === 'activas' 
            ? 'No hay alertas activas. Todos los productos tienen stock suficiente.'
            : 'No hay alertas descartadas.'}
        </div>
      ) : (
        <div className="glass-card">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Variante</th>
                  <th>Stock Actual</th>
                  <th>Stock Mín.</th>
                  <th>Desde</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alertasAMostrar.map((alerta) => (
                  <tr key={alerta._id}>
                    <td>{alerta.producto?.sku || '-'}</td>
                    <td>
                      <strong>{alerta.producto?.nombre || '-'}</strong>
                    </td>
                    <td>
                      {alerta.variante?.color || alerta.variante?.capacidad ? (
                        <span className="badge bg-secondary">
                          {[
                            alerta.variante.color,
                            alerta.variante.capacidad
                          ].filter(Boolean).join(' / ')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${alerta.stockActual === 0 ? 'bg-dark' : 'bg-danger'}`}>
                        {alerta.stockActual}
                      </span>
                    </td>
                    <td>{alerta.stockMinimo}</td>
                    <td>
                      <small className="text-muted">
                        {getDiasTranscurridos(alerta.fechaAlerta)}
                      </small>
                    </td>
                    <td>
                      {activeTab === 'activas' ? (
                         <div className="btn-group btn-group-sm">
                           <button
                             className="btn btn-success"
                             onClick={() => handleReponer(alerta)}
                             title="Reponer stock"
                           >
                             <i className="bi bi-plus-circle"></i>
                           </button>
                           <button 
                             className="btn btn-sm btn-outline-primary me-1 alertas-btn-icon" 
                             onClick={() => handleReponer(alerta)}
                             title="Reponer stock"
                           >
                             <i className="bi bi-box-arrow-in-down"></i>
                           </button>
                         </div>
                   ) : null}
                   {alerta.activo ? (
                     <button 
                       className="btn btn-sm btn-warning alertas-btn-icon" 
                       onClick={() => handleDescartar(alerta._id)}
                       title="Descartar"
                     >
                       <i className="bi bi-archive"></i>
                     </button>
                   ) : (
                     <button 
                       className="btn btn-sm btn-success alertas-btn-icon" 
                       onClick={() => handleReincorporar(alerta._id)}
                       title="Reincorporar"
                     >
                       <i className="bi bi-arrow-counterclockwise"></i>
                     </button>
                   )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'descartadas' && alertasDescartadas.length > 0 && (
        <div className="mt-3 text-muted small">
          <i className="bi bi-info-circle me-1"></i>
          Las alertas descartadas no aparecerán hasta que el stock suba y vuelva a bajar.
        </div>
      )}
    </div>
  );
};

export default Alertas;
