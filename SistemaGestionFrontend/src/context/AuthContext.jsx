import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

/**
 * Contexto de autenticación para gestionar el estado del usuario
 * @type {React.Context}
 */
const AuthContext = createContext();

/**
 * Proveedor de contexto de autenticación
 * @param {{ children: React.ReactNode }} props - Props del componente
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          setUser(userObj);
        } catch {
          localStorage.removeItem('user');
        }
      }

      try {
        const { data } = await authService.validate();
        if (data.usuario) {
          localStorage.setItem('user', JSON.stringify(data.usuario));
          setUser(data.usuario);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Error validando token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Inicia sesión con credenciales de usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Datos de respuesta con token y usuario
   */
  const login = async (username, password) => {
    const { data } = await authService.login(username, password);
    
    if (data.token && data.usuario) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
      setUser(data.usuario);
      return data;
    } else {
      throw new Error('Respuesta de login inválida');
    }
  };

  /**
   * Cierra la sesión del usuario actual
   * @returns {void}
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @returns {{ user: Object|null, login: Function, logout: Function, loading: boolean }}
 */
export const useAuth = () => useContext(AuthContext);