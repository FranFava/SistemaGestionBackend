# AGENTS.md - Sistema Francisco Development Guide

## Project Overview

This is a full-stack MERN application for inventory/stock management:
- **Backend**: Express.js + MongoDB Atlas (Mongoose), CommonJS modules
- **Frontend**: React 19 + Vite, ES Modules

---

# Frontend Developer Skill Set

## 🎯 Objetivo
Construir una interfaz de usuario reactiva, accesible y de alto rendimiento basada en las especificaciones del AGENTS.md.

## 🛠️ Stack Técnico
- **Framework**: React 19 + Vite
- **Estilos**: CSS Custom (glassmorphism), Bootstrap 5
- **Estado**: React Context API
- **Tipado**: JSDoc para documentación

## 📜 Reglas de Oro (Core Skills)

### 1. Componentización
- Todo elemento repetible debe ser un componente atómico en `/src/components/`
- Pages en `/src/pages/`

### 2. Tipado con JSDoc
- Documentar funciones y componentes con JSDoc
- Definir tipos en comentarios JSDoc cuando sea necesario

### 3. Responsividad
- Diseño Mobile-first por defecto
- Usar clases de Bootstrap 5

### 4. Consumo de API
- Centralizar llamadas en `/src/services/api.js`
- Usar axios con interceptors

---

# Backend Developer Skill Set

## 🎯 Objetivo
Desarrollar una API robusta, escalable y segura que sirva como fuente de verdad para el Frontend.

## 🛠️ Stack Técnico
- **Entorno**: Node.js + Express
- **Base de Datos**: MongoDB Atlas (Mongoose)
- **Autenticación**: JWT
- **Documentación**: JSDoc

## 📜 Reglas de Oro (Core Skills)

### 1. Arquitectura Limpia
- Separación clara entre Rutas, Controladores y Modelos
- Rutas: `/routes/`
- Controladores: `/controllers/`
- Modelos: `/models/`

### 2. Validación de Datos
- Validación manual en controladores
- Usar try/catch para manejo de errores

### 3. Documentación con JSDoc
- JSDoc comments en todas las funciones de controladores y modelos
- Usar `@async`, `@function`, `@param`, `@returns`

### 4. Seguridad
- CORS configurado para todos los origins
- JWT en header `x-auth-token`
- Validación de entrada en cada endpoint

## 🔄 Flujo de Trabajo
1. Diseñar el esquema de la base de datos
2. Definir los Endpoints siguiendo principios RESTful
3. Implementar controladores con JSDoc

---

## Build Commands

### Backend (SistemaGestionBackend)
```bash
cd SistemaGestionBackend
npm run dev    # Development server with nodemon (port 5000)
npm start      # Production server
npm run seed   # Seed database with initial data
```

### Frontend (SistemaGestionFrontend)
```bash
cd SistemaGestionFrontend
npm run dev      # Development server (port 5173)
npm run build    # Production build to dist/
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Running Tests
No test framework configured yet. To add tests:
- Backend: Jest (`npm install --save-dev jest`)
- Frontend: Vitest with `npm test`

---

## Code Style Guidelines

### General Conventions
- **Indentation**: 2 spaces
- **Line endings**: LF (Unix-style)
- **Max line length**: 100 characters
- **Quotes**: Single quotes for strings

### Backend (CommonJS)

**Imports:**
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ModelName = require('../models/ModelName');
const controller = require('../controllers/controllerName');
```

**Naming:**
- Files: camelCase (`productoController.js`, `authMiddleware.js`)
- Models: PascalCase (`Producto.js`, `Usuario.js`)
- Database fields: snake_case (`fecha_creacion`, `stock_actual`)
- Variables/functions: camelCase

