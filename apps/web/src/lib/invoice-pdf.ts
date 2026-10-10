/**
 * PDF de una factura del portal, generado en el navegador con jsPDF a partir
 * de los datos que devuelve el backend (GET /api/invoices/:id/download, solo
 * para el cliente dueño o el equipo). Lleva la aclaración de que no es una
 * factura electrónica de venta ante la DIAN.
 */
import type { InvoiceView } from './portal';
import { formatDay, formatMoney } from './portal';

export interface InvoicePdfLabels {
  title: string;
  issuer: string;
  client: string;
  number: string;
  issued: string;
  due: string;
  paid: string;
  status: string;
  statusValue: string;
  project: string;
  order: string;
  description: string;
  qty: string;
  unit: string;
  amount: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string;
  terms: string;
  disclaimer: string;
}

export interface InvoicePdfData extends InvoiceView {
  fileName?: string;
  emisor?: { nombre: string };
}

/** Genera el PDF y lo descarga. Devuelve el nombre del archivo. */
export async function downloadInvoicePdf(inv: InvoicePdfData, labels: InvoicePdfLabels, locale: string): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 15;
  const right = 200;
  const money = (n: number) => formatMoney(n, inv.currency, locale);
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(inv.emisor?.nombre ?? 'KopTup', left, y);
  doc.setFontSize(14);
  doc.text(`${labels.title} ${inv.invoiceNumber}`, right, y, { align: 'right' });

  y += 10;
  doc.setFontSize(10);
  doc.text(labels.issuer, left, y);
  doc.text(labels.client, 110, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(inv.emisor?.nombre ?? 'KopTup', left, y + 5);
  const clientLines = [inv.client.name, inv.client.company, inv.client.email].filter(Boolean) as string[];
  clientLines.forEach((line, i) => doc.text(line, 110, y + 5 + i * 4.5, { maxWidth: right - 110 }));

  y += 8 + Math.max(1, clientLines.length) * 4.5 + 4;
  const meta: Array<[string, string]> = [
    [labels.number, inv.invoiceNumber],
    [labels.issued, formatDay(inv.issueDate, locale)],
    [labels.due, formatDay(inv.dueDate, locale)],
    [labels.status, labels.statusValue],
  ];
  if (inv.paidDate) meta.push([labels.paid, formatDay(inv.paidDate, locale)]);
  if (inv.projectName) meta.push([labels.project, inv.projectName]);
  if (inv.orderId) meta.push([labels.order, inv.orderId]);
  for (const [k, v] of meta) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v, left + 38, y, { maxWidth: right - left - 38 });
    y += 5;
  }

  // Tabla de ítems
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(left, y - 4.5, right - left, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(labels.description, left + 2, y);
  doc.text(labels.qty, 125, y, { align: 'right' });
  doc.text(labels.unit, 160, y, { align: 'right' });
  doc.text(labels.amount, right - 2, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 7;
  for (const item of inv.items) {
    const lines = doc.splitTextToSize(item.description, 95) as string[];
    if (y + lines.length * 4.5 > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, left + 2, y);
    doc.text(String(item.quantity), 125, y, { align: 'right' });
    doc.text(money(item.unitPrice), 160, y, { align: 'right' });
    doc.text(money(item.total), right - 2, y, { align: 'right' });
    y += Math.max(1, lines.length) * 4.5 + 2;
  }

  // Totales
  doc.setDrawColor(203, 213, 225);
  doc.line(120, y, right, y);
  y += 6;
  const taxPct = `${Math.round((inv.taxRate ?? 0) * 100)}%`;
  const totals: Array<[string, string, boolean]> = [
    [labels.subtotal, money(inv.subtotal), false],
    [`${labels.tax} (${taxPct})`, money(inv.taxAmount), false],
    [labels.total, money(inv.total), true],
  ];
  for (const [k, v, bold] of totals) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.text(k, 160, y, { align: 'right' });
    doc.text(v, right - 2, y, { align: 'right' });
    y += bold ? 7 : 5;
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (inv.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(labels.notes, left, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(inv.notes, right - left) as string[];
    doc.text(lines, left, y + 5);
    y += 5 + lines.length * 4.5;
  }
  if (inv.terms) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(labels.terms, left, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(inv.terms, right - left) as string[];
    doc.text(lines, left, y + 5);
    y += 5 + lines.length * 4.5;
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(doc.splitTextToSize(labels.disclaimer, right - left) as string[], left, 262);
  doc.setTextColor(0, 0, 0);

  const fileName = inv.fileName ?? `factura-${inv.invoiceNumber}.pdf`;
  doc.save(fileName);
  return fileName;
}
