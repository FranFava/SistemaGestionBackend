const Proveedor = require('../models/Proveedor');

const proveedores = [
  { nombre: 'TechDistributor S.A.', documento: '30123456789', telefono: '+54 11 1111-2222', email: 'ventas@techdistributor.com', direccion: 'Av. Industrial 100, CABA', contacto: 'Carlos Manager', activo: true },
  { nombre: 'Global Electronics', documento: '30234567891', telefono: '+54 11 2222-3333', email: 'compras@globalelec.com', direccion: 'Zona Franca 200, Ezeiza', contacto: 'Ana Gerente', activo: true },
  { nombre: 'ImportParts Ltd.', documento: '30345678912', telefono: '+54 11 3333-4444', email: 'orders@importparts.com', direccion: 'Puerto 300, Dock Sud', contacto: 'John Smith', activo: true },
  { nombre: 'ServiTech Solutions', documento: '30456789123', telefono: '+54 11 4444-5555', email: 'ventas@servitech.com', direccion: 'Tech Park 400, GBA', contacto: 'María Tech', activo: true },
  { nombre: 'Componentes del Sur', documento: '30567891234', telefono: '+54 11 5555-6666', email: 'info@componentes.com', direccion: 'Av. Producción 500, Provincia', contacto: 'Pedro Comps', activo: true },
  { nombre: 'AsiaTrading Corp', documento: '30678912345', telefono: '+54 11 6666-7777', email: 'asia@asiatrading.com', direccion: 'Centro 600, CABA', contacto: 'Li Wei', activo: true },
  { nombre: 'EuroComponents', documento: '30789123456', telefono: '+54 11 7777-8888', email: 'eu@eurocomponents.com', direccion: 'Parque Industrial 700, GBA', contacto: 'Hans Muller', activo: true },
  { nombre: 'Latam Wholesale', documento: '30891234567', telefono: '+54 11 8888-9999', email: 'latam@wholesale.com', direccion: 'Distrito 800, CABA', contacto: 'Carlos Latam', activo: true },
  { nombre: 'Tecnosupply', documento: '30901234567', telefono: '+54 11 9999-0000', email: 'supply@tecnosupply.com', direccion: 'Logística 900, Provincia', contacto: 'Roberto Supply', activo: true },
  { nombre: 'MegaParts Inc', documento: '30111234567', telefono: '+54 11 1010-2020', email: 'mega@megaparts.com', direccion: 'Warehouse 1000, GBA', contacto: 'John Mega', activo: true }
];

const seedProveedores = async () => {
  try {
    await Proveedor.deleteMany({});
    const resultado = await Proveedor.insertMany(proveedores);
    console.log(`✅ ${resultado.length} proveedores creados`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al seed proveedores:', error.message);
  }
};

module.exports = { proveedores, seedProveedores };