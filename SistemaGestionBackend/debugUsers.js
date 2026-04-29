require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const usuarios = await Usuario.find({});
    console.log('Usuarios en BD:', JSON.stringify(usuarios, null, 2));

    if (usuarios.length > 0) {
      const user = usuarios[0];
      console.log('\nProbando password...');
      console.log('Password en BD:', user.password);
      console.log('Password tiene $2a$:', user.password.startsWith('$2a$'));
      
      const match = await bcrypt.compare('francisco1306', user.password);
      console.log('bcrypt.compare resultado:', match);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debug();
