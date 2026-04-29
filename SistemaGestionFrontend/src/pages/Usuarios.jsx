/**
 * ============================================
 * Página Usuarios
 * Gestión de usuarios del sistema
 * ============================================
 */

// React - Hooks
import { useState, useEffect } from 'react';

// Servicios - API
import { usuarioService } from '../services/api';

// Componentes - Notificaciones y paginación
import { toast, confirm } from '../components/Swal';
import Pagination from '../components/Pagination';

// Estilos de sección
import '../styles/sections/usuarios.css';

/**
 * Página de Usuarios
 * @description Permite crear, editar, eliminar y listar usuarios del sistema
 * @returns {JSX.Element} Gestión de usuarios
 */
const Usuarios = () => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================
  
  // Lista de usuarios
  const [usuarios, setUsuarios] = useState([]);
  
  // Control de modal
  const [showModal, setShowModal] = useState(false);
  
  // ID del usuario en edición
  const [editingId, setEditingId] = useState(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Formulario
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    nombre: '', 
    rol: 'vendedor' 
  });

  // ============================================
  // Efectos - Efectos secundarios
  // ============================================

  /**
   * Efecto: Cargar usuarios
   * @description Obtiene la lista de usuarios al montar el componente
   */
  useEffect(() => { 
    fetchUsuarios(); 
  }, []);

  // ============================================
  // Funciones de Fetch - Obtención de datos
  // ============================================

  /**
   * Fetch de usuarios
   * @description Obtiene todos los usuarios del sistema
   */
  const fetchUsuarios = async () => {
    try {
      const { data } = await usuarioService.getAll();
      setUsuarios(data);
    } catch {
      toast.error('Error al cargar usuarios');
    }
  };

  // ============================================
  // Handlers - Funciones manejadoras
  // ============================================

  /**
   * Enviar formulario
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { password, ...rest } = form;
        await usuarioService.update(editingId, password ? form : rest);
        toast.success('Usuario actualizado');
      } else {
        await usuarioService.create(form);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      resetForm();
      fetchUsuarios();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  /**
   * Editar usuario
   * @param {Object} u - Usuario a editar
   */
  const handleEdit = (u) => {
    setForm({ username: u.username, password: '', nombre: u.nombre, rol: u.rol });
    setEditingId(u._id);
    setShowModal(true);
  };

  /**
   * Eliminar usuario
   * @param {string} id - ID del usuario a eliminar
   */
  const handleDelete = async (id) => {
    const result = await confirm('¿Eliminar usuario?', 'Esta acción no se puede deshacer');
    if (result.isConfirmed) {
      try {
        await usuarioService.delete(id);
        toast.success('Usuario eliminado');
        fetchUsuarios();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  /**
   * Resetear formulario
   */
  const resetForm = () => {
    setForm({ username: '', password: '', nombre: '', rol: 'vendedor' });
    setEditingId(null);
  };

  // ============================================
  // Utilidades - Paginación
  // ============================================

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsuarios = usuarios.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);

  // ============================================
  // Render - Renderizado del componente
  // ============================================
  
  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h2 className="mb-0">
          <i className="bi bi-people me-2"></i>
          Usuarios
        </h2>
        <button 
          className="glass-btn glass-btn-primary" 
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Nuevo
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="glass-table">
        <div className="table-responsive">
        <table className="table table-hover table-sm mb-0">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsuarios.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.nombre}</td>
                <td>
                  <span className={`badge bg-${u.rol === 'admin' ? 'primary' : 'secondary'}`}>
                    {u.rol}
                  </span>
                </td>
                <td>
                  <span className={`badge bg-${u.activo ? 'success' : 'danger'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button 
                     className="btn btn-primary btn-sm me-1 usuarios-btn-icon" 
                     onClick={() => handleEdit(u)}
                     title="Editar"
                   >
                     <i className="bi bi-pencil"></i>
                   </button>
                   <button 
                     className="btn btn-danger btn-sm usuarios-btn-icon" 
                     onClick={() => handleDelete(u._id)}
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

      {/* Modal de usuario */}
      {showModal && (
        <div 
           className="modal show d-block glass-modal productos-modal-backdrop" 
           tabIndex="-1" 
         >
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  {editingId ? 'Editar' : 'Nuevo'} Usuario
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => { setShowModal(false); resetForm(); }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body productos-modal-body">
                  <div className="mb-3">
                    <label className="form-label">Usuario *</label>
                    <input 
                      className="glass-input" 
                      value={form.username} 
                      onChange={e => setForm({ ...form, username: e.target.value })} 
                      required 
                      disabled={!!editingId} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {editingId ? 'Nueva Contraseña' : 'Contraseña *'}
                    </label>
                    <input 
                      type="password" 
                      className="glass-input" 
                      value={form.password} 
                      onChange={e => setForm({ ...form, password: e.target.value })} 
                      required={!editingId} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input 
                      className="glass-input" 
                      value={form.nombre} 
                      onChange={e => setForm({ ...form, nombre: e.target.value })} 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select 
                      className="form-select" 
                      value={form.rol} 
                      onChange={e => setForm({ ...form, rol: e.target.value })}
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="glass-btn" 
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="glass-btn glass-btn-primary">
                    {editingId ? 'Actualizar' : 'Crear'}
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

export default Usuarios;
