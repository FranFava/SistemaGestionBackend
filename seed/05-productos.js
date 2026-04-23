const Producto = require('../models/Producto');

const productos = [
  { nombre: 'iPhone 15 Pro', sku: 'IP15PRO-256-BLK', marca: 'Apple', categoria: 'Smartphones', precioCosto: 800, precioVenta: 999, stockMinimo: 5, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '256GB', stock: 10 }, { color: 'Titanium', capacidad: '256GB', stock: 8 }] },
  { nombre: 'iPhone 15', sku: 'IP15-128-BLK', marca: 'Apple', categoria: 'Smartphones', precioCosto: 600, precioVenta: 799, stockMinimo: 5, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '128GB', stock: 15 }, { color: 'Blue', capacidad: '128GB', stock: 12 }] },
  { nombre: 'Samsung Galaxy S24 Ultra', sku: 'S24ULTRA-512-BLK', marca: 'Samsung', categoria: 'Smartphones', precioCosto: 750, precioVenta: 949, stockMinimo: 5, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '512GB', stock: 8 }, { color: 'Titanium', capacidad: '512GB', stock: 6 }] },
  { nombre: 'Samsung Galaxy A54', sku: 'A54-128-BLK', marca: 'Samsung', categoria: 'Smartphones', precioCosto: 250, precioVenta: 349, stockMinimo: 10, garantiaMeses: 6, variantes: [{ color: 'Black', capacidad: '128GB', stock: 20 }] },
  { nombre: 'MacBook Pro 14"', sku: 'MBP14-M3-512', marca: 'Apple', categoria: 'Laptops', precioCosto: 1500, precioVenta: 1899, stockMinimo: 3, garantiaMeses: 12, variantes: [{ color: 'Space Black', capacidad: '512GB', stock: 5 }] },
  { nombre: 'MacBook Air M3', sku: 'MBAIRM3-256-SLV', marca: 'Apple', categoria: 'Laptops', precioCosto: 900, precioVenta: 1199, stockMinimo: 5, garantiaMeses: 12, variantes: [{ color: 'Silver', capacidad: '256GB', stock: 8 }, { color: 'Midnight', capacidad: '256GB', stock: 6 }] },
  { nombre: 'Dell XPS 15', sku: 'DELLXPS15-512', marca: 'Dell', categoria: 'Laptops', precioCosto: 1100, precioVenta: 1449, stockMinimo: 3, garantiaMeses: 12, variantes: [{ color: 'Silver', capacidad: '512GB', stock: 4 }] },
  { nombre: 'Lenovo ThinkPad X1', sku: 'TPX1-512-BLK', marca: 'Lenovo', categoria: 'Laptops', precioCosto: 1000, precioVenta: 1299, stockMinimo: 3, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '512GB', stock: 5 }] },
  { nombre: 'AirPods Pro 2', sku: 'APP2GEN', marca: 'Apple', categoria: 'Auriculares', precioCosto: 180, precioVenta: 249, stockMinimo: 10, garantiaMeses: 12, variantes: [{ color: 'White', capacidad: 'USB-C', stock: 25 }] },
  { nombre: 'Sony WH-1000XM5', sku: 'SONYXM5-BLK', marca: 'Sony', categoria: 'Auriculares', precioCosto: 280, precioVenta: 399, stockMinimo: 8, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: 'Standard', stock: 12 }] },
  { nombre: 'Samsung Galaxy Watch 6', sku: 'SGW6-44-BLK', marca: 'Samsung', categoria: 'Wearables', precioCosto: 200, precioVenta: 299, stockMinimo: 10, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '44mm', stock: 15 }] },
  { nombre: 'Apple Watch Series 9', sku: 'AWS9-45-BLK', marca: 'Apple', categoria: 'Wearables', precioCosto: 280, precioVenta: 399, stockMinimo: 10, garantiaMeses: 12, variantes: [{ color: 'Midnight', capacidad: '45mm', stock: 12 }] },
  { nombre: 'iPad Pro 12.9"', sku: 'IPDP12-M4-256', marca: 'Apple', categoria: 'Tablets', precioCosto: 800, precioVenta: 1099, stockMinimo: 5, garantiaMeses: 12, variantes: [{ color: 'Space Black', capacidad: '256GB', stock: 8 }] },
  { nombre: 'Samsung Tab S9', sku: 'STAB9-256-BLK', marca: 'Samsung', categoria: 'Tablets', precioCosto: 600, precioVenta: 849, stockMinimo: 5, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '256GB', stock: 6 }] },
  { nombre: 'Nintendo Switch OLED', sku: 'NSW-OLED-WHT', marca: 'Nintendo', categoria: 'Gaming', precioCosto: 280, precioVenta: 399, stockMinimo: 8, garantiaMeses: 12, variantes: [{ color: 'White', capacidad: 'Standard', stock: 10 }] },
  { nombre: 'PlayStation 5', sku: 'PS5-DIGITAL', marca: 'Sony', categoria: 'Gaming', precioCosto: 400, precioVenta: 549, stockMinimo: 3, garantiaMeses: 12, variantes: [{ color: 'Digital', capacidad: 'Standard', stock: 4 }] },
  { nombre: 'Xbox Series X', sku: 'XBXS-1TB', marca: 'Microsoft', categoria: 'Gaming', precioCosto: 450, precioVenta: 599, stockMinimo: 3, garantiaMeses: 12, variantes: [{ color: 'Black', capacidad: '1TB', stock: 3 }] },
  { nombre: 'Logitech MX Master 3S', sku: 'LOGIMX3S-GRY', marca: 'Logitech', categoria: 'Periféricos', precioCosto: 80, precioVenta: 119, stockMinimo: 15, garantiaMeses: 24, variantes: [{ color: 'Grey', capacidad: 'Standard', stock: 30 }] },
  { nombre: 'Samsung Odyssey G9', sku: 'ODYSSEY-G9', marca: 'Samsung', categoria: 'Monitores', precioCosto: 900, precioVenta: 1299, stockMinimo: 2, garantiaMeses: 36, variantes: [{ color: 'Black', capacidad: '49"', stock: 3 }] },
  { nombre: 'LG UltraGear 27"', sku: 'LG27GP850', marca: 'LG', categoria: 'Monitores', precioCosto: 350, precioVenta: 499, stockMinimo: 5, garantiaMeses: 36, variantes: [{ color: 'Black', capacidad: '27"', stock: 8 }] }
];

const seedProductos = async () => {
  try {
    await Producto.deleteMany({});
    const resultado = await Producto.insertMany(productos);
    console.log(`✅ ${resultado.length} productos creados`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al seed productos:', error.message);
  }
};

module.exports = { productos, seedProductos };