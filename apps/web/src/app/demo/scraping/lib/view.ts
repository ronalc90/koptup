/**
 * Filas que se muestran y se descargan: las de la última ejecución más lo que
 * hiciste después en la demo (documentos enviados al asistente, NIT corregidos).
 */
import { SUPPLIER_DOCS } from './data';
import { docStatus } from './engine';
import { formatNit } from './nit';
import type { DemoState } from './store';
import type { Column, Row, SourceId } from './types';

export function displayData(id: SourceId, s: DemoState): { columns: Column[]; rows: Row[] } {
  const r = s.results[id];
  if (!r) return { columns: [], rows: [] };
  if (id === 'normativa') {
    return {
      columns: [...r.columns, { key: 'rag', labelKey: 'rag', type: 'status', valueKey: 'rag' }],
      rows: r.rows.map((row) => ({ ...row, rag: s.sentToRag.includes(String(row.id)) ? 'sent' : 'pending' })),
    };
  }
  if (id === 'documentos') {
    return {
      columns: r.columns,
      rows: r.rows.map((row) => {
        const corrected = s.corrections[String(row.id)];
        const d = SUPPLIER_DOCS.find((x) => x.id === row.id);
        if (corrected === undefined || !d) return row;
        return { ...row, nit: `${formatNit(d.nit)}-${corrected}`, status: docStatus(d, 0, corrected).status };
      }),
    };
  }
  return { columns: r.columns, rows: r.rows };
}
