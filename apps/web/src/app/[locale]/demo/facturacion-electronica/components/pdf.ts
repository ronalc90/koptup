// PDF generados en el navegador con jsPDF: representación gráfica del documento (con su QR real)
// y libros fiscales. Todos llevan la marca visible de documento de ejemplo.

import type { BillingDoc, Issuer } from './data';
import { docTotals } from './docs';
import { formatCOP, formatNit, TAX_CATEGORIES, TAX_RATE, type TaxCategory } from './fiscal';
import { encodeQr, qrRuns } from './qr';

export interface DocPdfLabels {
  title: string;
  number: string;
  issued: string;
  due: string;
  payment: string;
  paymentValue: string;
  issuerExtra: string;
  buyer: string;
  idLabel: string;
  sample: string;
  watermark: string;
  reference?: string;
  concept?: string;
  note?: string;
  cols: [string, string, string, string, string, string];
  taxLabel: Record<TaxCategory, string>;
  subtotal: string;
  ivaTotal: string;
  total: string;
  retTitle: string;
  retFuente: string;
  retIva: string;
  retIca: string;
  netEstimate: string;
  retNote: string;
  resolution?: string;
  cufeLabel: string;
  qrCaption: string;
  footer: string;
  date: (iso: string) => string;
}

async function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

