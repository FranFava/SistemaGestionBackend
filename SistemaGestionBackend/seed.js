require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const adminExists = await Usuario.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('Usuario admin ya existe');
    } else {
      const admin = new Usuario({
        username: 'admin',
        password: 'admin123',
        nombre: 'Administrador',
        rol: 'admin',
        activo: true
      });
      await admin.save();
      console.log('Usuario admin creado: admin / admin123');
    }

    const vendedorExists = await Usuario.findOne({ username: 'vendedor' });
    if (vendedorExists) {
      console.log('Usuario vendedor ya existe');
    } else {
      const vendedor = new Usuario({
        username: 'vendedor',
        password: 'vendedor123',
        nombre: 'Vendedor',
        rol: 'vendedor',
        activo: true
      });
      await vendedor.save();
      console.log('Usuario vendedor creado: vendedor / vendedor123');
    }

    console.log('\nSeed completado!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
