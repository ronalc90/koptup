/**
 * Lógica pura de la demo de code review (sin React ni navegador):
 * - modelo de datos (PR, archivos, comentarios, pruebas sugeridas);
 * - código efectivo de un archivo tras aplicar sugerencias;
 * - diff por líneas (LCS) para pintar la vista unificada y lado a lado;
 * - puntaje y riesgo calculados a partir de los hallazgos pendientes;
 * - "Prueba con tu diff": lectura de un diff unificado (o código suelto) y
 *   análisis con reglas locales que corren en el navegador, SIN IA.
 *
 * Todo es determinista para que el render inicial sea idéntico en servidor y
 * cliente (nada de Date.now ni Math.random aquí).
 */

export type Locale = 'es' | 'en';
export interface L10n { es: string; en: string }
export const tr = (l: L10n, locale: Locale): string => (locale === 'en' ? l.en : l.es);

export type Severity = 'blocking' | 'warning' | 'suggestion' | 'info';
export type Category = 'security' | 'privacy' | 'bug' | 'perf' | 'style' | 'tests';
export type Origin = 'ai-sample' | 'local-rule';
export type CommentStatus = 'open' | 'applied' | 'dismissed' | 'resolved';
export type PRStatus = 'open' | 'inReview' | 'changesRequested' | 'approved' | 'merged';

export interface FileChange {
  path: string;
  oldCode: string[];
  newCode: string[];
  /** Números de línea reales (solo en diffs pegados, donde los hunks no empiezan en 1). */
  oldNumbers?: number[];
  newNumbers?: number[];
}

export interface ReviewComment {
  id: string;
  file: string;
  /** Línea (1-based) del código nuevo base a la que se ancla el comentario. */
  line: number;
  /** Última línea que reemplaza la sugerencia (por defecto, la misma `line`). */
  endLine?: number;
  severity: Severity;
  category: Category;
  origin: Origin;
  /** Regla del equipo (o regla local) que origina el comentario. */
  rule?: L10n;
  message: L10n;
  explanation: L10n;
  /** Texto que reemplaza las líneas [line, endLine]; puede tener saltos de línea. */
  fix?: string;
  /** Tipo de hallazgo de seguridad para los contadores (secreto o dependencia). */
  tag?: 'secret' | 'dependency';
}

export interface SuggestedTest {
  id: string;
  name: L10n;
  kind: 'unit' | 'integration';
  file: string;
  code: string;
}

export interface Advisory {
  id: string;
  severity: 'high' | 'medium' | 'low';
  summary: L10n;
  fixedIn: string;
  url: string;
}

export interface Dependency {
  name: string;
  from: string;
  to: string;
  license: string;
  advisory?: Advisory;
  /** Comentario cuya sugerencia sube la dependencia a la versión corregida. */
  fixCommentId?: string;
  /** Versión que queda si se aplica esa sugerencia. */
  fixedTo?: string;
}

export type EventKind =
  | 'opened' | 'aiReview' | 'localReview' | 'approved' | 'changesRequested' | 'merged'
  | 'applied' | 'dismissed' | 'resolved' | 'reopened' | 'testAdded' | 'testRemoved';

export interface PREvent {
  /** Fecha local "AAAA-MM-DDTHH:mm" (sin zona horaria: se muestra tal cual). */
  at: string;
  kind: EventKind;
  who: string;
  /** Dato extra: archivo:línea, número de hallazgos, nombre de la prueba… */
  detail?: string;
}

export interface PR {
  id: string;
  number: number;
  title: L10n;
  summary: L10n;
  repo: string;
  branch: string;
  author: string;
  reviewers: string[];
  status: PRStatus;
  openedAt: string;
  /** Minutos hasta el primer comentario de la IA (dato de ejemplo). */
  firstReviewMin?: number;
  commits: number;
  files: FileChange[];
  comments: ReviewComment[];
  tests: SuggestedTest[];
  dependencies?: Dependency[];
  events: PREvent[];
  /** Estado inicial de algunos comentarios (p. ej. una sugerencia ya aplicada). */
  initialCommentStatus?: Record<string, CommentStatus>;
  /** PR creado en la sesión a partir de un diff pegado (análisis local, sin IA). */
  userDiff?: boolean;
}

