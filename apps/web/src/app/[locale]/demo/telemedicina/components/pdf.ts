/**
 * Documentos de la demo generados en el navegador con jsPDF (receta, resultados de
 * laboratorio y resumen de la atención). Todos llevan la marca visible de documento
 * de ejemplo: no tienen validez clínica ni firma electrónica real.
 */
import { IPS } from './mockData';

export interface PdfTable {
  head: string[];
  rows: string[][];
  widths?: number[];
}

export interface PdfSection {
  heading?: string;
  rows?: [string, string][];
  paragraphs?: string[];
  table?: PdfTable;
}

export interface PdfDoc {
  filename: string;
  title: string;
  subtitle?: string;
  /** Texto de la marca "documento de ejemplo". */
  sample: string;
  ipsLine: string;
  sections: PdfSection[];
  signature?: { name: string; detail: string };
  footer?: string;
}

export async function makePdf(d: PdfDoc) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 18;
  const right = 198;
  const width = right - left;
  let y = 18;

  const ensure = (h: number) => {
    if (y + h > 262) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFillColor(190, 18, 60);
  doc.rect(0, 0, 216, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(IPS.name, left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(d.ipsLine, left, (y += 5));
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  const sampleLines = doc.splitTextToSize(d.sample, width) as string[];
  doc.text(sampleLines, left, (y += 5));
  y += sampleLines.length * 4;
  doc.setTextColor(0, 0, 0);
  y += 6;

  doc.setFontSize(15);
  doc.text(d.title, left, y);
  if (d.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text(doc.splitTextToSize(d.subtitle, width), left, (y += 6));
    doc.setTextColor(0, 0, 0);
  }
  y += 8;

  for (const s of d.sections) {
    if (s.heading) {
      ensure(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(s.heading, left, y);
      doc.setDrawColor(220, 220, 220);
      doc.line(left, y + 1.5, right, y + 1.5);
      y += 7;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const [k, v] of s.rows ?? []) {
      const lines = doc.splitTextToSize(v || '—', width - 52) as string[];
      ensure(lines.length * 4.6 + 1);
      doc.setTextColor(90, 90, 90);
      doc.text(k, left, y);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, left + 52, y);
      y += lines.length * 4.6 + 1;
    }
    for (const p of s.paragraphs ?? []) {
      const lines = doc.splitTextToSize(p, width) as string[];
      ensure(lines.length * 4.8 + 2);
      doc.text(lines, left, y, { lineHeightFactor: 1.4 });
      y += lines.length * 4.8 + 2;
    }
    if (s.table) {
      const n = s.table.head.length;
      const widths = s.table.widths ?? Array.from({ length: n }, () => width / n);
      const xs = widths.map((_, i) => left + widths.slice(0, i).reduce((a, b) => a + b, 0));
      const drawRow = (cells: string[], bold: boolean) => {
        const wrapped = cells.map((c, i) => doc.splitTextToSize(String(c ?? ''), widths[i] - 2) as string[]);
        const h = Math.max(...wrapped.map((w) => w.length)) * 4.4 + 1.6;
        ensure(h);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        wrapped.forEach((w, i) => doc.text(w, xs[i] + 1, y));
        y += h;
      };
      doc.setFillColor(255, 241, 242);
      doc.rect(left, y - 4, width, 6, 'F');
      drawRow(s.table.head, true);
      s.table.rows.forEach((r) => drawRow(r, false));
    }
    y += 4;
  }

  if (d.signature) {
    ensure(24);
    y += 6;
    doc.setDrawColor(120, 120, 120);
    doc.line(left, y, left + 70, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(d.signature.name, left, (y += 5));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(d.signature.detail, width) as string[], left, (y += 4.5));
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(doc.splitTextToSize(d.footer ?? d.sample, width) as string[], left, 270);
  }
  doc.save(d.filename);
}

/** Descarga un archivo de texto generado en el navegador (CSV o JSON). */
export function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([mime.startsWith('text/csv') ? '﻿' + content : content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
