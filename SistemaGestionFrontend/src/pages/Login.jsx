/**
 * ============================================
 * Login Page - Página de Autenticación
 * Sistema Francisco
 * Aplicando SOLID
 * ============================================
 */

// React/core
import { useEffect } from 'react'

// Custom hooks
import useLogin from '../hooks/useLogin'

// Estilos de sección
import '../styles/sections/login.css';

/**
 * Página de Login
 * @description Formulario para autenticar usuarios en el sistema
 * @returns {JSX.Element}
 */
function Login() {
  const {
    username,
    password,
    error,
    loading,
    user,
    isValid,
    handleSubmit,
    handleUsernameChange,
    handlePasswordChange,
    navigate
  } = useLogin()

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center glass-login-bg">
      <div className="glass-card card p-4 login-card">
        <div className="text-center mb-4">
          <i className="bi bi-box-seam display-1 text-primary"></i>
          <h2 className="mt-3 fw-bold">Sistema de Stock</h2>
          <p className="text-muted">Ingresá tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control glass-input"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Ingrese usuario"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-key"></i>
              </span>
              <input
                type="password"
                className="form-control glass-input"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Ingrese contraseña"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 glass-btn"
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Iniciando...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <small className="text-muted">
            Sistema de Gestión de Stock v2.0
          </small>
        </div>
      </div>
    </div>
  )
}

export default Login