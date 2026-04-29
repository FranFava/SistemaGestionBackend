import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

/**
 * Proveedor de contexto del carrito de compras
 * @param {{ children: React.ReactNode }} props - Props del componente
 * @returns {JSX.Element}
 */
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Agrega un producto al carrito
   * @param {Object} producto - Producto a agregar
   * @param {number} cantidad - Cantidad (default: 1)
   */
  const addToCart = (producto, cantidad = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productoId === producto._id);
      if (existing) {
        return prev.map(item =>
          item.productoId === producto._id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...prev, {
        productoId: producto._id,
        nombre: producto.nombre,
        sku: producto.sku,
        precioUnitario: producto.precioVenta || 0,
        cantidad,
        garantiaMeses: producto.garantiaMeses || 12
      }];
    });
  };

  /**
   * Elimina un item del carrito por índice
   * @param {number} index - Índice del item
   */
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Actualiza la cantidad de un item
   * @param {number} index - Índice del item
   * @param {number} cantidad - Nueva cantidad
   */
  const updateQuantity = (index, cantidad) => {
    setCart(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, cantidad: Math.max(1, cantidad) } : item
      )
    );
  };

  /**
   * Limpia todo el carrito
   */
  const clearCart = () => setCart([]);

  /**
   * Obtiene el total de items en el carrito
   * @returns {number}
   */
  const getCartCount = () => cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * Hook para acceder al contexto del carrito
 * @returns {Object}
 */
export const useCart = () => useContext(CartContext);
