/**
 * Documentos PDF de la demo (certificado laboral, desprendible de pago, hoja
 * de vida y resúmenes del expediente) generados en el navegador con jsPDF.
 * Todos llevan una marca visible de "documento de ejemplo".
 */
import { COMPANY } from './catalog';

export interface PdfTable {
  head: string[];
  rows: string[][];
  /** Alineación por columna: 'r' a la derecha. */
  align?: ('l' | 'r')[];
  bold?: number[];
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
  sample: string;
  sections: PdfSection[];
  signature?: { name: string; role: string };
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
    if (y + h > 260) {
      doc.addPage();
      y = 20;
    }
  };

  // Encabezado de la empresa
  doc.setFillColor(109, 40, 217);
  doc.rect(0, 0, 216, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(COMPANY.name, left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`NIT ${COMPANY.nitFormatted} - ${COMPANY.address} - ${COMPANY.city}`, left, (y += 5));
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(d.sample, width), left, (y += 5));
  doc.setTextColor(0, 0, 0);
  y += 9;

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
      ensure(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(s.heading, left, y);
      doc.setDrawColor(220, 220, 220);
      doc.line(left, y + 1.5, right, y + 1.5);
      y += 7;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const p of s.paragraphs ?? []) {
      const lines = doc.splitTextToSize(p, width) as string[];
      ensure(lines.length * 5 + 2);
      doc.text(lines, left, y, { lineHeightFactor: 1.45 });
      y += lines.length * 5 + 3;
    }
    for (const [k, v] of s.rows ?? []) {
      const lines = doc.splitTextToSize(v, width - 62) as string[];
      ensure(lines.length * 4.6 + 1);
      doc.setTextColor(90, 90, 90);
      doc.text(k, left, y);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, left + 62, y);
      y += lines.length * 4.6 + 1;
    }
    if (s.table) {
      const n = s.table.head.length;
      const first = width * (n > 2 ? 0.46 : 0.6);
      const rest = (width - first) / (n - 1);
      const colX = (i: number) => (i === 0 ? left : left + first + rest * (i - 1));
      const drawRow = (cells: string[], bold: boolean) => {
        ensure(6);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        cells.forEach((c, i) => {
          const alignRight = (s.table!.align?.[i] ?? (i === 0 ? 'l' : 'r')) === 'r';
          const x = alignRight ? colX(i) + (i === 0 ? first : rest) - 1 : colX(i) + 1;
          doc.text(String(c), x, y, { align: alignRight ? 'right' : 'left', maxWidth: i === 0 ? first - 2 : rest - 2 });
        });
        y += 5.2;
      };
      doc.setFillColor(243, 240, 255);
      doc.rect(left, y - 4, width, 6, 'F');
      drawRow(s.table.head, true);
      s.table.rows.forEach((r, i) => drawRow(r, s.table!.bold?.includes(i) ?? false));
      doc.setFont('helvetica', 'normal');
    }
    y += 4;
  }

  if (d.signature) {
    ensure(28);
    y += 12;
    doc.setDrawColor(120, 120, 120);
    doc.line(left, y, left + 70, y);
    doc.setFont('helvetica', 'bold');
    doc.text(d.signature.name, left, (y += 5));
    doc.setFont('helvetica', 'normal');
    doc.text(d.signature.role, left, (y += 4.5));
  }

  if (d.footer) {
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.text(doc.splitTextToSize(d.footer, width), left, 270);
    }
  }

  doc.save(d.filename);
}
