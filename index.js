require('dotenv').config();
const express = require('express');
const cors = require('cors');

process.on('uncaughtException', (err) => {
  console.error('═══════════════════════════════════════════');
  console.error('❌ EXCEPTION NO CAPTURADA');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('═══════════════════════════════════════════');
  console.log('El servidor CONTINUA funcionando...');
});

process.on('unhandledRejection', (reason) => {
  console.error('═══════════════════════════════════════════');
  console.error('❌ PROMES A RECHAZADA NO MANEJADA');
  console.error('Razon:', reason);
  console.error('═══════════════════════════════════════════');
  console.log('El servidor CONTINUA funcionando...');
});

const isDev = process.env.NODE_ENV !== 'production';

console.log('═══════════════════════════════════════════');
console.log('🚀 SISTEMA DE GESTION DE STOCK - BACKEND');
console.log('Modo:', isDev ? 'DESARROLLO' : 'PRODUCCION');
console.log('═══════════════════════════════════════════');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  try {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    next();
  } catch (err) {
    console.error('Error en middleware:', err.message);
    next(err);
  }
});

const auth = require('./middleware/auth');

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime(),
    message: 'Backend funcionando correctamente'
  });
});

const errorHandler = (err, req, res, next) => {
  console.error('═══════════════════════════════════════════');
  console.error('ERROR:', req.method, req.originalUrl);
  console.error('Mensaje:', err.message);
  if (isDev) console.error('Stack:', err.stack);
  console.error('═══════════════════════════════════════════');
  
  res.status(err.statusCode || 500).json({ 
    success: false, 
    message: err.message || 'Error interno del servidor'
  });
};

const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const movimientoRoutes = require('./routes/movimientos');
const proveedorRoutes = require('./routes/proveedores');
const clienteRoutes = require('./routes/clientes');
const usuarioRoutes = require('./routes/usuarios');
const cajaRoutes = require('./routes/caja');
const ppConfigRoutes = require('./routes/ppconfig');
const configRoutes = require('./routes/config');
const alertaRoutes = require('./routes/alertas');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/ppconfig', ppConfigRoutes);
app.use('/api/config', configRoutes);
app.use('/api/alertas', alertaRoutes);

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Sistema de Gestion de Stock',
    estado: 'En linea',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use(errorHandler);

const connectDB = require('./config/database');
connectDB();

const startServer = () => {
  const PORT = process.env.PORT || 5000;
  
  try {
    const server = app.listen(PORT, () => {
      console.log('===========================================');
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
      console.log('===========================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Puerto ${PORT} en uso, intentando ${PORT + 1}...`);
        process.env.PORT = PORT + 1;
        startServer();
      } else {
        console.error('Error del servidor:', err.message);
      }
    });
  } catch (err) {
    console.error('Error al iniciar servidor:', err.message);
    setTimeout(startServer, 3000);
  }
};

startServer();

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nCerrando servidor...');
  process.exit(0);
});

console.log('Seguridad activa contra crashes');