// ---------------------------------------------------------------------------
// Puntaje y riesgo
// ---------------------------------------------------------------------------

/** Puntos que resta cada hallazgo pendiente. Se muestra tal cual en la demo. */
export const PENALTY: Record<Severity, number> = { blocking: 15, warning: 8, suggestion: 3, info: 1 };
export const SEVERITY_ORDER: Severity[] = ['blocking', 'warning', 'suggestion', 'info'];

export function scoreFor(openSeverities: Severity[]): number {
  const total = openSeverities.reduce((acc, s) => acc + PENALTY[s], 0);
  return Math.max(0, 100 - total);
}

export type Risk = 'high' | 'medium' | 'low';
export function riskFor(openSeverities: Severity[]): Risk {
  if (openSeverities.includes('blocking')) return 'high';
  if (openSeverities.includes('warning')) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Código efectivo (con sugerencias aplicadas)
// ---------------------------------------------------------------------------

export interface DisplayLine { text: string; number: number; anchor?: number }

/**
 * Devuelve las líneas del código nuevo después de aplicar las sugerencias
 * indicadas. Cada línea conserva el índice base (`anchor`, 1-based) de la
 * entrada de la que sale, para anclar los comentarios aunque una sugerencia
 * agregue o quite líneas.
 */
export function effectiveNewLines(file: FileChange, appliedFixes: ReviewComment[]): DisplayLine[] {
  const entries: (string | null)[] = file.newCode.slice();
  const sorted = appliedFixes
    .filter((c) => c.file === file.path && c.fix !== undefined)
    .sort((a, b) => a.line - b.line);
  for (const c of sorted) {
    const start = c.line - 1;
    const end = (c.endLine ?? c.line) - 1;
    if (start < 0 || start >= entries.length) continue;
    entries[start] = c.fix as string;
    for (let i = start + 1; i <= end && i < entries.length; i++) entries[i] = null;
  }
  const out: DisplayLine[] = [];
  let running = 0;
  entries.forEach((entry, idx) => {
    if (entry === null) return;
    const base = file.newNumbers?.[idx];
    entry.split('\n').forEach((text, k) => {
      running += 1;
      out.push({
        text,
        number: base !== undefined ? base + k : running,
        anchor: k === 0 ? idx + 1 : undefined,
      });
    });
  });
  return out;
}

export function oldLines(file: FileChange): DisplayLine[] {
  return file.oldCode.map((text, i) => ({ text, number: file.oldNumbers?.[i] ?? i + 1 }));
}

/** Número de línea visible de un comentario (tras aplicar sugerencias). */
export function displayLineOf(lines: DisplayLine[], anchor: number): number {
  const hit = lines.find((l) => l.anchor === anchor);
  return hit ? hit.number : anchor;
}

// ---------------------------------------------------------------------------
// Diff por líneas (LCS)
// ---------------------------------------------------------------------------

export type DiffRow =
  | { type: 'ctx'; old: DisplayLine; new: DisplayLine }
  | { type: 'del'; old: DisplayLine }
  | { type: 'add'; new: DisplayLine }
  | { type: 'gap' };

export function diffRows(oldL: DisplayLine[], newL: DisplayLine[]): DiffRow[] {
  const n = oldL.length;
  const m = newL.length;
  // Tabla LCS (los archivos de la demo y los diffs pegados tienen ≤ 300 líneas).
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = oldL[i].text === newL[j].text ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && oldL[i].text === newL[j].text) {
      rows.push({ type: 'ctx', old: oldL[i], new: newL[j] });
      i++; j++;
    } else if (i < n && (j >= m || dp[i + 1][j] >= dp[i][j + 1])) {
      // Ante un empate se muestran primero las líneas borradas (como en git).
      rows.push({ type: 'del', old: oldL[i] });
      i++;
    } else {
      rows.push({ type: 'add', new: newL[j] });
      j++;
    }
  }
  // Separador entre hunks no contiguos (solo diffs pegados con números reales).
  const withGaps: DiffRow[] = [];
  let lastNew = 0;
  let lastOld = 0;
  for (const r of rows) {
    const nn = r.type === 'ctx' || r.type === 'add' ? r.new.number : undefined;
    const on = r.type === 'ctx' || r.type === 'del' ? r.old.number : undefined;
    const jump = (nn !== undefined && lastNew > 0 && nn > lastNew + 1) || (on !== undefined && lastOld > 0 && on > lastOld + 1);
    if (jump && withGaps.length > 0) withGaps.push({ type: 'gap' });
    if (nn !== undefined) lastNew = nn;
    if (on !== undefined) lastOld = on;
    withGaps.push(r);
  }
  return withGaps;
}

