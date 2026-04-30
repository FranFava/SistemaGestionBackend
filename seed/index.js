const mongoose = require('mongoose');
const connectDB = require('../config/database');

const { seedEmpresas } = require('./01-empresas');
const { seedPlanCuentas } = require('./02-planCuentas');
const { seedClientes } = require('./03-clientes');
const { seedProveedores } = require('./04-proveedores');
const { seedProductos } = require('./05-productos');

const seedCompleto = async () => {
  try {
    await connectDB();
    console.log('🌱 Iniciando seed completo...');
    
    // 1. Empresas
    const empresas = await seedEmpresas();
    
    // 2. Plan de cuentas para cada empresa
    for (const empresa of empresas) {
      await seedPlanCuentas(empresa._id);
    }
    
    // 3. Clientes
    await seedClientes();
    
    // 4. Proveedores
    await seedProveedores();
    
    // 5. Productos
    await seedProductos();
    
    console.log('✅ Seed completo ejecutado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedCompleto();
}

module.exports = { seedCompleto };