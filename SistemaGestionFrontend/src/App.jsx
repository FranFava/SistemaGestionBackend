import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DollarProvider } from './context/DollarContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Movimientos from './pages/Movimientos';
import Proveedores from './pages/Proveedores';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import PPConfig from './pages/PPConfig';
import Caja from './pages/Caja';
import Alertas from './pages/Alertas';
import NuevaVenta from './pages/NuevaVenta';

function App() {
  return (
    <DollarProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="productos" element={<Productos />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="ppconfig" element={<PPConfig />} />
            <Route path="caja" element={<Caja />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="nueva-venta" element={<NuevaVenta />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DollarProvider>
  );
}

export default App;
