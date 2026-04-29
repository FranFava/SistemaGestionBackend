# Sistema Francisco - Deployment Guide

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-string
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Deploy en Render

### 1. Backend
1. Create account en [render.com](https://render.com)
2. New Web Service
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `NODE_ENV=production`
5. Add Environment Variables:
   - `MONGODB_URI` (from MongoDB Atlas)
   - `JWT_SECRET` (generate secure random string)
   - `PORT` = 5000
   - `NODE_ENV` = production

### 2. Frontend (Vercel)
1. Create account en [vercel.com](https://vercel.com)
2. New Project
3. Import from GitHub
4. Configure:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL` = https://your-backend.onrender.com

## API Documentation

Once deployed, access:
- Swagger UI: `https://your-backend.onrender.com/api-docs`
- JSON Schema: `https://your-backend.onrender.com/api-docs.json`

## Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `POST /api/auth/validate` - Validate token

### Productos
- `GET /api/productos` - List all
- `GET /api/productos/:id` - Get one
- `POST /api/productos` - Create
- `PUT /api/productos/:id` - Update
- `DELETE /api/productos/:id` - Soft delete
- `GET /api/productos/check-sku/:sku` - Check SKU

### Movimientos
- `GET /api/movimientos` - List all
- `GET /api/movimientos/producto/:id` - By product
- `POST /api/movimientos` - Create

### Caja
- `GET /api/caja` - List all
- `GET /api/caja/saldos` - Get balances
- `POST /api/caja` - Create

### Proveedores
- `GET /api/proveedores` - List all
- `POST /api/proveedores` - Create
- `PUT /api/proveedores/:id` - Update
- `DELETE /api/proveedores/:id` - Soft delete

### Clientes
- `GET /api/clientes` - List all
- `POST /api/clientes` - Create
- `PUT /api/clientes/:id` - Update
- `DELETE /api/clientes/:id` - Soft delete

### Usuarios
- `GET /api/usuarios` - List all (admin only)
- `POST /api/usuarios` - Create (admin only)
- `PUT /api/usuarios/:id` - Update
- `DELETE /api/usuarios/:id` - Soft delete

### Alertas
- `GET /api/alertas/activas` - Active alerts
- `GET /api/alertas/descartadas` - Dismissed alerts
- `PATCH /api/alertas/:id/descartar` - Dismiss
- `POST /api/alertas/generar` - Generate all

## Headers

All protected endpoints require:
```
x-auth-token: <jwt-token>
```

## Default Credentials

After seeding:
- Username: `admin`
- Password: `123456`