export function countChanges(rows: DiffRow[]): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const r of rows) {
    if (r.type === 'add') additions++;
    else if (r.type === 'del') deletions++;
  }
  return { additions, deletions };
}

export type PRSize = 'xs' | 's' | 'm' | 'l' | 'xl';
export function sizeFor(changed: number): PRSize {
  if (changed < 10) return 'xs';
  if (changed < 40) return 's';
  if (changed < 150) return 'm';
  if (changed < 400) return 'l';
  return 'xl';
}

// ---------------------------------------------------------------------------
// "Prueba con tu diff": lectura del texto pegado
// ---------------------------------------------------------------------------

export const MAX_INPUT_LINES = 300;
export const MAX_INPUT_CHARS = 60_000;

export interface ParsedInput {
  files: FileChange[];
  /** Por archivo, qué líneas del código nuevo son agregadas (las únicas que se analizan). */
  added: Record<string, boolean[]>;
  isDiff: boolean;
}

export type ParseError = 'empty' | 'tooManyLines' | 'tooLong' | 'noChanges';

export function looksLikeDiff(text: string): boolean {
  return /^(diff --git |--- |\+\+\+ |@@ )/m.test(text);
}

export function parseInput(
  text: string,
  fragmentName = 'fragmento-pegado',
): { ok: true; value: ParsedInput } | { ok: false; error: ParseError } {
  const trimmed = text.replace(/\s+$/, '');
  if (!trimmed.trim()) return { ok: false, error: 'empty' };
  if (trimmed.length > MAX_INPUT_CHARS) return { ok: false, error: 'tooLong' };
  const lines = trimmed.split(/\r?\n/);
  if (lines.length > MAX_INPUT_LINES) return { ok: false, error: 'tooManyLines' };

  if (!looksLikeDiff(trimmed)) {
    const path = fragmentName;
    return {
      ok: true,
      value: {
        files: [{ path, oldCode: [], newCode: lines }],
        added: { [path]: lines.map(() => true) },
        isDiff: false,
      },
    };
  }

  type Building = FileChange & { oldNumbers: number[]; newNumbers: number[] };
  const files: Building[] = [];
  const added: Record<string, boolean[]> = {};
  const st = { cur: null as Building | null, oldNo: 0, newNo: 0, remOld: 0, remNew: 0, hadHunk: false, pendingOldPath: null as string | null };

  const start = (path: string): Building => {
    let p = path;
    let k = 2;
    while (files.some((f) => f.path === p)) p = `${path} (${k++})`;
    const f: Building = { path: p, oldCode: [], newCode: [], oldNumbers: [], newNumbers: [] };
    files.push(f);
    added[p] = [];
    st.cur = f;
    st.remOld = 0;
    st.remNew = 0;
    st.hadHunk = false;
    return f;
  };
  const clean = (p: string) => p.replace(/^[ab]\//, '').replace(/\t.*$/, '').trim();
  const pushLine = (f: Building, raw: string) => {
    if (raw.startsWith('+')) {
      f.newCode.push(raw.slice(1));
      f.newNumbers.push(st.newNo++);
      added[f.path].push(true);
      st.remNew--;
    } else if (raw.startsWith('-')) {
      f.oldCode.push(raw.slice(1));
      f.oldNumbers.push(st.oldNo++);
      st.remOld--;
    } else {
      const text = raw.startsWith(' ') ? raw.slice(1) : raw; // contexto (o línea vacía)
      f.oldCode.push(text);
      f.oldNumbers.push(st.oldNo++);
      f.newCode.push(text);
      f.newNumbers.push(st.newNo++);
      added[f.path].push(false);
      st.remOld--;
      st.remNew--;
    }
  };

  for (const raw of lines) {
    if (raw.startsWith('diff --git ')) {
      const m = raw.match(/ b\/(.+)$/);
      start(m ? m[1].trim() : 'cambios');
      st.pendingOldPath = null;
      continue;
    }
    // Dentro de un hunk se respetan los conteos de la cabecera @@.
    if (st.cur && (st.remOld > 0 || st.remNew > 0)) {
      if (!raw.startsWith('\\')) pushLine(st.cur, raw); // "\ No newline at end of file"
      continue;
    }
    if (raw.startsWith('--- ')) {
      st.pendingOldPath = clean(raw.slice(4));
      continue;
    }
    if (raw.startsWith('+++ ')) {
      const p = clean(raw.slice(4));
      const path = p === '/dev/null' ? (st.pendingOldPath ?? 'cambios') : p;
      const c = st.cur;
      if (!c || c.newCode.length > 0 || c.oldCode.length > 0) start(path);
      else if (c.path !== path) {
        // Diff sin cabecera "diff --git": usa la ruta de "+++".
        added[path] = added[c.path];
        delete added[c.path];
        c.path = path;
      }
      continue;
    }
    const hunk = raw.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunk) {
      const f = st.cur ?? start('cambios');
      st.oldNo = Number(hunk[1]);
      st.remOld = hunk[2] !== undefined ? Number(hunk[2]) : 1;
      st.newNo = Number(hunk[3]);
      st.remNew = hunk[4] !== undefined ? Number(hunk[4]) : 1;
      st.hadHunk = true;
      st.cur = f;
      continue;
    }
    // Tolerancia: diffs editados a mano con conteos cortos.
    if (st.cur && st.hadHunk && /^[+\- ]/.test(raw)) pushLine(st.cur, raw);
  }

  const withChanges = files.filter((f) => (added[f.path] ?? []).some(Boolean) || f.oldCode.length !== f.newCode.length);
  if (withChanges.length === 0) return { ok: false, error: 'noChanges' };
  return { ok: true, value: { files: withChanges, added, isDiff: true } };
}

