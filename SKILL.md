# SKILL.md - Sistema Francisco Developer Skills

---

## Frontend Developer Skills

### 🎯 Objetivo
Construir una interfaz de usuario reactiva, accesible y de alto rendimiento basada en las especificaciones del AGENTS.md.

### 🛠️ Stack Técnico
- **Framework**: React 19 + Vite
- **Estilos**: CSS Custom (glassmorphism), Bootstrap 5
- **Estado**: React Context API
- **HTTP Client**: Axios con interceptors
- **Tipado**: JSDoc para documentación

### 📜 Reglas de Oro

#### 1. Componentización
- Todo elemento repetible debe ser un componente atómico en `/src/components/`
- Pages en `/src/pages/`
- Contexts en `/src/context/`
- Servicios en `/src/services/`

#### 2. Estructura de Componentes
```javascript
function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  const navigate = useNavigate();
  const { value } = useContext(Context);

  useEffect(() => {
    // effect logic
  }, []);

  const handler = async () => {
    try {
      // logic
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return <div>...</div>;
}

export default ComponentName;
```

#### 3. Imports (ordenados por grouping)
```javascript
// React/core
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Third-party
import axios from 'axios';
import Swal from 'sweetalert2';

// Components
import Layout from '../components/Layout';
import Navbar from '../components/Navbar';

// Context
import { useAuth } from '../context/AuthContext';
```

#### 4. Tipado con JSDoc
```javascript
/**
 * Componente de lista de productos
 * @description Muestra una lista paginada de productos con filtros
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.productos - Array de productos a mostrar
 * @param {Function} props.onSelect - Callback al seleccionar producto
 * @returns {JSX.Element} Componente de lista
 */
```

#### 5. Responsividad
- Diseño Mobile-first por defecto
- Usar clases de Bootstrap 5
- Breakpoints: mobile (<576px), tablet (≥576px), desktop (≥992px)

#### 6. Consumo de API
- Centralizar todas las llamadas en `/src/services/api.js`
- Usar axios con interceptors para autenticación
- Manejar errores centralizado

#### 7. Manejo de Errores
```javascript
const handler = async () => {
  try {
    const { data } = await api.get('/recurso');
    setData(data);
  } catch (error) {
    console.error('Error:', error.message);
    // Mostrar Toast o alert al usuario
  }
};
```

### 🔄 Flujo de Trabajo

1. **Diseñar UI** según especificación del AGENTS.md
2. **Crear componente** en `/src/components/` si es reutilizable
3. **Crear page** en `/src/pages/` si es una ruta
4. **Agregar API** en `/src/services/api.js`
5. **Agregar ruta** en `/src/App.jsx`
6. **Documentar** con JSDoc

### 🛠️ Herramientas Clave

#### Comandos
```bash
npm run dev      # Desarrollo (port 5173)
npm run build   # Producción
npm run lint    # ESLint
npm run preview # Vista previa
```

#### Rutas Principales
- `/dashboard` - Panel principal
- `/productos` - Gestión de productos
- `/movimientos` - Registro de movimientos
- `/caja` -Control de caja
- `/proveedores` - Gestión de proveedores
- `/clientes` - Gestión de clientes
- `/usuarios` - Gestión de usuarios (admin)
- `/alertas` - Stock bajo

#### Servicios
- `api.js` - Axios instance con interceptors
- JWT en header `x-auth-token`
- Retry automático en errores de conexión
- Redirect a login en 401

---

## Backend Developer Skills

### 🎯 Objetivo
Desarrollar una API robusta, escalable y segura que sirva como fuente de verdad para el Frontend.

### 🛠️ Stack Técnico
- **Entorno**: Node.js + Express
- **Base de Datos**: MongoDB Atlas (Mongoose)
- **Autenticación**: JWT
- **Documentación**: JSDoc

### 📜 Reglas de Oro

#### 1. Arquitectura Limpia
- **Rutas**: `/routes/` - Definición de endpoints
- **Controladores**: `/controllers/` - Lógica de negocio
- **Modelos**: `/models/` - Esquemas de MongoDB
- **Middleware**: `/middleware/` - Funciones intermedias

