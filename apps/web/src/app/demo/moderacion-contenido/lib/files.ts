/**
 * Descargas reales generadas en tu navegador: el registro de auditoría en CSV
 * y el informe de transparencia de ejemplo en PDF. No se envía nada a ningún
 * servidor.
 */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvCell(v: string | number, sep: string): string {
  const s = String(v);
  return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con BOM para que Excel lea las tildes. En español usa punto y coma. */
export function buildCsv(headers: string[], rows: Array<Array<string | number>>, sep: ';' | ','): string {
  return [headers, ...rows].map((r) => r.map((c) => csvCell(c, sep)).join(sep)).join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>, sep: ';' | ',') {
  triggerDownload(new Blob(['\uFEFF' + buildCsv(headers, rows, sep)], { type: 'text/csv;charset=utf-8' }), filename);
}

export interface ReportPdf {
  title: string;
  disclaimer: string;
  generated: string;
  period: string;
  kpisTitle: string;
  kpis: Array<[string, string]>;
  monthsTitle: string;
  monthHeaders: [string, string, string, string];
  months: Array<[string, string, string, string]>;
  categoriesTitle: string;
  categories: Array<[string, string]>;
  sessionTitle: string;
  session: Array<[string, string]>;
  rulesTitle: string;
  rules: string[];
  footer: string;
}

export async function downloadReportPdf(r: ReportPdf, filename: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const left = 16;
  const right = 200;
  let y = 18;

  const ensure = (h: number) => {
    if (y + h > 268) {
      doc.addPage();
      y = 18;
    }
  };
  const heading = (txt: string) => {
    ensure(14);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(txt, left, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  };
  const row = (cols: string[], xs: number[], bold = false) => {
    ensure(6);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    cols.forEach((c, i) => doc.text(c, xs[i], y, i === 0 ? undefined : { align: 'right' }));
    y += 5;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(r.title, left, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  const disc = doc.splitTextToSize(r.disclaimer, right - left);
  doc.text(disc, left, (y += 6));
  y += disc.length * 4;
  doc.setTextColor(60, 60, 60);
  doc.text(`${r.generated} · ${r.period}`, left, (y += 2));
  doc.setTextColor(0, 0, 0);

  heading(r.kpisTitle);
  r.kpis.forEach(([k, v]) => row([k, v], [left, right]));

  heading(r.monthsTitle);
  row(r.monthHeaders, [left, 120, 160, right], true);
  r.months.forEach((m) => row(m, [left, 120, 160, right]));

  heading(r.categoriesTitle);
  r.categories.forEach(([k, v]) => row([k, v], [left, right]));

  heading(r.sessionTitle);
  r.session.forEach(([k, v]) => row([k, v], [left, right]));

  heading(r.rulesTitle);
  r.rules.forEach((line) => {
    const lines = doc.splitTextToSize(`• ${line}`, right - left);
    ensure(lines.length * 4.5);
    doc.text(lines, left, y);
    y += lines.length * 4.5;
  });

  ensure(8);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(doc.splitTextToSize(r.footer, right - left), left, y);

  triggerDownload(doc.output('blob'), filename);
}
