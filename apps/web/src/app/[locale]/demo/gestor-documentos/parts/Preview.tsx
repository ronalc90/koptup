'use client';

import { useTranslations } from 'next-intl';
import { fmtCop } from '../lib/dates';
import type { DocItem, OcrField } from '../lib/types';

export interface WatermarkInfo {
  line: string;
  id: string;
}

/** Encabezado de cláusula ("CLÁUSULA QUINTA - MULTAS." o "PRIMERA - CANON."). */
const HEADING_RE = /^(CL[ÁA]USULA [^.]+\.|(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA)[^.]*\.)/;

function WatermarkOverlay({ wm }: { wm: WatermarkInfo }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
      <span className="-rotate-[30deg] select-none px-4 text-center text-lg font-bold leading-tight text-slate-500/35 sm:text-2xl">
        {wm.line}
        <br />
        {wm.id}
      </span>
    </div>
  );
}

/** Colores de los recuadros del OCR por campo. */
const BOX: Partial<Record<OcrField['key'], string>> = {
  issuer: 'ring-emerald-500',
  nit: 'ring-emerald-500',
  number: 'ring-blue-500',
  date: 'ring-blue-500',
  buyer: 'ring-purple-500',
  subtotal: 'ring-amber-500',
  iva: 'ring-amber-500',
  total: 'ring-red-500',
  cufe: 'ring-slate-500',
};

/** Factura "escaneada": representación de la imagen con los campos que leyó el OCR de ejemplo. */
export function InvoiceScan({ doc, highlight }: { doc: DocItem; highlight: boolean }) {
  const t = useTranslations('demoDocs');
  const ocr = doc.ocr!;
  const get = (k: OcrField['key']) => ocr.fields.find((f) => f.key === k)?.value ?? '';
  const box = (k: OcrField['key']) => (highlight ? `rounded ring-2 ring-offset-1 ${BOX[k]} ring-offset-[#f5f1e6]` : '');
  return (
    <div className="rotate-[0.4deg] rounded-sm bg-[#f5f1e6] p-4 font-mono text-[11px] leading-snug text-slate-800 shadow-inner contrast-[0.95] sm:text-xs">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-dashed border-slate-400 pb-2">
        <div className="min-w-0">
          <p className={`font-bold uppercase ${box('issuer')}`}>{get('issuer')}</p>
          <p className={box('nit')}>NIT {get('nit')}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">FACTURA ELECTRÓNICA DE VENTA</p>
          <p className={box('number')}>No. {get('number')}</p>
          <p className={box('date')}>{get('date')}</p>
        </div>
      </div>
      <p className={`mt-2 ${box('buyer')}`}>{get('buyer')}</p>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-400 text-left">
            <th className="py-1 pr-2 font-semibold">{t('ocr.headers.concept')}</th>
            <th className="py-1 pr-2 text-right font-semibold">{t('ocr.headers.qty')}</th>
            <th className="py-1 text-right font-semibold">{t('ocr.headers.total')}</th>
          </tr>
        </thead>
        <tbody>
          {ocr.lines.map((l) => (
            <tr key={l.concept} className="border-b border-dotted border-slate-300 align-top">
              <td className="py-1 pr-2">{l.concept}</td>
              <td className="py-1 pr-2 text-right">{l.qty}</td>
              <td className="py-1 text-right">{fmtCop(l.qty * l.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-2 w-full max-w-[220px] space-y-0.5 text-right">
        <p className={box('subtotal')}>Subtotal {get('subtotal')}</p>
        <p className={box('iva')}>IVA 19 % {get('iva')}</p>
        <p className={`font-bold ${box('total')}`}>Total {get('total')}</p>
      </div>
      <p className={`mt-2 break-all text-[9px] text-slate-600 ${box('cufe')}`}>CUFE {get('cufe')}</p>
    </div>
  );
}

function CsvTable({ text }: { text: string }) {
  const rows = text.trim().split('\n').map((r) => r.split(','));
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-slate-800">
        <thead>
          <tr className="border-b border-slate-300 text-left">
            {head.map((h) => (
              <th key={h} className="px-2 py-1 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r) => (
            <tr key={r.join('|')} className="border-b border-slate-200">
              {r.map((c, i) => (
                <td key={i} className={`px-2 py-1 ${/^\d+$/.test(c) && c.length > 4 ? 'text-right tabular-nums' : ''}`}>
                  {/^\d+$/.test(c) && c.length > 4 ? fmtCop(Number(c)) : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Vista previa de un documento de ejemplo (texto real del documento). */
export default function Preview({ doc, watermark }: { doc: DocItem; watermark: WatermarkInfo | null }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700">
      <div className="max-h-[420px] overflow-auto p-4">
        {doc.ocr ? (
          <InvoiceScan doc={doc} highlight={false} />
        ) : doc.kind === 'csv' && doc.text ? (
          <CsvTable text={doc.text} />
        ) : (
          <div className="space-y-1.5 text-xs leading-relaxed text-slate-800">
            {(doc.text || '').split('\n').map((line, i) => {
              if (!line.trim()) return <div key={i} className="h-1" />;
              const head = HEADING_RE.exec(line);
              if (head) {
                return (
                  <p key={i}>
                    <strong className="font-semibold text-slate-900">{head[0]}</strong>
                    {line.slice(head[0].length)}
                  </p>
                );
              }
              return (
                <p key={i} className={i === 0 || /^[A-ZÁÉÍÓÚÑ0-9 .,-]{12,}$/.test(line) ? 'font-semibold text-slate-900' : ''}>
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </div>
      {watermark && <WatermarkOverlay wm={watermark} />}
    </div>
  );
}
