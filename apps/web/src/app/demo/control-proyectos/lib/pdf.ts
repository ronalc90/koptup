/**
 * PDF generados en el navegador con jsPDF (informe semanal, documentos de
 * ejemplo de las tareas y prefactura). Todos llevan la marca visible de
 * "documento de ejemplo" porque los datos son ficticios.
 */

export interface PdfTable {
  head: string[];
  rows: string[][];
  /** Alineación por columna: 'r' a la derecha (por defecto, la primera a la izquierda y el resto a la derecha). */
  align?: ('l' | 'r')[];
  bold?: number[];
}

export interface PdfSection {
  heading?: string;
  rows?: [string, string][];
  paragraphs?: string[];
  bullets?: string[];
  table?: PdfTable;
  /** Recuadros grises de "foto" con su leyenda (registro fotográfico de ejemplo). */
  photos?: string[];
}

export interface PdfDoc {
  filename: string;
  company: string;
  companyLine: string;
  title: string;
  subtitle?: string;
  sample: string;
  sections: PdfSection[];
  footer?: string;
}

export async function makePdf(d: PdfDoc): Promise<void> {
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

  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, 216, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(d.company, left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(d.companyLine, left, (y += 5));
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  const sample = doc.splitTextToSize(d.sample, width) as string[];
  doc.text(sample, left, (y += 5));
  y += sample.length * 4;
  doc.setTextColor(0, 0, 0);
  y += 6;

  doc.setFontSize(15);
  const title = doc.splitTextToSize(d.title, width) as string[];
  doc.text(title, left, y);
  y += (title.length - 1) * 6;
  if (d.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const sub = doc.splitTextToSize(d.subtitle, width) as string[];
    doc.text(sub, left, (y += 6));
    y += (sub.length - 1) * 4.5;
    doc.setTextColor(0, 0, 0);
  }
  y += 9;

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
    for (const p of s.paragraphs ?? []) {
      const lines = doc.splitTextToSize(p, width) as string[];
      ensure(lines.length * 5 + 2);
      doc.text(lines, left, y, { lineHeightFactor: 1.45 });
      y += lines.length * 5 + 2;
    }
    for (const b of s.bullets ?? []) {
      const lines = doc.splitTextToSize(b, width - 5) as string[];
      ensure(lines.length * 4.8 + 1);
      doc.text('•', left + 1, y);
      doc.text(lines, left + 5, y);
      y += lines.length * 4.8 + 0.8;
    }
    for (const [k, v] of s.rows ?? []) {
      const lines = doc.splitTextToSize(v, width - 58) as string[];
      ensure(lines.length * 4.6 + 1);
      doc.setTextColor(90, 90, 90);
      doc.text(k, left, y);
      doc.setTextColor(0, 0, 0);
      doc.text(lines, left + 58, y);
      y += lines.length * 4.6 + 1;
    }
    if (s.table) {
      const tbl = s.table;
      const n = tbl.head.length;
      const first = width * (n > 3 ? 0.42 : n > 2 ? 0.5 : 0.62);
      const rest = n > 1 ? (width - first) / (n - 1) : 0;
      const colX = (i: number) => (i === 0 ? left : left + first + rest * (i - 1));
      const drawRow = (cells: string[], bold: boolean) => {
        ensure(6);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        cells.forEach((c, i) => {
          const alignRight = (tbl.align?.[i] ?? (i === 0 ? 'l' : 'r')) === 'r';
          const w = i === 0 ? first : rest;
          const x = alignRight ? colX(i) + w - 1 : colX(i) + 1;
          const text = (doc.splitTextToSize(String(c), w - 2) as string[])[0] ?? '';
          doc.text(text, x, y, { align: alignRight ? 'right' : 'left' });
        });
        y += 5.4;
      };
      doc.setFillColor(230, 246, 244);
      ensure(8);
      doc.rect(left, y - 4, width, 6, 'F');
      drawRow(tbl.head, true);
      tbl.rows.forEach((r, i) => drawRow(r, tbl.bold?.includes(i) ?? false));
      doc.setFont('helvetica', 'normal');
    }
    if (s.photos?.length) {
      const w = (width - 6) / 2;
      const h = 52;
      s.photos.forEach((cap, i) => {
        const col = i % 2;
        if (col === 0) ensure(h + 10);
        const x = left + col * (w + 6);
        doc.setFillColor(226, 232, 240);
        doc.rect(x, y, w, h, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.text(cap, x + 3, y + h + 5, { maxWidth: w - 6 });
        doc.setTextColor(0, 0, 0);
        if (col === 1 || i === s.photos!.length - 1) y += h + 11;
      });
      doc.setFontSize(9.5);
    }
    y += 4;
  }

  if (d.footer) {
    ensure(12);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(doc.splitTextToSize(d.footer, width) as string[], left, y + 4);
  }

  doc.save(d.filename);
}
