const Cliente = require('../models/Cliente');

const clientes = [
  { nombre: 'Juan Pérez', documento: '20123456789', telefono: '+54 11 1234-5678', email: 'juan@example.com', direccion: 'Calle 123, CABA', condicionIVA: 'consumidor', activo: true },
  { nombre: 'María González', documento: '27123456784', telefono: '+54 11 2345-6789', email: 'maria@example.com', direccion: 'Av. Libertador 456, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Carlos López', documento: '20234567891', telefono: '+54 11 3456-7890', email: 'carlos@example.com', direccion: 'Calle 789, Provincia', condicionIVA: 'monotributista', activo: true },
  { nombre: 'Ana Martínez', documento: '27234567894', telefono: '+54 11 4567-8901', email: 'ana@example.com', direccion: 'Av. 9 de Julio 100, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Pedro Sánchez', documento: '20345678912', telefono: '+54 11 5678-9012', email: 'pedro@example.com', direccion: 'Calle 200,GBA', condicionIVA: 'consumidor', activo: true },
  { nombre: 'Laura Rodríguez', documento: '27345678915', telefono: '+54 11 6789-0123', email: 'laura@example.com', direccion: 'Av. Scalabrini 300, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Jorge Gómez', documento: '20456789123', telefono: '+54 11 7890-1234', email: 'jorge@example.com', direccion: 'Calle 400, Provincia', condicionIVA: 'consumidor', activo: true },
  { nombre: 'Sandra Fernández', documento: '27456789126', telefono: '+54 11 8901-2345', email: 'sandra@example.com', direccion: 'Av. Rivadavia 500, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Miguel Torres', documento: '20567891234', telefono: '+54 11 9012-3456', email: 'miguel@example.com', direccion: 'Calle 600, CABA', condicionIVA: 'monotributista', activo: true },
  { nombre: 'Carmen Ramírez', documento: '27567891237', telefono: '+54 11 0123-4567', email: 'carmen@example.com', direccion: 'Av. del Libertador 700, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Roberto Díaz', documento: '20678912345', telefono: '+54 11 1122-3344', email: 'roberto@example.com', direccion: 'Calle 800, GBA', condicionIVA: 'consumidor', activo: true },
  { nombre: 'Patricia Flores', documento: '27678912348', telefono: '+54 11 2233-4455', email: 'patricia@example.com', direccion: 'Av. Santa Fe 900, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Fernando Romero', documento: '20789123456', telefono: '+54 11 3344-5566', email: 'fernando@example.com', direccion: 'Calle 1000, Provincia', condicionIVA: 'consumidor', activo: true },
  { nombre: 'Lucía Herrera', documento: '27789123459', telefono: '+54 11 4455-6677', email: 'lucia@example.com', direccion: 'Av. Corrientes 1100, CABA', condicionIVA: 'responsable', activo: true },
  { nombre: 'Eduardo Núñez', documento: '20891234567', telefono: '+54 11 5566-7788', email: 'eduardo@example.com', direccion: 'Calle 1200, CABA', condicionIVA: 'monotributista', activo: true }
];

const seedClientes = async () => {
  try {
    await Cliente.deleteMany({});
    const resultado = await Cliente.insertMany(clientes);
    console.log(`✅ ${resultado.length} clientes creados`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al seed clientes:', error.message);
  }
};

module.exports = { clientes, seedClientes };