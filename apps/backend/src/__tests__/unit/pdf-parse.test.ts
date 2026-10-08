import { parsePdf } from '../../utils/pdf-parse';

/**
 * PDF mínimo válido de 2 páginas (sin compresión), como los que suben los
 * visitantes en "Prueba con tu documento". Pesa ~1 KB: un Buffer así sale del
 * pool compartido de Node, que es el caso que rompía pdf.js ("bad XRef entry").
 */
function tinyPdf(pages: string[][]): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const pageIds: number[] = [];
  for (const lines of pages) {
    const stream = ['BT', '/F1 12 Tf', '16 TL', '56 780 Td', ...lines.map((l) => `(${esc(l)}) Tj T*`), 'ET'].join('\n');
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
    const contentId = objects.length;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(objects.length);
  }
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  return `${pdf}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}

const PDF = tinyPdf([
  ['Garantía de 12 meses desde la fecha de compra.'],
  ['Horario de soporte técnico: lunes a viernes de 8:00 a 18:00.'],
]);

describe('parsePdf (pdf-parse sin el Buffer de Node)', () => {
  it('lee siempre un PDF pequeño que sale del pool de Buffer de Node', async () => {
    const offsets = new Set<number>();
    for (let i = 0; i < 40; i++) {
      // Asignaciones pequeñas de distinto tamaño: mueven la posición del pool
      // donde cae el PDF (byteOffset), igual que en un servidor con tráfico.
      Buffer.from('x'.repeat(50 + ((i * 97) % 1500)));
      const buffer = Buffer.from(PDF, 'latin1');
      offsets.add(buffer.byteOffset);
      const data = await parsePdf(buffer);
      expect(data.numpages).toBe(2);
      expect(data.text).toContain('Garantía de 12 meses');
      expect(data.text).toContain('Horario de soporte técnico');
    }
    // La prueba de verdad ejercitó Buffers en distintas posiciones del pool.
    expect([...offsets].some((o) => o > 0)).toBe(true);
  });

  it('acepta un Uint8Array y respeta las opciones de pdf-parse (max)', async () => {
    const data = await parsePdf(new Uint8Array(Buffer.from(PDF, 'latin1')), { max: 1 });
    expect(data.numpages).toBe(2);
    expect(data.numrender).toBe(1);
    expect(data.text).toContain('Garantía');
    expect(data.text).not.toContain('Horario');
  });
});
