/**
 * ============================================
 * Componente ProductoCard
 * Tarjeta de producto para la tienda virtual
 * ============================================
 */

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

/**
 * Tarjeta de producto para la galería
 * @param {{ producto: Object, onLoginClick: Function }} props
 * @returns {JSX.Element}
 */
const ProductoCard = ({ producto, onLoginClick }) => {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();

  const inCart = cart.find(item => item.productoId === producto._id);
  const stockTotal = producto.variantes?.reduce((sum, v) => sum + v.stock, 0) || 0;

  const handleAddToCart = () => {
    if (!user) {
      onLoginClick();
      return;
    }
    addToCart(producto);
  };

  return (
    <div className="glass-card card h-100 border-0">
      <div className="card-body d-flex flex-column">
        <div className="mb-2">
          <h5 className="card-title text-white mb-1">{producto.nombre}</h5>
          <small className="text-muted">{producto.sku}</small>
        </div>

        {producto.marca && (
          <span className="badge bg-info mb-2" style={{ width: 'fit-content' }}>
            {producto.marca}
          </span>
        )}

        {producto.descripcion && (
          <p className="card-text text-white-50 small flex-grow-1">
            {producto.descripcion.length > 100
              ? `${producto.descripcion.substring(0, 100)}...`
              : producto.descripcion}
          </p>
        )}

        <div className="mt-auto">
          {producto.categoria && (
            <span className="badge bg-secondary me-2">{producto.categoria}</span>
          )}
          {stockTotal > 0 ? (
            <span className="badge bg-success">En stock</span>
          ) : (
            <span className="badge bg-danger">Sin stock</span>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3">
          {user ? (
            <span className="text-success fw-bold fs-5">
              ${producto.precioVenta?.toLocaleString('es-AR') || 'Consultar'}
            </span>
          ) : (
            <span className="text-muted fst-italic">
              <i className="bi bi-lock-fill me-1"></i>
              Inicia sesión para ver precio
            </span>
          )}

          <button
            className="btn btn-sm btn-success"
            onClick={handleAddToCart}
            disabled={stockTotal === 0}
          >
            {!user ? (
              <>
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Login
              </>
            ) : inCart ? (
              <>
                <i className="bi bi-cart-check me-1"></i>
                En carrito
              </>
            ) : (
              <>
                <i className="bi bi-cart-plus me-1"></i>
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoCard;
