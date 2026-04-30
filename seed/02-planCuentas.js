const PlanCuenta = require('../models/PlanCuenta');

const cuentasBasicas = [
  { codigo: '1.0.0.0', nombre: 'ACTIVO', tipo: 'activo', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '1.1.0.0', nombre: 'DISPONIBLE', tipo: 'activo', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '1.1.1.0', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true, padre: null },
  { codigo: '1.1.2.0', nombre: 'Banco Galicia', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.1.3.0', nombre: 'Banco Nación', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.2.0.0', nombre: 'CRÉDITOS', tipo: 'activo', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '1.2.1.0', nombre: 'Clientes', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.2.2.0', nombre: 'Proveedores', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.2.3.0', nombre: 'Tarjetas', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.3.0.0', nombre: 'BIENES DE USO', tipo: 'activo', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '1.3.1.0', nombre: 'Equipos', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.3.2.0', nombre: 'Muebles y Útiles', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '1.3.3.0', nombre: 'Vehículos', tipo: 'activo', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '2.0.0.0', nombre: 'PASIVO', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '2.1.0.0', nombre: 'DEUDAS', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '2.1.1.0', nombre: 'Proveedores', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '2.1.2.0', nombre: 'Acreedores', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '2.2.0.0', nombre: 'RESULTADOS', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '2.2.1.0', nombre: 'Descuentos Obtenidos', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '3.0.0.0', nombre: 'PATRIMONIO', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '3.1.0.0', nombre: 'CAPITAL', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '3.1.1.0', nombre: 'Capital Social', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '3.2.0.0', nombre: 'RESULTADOS', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '3.2.1.0', nombre: 'Resultados Acumulados', tipo: 'patrimonio', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '4.0.0.0', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '4.1.0.0', nombre: 'VENTAS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '4.1.1.0', nombre: 'Venta Productos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '4.1.2.0', nombre: 'Venta Servicios', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '4.2.0.0', nombre: 'OTROS INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1, permiteMovimientos: false },
  { codigo: '4.2.1.0', nombre: 'Intereses Ganados', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2, permiteMovimientos: true },
  { codigo: '5.0.0.0', nombre: 'EROGACIONES', tipo: 'gasto', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '5.1.0.0', nombre: 'COSTO DE MERCADOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '5.1.1.0', nombre: 'Costo Mercancías Vendidas', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '5.2.0.0', nombre: 'GASTOS OPERATIVOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '5.2.1.0', nombre: 'Sueldos', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '5.2.2.0', nombre: 'Alquileres', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '5.2.3.0', nombre: 'Servicios', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '5.3.0.0', nombre: 'IMPUESTOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1, permiteMovimientos: false },
  { codigo: '5.3.1.0', nombre: 'IVA Débito', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true },
  { codigo: '5.3.2.0', nombre: 'Ingresos Brutos', tipo: 'gasto', naturaleza: 'deudora', nivel: 2, permiteMovimientos: true }
];

const seedPlanCuentas = async (empresaId) => {
  try {
    await PlanCuenta.deleteMany({ empresa: empresaId });
    
    const cuentasConEmpresa = cuentasBasicas.map(c => ({ ...c, empresa: empresaId }));
    const resultado = await PlanCuenta.insertMany(cuentasConEmpresa);
    
    console.log(`✅ ${resultado.length} cuentas contables creadas para empresa ${empresaId}`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al seed plan de cuentas:', error.message);
  }
};

module.exports = { cuentasBasicas, seedPlanCuentas };