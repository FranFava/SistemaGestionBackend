import { createContext, useContext, useState, useEffect } from 'react';
import { cajaService } from '../services/api';

const DollarContext = createContext();

export const useDollar = () => {
  const context = useContext(DollarContext);
  if (!context) {
    throw new Error('useDollar debe usarse dentro de DollarProvider');
  }
  return context;
};

export const DollarProvider = ({ children }) => {
  // null indica que no se pudo obtener la cotización
  // Los componentes deben verificar antes de usar en cálculos
  const [cotizacionDolar, setCotizacionDolar] = useState(() => {
    const saved = localStorage.getItem('cotizacionDolar');
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCotizacion = async () => {
    // Solo fetch si hay token guardado - no buscar cotización si no está logueado
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await cajaService.getCotizacion();
      const data = response.data?.data || response.data;
      if (data && data.cotizacionDolar && Number(data.cotizacionDolar) > 0) {
        const newValue = Number(data.cotizacionDolar);
        setCotizacionDolar(newValue);
        setError(null);
        localStorage.setItem('cotizacionDolar', newValue.toString());
      } else {
        setError('Sin datos de cotización');
      }
    } catch (err) {
      // Silenciar errores - el valor null indica que no hay cotización
      setError('No se pudo obtener cotización');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizacion();
  }, []);

  const updateCotizacion = async (nuevoValor) => {
    try {
      await cajaService.updateCotizacion(nuevoValor);
      setCotizacionDolar(nuevoValor);
      localStorage.setItem('cotizacionDolar', nuevoValor.toString());
      return true;
    } catch (err) {
      throw err;
    }
  };

  return (
    <DollarContext.Provider value={{ 
      cotizacionDolar, 
      updateCotizacion, 
      loading, 
      error,
      hasCotizacion: cotizacionDolar !== null,
      refreshCotizacion: fetchCotizacion 
    }}>
      {children}
    </DollarContext.Provider>
  );
};
