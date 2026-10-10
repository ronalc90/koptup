/**
 * «Prueba con tu documento»: un PDF corto pero con demasiado texto se rechaza
 * con su propio código (`too_much_text`), no como "supera 30 páginas".
 */
import { DemoRagError, ingestDocument, MAX_TEXT_CHARS } from '../../services/demo-rag.service';

/** PDF mínimo válido de una página con `text` en su contenido. */
function onePagePdf(text: string): Buffer {
  const stream = `BT /F1 6 Tf 10 780 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

describe('demo RAG: límite de texto', () => {
  it('un PDF de 1 página con más de 400.000 caracteres responde too_much_text (422)', async () => {
    const words = 'palabra '.repeat(Math.ceil((MAX_TEXT_CHARS + 20_000) / 8));
    const err = await ingestDocument({ buffer: onePagePdf(words), kind: 'pdf', originalName: 'denso.pdf' }).catch((e) => e);
    expect(err).toBeInstanceOf(DemoRagError);
    expect(err.code).toBe('too_much_text');
    expect(err.status).toBe(422);
    expect(err.message).toMatch(/demasiado texto/);
    expect(err.message).not.toMatch(/30 páginas/);
  });

  it('un PDF corto con poco texto se acepta', async () => {
    const doc = await ingestDocument({ buffer: onePagePdf('Contrato de prueba con poco texto.'), kind: 'pdf', originalName: 'corto.pdf' });
    expect(doc.pages).toBe(1);
  });
});