#### 2. Estructura de Controlador
```javascript
const ModelName = require('../models/ModelName');

/**
 * Obtiene todos los registros activos.
 * @async
 * @function getAll
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getAll = async (req, res) => {
  try {
    const items = await ModelName.find({ activo: true });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene un registro por ID.
 * @async
 * @function getById
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getById = async (req, res) => {
  try {
    const item = await ModelName.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo registro.
 * @async
 * @function create
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const create = async (req, res) => {
  try {
    const item = new ModelName(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un registro.
 * @async
 * @function update
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const update = async (req, res) => {
  try {
    const item = await ModelName.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un registro (soft delete).
 * @async
 * @function delete
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const deleteItem = async (req, res) => {
  try {
    const item = await ModelName.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAll, getById, create, update, deleteItem };
```

#### 3. Estructura de Modelo
```javascript
const mongoose = require('mongoose');

/**
 * Esquema de Nombre
 * @typedef {Object} NombreSchema
 * @property {string} campo1 - Descripción del campo
 * @property {number} campo2 - Otro campo
 */
const nombreSchema = new mongoose.Schema({
  campo1: { type: String, required: true },
  campo2: { type: Number, default: 0 },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Nombre', nombreSchema);
```

#### 4. Naming (Convenciones)
- **Archivos**: camelCase (`productoController.js`, `authMiddleware.js`)
- **Modelos**: PascalCase (`Producto.js`, `Usuario.js`)
- **Campos DB**: snake_case (`fecha_creacion`, `stock_actual`)
- **Variables**: camelCase
- **Funciones**: camelCase

#### 5. Validación de Datos
- Validación manual en controladores
- Verificar campos requeridos
- Sanitizar entradas del usuario

#### 6. Documentación con JSDoc
```javascript
/**
 * Obtiene todos los productos activos.
 * @async
 * @function getProductos
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @returns {Promise<void>}
 */

/**
 * Modelo de Producto para MongoDB
 * @typedef {Object} ProductoSchema
 * @property {string} nombre - Nombre del producto
 * @property {string} sku - SKU único
 * @property {number} stock_actual - Stock actual
 */
```

#### 7. Seguridad
- CORS configurado para todos los origins
- JWT en header `x-auth-token`
- Validación de autenticación en rutas protegidas
- Sanitización de entradas

### 🔄 Flujo de Trabajo

1. **Diseñar esquema** de base de datos
2. **Crear modelo** en `/models/` con JSDoc
3. **Crear controlador** en `/controllers/` con JSDoc
4. **Crear ruta** en `/routes/`
5. **Registrar ruta** en `index.js`
6. **Testear** endpoint

### 🛠️ Herramientas Clave

#### Comandos
```bash
npm run dev    # Desarrollo (nodemon, port 5000)
npm start     # Producción
npm run seed  # Poblar base de datos
```

#### Endpoints RESTful
- `GET /api/recurso` - Listar todos
- `GET /api/recurso/:id` - Obtener uno
- `POST /api/recurso` - Crear
- `PUT /api/recurso/:id` - Actualizar
- `DELETE /api/recurso/:id` - Eliminar (soft delete)

#### Respuestas
```javascript
// Éxito
res.json(data);
res.status(201).json(createdItem);

// Error
res.status(404).json({ message: 'No encontrado' });
res.status(500).json({ message: error.message });
```

#### Autenticación
- JWT token en header `x-auth-token`
- Middleware `auth.js` para rutas protegidas
- Token expiración configurable

---

## Convenciones Compartidas

### Errores Comunes
| Problema | Solución |
|----------|----------|
| Puerto en uso | Backend auto-incrementa puerto |
| CORS error | Configurar cors en backend |
| Conexión BD | Verificar MongoDB Atlas |
| Proxy error | Frontend proxea `/api` a backend |

### Build Commands
```bash
# Backend
cd SistemaGestionBackend
npm run dev    # Development server with nodemon
npm start      # Production server
npm run seed   # Seed database

# Frontend
cd SistemaGestionFrontend
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Linting
```bash
cd SistemaGestionFrontend
npm run lint
```

### Important Files

#### Backend
- `index.js` - Entry point
- `middleware/auth.js` - JWT authentication
- `config/database.js` - MongoDB connection

#### Frontend
- `src/App.jsx` - Router configuration
- `src/services/api.js` - Axios instance
- `src/context/*.jsx` - React contexts