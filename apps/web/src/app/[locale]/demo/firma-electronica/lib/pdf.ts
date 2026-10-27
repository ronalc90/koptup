/**
 * PDF de ejemplo generados en el navegador con jsPDF: el certificado de
 * evidencia de un sobre y el documento con las firmas. Ambos llevan la marca
 * "EJEMPLO - SIN VALIDEZ LEGAL".
 */

/** Las fuentes estándar de PDF solo traen Latin-1: se reemplazan los signos que no están. */
export function pdfSafe(s: string): string {
  return s
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/→/g, '->')
    .replace(/[^\u0000-ÿ]/g, '?');
}

export interface ReportSpec {
  filename: string;
  title: string;
  note: string;
  watermark: string;
  sections: { heading: string; rows: [string, string][] }[];
  table?: { heading: string; headers: string[]; widths: number[]; rows: string[][] };
  events?: { heading: string; rows: { when: string; what: string; who: string; where: string; hash: string }[] };
  paragraphs?: { heading: string; text: string };
  signatures?: { heading: string; items: { name: string; role: string; when: string; image?: string; text?: string }[] };
  footer: string;
}

type Doc = InstanceType<typeof import('jspdf').jsPDF>;

const LEFT = 15;
const RIGHT = 200;
const BOTTOM = 262;

function watermark(doc: Doc, text: string) {
  doc.saveGraphicsState();
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(38);
  doc.text(pdfSafe(text), 105, 160, { align: 'center', angle: 35 });
  doc.restoreGraphicsState();
  doc.setTextColor(15, 23, 42);
}

export async function buildReportPdf(spec: ReportSpec): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  let y = 18;
  watermark(doc, spec.watermark);

  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      watermark(doc, spec.watermark);
      y = 18;
    }
  };
  const heading = (txt: string) => {
    ensure(12);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(pdfSafe(txt), LEFT, y);
    doc.setDrawColor(203, 213, 225);
    doc.line(LEFT, y + 1.5, RIGHT, y + 1.5);
    y += 7;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(pdfSafe(spec.title), LEFT, y);
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28);
  const noteLines = doc.splitTextToSize(pdfSafe(spec.note), RIGHT - LEFT) as string[];
  doc.text(noteLines, LEFT, (y += 6));
  y += noteLines.length * 4;
  doc.setTextColor(15, 23, 42);

  for (const sec of spec.sections) {
    heading(sec.heading);
    doc.setFontSize(9);
    for (const [label, value] of sec.rows) {
      const lines = doc.splitTextToSize(pdfSafe(value), RIGHT - LEFT - 52) as string[];
      ensure(lines.length * 4.4 + 1);
      doc.setFont('helvetica', 'bold');
      doc.text(pdfSafe(label), LEFT, y);
      doc.setFont(value.length === 64 && /^[0-9a-f]+$/.test(value) ? 'courier' : 'helvetica', 'normal');
      doc.text(lines, LEFT + 52, y);
      y += lines.length * 4.4 + 0.6;
    }
  }

  if (spec.paragraphs) {
    heading(spec.paragraphs.heading);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const para of spec.paragraphs.text.split(/\n+/)) {
      const lines = doc.splitTextToSize(pdfSafe(para), RIGHT - LEFT) as string[];
      for (const line of lines) {
        ensure(5);
        doc.text(line, LEFT, y);
        y += 4.6;
      }
      y += 2;
    }
  }

  if (spec.table) {
    heading(spec.table.heading);
    const { headers, widths, rows } = spec.table;
    doc.setFontSize(8.5);
    const drawRow = (cells: string[], bold: boolean) => {
      const wrapped = cells.map((c, i) => doc.splitTextToSize(pdfSafe(c), widths[i] - 2) as string[]);
      const h = Math.max(...wrapped.map((w) => w.length)) * 4 + 1.5;
      ensure(h);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      let x = LEFT;
      wrapped.forEach((w, i) => {
        doc.text(w, x, y);
        x += widths[i];
      });
      y += h;
    };
    drawRow(headers, true);
    rows.forEach((r) => drawRow(r, false));
  }

  if (spec.signatures) {
    heading(spec.signatures.heading);
    for (const it of spec.signatures.items) {
      ensure(34);
      if (it.image) {
        try {
          doc.addImage(it.image, 'PNG', LEFT, y, 60, 20, undefined, 'FAST');
        } catch {
          /* imagen ilegible: queda solo el nombre */
        }
      } else if (it.text) {
        doc.setFont('times', 'italic');
        doc.setFontSize(20);
        doc.setTextColor(30, 58, 138);
        doc.text(pdfSafe(it.text), LEFT + 2, y + 13);
        doc.setTextColor(15, 23, 42);
      }
      doc.setDrawColor(100, 116, 139);
      doc.line(LEFT, y + 21, LEFT + 70, y + 21);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(pdfSafe(it.name), LEFT, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.text(pdfSafe(`${it.role} · ${it.when}`), LEFT, y + 29);
      y += 34;
    }
  }

  if (spec.events) {
    heading(spec.events.heading);
    for (const ev of spec.events.rows) {
      const what = doc.splitTextToSize(pdfSafe(ev.what), RIGHT - LEFT - 45) as string[];
      ensure(what.length * 4 + 13);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(pdfSafe(ev.when), LEFT, y);
      doc.text(what, LEFT + 45, y);
      y += what.length * 4;
      doc.setFont('helvetica', 'normal');
      doc.text(pdfSafe(ev.where ? `${ev.who} · ${ev.where}` : ev.who), LEFT + 45, y);
      y += 4;
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text(ev.hash, LEFT + 45, y);
      y += 5;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafe(spec.footer), LEFT, 270, { maxWidth: RIGHT - LEFT - 20 });
    doc.text(`${p}/${pages}`, RIGHT, 270, { align: 'right' });
  }
  doc.save(spec.filename);
}
