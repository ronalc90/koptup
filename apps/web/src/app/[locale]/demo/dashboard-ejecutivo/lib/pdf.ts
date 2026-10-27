/**
 * Informe ejecutivo en PDF generado en el navegador con jsPDF a partir de los
 * textos ya formateados por la interfaz (mismas cifras que el tablero).
 */
import { jsPDF } from 'jspdf';

export interface PdfTable {
  headers: string[];
  rows: string[][];
  /** Ancho relativo de cada columna. */
  widths: number[];
  /** Alineación por columna. */
  align: ('l' | 'r')[];
  /** Filas a resaltar en negrita (índices). */
  bold?: number[];
}

export interface PdfSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: PdfTable;
}

export interface ReportData {
  title: string;
  subtitle: string;
  badge: string;
  kpis: { label: string; value: string; note: string }[];
  sections: PdfSection[];
  footer: string;
  pageLabel: (n: number, total: number) => string;
  fileName: string;
}

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Las fuentes estándar de jsPDF (WinAnsi) no traen el signo menos tipográfico ni la flecha. */
function clean(s: string): string {
  return s.replace(/\u2212/g, '-').replace(/\u2192/g, '->');
}

export function buildReportPdf(data: ReportData): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - 16) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Encabezado
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, PAGE_W, 4, 'F');
  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(clean(data.title), MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  for (const line of doc.splitTextToSize(clean(data.subtitle), CONTENT_W) as string[]) {
    doc.text(line, MARGIN, y);
    y += 4.6;
  }
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  for (const line of doc.splitTextToSize(clean(data.badge), CONTENT_W) as string[]) {
    doc.text(line, MARGIN, y);
    y += 4;
  }
  y += 3;

  // KPIs en tarjetas
  const cols = Math.min(4, data.kpis.length) || 1;
  const gap = 3;
  const cw = (CONTENT_W - gap * (cols - 1)) / cols;
  data.kpis.forEach((k, i) => {
    const x = MARGIN + (i % cols) * (cw + gap);
    if (i % cols === 0 && i > 0) y += 24;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cw, 21, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(clean(k.label), x + 3, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(clean(k.value), x + 3, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const note = (doc.splitTextToSize(clean(k.note), cw - 6) as string[]).slice(0, 2);
    note.forEach((l, j) => doc.text(l, x + 3, y + 16 + j * 3));
  });
  y += 27;

  for (const s of data.sections) {
    ensure(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(88, 28, 135);
    doc.text(clean(s.title), MARGIN, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    for (const p of s.paragraphs ?? []) {
      for (const line of doc.splitTextToSize(clean(p), CONTENT_W) as string[]) {
        ensure(5);
        doc.text(line, MARGIN, y);
        y += 4.3;
      }
      y += 1;
    }
    for (const b of s.bullets ?? []) {
      const lines = doc.splitTextToSize(clean(b), CONTENT_W - 5) as string[];
      lines.forEach((line, j) => {
        ensure(5);
        if (j === 0) doc.text('•', MARGIN + 1, y);
        doc.text(line, MARGIN + 5, y);
        y += 4.3;
      });
      y += 0.6;
    }
    if (s.table) {
      const tb = s.table;
      const total = tb.widths.reduce((a, b) => a + b, 0);
      const ws = tb.widths.map((w) => (w / total) * CONTENT_W);
      const drawRow = (cells: string[], header: boolean, bold: boolean) => {
        const wrapped = cells.map((c, i) => doc.splitTextToSize(clean(c), ws[i] - 2) as string[]);
        const h = Math.max(...wrapped.map((w) => w.length)) * 3.8 + 2;
        ensure(h + 1);
        if (header) {
          doc.setFillColor(241, 245, 249);
          doc.rect(MARGIN, y - 3.6, CONTENT_W, h, 'F');
        }
        doc.setFont('helvetica', header || bold ? 'bold' : 'normal');
        doc.setFontSize(header ? 8 : 8.5);
        let x = MARGIN;
        wrapped.forEach((lines, i) => {
          lines.forEach((line, j) => {
            if (tb.align[i] === 'r') doc.text(line, x + ws[i] - 1, y + j * 3.8, { align: 'right' });
            else doc.text(line, x + 1, y + j * 3.8);
          });
          x += ws[i];
        });
        y += h;
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y - 3.4, MARGIN + CONTENT_W, y - 3.4);
      };
      doc.setTextColor(30, 41, 59);
      drawRow(tb.headers, true, true);
      tb.rows.forEach((r, i) => drawRow(r, false, tb.bold?.includes(i) ?? false));
      doc.setFont('helvetica', 'normal');
    }
    y += 4;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(clean(data.footer), MARGIN, PAGE_H - 8);
    doc.text(clean(data.pageLabel(i, pages)), PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
  }
  return doc;
}
