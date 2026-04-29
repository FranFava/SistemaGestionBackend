import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data, filename, columns) => {
  const ws = XLSX.utils.json_to_sheet(data.map(item => {
    const row = {};
    columns.forEach(col => {
      row[col.header] = col.accessor ? col.accessor(item) : item[col.key];
    });
    return row;
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, filename, columns, title) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title || filename, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

  const headers = columns.map(col => col.header);
  const body = data.map(item => columns.map(col => {
    const value = col.accessor ? col.accessor(item) : item[col.key];
    return value !== null && value !== undefined ? String(value) : '';
  }));

  doc.autoTable({
    head: [headers],
    body: body,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`${filename}.pdf`);
};

export const exportProductosExcel = (productos) => {
  const data = productos.map(p => ({
    SKU: p.sku,
    Nombre: p.nombre,
    Marca: p.marca || '',
    Categoría: p.categoria || '',
    'Stock Total': p.variantes.reduce((sum, v) => sum + v.stock, 0),
    'Stock Mínimo': p.stockMinimo,
    'Precio Costo': p.precioCosto,
    'Precio Venta': p.precioVenta,
    Garantía: `${p.garantiaMeses || 0} meses`
  }));
  exportToExcel(data, 'productos', Object.keys(data[0] || {}).map(k => ({ header: k, key: k })));
};

export const exportMovimientosExcel = (movimientos) => {
  const data = movimientos.map(m => ({
    Fecha: new Date(m.fecha).toLocaleString(),
    Tipo: m.tipo,
    Producto: m.producto?.nombre || '',
    Color: m.variante?.color || '',
    Capacidad: m.variante?.capacidad || '',
    Cantidad: m.cantidad,
    Motivo: m.motivo || '',
    Usuario: m.usuario?.nombre || ''
  }));
  exportToExcel(data, 'movimientos', Object.keys(data[0] || {}).map(k => ({ header: k, key: k })));
};

export const exportAlertasPDF = (alertas) => {
  const data = alertas.map(a => [
    a.sku,
    a.nombre,
    a.variante?.color || '-',
    a.variante?.capacidad || '-',
    a.variante?.stock || 0,
    a.stockMinimo
  ]);
  
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reporte de Alertas de Stock', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);

  doc.autoTable({
    head: [['SKU', 'Producto', 'Color', 'Capacidad', 'Stock Actual', 'Stock Mínimo']],
    body: data,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [192, 57, 43] }
  });

  doc.save('alertas_stock.pdf');
};