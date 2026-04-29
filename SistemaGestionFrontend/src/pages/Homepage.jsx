/**
 * ============================================
 * Página Homepage
 * Tienda virtual con galería de productos
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { productoService } from '../services/api';
import ProductoCard from '../components/ProductoCard';
import '../styles/sections/homepage.css';

/**
 * Página principal de la tienda virtual
 * @returns {JSX.Element}
 */
const Homepage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');

  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      if (user) {
        res = await productoService.getAll({ activo: true });
      } else {
        res = await productoService.getPublicAll({ activo: true });
      }
      setProductos(res.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const filtered = productos.filter(p => {
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoria || p.categoria === categoria;
    return matchSearch && matchCat;
  });

  return (
    <div className="homepage">
      <div className="hero-section text-center py-5 mb-4">
        <h1 className="display-4 fw-bold text-white mb-3">
          <i className="bi bi-shop me-3"></i>
          Bienvenido a {localStorage.getItem('nombreTienda') || 'Stock Nextech'}
        </h1>
        <p className="lead text-white-50 mb-4">
          {user
            ? `¡Hola ${user.nombre || user.username}! Explora nuestros productos`
            : 'Inicia sesión para ver precios y comprar'}
        </p>

        {!user && (
          <div className="d-flex gap-3 justify-content-center">
            <button
              className="btn btn-success btn-lg px-4"
              onClick={() => navigate('/login')}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Iniciar Sesión
            </button>
          </div>
        )}
      </div>

      <div className="container-fluid px-4">
        <div className="row mb-4">
          <div className="col-md-8">
            <input
              type="text"
              className="glass-input form-control"
              placeholder="Buscar productos por nombre o SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select
              className="glass-input form-control"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-white-50">
            <i className="bi bi-inbox display-1"></i>
            <p className="mt-3">No se encontraron productos</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(producto => (
              <div key={producto._id} className="col-xl-3 col-lg-4 col-md-6">
                <ProductoCard producto={producto} onLoginClick={handleLoginClick} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
