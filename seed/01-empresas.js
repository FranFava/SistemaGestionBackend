const Empresa = require('../models/Empresa');

const empresas = [
  {
    nombre: 'NexTech Solutions',
    razonSocial: 'NexTech Solutions S.R.L.',
    nombreFantasia: 'NexTech',
    cuil: '30-12345678-9',
    iva: '30-12345678-9',
    direccion: {
      calle: 'Av. Santa Fe',
      numero: 1234,
      piso: '3',
      localidad: 'Buenos Aires',
      provincia: 'CABA',
      codigoPostal: '1425'
    },
    contacto: {
      telefono: '+54 11 4567-8900',
      email: 'info@nextech.com.ar',
      web: 'https://nextech.com.ar'
    },
    habilitaciones: {
      ini: 123456,
      puntoVenta: 1,
      facturaElectronica: true
    },
    responsableIVA: 'responsable',
    categoriaIVA: 'Responsable Inscripto',
    configuraciones: {
      monedaPrincipal: 'ARS',
      monedaSecundaria: 'USD',
      pieComprobante: 'Gracias por su compra en NexTech Solutions'
    },
    activa: true
  },
  {
    nombre: 'TecnoWorld',
    razonSocial: 'TecnoWorld S.A.',
    nombreFantasia: 'TecnoWorld',
    cuil: '33-98765432-1',
    iva: '33-98765432-1',
    direccion: {
      calle: 'Av. Corrientes',
      numero: 5678,
      localidad: 'Buenos Aires',
      provincia: 'CABA',
      codigoPostal: '1043'
    },
    contacto: {
      telefono: '+54 11 3210-9876',
      email: 'ventas@tecnoworld.com',
      web: 'https://tecnoworld.com'
    },
    habilitaciones: {
      ini: 654321,
      puntoVenta: 2,
      facturaElectronica: true
    },
    responsableIVA: 'responsable',
    categoriaIVA: 'Responsable Inscripto',
    configuraciones: {
      monedaPrincipal: 'ARS',
      monedaSecundaria: 'USD',
      pieComprobante: 'Gracias por su compra en TecnoWorld'
    },
    activa: true
  }
];

const seedEmpresas = async () => {
  try {
    await Empresa.deleteMany({});
    const resultado = await Empresa.insertMany(empresas);
    console.log(`✅ ${resultado.length} empresas creadas`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al seed empresas:', error.message);
  }
};

module.exports = { empresas, seedEmpresas };