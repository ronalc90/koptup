// Representación gráfica de ejemplo de la factura de un pedido de la demo,
// generada en el navegador con jsPDF. Lleva una marca visible de que NO es una
// factura electrónica válida: en la demo no se transmite nada a la DIAN.

import type { Order } from './data';
import { CITY_BY_ID, SELLER, formatNit } from './data';
import { formatPrice } from './pricing';

export interface InvoiceLabels {
  title: string;
  notValid: string;
  seller: string;
  buyer: string;
  document: string;
  address: string;
  order: string;
  date: string;
  payment: string;
  product: string;
  qty: string;
  unit: string;
  amount: string;
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  ivaIncluded: string;
  cufe: string;
  cufePending: string;
  footer: string;
}

export async function downloadInvoicePdf(
  order: Order,
  lines: Array<{ name: string; qty: number; unitPrice: number }>,
  labels: InvoiceLabels,
  paymentLabel: string,
  dateLabel: string,
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 15;
  const right = 200;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(labels.title, left, y);
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text(labels.notValid, left, (y += 6), { maxWidth: right - left });
  doc.setTextColor(0, 0, 0);

  y += 10;
  doc.setFontSize(10);
  doc.text(labels.seller, left, y);
  doc.text(labels.buyer, 110, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const city = CITY_BY_ID[order.cityId];
  const sellerLines = [SELLER.name, `NIT ${formatNit(SELLER.nit)}`, SELLER.address, SELLER.resolution];
  const buyerLines = [
    order.company || order.customer,
    `${labels.document}: ${order.docType ?? ''} ${order.docNumber ?? ''}`.trim(),
    `${labels.address}: ${order.address ?? ''}, ${city ? `${city.name}, ${city.department}` : ''}`,
    order.email ?? '',
  ];
  sellerLines.forEach((l, i) => doc.text(l, left, y + 5 + i * 4.5, { maxWidth: 90 }));
  buyerLines.forEach((l, i) => doc.text(l, 110, y + 5 + i * 4.5, { maxWidth: 90 }));

  y += 30;
  doc.text(`${labels.order}: ${order.id}`, left, y);
  doc.text(`${labels.date}: ${dateLabel}`, 80, y);
  doc.text(`${labels.payment}: ${paymentLabel}`, 140, y);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(left, y - 4.5, right - left, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(labels.product, left + 2, y);
  doc.text(labels.qty, 125, y, { align: 'right' });
  doc.text(labels.unit, 160, y, { align: 'right' });
  doc.text(labels.amount, right - 2, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  lines.forEach((l) => {
    y += 7;
    doc.text(l.name, left + 2, y, { maxWidth: 95 });
    doc.text(String(l.qty), 125, y, { align: 'right' });
    doc.text(formatPrice(l.unitPrice), 160, y, { align: 'right' });
    doc.text(formatPrice(l.unitPrice * l.qty), right - 2, y, { align: 'right' });
  });

  y += 10;
  const rows: Array<[string, string, boolean?]> = [
    [labels.subtotal, formatPrice(order.subtotal)],
    ...(order.discount ? [[labels.discount, `-${formatPrice(order.discount)}`] as [string, string]] : []),
    [labels.shipping, formatPrice(order.shipping)],
    [labels.total, formatPrice(order.total), true],
    [labels.ivaIncluded, formatPrice(order.ivaIncluded)],
  ];
  rows.forEach(([label, value, bold]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, 140, y, { align: 'right' });
    doc.text(value, right - 2, y, { align: 'right' });
    y += 6;
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(labels.cufe, left, y);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(order.cufe ?? labels.cufePending, left, y + 5, { maxWidth: right - left });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(labels.footer, left, 262, { maxWidth: right - left });

  doc.save(`factura-ejemplo-${order.id}.pdf`);
}
