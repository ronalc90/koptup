/**
 * Copia controlada en PDF (jsPDF, en el navegador): el texto del documento de
 * ejemplo con una marca de agua por página que dice quién la descargó, cuándo
 * y con qué identificador. Es una copia de lectura, no el archivo original.
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

export interface WatermarkPdfSpec {
  filename: string;
  title: string;
  text: string;
  /** Línea de la marca de agua: "Visto por Ana · 10 oct. 2026, 9:05 a. m.". */
  watermark: string;
  watermarkId: string;
  footer: string;
}

export async function buildWatermarkedPdf(spec: WatermarkPdfSpec): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const LEFT = 18;
  const WIDTH = 180;
  const BOTTOM = 258;

  const stamp = () => {
    doc.saveGraphicsState();
    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(pdfSafe(spec.watermark), 108, 150, { align: 'center', angle: 32 });
    doc.setFontSize(14);
    doc.text(pdfSafe(spec.watermarkId), 116, 162, { align: 'center', angle: 32 });
    doc.restoreGraphicsState();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafe(`${spec.footer} · ${spec.watermarkId}`), LEFT, 272);
    doc.setTextColor(15, 23, 42);
  };

  stamp();
  let y = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  for (const line of doc.splitTextToSize(pdfSafe(spec.title), WIDTH) as string[]) {
    doc.text(line, LEFT, y);
    y += 6;
  }
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const para of spec.text.split('\n')) {
    const lines = para.trim() ? (doc.splitTextToSize(pdfSafe(para), WIDTH) as string[]) : [''];
    for (const line of lines) {
      if (y > BOTTOM) {
        doc.addPage();
        stamp();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        y = 22;
      }
      doc.text(line, LEFT, y);
      y += 5;
    }
  }
  doc.save(spec.filename);
}
