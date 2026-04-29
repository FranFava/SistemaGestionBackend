/**
 * ============================================
 * Punto de Entrada - Main
 * Sistema Francisco - Estilo Apple/Mac
 * ============================================
 */

// React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// third-party - Bootstrap 5 + Icons
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Estilos del Sistema - Consolidado
import './styles/main.css'

// App
import App from './App.jsx'

// Mount
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)