import type { ReactNode } from 'react';

/**
 * Resaltado de sintaxis mínimo y SEGURO: divide la línea en fragmentos y
 * devuelve nodos de React (React escapa el texto). No usa
 * dangerouslySetInnerHTML, así que el código pegado en "Prueba con tu diff"
 * no puede inyectar HTML.
 */
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'await', 'async', 'class', 'extends', 'new',
  'throw', 'try', 'catch', 'finally', 'import', 'export', 'from', 'interface', 'type', 'public', 'private',
  'implements', 'describe', 'it', 'expect', 'for', 'of', 'in', 'while', 'def', 'self', 'public', 'static',
]);
const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'None', 'True', 'False']);

const TOKEN_RE = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

export function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  TOKEN_RE.lastIndex = 0;
  for (let m = TOKEN_RE.exec(line); m; m = TOKEN_RE.exec(line)) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [tok, comment, str, num, word] = m;
    let cls = '';
    if (comment) cls = 'text-emerald-500/80';
    else if (str) cls = 'text-amber-300';
    else if (num) cls = 'text-pink-300';
    else if (word && KEYWORDS.has(word)) cls = 'text-violet-400';
    else if (word && LITERALS.has(word)) cls = 'text-pink-400';
    else if (word && /^[A-Z][A-Za-z0-9_]+$/.test(word)) cls = 'text-cyan-300';
    out.push(cls ? <span key={key++} className={cls}>{tok}</span> : tok);
    last = m.index + tok.length;
    if (tok.length === 0) TOKEN_RE.lastIndex++;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function Code({ text }: { text: string }) {
  return <>{highlightLine(text)}</>;
}
