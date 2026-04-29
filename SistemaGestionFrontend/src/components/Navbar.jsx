/**
 * ============================================
 * Componente Navbar
 * Barra de navegación principal de la aplicación
 * Muestra el menú, cotización del dólar y controls de usuario
 * ============================================
 */

// React Router - Navegación
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Context - Autenticación, Cotización y Carrito
import { useAuth } from '../context/AuthContext';
import { useDollar } from '../context/DollarContext';
import { useCart } from '../context/CartContext';

// React - Hooks
import { useState, useEffect } from 'react';

// Servicios - API
import { alertaService } from '../services/api';

/**
 * Componente de Barra de Navegación
 * @description Muestra el menú de navegación, la cotización actual del dólar
 * y controls para cerrar sesión. Actualiza las alertas cada 60 segundos.
 * @returns {JSX.Element} Barra de navegación
 */
const Navbar = () => {
  // ============================================
  // Estado - Variables de estado del componente
  // ============================================

  // Hooks de navegación
  const navigate = useNavigate();

  // Context de autenticación
  const { user, logout } = useAuth();
  
  // Context de cotización del dólar
  const { cotizacionDolar } = useDollar();
  
  // Hook de ubicación actual (react-router)
  const location = useLocation();
  
  // Nombre de la tienda (desde localStorage)
  const [nombreTienda, setNombreTienda] = useState('Stock Nextech');

  // Estado para el menú móvil
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Contador de alertas de stock
  const [alertasCount, setAlertasCount] = useState(0);

  // ============================================
  // Efectos - Efectos secundarios
  // ============================================

  /**
   * Efecto: Cargar nombre de tienda
   * @description Recupera el nombre de la tienda desde localStorage al iniciar
   */
  useEffect(() => {
    const stored = localStorage.getItem('nombreTienda');
    if (stored) setNombreTienda(stored);
  }, []);

  /**
   * Efecto: Fetch de alertas
   * @description Carga las alertas de stock cada 60 segundos si hay un usuario logueado
   */
  useEffect(() => {
    const fetchAlertas = async () => {
      try {
        const res = await alertaService.getActivas();
        setAlertasCount(res.data.length);
      } catch (err) {
        console.error(err);
      }
    };
    
    if (user) {
      fetchAlertas();
      const interval = setInterval(fetchAlertas, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ============================================
  // Context - Carrito
  // ============================================
  const { getCartCount } = useCart();

  // ============================================
  // Datos - Definiciones estáticas
  // ============================================

  // Elementos del menú de navegación
  const navItems = [
    { path: '/', label: 'Tienda', icon: 'shop' },
    { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { path: '/nueva-venta', label: 'Nueva Venta', icon: 'cart', primary: true },
    { path: '/productos', label: 'Productos', icon: 'box' },
    { path: '/movimientos', label: 'Movimientos', icon: 'arrow-left-right' },
    { path: '/caja', label: 'Caja', icon: 'cash-coin' },
    { path: '/proveedores', label: 'Proveedores', icon: 'truck' },
    { path: '/clientes', label: 'Clientes', icon: 'people' }
  ];

  // Elementos de administrador
  const adminItems = [
    { path: '/ppconfig', label: 'Valores PP', icon: 'phone' },
    { path: '/usuarios', label: 'Usuarios', icon: 'person-gear' }
  ];

  // ============================================
  // Render - Renderizado del componente
  // ============================================

  return (
    <nav className="glass-navbar navbar navbar-expand-lg">
      <div className="container-fluid">
        {/* Logo/Nombre de la tienda */}
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-shop me-2"></i>
          {nombreTienda}
        </Link>

        {/* Botón hamburguesa para móvil */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú de navegación */}
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Items del menú - visibles si está logueado o es la tienda */}
            {navItems.map(item => (
              <li className="nav-item" key={item.path}>
                <Link
                  className={`nav-link ${location.pathname === item.path ? 'active fw-bold' : ''} ${item.primary ? 'btn btn-success btn-sm ms-2' : ''}`}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                >
                  <i className={`bi bi-${item.icon}${item.primary ? '' : '-fill'} me-1`}></i>
                  {item.label}
                  {item.path === '/nueva-venta' && getCartCount() > 0 && (
                    <span className="badge bg-danger ms-1">{getCartCount()}</span>
                  )}
                </Link>
              </li>
            ))}

            {/* Items de administrador */}
            {user?.rol === 'admin' && adminItems.map(item => (
              <li className="nav-item" key={item.path}>
                <Link
                  className={`nav-link ${location.pathname === item.path ? 'active fw-bold' : ''}`}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                >
                  <i className={`bi bi-${item.icon}-fill me-1`}></i>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Controls de usuario */}
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="glass-badge d-none d-md-inline">
                  <i className="bi bi-currency-dollar me-1"></i>
                  USD: {Number(cotizacionDolar).toLocaleString('es-AR')} ARS
                </span>
                {alertasCount > 0 && (
                  <Link
                    to="/alertas"
                    className="btn btn-outline-danger btn-sm position-relative"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="bi bi-bell-fill"></i>
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {alertasCount}
                    </span>
                  </Link>
                )}
                <span className="text-white d-none d-md-inline">
                  <i className="bi bi-person-circle me-1"></i>
                  {user.nombre || user.username}
                </span>
                <button
                  className="glass-btn btn btn-sm"
                  onClick={() => { logout(); setMenuOpen(false); }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  <span className="d-none d-xl-inline">Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <button
                className="btn btn-success btn-sm"
                onClick={() => { navigate('/login'); setMenuOpen(false); }}
              >
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
