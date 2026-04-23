const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../index');
const Empresa = require('../models/Empresa');
const PlanCuenta = require('../models/PlanCuenta');

describe('API Empresas', () => {
  let token;
  
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_sistema_gestion';
    await mongoose.connect(mongoUri);
  });
  
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    await Empresa.deleteMany({});
    await PlanCuenta.deleteMany({});
    
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: '123456' });
    
    if (adminResponse.body.token) {
      token = adminResponse.body.token;
    }
  });
  
  describe('GET /api/empresas', () => {
    it('debe retornar lista de empresas', async () => {
      await Empresa.create({
        nombre: 'Test Empresa',
        cuil: '30-12345678-9',
        iva: '30-12345678-9'
      });
      
      const res = await request(app)
        .get('/api/empresas')
        .set('x-auth-token', token);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    
    it('debe requerir autenticación', async () => {
      const res = await request(app).get('/api/empresas');
      expect(res.status).toBe(401);
    });
  });
  
  describe('POST /api/empresas', () => {
    it('debe crear una nueva empresa', async () => {
      const empresaData = {
        nombre: 'Nueva Empresa',
        cuil: '30-98765432-1',
        iva: '30-98765432-1',
        responsableIVA: 'responsable'
      };
      
      const res = await request(app)
        .post('/api/empresas')
        .set('x-auth-token', token)
        .send(empresaData);
      
      expect(res.status).toBe(201);
      expect(res.body.nombre).toBe('Nueva Empresa');
    });
    
    it('no debe permitir duplicar CUIT', async () => {
      await Empresa.create({
        nombre: 'Empresa Existente',
        cuil: '30-12345678-9',
        iva: '30-12345678-9'
      });
      
      const res = await request(app)
        .post('/api/empresas')
        .set('x-auth-token', token)
        .send({
          nombre: 'Otra Empresa',
          cuil: '30-12345678-9'
        });
      
      expect(res.status).toBe(400);
    });
  });
});

describe('API Plan de Cuentas', () => {
  let empresaId;
  let token;
  
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_sistema_gestion';
    await mongoose.connect(mongoUri);
  });
  
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    await Empresa.deleteMany({});
    await PlanCuenta.deleteMany({});
    
    const empresa = await Empresa.create({
      nombre: 'Test',
      cuil: '30-11111111-1',
      iva: '30-11111111-1'
    });
    empresaId = empresa._id;
    
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: '123456' });
    
    if (adminResponse.body.token) {
      token = adminResponse.body.token;
    }
  });
  
  describe('GET /api/plan-cuentas', () => {
    it('debe retornar cuentas contables', async () => {
      await PlanCuenta.create({
        codigo: '1.1.1.0',
        nombre: 'Caja',
        tipo: 'activo',
        naturaleza: 'deudora',
        nivel: 2,
        empresa: empresaId
      });
      
      const res = await request(app)
        .get('/api/plan-cuentas')
        .query({ empresa: empresaId })
        .set('x-auth-token', token);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
  
  describe('POST /api/plan-cuentas', () => {
    it('debe crear cuenta contable', async () => {
      const cuentaData = {
        codigo: '1.1.1.0',
        nombre: 'Caja',
        tipo: 'activo',
        naturaleza: 'deudora',
        nivel: 2,
        empresa: empresaId
      };
      
      const res = await request(app)
        .post('/api/plan-cuentas')
        .set('x-auth-token', token)
        .send(cuentaData);
      
      expect(res.status).toBe(201);
      expect(res.body.codigo).toBe('1.1.1.0');
    });
  });
});

describe('API Cuentas Corrientes', () => {
  let token;
  
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_sistema_gestion';
    await mongoose.connect(mongoUri);
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  describe('GET /api/cuentas-corrientes', () => {
    it('debe requerir autenticación', async () => {
      const res = await request(app).get('/api/cuentas-corrientes');
      expect(res.status).toBe(401);
    });
  });
});

describe('API Comprobantes', () => {
  let empresaId;
  let token;
  
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_sistema_gestion';
    await mongoose.connect(mongoUri);
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    const empresa = await Empresa.create({
      nombre: 'Test',
      cuil: '30-11111111-1',
      iva: '30-11111111-1'
    });
    empresaId = empresa._id;
  });
  
  describe('GET /api/comprobantes', () => {
    it('debe listar comprobantes', async () => {
      const res = await request(app)
        .get('/api/comprobantes')
        .query({ empresa: empresaId })
        .set('x-auth-token', token);
      
      expect(res.status).toBe(200);
    });
  });
});