export async function makeDocPdf(doc: BillingDoc, issuer: Issuer, qrPayload: string, L: DocPdfLabels): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 16;
  const right = 200;
  const width = right - left;
  const t = docTotals(doc);
  let y = 14;

  const ensure = (h: number) => {
    if (y + h > 262) {
      pdf.addPage();
      y = 18;
    }
  };

  // Marca de agua.
  pdf.setTextColor(232, 232, 232);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(54);
  pdf.text(L.watermark, 108, 150, { angle: 30, align: 'center' });

  pdf.setFillColor(5, 150, 105);
  pdf.rect(0, 0, 216, 5, 'F');

  // Emisor (con logo si el visitante lo subió).
  let textLeft = left;
  if (issuer.logo) {
    try {
      const { w, h } = await imageSize(issuer.logo);
      const maxW = 30;
      const maxH = 18;
      const scale = Math.min(maxW / w, maxH / h);
      const fmt = issuer.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(issuer.logo, fmt, left, y - 3, w * scale, h * scale);
      textLeft = left + w * scale + 4;
    } catch {
      textLeft = left;
    }
  }
  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(issuer.name, textLeft, y + 1);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text(`NIT ${formatNit(issuer.nit, issuer.dv)} · ${L.issuerExtra}`, textLeft, y + 6);
  pdf.text(`${issuer.address} · ${issuer.city}`, textLeft, y + 10);
  pdf.text(`${issuer.email} · ${issuer.phone}`, textLeft, y + 14);

  // Caja del documento.
  pdf.setDrawColor(5, 150, 105);
  pdf.roundedRect(130, y - 4, 70, 30, 2, 2);
  pdf.setTextColor(6, 95, 70);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text(pdf.splitTextToSize(L.title, 64), 133, y + 1);
  pdf.setFontSize(12);
  pdf.text(`${L.number} ${doc.id}`, 133, y + 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(55, 65, 81);
  pdf.text(`${L.issued}: ${L.date(doc.issueDate)} ${doc.issueTime.slice(0, 8)}`, 133, y + 17);
  if (doc.dueDate) pdf.text(`${L.due}: ${L.date(doc.dueDate)}`, 133, y + 21);
  pdf.text(`${L.payment}: ${L.paymentValue}`, 133, doc.dueDate ? y + 25 : y + 21);
  y += 32;

  pdf.setTextColor(185, 28, 28);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  const sample = pdf.splitTextToSize(L.sample, width);
  pdf.text(sample, left, y);
  y += sample.length * 4 + 3;

  // Adquirente.
  pdf.setDrawColor(209, 213, 219);
  pdf.line(left, y, right, y);
  y += 5;
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text(L.buyer.toUpperCase(), left, y);
  y += 5;
  pdf.setTextColor(17, 24, 39);
  pdf.setFontSize(10);
  pdf.text(doc.client.name, left, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(55, 65, 81);
  y += 4.5;
  pdf.text([L.idLabel, doc.client.city, doc.client.email].filter(Boolean).join(' · '), left, y);
  y += 5;
  if (L.reference) {
    pdf.text(L.reference, left, y);
    y += 4.5;
  }
  if (L.concept) {
    pdf.text(L.concept, left, y);
    y += 4.5;
  }
  if (L.note) {
    const n = pdf.splitTextToSize(L.note, width);
    pdf.text(n, left, y);
    y += n.length * 4.5;
  }
  y += 2;

  // Líneas.
  const colX = [left, left + 8, left + 104, left + 120, left + 150, right];
  const head = () => {
    pdf.setFillColor(243, 244, 246);
    pdf.rect(left, y - 4, width, 6.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(55, 65, 81);
    pdf.text(L.cols[0], colX[0] + 1, y);
    pdf.text(L.cols[1], colX[1], y);
    pdf.text(L.cols[2], colX[2] + 12, y, { align: 'right' });
    pdf.text(L.cols[3], colX[3] + 28, y, { align: 'right' });
    pdf.text(L.cols[4], colX[4] + 10, y, { align: 'right' });
    pdf.text(L.cols[5], colX[5] - 1, y, { align: 'right' });
    y += 6;
  };
  head();
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(17, 24, 39);
  doc.lines.forEach((l, i) => {
    const desc = pdf.splitTextToSize(l.description, 92);
    ensure(desc.length * 4 + 2);
    pdf.setFontSize(8.5);
    pdf.text(String(i + 1), colX[0] + 1, y);
    pdf.text(desc, colX[1], y);
    pdf.text(String(l.qty), colX[2] + 12, y, { align: 'right' });
    pdf.text(formatCOP(l.unitPrice), colX[3] + 28, y, { align: 'right' });
    pdf.text(l.tax === 'excluido' ? '—' : `${Math.round(TAX_RATE[l.tax] * 100)} %`, colX[4] + 10, y, { align: 'right' });
    pdf.text(formatCOP(Math.round(l.qty * l.unitPrice)), colX[5] - 1, y, { align: 'right' });
    y += desc.length * 4 + 2;
  });
  pdf.line(left, y - 1, right, y - 1);
  y += 4;

  // Totales y retenciones.
  ensure(60);
  const totalsTop = y;
  const row = (label: string, value: string, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(bold ? 10 : 8.5);
    pdf.text(label, 130, y);
    pdf.text(value, right - 1, y, { align: 'right' });
    y += bold ? 6 : 4.5;
  };
  pdf.setTextColor(17, 24, 39);
  row(L.subtotal, formatCOP(t.subtotal));
  for (const k of TAX_CATEGORIES) {
    if (t.byTax[k].base === 0) continue;
    row(L.taxLabel[k], formatCOP(t.byTax[k].base));
    if (t.byTax[k].tax > 0) row(`IVA ${Math.round(TAX_RATE[k] * 100)} %`, formatCOP(t.byTax[k].tax));
  }
  row(L.ivaTotal, formatCOP(t.iva));
  row(L.total, formatCOP(t.total), true);
  const totalsBottom = y;

  // Retenciones informativas a la izquierda.
  y = totalsTop;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text(L.retTitle, left, y);
  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  const retRow = (label: string, value: number) => {
    pdf.text(label, left, y);
    pdf.text(formatCOP(value), left + 90, y, { align: 'right' });
    y += 4.5;
  };
  retRow(L.retFuente, t.rete.fuente);
  retRow(L.retIva, t.rete.iva);
  retRow(L.retIca, t.rete.ica);
  pdf.setFont('helvetica', 'bold');
  retRow(L.netEstimate, t.netEstimate);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(107, 114, 128);
  const rn = pdf.splitTextToSize(L.retNote, 95);
  pdf.text(rn, left, y);
  y = Math.max(y + rn.length * 3.5, totalsBottom) + 4;

  // CUFE y QR.
  ensure(48);
  pdf.setDrawColor(209, 213, 219);
  pdf.line(left, y, right, y);
  y += 5;
  const qrTop = y;
  const modules = encodeQr(qrPayload);
  const qrSize = 36;
  const cell = qrSize / (modules.length + 8);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(right - qrSize, qrTop, qrSize, qrSize, 'F');
  pdf.setFillColor(0, 0, 0);
  for (const [x, yy, w] of qrRuns(modules)) {
    pdf.rect(right - qrSize + (x + 4) * cell, qrTop + (yy + 4) * cell, w * cell + 0.01, cell + 0.01, 'F');
  }
  pdf.setFontSize(7);
  pdf.setTextColor(107, 114, 128);
  pdf.text(L.qrCaption, right - qrSize / 2, qrTop + qrSize + 3.5, { align: 'center' });

  pdf.setTextColor(17, 24, 39);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(L.cufeLabel, left, y);
  y += 4;
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  const cufeLines = pdf.splitTextToSize(doc.cufe, width - qrSize - 8);
  pdf.text(cufeLines, left, y);
  y += cufeLines.length * 3.5 + 3;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(75, 85, 99);
  if (L.resolution) {
    const res = pdf.splitTextToSize(L.resolution, width - qrSize - 8);
    pdf.text(res, left, y);
    y += res.length * 3.5 + 2;
  }
  const foot = pdf.splitTextToSize(L.footer, width - qrSize - 8);
  pdf.text(foot, left, y);

  return pdf.output('blob');
}

export interface BookPdf {
  title: string;
  subtitle: string;
  sample: string;
  head: string[];
  rows: string[][];
  align: ('l' | 'r')[];
  widths: number[];
  /** La última fila es de totales (negrita y fondo). */
  boldLast: boolean;
}

export async function makeBookPdf(b: BookPdf): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'landscape' });
  const left = 12;
  const right = 267;
  const width = right - left;
  const totalW = b.widths.reduce((a, w) => a + w, 0);
  const cols = b.widths.map((w) => (w / totalW) * width);
  let y = 14;

  pdf.setFillColor(5, 150, 105);
  pdf.rect(0, 0, 280, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(17, 24, 39);
  pdf.text(b.title, left, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.text(b.subtitle, left, (y += 5));
  pdf.setTextColor(185, 28, 28);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(b.sample, left, (y += 5));
  y += 7;

  const drawRow = (cells: string[], bold: boolean, fill: boolean) => {
    const wrapped = cells.map((c, i) => pdf.splitTextToSize(c, cols[i] - 2) as string[]);
    const h = Math.max(...wrapped.map((w) => w.length)) * 3.6 + 2;
    if (y + h > 200) {
      pdf.addPage();
      y = 16;
    }
    if (fill) {
      pdf.setFillColor(243, 244, 246);
      pdf.rect(left, y - 3.6, width, h, 'F');
    }
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(17, 24, 39);
    let x = left;
    wrapped.forEach((w, i) => {
      if (b.align[i] === 'r') pdf.text(w, x + cols[i] - 1, y, { align: 'right' });
      else pdf.text(w, x + 1, y);
      x += cols[i];
    });
    y += h;
  };
  drawRow(b.head, true, true);
  b.rows.forEach((r, i) => {
    const last = b.boldLast && i === b.rows.length - 1;
    drawRow(r, last, last);
  });
  return pdf.output('blob');
}
