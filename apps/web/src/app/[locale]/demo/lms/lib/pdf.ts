/**
 * PDF generados en el navegador con jsPDF: certificado con QR de verificación
 * y comprobante de pago. Ambos llevan la marca visible de documento de ejemplo.
 */
import { ACADEMY } from './catalog';
import { formatNit } from './engine';
import { encodeQr, qrRuns } from './qr';

export interface CertificatePdf {
  filename: string;
  heading: string;
  certifies: string;
  name: string;
  completed: string;
  course: string;
  details: string;
  code: string;
  instructor: string;
  instructorRole: string;
  director: string;
  directorRole: string;
  verifyCaption: string;
  verifyUrl: string;
  sample: string;
}

function drawQr(doc: import('jspdf').jsPDF, text: string, x: number, y: number, size: number) {
  const modules = encodeQr(text);
  const n = modules.length + 8;
  const cell = size / n;
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');
  doc.setFillColor(0, 0, 0);
  for (const [mx, my, w] of qrRuns(modules)) {
    doc.rect(x + (mx + 4) * cell, y + (my + 4) * cell, w * cell + 0.01, cell + 0.01, 'F');
  }
}

export async function certificatePdf(d: CertificatePdf) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const W = 279.4;
  const H = 215.9;
  const cx = W / 2;

  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.3);
  doc.rect(13, 13, W - 26, H - 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(8, 145, 178);
  doc.text(ACADEMY.legalName, cx, 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`NIT ${formatNit(ACADEMY.nit)} - ${ACADEMY.city}`, cx, 33, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  doc.text(d.heading, cx, 52, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(70, 70, 70);
  doc.text(d.certifies, cx, 66, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(17, 24, 39);
  doc.text(d.name, cx, 82, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(70, 70, 70);
  doc.text(d.completed, cx, 95, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(8, 145, 178);
  doc.text(doc.splitTextToSize(d.course, 200), cx, 106, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(70, 70, 70);
  doc.text(d.details, cx, 122, { align: 'center' });

  // Firmas
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(45, 160, 115, 160);
  doc.line(130, 160, 200, 160);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(d.instructor, 80, 166, { align: 'center' });
  doc.text(d.director, 165, 166, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(d.instructorRole, 80, 171, { align: 'center' });
  doc.text(d.directorRole, 165, 171, { align: 'center' });

  // QR de verificación
  const qrSize = 36;
  const qx = W - 22 - qrSize;
  const qy = 136;
  drawQr(doc, d.verifyUrl, qx, qy, qrSize);
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.text(d.verifyCaption, qx + qrSize / 2, qy + qrSize + 4, { align: 'center' });
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(d.code, qx + qrSize / 2, qy + qrSize + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  doc.text(doc.splitTextToSize(d.sample, W - 60), cx, H - 20, { align: 'center' });

  doc.save(d.filename);
}

export interface ReceiptPdf {
  filename: string;
  title: string;
  sample: string;
  rows: [string, string][];
  lines: { label: string; value: string; bold?: boolean }[];
  footer: string;
}

export async function receiptPdf(d: ReceiptPdf) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 20;
  const right = 196;
  let y = 22;

  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, 216, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(ACADEMY.legalName, left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`NIT ${formatNit(ACADEMY.nit)} - ${ACADEMY.city}`, left, (y += 5));
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(doc.splitTextToSize(d.sample, right - left), left, (y += 6));
  y += 12;

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(15);
  doc.text(d.title, left, y);
  y += 9;

  doc.setFontSize(10);
  for (const [k, v] of d.rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(k, left, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(v, 110);
    doc.text(wrapped, left + 55, y);
    y += 6 * Math.max(1, wrapped.length);
  }

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(left, y, right, y);
  y += 7;
  for (const ln of d.lines) {
    doc.setFont('helvetica', ln.bold ? 'bold' : 'normal');
    doc.setFontSize(ln.bold ? 11.5 : 10);
    doc.text(ln.label, left, y);
    doc.text(ln.value, right, y, { align: 'right' });
    y += ln.bold ? 8 : 6;
  }
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(doc.splitTextToSize(d.footer, right - left), left, y);

  doc.save(d.filename);
}
