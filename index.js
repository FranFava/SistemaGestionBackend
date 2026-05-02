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

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión de Stock API',
      version: '1.0.0',
      description: 'API REST para el sistema de gestión de inventario y stock',
      contact: {
        name: 'API Support',
        email: 'support@sistema.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token in x-auth-token header'
        }
      },
      schemas: {
        Producto: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            nombre: { type: 'string' },
            sku: { type: 'string' },
            marca: { type: 'string' },
            categoria: { type: 'string' },
            descripcion: { type: 'string' },
            precioCosto: { type: 'number' },
            precioVenta: { type: 'number' },
            stockMinimo: { type: 'number' },
            garantiaMeses: { type: 'number' },
            variantes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  color: { type: 'string' },
                  capacidad: { type: 'string' },
                  stock: { type: 'number' }
                }
              }
            },
            activo: { type: 'boolean' }
          }
        },
        ProductoInput: {
          type: 'object',
          required: ['nombre', 'sku'],
          properties: {
            nombre: { type: 'string' },
            sku: { type: 'string' },
            marca: { type: 'string' },
            categoria: { type: 'string' },
            descripcion: { type: 'string' },
            precioCosto: { type: 'number' },
            precioVenta: { type: 'number' },
            stockMinimo: { type: 'number' },
            garantiaMeses: { type: 'number' },
            variantes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  color: { type: 'string' },
                  capacidad: { type: 'string' },
                  stock: { type: 'number' }
                }
              }
            }
          }
        },
        Movimiento: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tipo: { type: 'string', enum: ['entrada', 'salida', 'ajuste'] },
            producto: { type: 'string' },
            cantidad: { type: 'number' },
            precioUnitario: { type: 'number' },
            total: { type: 'number' },
            observaciones: { type: 'string' },
            variante: { type: 'object' },
            active: { type: 'boolean' }
          }
        },
        Usuario: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            nombre: { type: 'string' },
            rol: { type: 'string', enum: ['admin', 'usuario'] },
            activo: { type: 'boolean' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                nombre: { type: 'string' },
                rol: { type: 'string' }
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      { name: 'Autenticación', description: 'Endpoints de login y auth' },
      { name: 'Productos', description: 'Gestión de productos' },
      { name: 'Movimientos', description: 'Registro de movimientos' },
      { name: 'Caja', description: 'Control de caja' },
      { name: 'Proveedores', description: 'Gestión de proveedores' },
      { name: 'Clientes', description: 'Gestión de clientes' },
      { name: 'Usuarios', description: 'Gestión de usuarios' },
      { name: 'Alertas', description: 'Alertas de stock bajo' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sistema Francisco API Docs'
}));

app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

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
const empresaRoutes = require('./routes/empresas');
const planCuentaRoutes = require('./routes/planCuentas');
const cuentaCorrienteRoutes = require('./routes/cuentasCorrientes');
const comprobanteRoutes = require('./routes/comprobantes');
const ventaRoutes = require('./routes/ventas');
const tercerosRoutes = require('./routes/terceros');
const tiposCambioRoutes = require('./routes/tiposCambio');
const movimientoCtaRoutes = require('./routes/movimientosCta');
const prestamosRoutes = require('./routes/prestamos');
const categoriaRoutes = require('./routes/categorias');
const listaPrecioRoutes = require('./routes/listasPrecio');
const preciosProductoRoutes = require('./routes/preciosProducto');

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
app.use('/api/empresas', empresaRoutes);
app.use('/api/plan-cuentas', planCuentaRoutes);
app.use('/api/cuentas-corrientes', cuentaCorrienteRoutes);
app.use('/api/comprobantes', comprobanteRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/terceros', tercerosRoutes);
app.use('/api/tipos-cambio', tiposCambioRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/movimientos-cta', movimientoCtaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/listas-precio', listaPrecioRoutes);
app.use('/api/precios-producto', preciosProductoRoutes);

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

const crearUsuarioAdmin = async () => {
  try {
    const Usuario = require('./models/Usuario');
    const adminExiste = await Usuario.findOne({ username: 'admin' });
    
    if (!adminExiste) {
      const admin = new Usuario({
        username: 'admin',
        password: '123456',
        nombre: 'Administrador',
        rol: 'admin',
        activo: true
      });
      await admin.save();
      console.log('✅ Usuario admin creado: admin / 123456');
    } else {
      console.log('ℹ️ Usuario admin ya existe');
    }
  } catch (err) {
    console.error('❌ Error al crear usuario admin:', err.message);
  }
};

const iniciarBackend = async () => {
  await connectDB();
  await crearUsuarioAdmin();
  
  startServer();
};

iniciarBackend();

process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nCerrando servidor...');
  process.exit(0);
});

console.log('Seguridad activa contra crashes');
