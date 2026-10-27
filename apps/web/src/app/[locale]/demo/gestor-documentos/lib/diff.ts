/**
 * Comparación palabra por palabra entre dos versiones de un texto (subsecuencia
 * común más larga). Se calcula en el navegador con el texto de cada versión.
 */

export type DiffOp = 'equal' | 'add' | 'del';

export interface DiffPart {
  op: DiffOp;
  /** Texto de la versión nueva (o de la anterior si op = 'del'). */
  text: string;
  /** En las partes iguales, el texto tal como está en la versión anterior (con sus saltos de línea). */
  before?: string;
}

export interface DiffSummary {
  /** Bloques de texto agregados. */
  additions: number;
  /** Bloques de texto eliminados. */
  deletions: number;
  /** Bloques donde se eliminó y agregó texto en el mismo punto (cambios). */
  changes: number;
  addedWords: number;
  removedWords: number;
}

function words(text: string): string[] {
  return text.match(/\S+\s*/g) || [];
}

export function diffWords(a: string, b: string): DiffPart[] {
  const x = words(a);
  const y = words(b);
  const n = x.length;
  const m = y.length;
  const key = (w: string) => w.trim();
  // Tabla LCS de (n+1)×(m+1) en un arreglo plano.
  const L = new Uint16Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * (m + 1) + j] =
        key(x[i]) === key(y[j])
          ? L[(i + 1) * (m + 1) + j + 1] + 1
          : Math.max(L[(i + 1) * (m + 1) + j], L[i * (m + 1) + j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (op: DiffOp, text: string, before?: string) => {
    const last = parts[parts.length - 1];
    if (last && last.op === op) {
      last.text += text;
      if (op === 'equal') last.before = (last.before ?? '') + (before ?? text);
    } else parts.push(op === 'equal' ? { op, text, before: before ?? text } : { op, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(x[i]) === key(y[j])) {
      push('equal', y[j], x[i]);
      i++;
      j++;
    } else if (L[(i + 1) * (m + 1) + j] >= L[i * (m + 1) + j + 1]) {
      push('del', x[i]);
      i++;
    } else {
      push('add', y[j]);
      j++;
    }
  }
  while (i < n) push('del', x[i++]);
  while (j < m) push('add', y[j++]);
  return parts;
}

export function summarize(parts: DiffPart[]): DiffSummary {
  const s: DiffSummary = { additions: 0, deletions: 0, changes: 0, addedWords: 0, removedWords: 0 };
  for (let k = 0; k < parts.length; k++) {
    const p = parts[k];
    const count = (p.text.match(/\S+/g) || []).length;
    if (p.op === 'add') s.addedWords += count;
    if (p.op === 'del') s.removedWords += count;
    if (p.op === 'equal') continue;
    const next = parts[k + 1];
    if (p.op === 'del' && next?.op === 'add') {
      s.changes++;
      s.addedWords += (next.text.match(/\S+/g) || []).length;
      k++;
      continue;
    }
    if (p.op === 'add') s.additions++;
    else s.deletions++;
  }
  return s;
}