// ---------------------------------------------------------------------------
// Reglas locales (sin IA). Cada una se explica en la demo.
// ---------------------------------------------------------------------------

export interface LocalRule {
  id: string;
  severity: Severity;
  category: Category;
  name: L10n;
  message: L10n;
  explanation: L10n;
  /** Solo se evalúa en archivos de este tipo (por extensión). Vacío = todos. */
  only?: RegExp;
  test: (line: string, ctx: { prev: string[] }) => boolean;
  /** Corrección automática de la línea, si la regla la sabe hacer. */
  fix?: (line: string) => string | null;
}

const JS_TS = /\.(m?[jt]sx?|cjs)$/;
const TS_ONLY = /\.tsx?$/;
const LOOP_RE = /\b(for|while)\s*\(|\.forEach\(|\.map\(\s*async\b/;
const PERSONAL_RE = /\b(c[eé]dula|documento|nit|email|correo|tel[eé]fono|celular|password|contrase[ñn]a|tarjeta)\b/i;
const LOG_CALL_RE = /\b(console\.(log|info|warn|error|debug)|logger\.\w+|log\.\w+|print)\s*\(/;

export const LOCAL_RULES: LocalRule[] = [
  {
    id: 'secreto-en-codigo',
    severity: 'blocking',
    category: 'security',
    name: { es: 'Secreto escrito en el código', en: 'Secret written in the code' },
    message: { es: 'Parece un secreto (clave, token o contraseña) escrito en el código.', en: 'This looks like a secret (key, token or password) written in the code.' },
    explanation: {
      es: 'Queda en el historial de git aunque luego lo borres. Muévelo a una variable de entorno o a tu gestor de secretos y cámbialo (rótalo) si ya se publicó.',
      en: 'It stays in the git history even if you delete it later. Move it to an environment variable or your secrets manager and rotate it if it was already pushed.',
    },
    test: (l) =>
      /(api[_-]?key|secret|secreto|password|contrase[ñn]a|clave|token)\w*['"]?\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/i.test(l) ||
      /AKIA[0-9A-Z]{16}/.test(l) ||
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(l) ||
      /\b(mongodb(\+srv)?|postgres(ql)?|mysql|redis|amqp):\/\/[^:\s/]+:[^@\s]+@/i.test(l),
  },
  {
    id: 'tls-desactivado',
    severity: 'blocking',
    category: 'security',
    name: { es: 'Verificación TLS desactivada', en: 'TLS verification disabled' },
    message: { es: 'Se desactiva la verificación del certificado TLS.', en: 'TLS certificate verification is disabled.' },
    explanation: {
      es: 'Permite que alguien en la red se haga pasar por el servidor (ataque de intermediario). Si es un certificado interno, agrega su CA en lugar de desactivar la verificación.',
      en: 'It lets someone on the network impersonate the server (man-in-the-middle). If it is an internal certificate, add its CA instead of disabling verification.',
    },
    test: (l) => /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False/.test(l),
    fix: (l) => (/rejectUnauthorized\s*:\s*false/.test(l) ? l.replace(/rejectUnauthorized\s*:\s*false/, 'rejectUnauthorized: true') : null),
  },
  {
    id: 'eval',
    severity: 'blocking',
    category: 'security',
    only: JS_TS,
    name: { es: 'Ejecución de código dinámico', en: 'Dynamic code execution' },
    message: { es: 'eval o new Function ejecutan texto como código.', en: 'eval or new Function run text as code.' },
    explanation: {
      es: 'Si el texto llega del usuario, puede ejecutar cualquier cosa en tu servidor o en el navegador. Usa JSON.parse o un mapa de funciones permitidas.',
      en: 'If the text comes from the user, it can run anything on your server or in the browser. Use JSON.parse or a map of allowed functions.',
    },
    test: (l) => /\beval\s*\(|new Function\s*\(/.test(l),
  },
  {
    id: 'sql-concatenado',
    severity: 'blocking',
    category: 'security',
    name: { es: 'SQL armado con texto', en: 'SQL built from strings' },
    message: { es: 'La consulta SQL se arma concatenando valores.', en: 'The SQL query is built by concatenating values.' },
    explanation: {
      es: 'Es la puerta a una inyección SQL. Usa parámetros ($1, ?) o el constructor de consultas de tu ORM.',
      en: 'That is the door to SQL injection. Use parameters ($1, ?) or your ORM query builder.',
    },
    test: (l) => /\b(SELECT|INSERT|UPDATE|DELETE)\b[^;]*(\$\{|['"]\s*\+\s*\w)/i.test(l),
  },
  {
    id: 'jwt-sin-algoritmo',
    severity: 'warning',
    category: 'security',
    only: JS_TS,
    name: { es: 'JWT verificado sin fijar el algoritmo', en: 'JWT verified without pinning the algorithm' },
    message: { es: 'jwt.verify se llama sin la opción algorithms.', en: 'jwt.verify is called without the algorithms option.' },
    explanation: {
      es: 'Fija el algoritmo esperado para que no se acepten tokens firmados con otro (confusión de algoritmo).',
      en: 'Pin the expected algorithm so tokens signed with a different one are not accepted (algorithm confusion).',
    },
    test: (l) => /\bjwt\.verify\(/.test(l) && !/algorithms/.test(l),
    fix: (l) => {
      const m = l.match(/jwt\.verify\(([^,()]+),\s*([^,()]+(?:\([^()]*\))?[^,()]*)\)/);
      if (!m) return null;
      return l.replace(m[0], `jwt.verify(${m[1].trim()}, ${m[2].trim()}, { algorithms: ['HS256'] })`);
    },
  },
  {
    id: 'dato-personal-en-log',
    severity: 'warning',
    category: 'privacy',
    name: { es: 'Dato personal en los logs (Ley 1581)', en: 'Personal data in logs (Colombian Law 1581)' },
    message: { es: 'Se escribe un dato personal en los logs.', en: 'Personal data is written to the logs.' },
    explanation: {
      es: 'Cédulas, correos, teléfonos o contraseñas en los logs quedan copiados con otros permisos y otra retención (Ley 1581 de 2012). Registra solo una referencia que no identifique a la persona.',
      en: 'ID numbers, emails, phone numbers or passwords in logs get copied with different permissions and retention (Colombian Law 1581 of 2012). Log only a reference that does not identify the person.',
    },
    test: (l) => LOG_CALL_RE.test(l) && PERSONAL_RE.test(l),
  },
  {
    id: 'monto-con-decimales',
    severity: 'warning',
    category: 'bug',
    name: { es: 'Dinero con punto flotante', en: 'Money with floating point' },
    message: { es: 'Un monto de dinero se calcula con decimales de punto flotante.', en: 'A money amount is computed with floating-point decimals.' },
    explanation: {
      es: 'En binario 0,1 + 0,2 no es 0,3: aparecen diferencias de un peso entre sistemas. Maneja los montos en centavos (enteros) o con un tipo decimal.',
      en: 'In binary 0.1 + 0.2 is not 0.3: one-peso differences show up between systems. Handle amounts in cents (integers) or with a decimal type.',
    },
    test: (l) =>
      (/\b(parseFloat|toFixed)\b/.test(l) && /\b(monto|valor|precio|total|iva|saldo|subtotal|amount|price)\w*/i.test(l)) ||
      /\b(monto|valor|precio|total|iva|saldo|subtotal)\w*\s*\*\s*\d*\.\d+/i.test(l) ||
      /\b(float|double)\s+(monto|valor|precio|total|saldo)/i.test(l),
  },
  {
    id: 'consulta-en-bucle',
    severity: 'warning',
    category: 'perf',
    name: { es: 'Consulta dentro de un bucle (N+1)', en: 'Query inside a loop (N+1)' },
    message: { es: 'Parece una consulta a la base de datos dentro de un bucle.', en: 'This looks like a database query inside a loop.' },
    explanation: {
      es: 'Con N elementos son N consultas. Trae todo en una sola consulta (por ejemplo, con $in o IN (...)) y recórrela.',
      en: 'With N items that is N queries. Fetch everything in a single query (for example, with $in or IN (...)) and iterate it.',
    },
    test: (l, { prev }) =>
      /\bawait\b.*\.(find|findOne|findById|findMany|findUnique|query|select|get|fetch)\w*\(/.test(l) && prev.some((p) => LOOP_RE.test(p)),
  },
  {
    id: 'catch-vacio',
    severity: 'warning',
    category: 'bug',
    name: { es: 'Error silenciado', en: 'Swallowed error' },
    message: { es: 'Un catch vacío oculta el error.', en: 'An empty catch hides the error.' },
    explanation: {
      es: 'Si algo falla, nadie se entera. Registra el error o déjalo propagar.',
      en: 'If something fails, nobody finds out. Log the error or let it propagate.',
    },
    test: (l) => /catch\s*(\([^)]*\))?\s*\{\s*\}/.test(l),
  },
  {
    id: 'aleatorio-inseguro',
    severity: 'warning',
    category: 'security',
    only: JS_TS,
    name: { es: 'Aleatorio no criptográfico', en: 'Non-cryptographic randomness' },
    message: { es: 'Math.random() no sirve para tokens, códigos o contraseñas.', en: 'Math.random() is not suitable for tokens, codes or passwords.' },
    explanation: {
      es: 'Sus valores se pueden predecir. Usa crypto.randomUUID() o crypto.getRandomValues().',
      en: 'Its values can be predicted. Use crypto.randomUUID() or crypto.getRandomValues().',
    },
    test: (l) => /Math\.random\(\)/.test(l) && /(token|otp|c[oó]digo|code|clave|password|secret|pin)/i.test(l),
  },
  {
    id: 'igualdad-laxa',
    severity: 'suggestion',
    category: 'style',
    only: JS_TS,
    name: { es: 'Comparación con == o !=', en: 'Comparison with == or !=' },
    message: { es: 'Usa === y !== en lugar de == y !=.', en: 'Use === and !== instead of == and !=.' },
    explanation: {
      es: 'La comparación laxa convierte tipos ("0" == 0 es verdadero) y produce errores difíciles de ver.',
      en: 'Loose comparison coerces types ("0" == 0 is true) and causes hard-to-spot bugs.',
    },
    test: (l) => /[^=!<>]==[^=]|!=[^=]/.test(l.replace(/(['"`]).*?\1/g, '""')),
    fix: (l) => l.replace(/([^=!<>])==(?!=)/g, '$1===').replace(/!=(?!=)/g, '!=='),
  },
  {
    id: 'tipo-any',
    severity: 'suggestion',
    category: 'style',
    only: TS_ONLY,
    name: { es: 'Tipo any', en: 'any type' },
    message: { es: 'any desactiva la verificación de tipos.', en: 'any disables type checking.' },
    explanation: {
      es: 'Define una interfaz o usa unknown y valida el valor antes de usarlo.',
      en: 'Define an interface or use unknown and validate the value before using it.',
    },
    test: (l) => /:\s*any\b|\bas any\b|<any>/.test(l),
  },
  {
    id: 'http-sin-tls',
    severity: 'suggestion',
    category: 'security',
    name: { es: 'URL sin HTTPS', en: 'URL without HTTPS' },
    message: { es: 'Se llama a una URL con http:// (sin cifrar).', en: 'A URL is called over http:// (unencrypted).' },
    explanation: {
      es: 'Aunque sea una red interna, los datos viajan en claro. Usa https:// o deja la URL en la configuración.',
      en: 'Even on an internal network, the data travels in clear text. Use https:// or keep the URL in configuration.',
    },
    test: (l) => /['"`]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(l),
  },
  {
    id: 'console-log',
    severity: 'info',
    category: 'style',
    only: JS_TS,
    name: { es: 'console.log olvidado', en: 'Leftover console.log' },
    message: { es: 'Quedó un console.log en el código.', en: 'A console.log was left in the code.' },
    explanation: {
      es: 'Usa el logger del proyecto (con niveles) o quítalo antes de fusionar.',
      en: 'Use the project logger (with levels) or remove it before merging.',
    },
    test: (l) => /\bconsole\.log\(/.test(l) && !PERSONAL_RE.test(l),
  },
  {
    id: 'pendiente-todo',
    severity: 'info',
    category: 'style',
    name: { es: 'TODO o FIXME pendiente', en: 'Pending TODO or FIXME' },
    message: { es: 'Hay un TODO/FIXME en el código nuevo.', en: 'There is a TODO/FIXME in the new code.' },
    explanation: {
      es: 'Crea un ticket y enlázalo, o resuélvelo en este PR, para que no se pierda.',
      en: 'Create a ticket and link it, or solve it in this PR, so it does not get lost.',
    },
    test: (l) => /\b(TODO|FIXME|HACK)\b/.test(l),
  },
];

export interface LocalFinding {
  file: string;
  /** Índice base (1-based) de la línea en el código nuevo del archivo. */
  line: number;
  rule: LocalRule;
  fix?: string;
}

/** Analiza solo las líneas agregadas del texto pegado con las reglas locales. */
export function analyzeParsed(parsed: ParsedInput): LocalFinding[] {
  const findings: LocalFinding[] = [];
  for (const f of parsed.files) {
    const added = parsed.added[f.path] ?? [];
    f.newCode.forEach((line, idx) => {
      if (!added[idx]) return;
      const prev = f.newCode.slice(Math.max(0, idx - 3), idx);
      for (const rule of LOCAL_RULES) {
        // En un fragmento suelto no se sabe el lenguaje: se aplican todas las reglas.
        if (parsed.isDiff && rule.only && !rule.only.test(f.path)) continue;
        let hit = false;
        try {
          hit = rule.test(line, { prev });
        } catch {
          hit = false;
        }
        if (!hit) continue;
        const fixed = rule.fix ? rule.fix(line) : null;
        findings.push({ file: f.path, line: idx + 1, rule, fix: fixed && fixed !== line ? fixed : undefined });
      }
    });
  }
  return findings;
}

export function findingsToComments(prId: string, findings: LocalFinding[]): ReviewComment[] {
  return findings.map((f, i) => ({
    id: `${prId}-r${i + 1}`,
    file: f.file,
    line: f.line,
    severity: f.rule.severity,
    category: f.rule.category,
    origin: 'local-rule' as const,
    rule: f.rule.name,
    message: f.rule.message,
    explanation: f.rule.explanation,
    fix: f.fix,
    tag: f.rule.id === 'secreto-en-codigo' ? ('secret' as const) : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Formato determinista (sin toLocaleString ni zona horaria)
// ---------------------------------------------------------------------------

const MONTHS: Record<Locale, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "2026-10-07T16:40" → "7 oct 2026, 16:40" (es) / "Oct 7, 2026, 16:40" (en). */
export function formatStamp(at: string, locale: Locale): string {
  const m = at.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return at;
  const [, y, mo, d, hh, mm] = m;
  const month = MONTHS[locale][Number(mo) - 1] ?? mo;
  const day = String(Number(d));
  const time = hh ? `, ${hh}:${mm}` : '';
  return locale === 'en' ? `${month} ${day}, ${y}${time}` : `${day} ${month} ${y}${time}`;
}

/** Fecha local actual como "AAAA-MM-DDTHH:mm". Solo se llama desde eventos del usuario. */
export function nowStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatNumber(n: number, locale: Locale, decimals = 0): string {
  const fixed = n.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const sep = locale === 'en' ? ',' : '.';
  const neg = int.startsWith('-');
  const digits = neg ? int.slice(1) : int;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const out = (neg ? '-' : '') + grouped;
  return dec ? `${out}${locale === 'en' ? '.' : ','}${dec}` : out;
}

// ---------------------------------------------------------------------------
// Exportaciones (CSV y SBOM CycloneDX)
// ---------------------------------------------------------------------------

export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

export interface SbomInput {
  appName: string;
  dependencies: { name: string; version: string; license: string }[];
  vulnerabilities: { id: string; name: string; version: string; severity: string; fixedIn: string; url: string }[];
  timestamp: string;
}

export function buildCycloneDx(input: SbomInput): Record<string, unknown> {
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      timestamp: input.timestamp,
      component: { type: 'application', name: input.appName },
      properties: [{ name: 'koptup:demo', value: 'Datos de ejemplo de la demo /demo/code-review-ia' }],
    },
    components: input.dependencies.map((d) => ({
      type: 'library',
      'bom-ref': `pkg:npm/${d.name}@${d.version}`,
      name: d.name,
      version: d.version,
      purl: `pkg:npm/${d.name}@${d.version}`,
      licenses: [{ license: { id: d.license } }],
    })),
    vulnerabilities: input.vulnerabilities.map((v) => ({
      id: v.id,
      source: { name: 'NVD', url: v.url },
      ratings: [{ severity: v.severity }],
      recommendation: `Actualizar ${v.name} a ${v.fixedIn} o superior`,
      affects: [{ ref: `pkg:npm/${v.name}@${v.version}` }],
    })),
  };
}
