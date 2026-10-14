/**
 * Descargas reales generadas en tu navegador: CSV (bitácora, clientes) y PDF
 * de la representación gráfica de ejemplo de una factura.
 */
import { VENDOR } from './data';
import { formatNit } from './format';
import type { Invoice, Tenant } from './types';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: string | number, sep: string): string {
  const s = String(v);
  return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV en UTF-8 con BOM (abre bien en Excel). En español usa punto y coma. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][], sep: ';' | ',') {
  const lines = [headers, ...rows].map((r) => r.map((c) => csvCell(c, sep)).join(sep));
  triggerDownload(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), filename);
}

export interface InvoicePdfLabels {
  title: string;
  notValid: string;
  seller: string;
  buyer: string;
  number: string;
  issued: string;
  period: string;
  method: string;
  description: string;
  amount: string;
  line: string;
  discount: string;
  subtotal: string;
  iva: string;
  total: string;
  cufe: string;
  cufeNote: string;
  footer: string;
}

export async function downloadInvoicePdf(
  inv: Invoice,
  buyer: Tenant,
  labels: InvoicePdfLabels,
  values: { issued: string; period: string; method: string; money: (n: number) => string },
  cufe: string,
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 15;
  const right = 200;
  let y = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(labels.title, left, y);
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text(labels.notValid, left, (y += 6), { maxWidth: right - left });
  doc.setTextColor(0, 0, 0);

  y += 12;
  doc.setFontSize(10);
  doc.text(labels.seller, left, y);
  doc.text(labels.buyer, 110, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  [VENDOR.name, `NIT ${formatNit(VENDOR.nit)}`, VENDOR.city, VENDOR.email].forEach((l, i) => doc.text(l, left, y + 5 + i * 4.5));
  [buyer.name, `NIT ${formatNit(buyer.nit)}`, buyer.city, buyer.email].forEach((l, i) => doc.text(l, 110, y + 5 + i * 4.5, { maxWidth: 90 }));

  y += 28;
  doc.text(`${labels.number}: ${inv.number}`, left, y);
  doc.text(`${labels.issued}: ${values.issued}`, 70, y);
  y += 5;
  doc.text(`${labels.period}: ${values.period}`, left, y);
  doc.text(`${labels.method}: ${values.method}`, 70, y);

  y += 9;
  doc.setFillColor(241, 245, 249);
  doc.rect(left, y - 4.5, right - left, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(labels.description, left + 2, y);
  doc.text(labels.amount, right - 2, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.text(labels.line, left + 2, y, { maxWidth: 140 });
  doc.text(values.money(inv.gross), right - 2, y, { align: 'right' });

  y += 12;
  const rows: [string, string, boolean?][] = [
    ...(inv.discount ? [[labels.discount, `-${values.money(inv.discount)}`] as [string, string]] : []),
    [labels.subtotal, values.money(inv.subtotal)],
    [labels.iva, values.money(inv.iva)],
    [labels.total, values.money(inv.total), true],
  ];
  rows.forEach(([label, value, bold]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, 150, y, { align: 'right' });
    doc.text(value, right - 2, y, { align: 'right' });
    y += 6;
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(labels.cufe, left, y);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(cufe, left, y + 5, { maxWidth: right - left });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(labels.cufeNote, left, y + 16, { maxWidth: right - left });
  doc.text(labels.footer, left, 262, { maxWidth: right - left });

  doc.save(`factura-ejemplo-${inv.number}.pdf`);
}
