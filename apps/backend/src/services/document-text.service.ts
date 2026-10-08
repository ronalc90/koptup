/**
 * document-text.service.ts — extrae el texto real de un archivo en memoria.
 *
 * Lo usa la ingesta del chatbot (POST /api/chatbot/bots/:botId/docs, archivos
 * en base64): PDF con pdf-parse, DOCX con mammoth y texto plano decodificado
 * como UTF-8 (o latin1). El formato se decide por la firma binaria del
 * contenido, no solo por el nombre o el mimetype que manda el cliente.
 */
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export type ExtractedKind = 'pdf' | 'docx' | 'text';

export class UnsupportedDocumentError extends Error {
  readonly reason: 'unsupported_format' | 'unreadable' | 'too_many_pages';
  constructor(reason: 'unsupported_format' | 'unreadable' | 'too_many_pages') {
    super(reason);
    this.reason = reason;
  }
}

/** Extensiones de texto plano que se aceptan tal cual. */
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.csv', '.tsv', '.json', '.html', '.htm', '.xml']);
const TEXT_MIME_PREFIXES = ['text/'];
const TEXT_MIMES = new Set(['application/json', 'application/xml', 'application/xhtml+xml']);

export const MAX_PDF_PAGES = 200;
const PARSE_TIMEOUT_MS = 20_000;

function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 1024).includes('%PDF-');
}

function isZip(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

function looksLikeText(buffer: Buffer): boolean {
  return !buffer.subarray(0, 8192).includes(0);
}

function decodeText(buffer: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
  } catch {
    return buffer.toString('latin1');
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Devuelve el texto del archivo. Lanza `UnsupportedDocumentError` si el
 * formato no se puede leer (binarios, imágenes, ZIP que no es DOCX, PDF dañado
 * o protegido).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  meta: { name: string; mime: string },
): Promise<{ text: string; kind: ExtractedKind; pages?: number }> {
  const ext = path.extname(meta.name || '').toLowerCase();
  const mime = (meta.mime || '').split(';')[0].trim().toLowerCase();

  if (isPdf(buffer)) {
    try {
      const data = await withTimeout(pdfParse(Buffer.from(buffer), { max: MAX_PDF_PAGES }), PARSE_TIMEOUT_MS);
      const pages = Number(data?.numpages) || 0;
      if (pages > MAX_PDF_PAGES) throw new UnsupportedDocumentError('too_many_pages');
      return { text: String(data?.text ?? ''), kind: 'pdf', pages };
    } catch (err) {
      if (err instanceof UnsupportedDocumentError) throw err;
      throw new UnsupportedDocumentError('unreadable');
    }
  }

  if (isZip(buffer)) {
    if (ext !== '.docx' && mime !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new UnsupportedDocumentError('unsupported_format');
    }
    try {
      const result = await withTimeout(mammoth.extractRawText({ buffer }), PARSE_TIMEOUT_MS);
      return { text: result?.value ?? '', kind: 'docx' };
    } catch {
      throw new UnsupportedDocumentError('unreadable');
    }
  }

  const declaredText =
    TEXT_EXTENSIONS.has(ext) || TEXT_MIMES.has(mime) || TEXT_MIME_PREFIXES.some((p) => mime.startsWith(p));
  if (declaredText && looksLikeText(buffer)) {
    return { text: decodeText(buffer), kind: 'text' };
  }
  throw new UnsupportedDocumentError('unsupported_format');
}
