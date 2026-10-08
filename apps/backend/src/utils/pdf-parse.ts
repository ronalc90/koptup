import pdfParse from 'pdf-parse';

type PdfParseOptions = Parameters<typeof pdfParse>[1];
type PdfParseResult = Awaited<ReturnType<typeof pdfParse>>;

/**
 * pdf-parse (pdf.js 1.10) con los bytes en un `Uint8Array` propio en lugar
 * del `Buffer` de Node. Úsalo siempre en vez de llamar a pdf-parse directo.
 *
 * Por qué: el "worker" falso de pdf.js copia los datos con
 * `new value.constructor(value)`. Con un Buffer eso es `Buffer.from(...)`,
 * que para archivos de menos de 4 KB toma memoria del pool compartido de Node
 * (con un `byteOffset` distinto de 0), y `Stream.makeSubStream` de pdf.js lee
 * desde `bytes.buffer` sin ese desplazamiento: las posiciones del XRef quedan
 * corridas y un PDF válido falla al azar con "bad XRef entry" (según dónde
 * caiga la copia en el pool). Con un Uint8Array la copia tiene su propio
 * ArrayBuffer y la lectura es exacta. Lo prueba
 * src/__tests__/unit/pdf-parse.test.ts.
 */
export function parsePdf(data: Buffer | Uint8Array, options?: PdfParseOptions): Promise<PdfParseResult> {
  return pdfParse(new Uint8Array(data), options);
}
