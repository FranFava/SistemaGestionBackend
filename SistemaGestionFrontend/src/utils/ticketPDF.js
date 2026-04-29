import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarTicketPDF = (ticket, empresa, cliente) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa?.nombre || 'NEXTTECH SOLUTIONS', pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(empresa?.direccion?.calle || 'Av. Santa Fe 1234, CABA', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`Tel: ${empresa?.contacto?.telefono || '11-4567-8900'}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CUIT: ${empresa?.cuil || '30-12345678-9'}`, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`IVA: ${empresa?.categoriaIVA || 'Responsable Inscripto'}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  const fecha = new Date().toLocaleString('es-AR');
  doc.text(`Fecha: ${fecha}`, margin, y);
  doc.text(`Ticket: ${ticket.numero}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(10);
  doc.text('Cant', margin, y);
  doc.text('Descripcion', margin + 15, y);
  doc.text('Precio', pageWidth - 50, y, { align: 'right' });
  doc.text('Importe', pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  const tableData = ticket.items.map(item => [
    item.cantidad.toString(),
    item.descripcion?.substring(0, 25) || item.productoId?.nombre?.substring(0, 25) || 'Producto',
    `$${(item.precioUnitario || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
    `$${((item.precioUnitario || 0) * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: y,
    head: [],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.text(`Subtotal:`, pageWidth - 50, y, { align: 'right' });
  doc.text(`$${ticket.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.text(`IVA (21%):`, pageWidth - 50, y, { align: 'right' });
  doc.text(`$${ticket.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, pageWidth - 50, y, { align: 'right' });
  doc.text(`$${ticket.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  if (ticket.garantia && ticket.garantia.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('GARANTÍA', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    ticket.garantia.forEach(g => {
      doc.text(`Producto: ${g.producto}`, margin, y);
      y += 5;
      doc.text(`- Vigencia: ${g.meses} meses`, margin, y);
      y += 5;
      doc.text(`- Vencimiento: ${new Date(g.vencimiento).toLocaleDateString('es-AR')}`, margin, y);
      y += 5;
      doc.text(`- Tipo: ${g.terminos}`, margin, y);
      y += 5;
      if (g.requiereTicket) {
        doc.text(`- Requiere: Ticket original`, margin, y);
        y += 5;
      }
      y += 3;
    });
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GRACIAS POR SU COMPRA!', pageWidth / 2, y + 10, { align: 'center' });
  if (empresa?.contacto?.web) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(empresa.contacto.web, pageWidth / 2, y + 17, { align: 'center' });
  }

  return doc;
};

export const guardarTicket = (ticket, empresa, cliente) => {
  const doc = generarTicketPDF(ticket, empresa, cliente);
  const nombre = `ticket_${ticket.numero}_${Date.now()}.pdf`;
  doc.save(nombre);
};

export const obtenerBlob = (ticket, empresa, cliente) => {
  const doc = generarTicketPDF(ticket, empresa, cliente);
  return doc.output('blob');
};