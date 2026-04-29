import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Error en request:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    const isConnectionError = 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' ||
      error.message.includes('Network Error') ||
      error.message.includes('Connection refused');
    
    if (isConnectionError && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log(`[API] Error de conexión detectado. Reintentando...`);
      
      for (let i = 1; i <= MAX_RETRIES; i++) {
        console.log(`[API] Reintento ${i}/${MAX_RETRIES}...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY * i));
        
        try {
          const response = await axios(originalRequest);
          console.log(`[API] Reintento ${i} exitoso!`);
          return response;
        } catch (retryError) {
          if (i === MAX_RETRIES) {
            console.error('[API] Todos los reintentos fallaron');
          }
        }
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  validate: () => api.post('/auth/validate')
};

export const productoService = {
  getAll: (params) => api.get('/productos', { params }),
  getById: (id) => api.get(`/productos/${id}`),
  create: (data) => api.post('/productos', data),
  update: (id, data) => api.put(`/productos/${id}`, data),
  delete: (id) => api.delete(`/productos/${id}`),
  checkSku: (sku) => api.get(`/productos/check-sku/${sku}`)
};

export const movimientoService = {
  getAll: (params) => api.get('/movimientos', { params }),
  getByProducto: (id) => api.get(`/movimientos/producto/${id}`),
  create: (data) => api.post('/movimientos', data),
  update: (id, data) => api.put(`/movimientos/${id}`, data),
  delete: (id) => api.delete(`/movimientos/${id}`),
  getAlertas: () => api.get('/movimientos/alertas')
};

export const proveedorService = {
  getAll: (params) => api.get('/proveedores', { params }),
  create: (data) => api.post('/proveedores', data),
  update: (id, data) => api.put(`/proveedores/${id}`, data),
  delete: (id) => api.delete(`/proveedores/${id}`)
};

export const clienteService = {
  getAll: (params) => api.get('/clientes', { params }),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`)
};

export const usuarioService = {
  getAll: () => api.get('/usuarios'),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`)
};

export const configService = {
  get: () => api.get('/config'),
  update: (data) => api.put('/config', data)
};

export const cajaService = {
  getAll: (params) => api.get('/caja', { params }),
  getSaldos: () => api.get('/caja/saldos'),
  getCotizacion: () => api.get('/caja/cotizacion'),
  create: (data) => api.post('/caja', data),
  updateCotizacion: (cotizacion) => api.post('/caja/cotizacion', { cotizacion }),
  delete: (id) => api.delete(`/caja/${id}`)
};

export const ppConfigService = {
  getAll: () => api.get('/ppconfig'),
  buscar: (params) => api.get('/ppconfig/buscar', { params }),
  create: (data) => api.post('/ppconfig', data),
  update: (id, data) => api.put(`/ppconfig/${id}`, data),
  delete: (id) => api.delete(`/ppconfig/${id}`)
};

export const alertaService = {
  getActivas: () => api.get('/alertas/activas'),
  getDescartadas: () => api.get('/alertas/descartadas'),
  getAll: (estado) => api.get('/alertas', { params: estado ? { estado } : {} }),
  getEstadisticas: () => api.get('/alertas/estadisticas'),
  descartar: (id) => api.patch(`/alertas/${id}/descartar`),
  reincorporar: (id) => api.patch(`/alertas/${id}/reincorporar`),
  generarTodas: () => api.post('/alertas/generar')
};

export const ventaService = {
  crear: (data) => api.post('/ventas', data),
  confirmarReserva: (id) => api.post(`/ventas/${id}/confirmar`),
  cancelarReserva: (id) => api.post(`/ventas/${id}/cancelar`),
  getById: (id) => api.get(`/ventas/${id}`),
  getAll: (params) => api.get('/ventas', { params }),
  buscarCliente: (texto) => api.get('/ventas/buscar-cliente', { params: { q: texto } })
};

export default api;