**Error Handling:**
```javascript
const controllerFn = async (req, res) => {
  try {
    const result = await Model.findOne({ field: value });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Controller Pattern:**
```javascript
/**
 * Get all items
 * @async
 * @function getItems
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getItems = async (req, res) => { ... };

module.exports = { getItems, getItemById, createItem, updateItem, deleteItem };
```

**JSDoc Examples:**
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

### Frontend (React/ES Modules)

**Imports (organized by grouping):**
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

**Naming:**
- Components: PascalCase (`ProductoDetalle.jsx`, `Pagination.jsx`)
- Contexts: PascalCase + Context (`AuthContext.jsx`)
- Utils: camelCase (`exportUtils.js`, `api.js`)
- CSS files: kebab-case (`glassmorphism.css`, `components.css`)

**Component Structure:**
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

---

## CSS Structure & Conventions

### File Structure Pattern
```
src/styles/
├── main.css                     # Global consolidated styles
└── sections/                   # Per-section CSS files (kebab-case)
    ├── dashboard.css
    ├── productos.css
    ├── nueva-venta.css
    ├── movimientos.css
    ├── caja.css
    ├── usuarios.css
    ├── clientes.css
    ├── proveedores.css
    ├── alertas.css
    ├── login.css
    ├── pp-config.css
    └── components.css          # Shared component styles
```

### Priority of Styles (order of importance, last wins):
1. **Bootstrap 5** (base for all components)
2. **`/src/styles/main.css`** (global overrides, glassmorphism, CSS variables)
3. **`/src/styles/sections/<page>.css`** (overrides only for that specific page)

### Rules
- **NO static inline styles allowed** (fixed values like `style={{ padding: '4px 8px' }}`)
- **Only dynamic inline styles allowed** (values that depend on React state)
- Static styles must go to the corresponding section file or to the global `main.css`
- All custom classes use **kebab-case**
- **Do NOT duplicate native Bootstrap 5 classes** (use Bootstrap utilities directly)
- Section CSS files are imported **in each page component**, not in `main.jsx`

### Import Pattern

**In `src/main.jsx`** (global imports only):
```javascript
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles/main.css'
```

**In each page component** (e.g., `src/pages/Productos.jsx`):
```javascript
// At the top with other imports
import '../styles/sections/productos.css';
```

**In shared components** (e.g., `src/components/ProductoDetalle.jsx`):
```javascript
import '../styles/sections/components.css';
```

### Custom Utility Classes (defined in main.css)
| Class | Purpose | Replaces |
|-------|---------|----------|
| `.btn-icon-sm` | Small icon buttons | `style={{ padding: '4px 8px' }}` |
| `.modal-backdrop-dark` | Dark modal backdrops | `style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}` |
| `.modal-body-scrollable` | Scrollable modal bodies | `style={{ maxHeight: '70vh', overflowY: 'auto' }}` |
| `.step-circle` | Step indicator circles | `style={{ width: '36px', height: '36px' }}` |
| `.dropdown-custom` | Custom dropdowns | `style={{ zIndex: 1000, maxHeight: '300px' }}` |
| `.sticky-top-custom` | Custom sticky positioning | `style={{ top: '70px' }}` |
| `.component-icon-lg` | Large icons (1.5rem) | `style={{ fontSize: '1.5rem' }}` |
| `.component-input-sm` | Small inputs (80px width) | `style={{ width: '80px' }}` |

### Migration Notes
- Old CSS files (`variables.css`, `colors.css`, `typography.css`, `utilities.css`, `components.css`, `glassmorphism.css`) have been **deleted**
- All their content is now consolidated in `main.css`
- Inline styles have been replaced with CSS classes in section files
- Bootstrap 5 is the **primary framework** - use its classes directly

---

## API Conventions

### REST Endpoints
- `GET /api/resource` - List all
- `GET /api/resource/:id` - Get one
- `POST /api/resource` - Create
- `PUT /api/resource/:id` - Update
- `DELETE /api/resource/:id` - Soft delete (set `activo: false`)

### Response Format
```javascript
// Success
res.json(data);
res.status(201).json(createdItem);

// Error
res.status(404).json({ message: 'Not found' });
res.status(500).json({ message: error.message });
```

### Authentication
- JWT token in `x-auth-token` header
- Token expiration: Configurable in config
- Routes protected via `middleware/auth.js`

---

## Database

### Mongoose Models
- All models have `activo: Boolean` for soft deletes
- Timestamps: `createdAt`, `updatedAt` (automatic)
- Use `find({ activo: true })` for queries

### Environment Variables

**Backend (.env):**
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=development
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000
```

---

## Important Files

### Backend
- `index.js` - Entry point, route registration, error handling
- `middleware/auth.js` - JWT authentication
- `config/database.js` - MongoDB connection
- `routes/*.js` - Route definitions
- `controllers/*.js` - Business logic with JSDoc
- `models/*.js` - Mongoose schemas with JSDoc

### Frontend
- `src/App.jsx` - Main router configuration
- `src/services/api.js` - Axios instance with interceptors
- `src/context/*.jsx` - React contexts (Auth, Dollar)
- `src/components/*.jsx` - Reusable components
- `src/pages/*.jsx` - Page components

---

## Adding New Features

### Backend
1. Create model in `models/`
2. Add JSDoc to model schema
3. Create controller in `controllers/` with JSDoc
4. Create route in `routes/`
5. Register route in `index.js`

### Frontend
1. Add API method in `src/services/api.js`
2. Create page in `src/pages/` or component in `src/components/`
3. Add route in `src/App.jsx`

---

## Linting

### Running ESLint
```bash
cd SistemaGestionFrontend
npm run lint
```

### ESLint Rules (eslint.config.js)
- `no-unused-vars`: Error except vars starting with uppercase or underscore
- React hooks: Recommended rules enforced
- React refresh: Hot reload compatible

---

## Common Issues

- **Port in use**: Backend auto-increments port if 5000 is busy
- **CORS**: Configured for all origins in backend
- **Database connection**: Ensure MongoDB Atlas is accessible
- **Proxy errors**: Frontend proxies `/api` to backend