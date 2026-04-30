  require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    await Usuario.deleteMany({});
    console.log('Usuarios eliminados');

    const password = 'francisco1306';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password original:', password);
    console.log('Password hasheado:', hashedPassword);

    const admin = new Usuario({
      username: 'francisco_fava',
      password: hashedPassword,
      nombre: 'Francisco Fava',
      rol: 'admin'
    });
    await admin.save();
    console.log('Admin guardado en BD');

    const verify = await Usuario.findOne({ username: 'francisco_fava' });
    console.log('Password en BD:', verify.password);
    
    const match = await bcrypt.compare(password, verify.password);
    console.log('Verificacion bcrypt.compare:', match);

    if (!match) {
      console.log('ERROR: La verificacion fallo');
    } else {
      console.log('EXITO: Todo funciona correctamente');
    }

    console.log('\nCredenciales:');
    console.log('  username: francisco_fava');
    console.log('  password: francisco1306');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

reset();
