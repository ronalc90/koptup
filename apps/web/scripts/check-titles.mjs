#!/usr/bin/env node
/**
 * Lista el `<title>` final de cada ruta de `src/app` en cada idioma (español
 * sin prefijo: `/about`; inglés con prefijo: `/en/about`) y verifica que:
 *   - no pase de MAX_TITLE_LENGTH caracteres (sufijo " | KopTup" incluido);
 *   - tenga el formato "<título de la página> | KopTup" (la marca una sola vez).
 *     Única excepción: la home puede usar "KopTup | <título>".
 *
 * De dónde salen los títulos. Las páginas cuelgan de `src/app/[locale]/` y casi
 * todos los layouts y pages arman su metadata en `generateMetadata` según el
 * idioma de la URL: con `pageMetadata('<clave>', locale)` de
 * `src/lib/seo-config.ts` (en /en, con los textos de `seo-config.en.ts`), con
 * `privatePageMetadata(t('…'))`, con `getTranslations(…)` de los mensajes es/en
 * o con constantes por idioma. En vez de reimplementar cada patrón leyendo el
 * AST, el script ejecuta el `generateMetadata` real (o lee el `metadata`
 * exportado) de cada layout y page, una vez por idioma:
 *   - transpila TypeScript al vuelo con `typescript` (sin chequear tipos) y
 *     resuelve el alias `@/` de tsconfig;
 *   - `next-intl/server` es un doble: `getLocale()` devuelve el idioma de la
 *     ruta y `getTranslations()` traduce con `createTranslator` de use-intl (el
 *     formateador de next-intl) sobre los mensajes que arma
 *     `src/i18n/request.ts`. Una clave que no existe es un error, no un texto
 *     de reemplazo;
 *   - los componentes (`.tsx` distintos del layout o page que se evalúa), los
 *     módulos de `next`, `next-intl` y React, y los estilos se cambian por
 *     sustitutos vacíos: la metadata no los usa. Si un título llegara a
 *     depender de uno, sale con la marca ⟦sustituto⟧ y la ruta falla.
 * Solo se cargan los layouts y pages que exportan `metadata` o
 * `generateMetadata` (lo dice el AST); los demás no aportan título.
 *
 * Luego simula cómo Next 15 resuelve `title.template` a lo largo de la
 * jerarquía de layouts (ver next/dist/lib/metadata/resolve-metadata.js): la
 * plantilla vigente para un segmento es la que dejó el segmento padre, y un
 * layout que define `title` como string corta la plantilla para sus hijos.
 * La página 404 (`not-found.tsx`) se revisa igual, como lo hace Next: los
 * layouts de la ruta y al final su metadata. Un page que solo llama a
 * `notFound()` (el comodín `[locale]/[...rest]`) nunca muestra metadata propia,
 * así que esa ruta se revisa con el título del 404, que es el que sirve.
 *
 * Segmentos dinámicos:
 *   - `[locale]` toma los idiomas de su `generateStaticParams` (es y en);
 *   - otro segmento con `generateStaticParams` usa esos valores;
 *   - si no, se evalúa con un valor de ejemplo. Si el `generateMetadata` lee
 *     ese parámetro, el título depende de él y el valor de ejemplo no dice
 *     nada: la ruta necesita valores reales en PARAM_VALUES (con el motivo) o
 *     falla.
 *
 * Además valida el título de cada clave de `seoConfig` en cada idioma, aunque
 * ninguna ruta la use, y que `seoConfigEn` no tenga claves que `pageMetadata`
 * nunca lee.
 *
 * Fuera de alcance: el título que pone en el navegador AreaDocumentTitle en
 * /admin y /dashboard (es de cliente; el HTML trae el del área, que sí se
 * revisa aquí).
 *
 * Uso: node scripts/check-titles.mjs [--verbose]
 *      (sale con código 1 si algún título no cumple)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const ts = require('typescript');

const BRAND = 'KopTup';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const APP_DIR = path.join(SRC, 'app');
const VERBOSE = process.argv.includes('--verbose');
const STUB_MARK = '⟦sustituto⟧';
const PLACEHOLDER_MARK = '⟦ejemplo⟧';

/**
 * Valores reales de los segmentos dinámicos cuyo título depende del parámetro
 * y que no tienen `generateStaticParams` (se generan en cada petición). La
 * clave es la carpeta de la ruta, relativa a src/app.
 */
const PARAM_VALUES = {
  // Pantalla "Solicita acceso" de una demo (force-dynamic): el título es
  // "<nombre de la demo>: acceso" con el nombre de la tabla de respaldo
  // DEMO_ACCESS_DEFAULTS (la misma semilla del backend). Se prueban todas.
  '[locale]/demo-acceso/[slug]': {
    slug: () => load('src/lib/demo-access-defaults.ts').DEMO_ACCESS_DEFAULTS.map((d) => d.slug),
  },
};

/** Formato "<título> | KopTup" (o "KopTup | <título>" solo en la home). */
function formatOk(title, isHome) {
  if (title.split(BRAND).length - 1 !== 1) return false;
  if (title.endsWith(` | ${BRAND}`) && title.length > BRAND.length + 3) return true;
  return isHome && title.startsWith(`${BRAND} | `) && title.length > BRAND.length + 3;
}

// --- Cargar TypeScript del proyecto ------------------------------------------
const COMPILER_OPTIONS = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  resolveJsonModule: true,
};
for (const ext of ['.ts', '.tsx']) {
  Module._extensions[ext] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: COMPILER_OPTIONS, fileName: filename });
    module._compile(outputText, filename);
  };
}

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, ...rest) {
  // Alias de tsconfig.json: "@/*" -> "./src/*" (los demás alias son casos de este).
  const target = request.startsWith('@/') ? path.join(SRC, request.slice(2)) : request;
  return originalResolve.call(this, target, ...rest);
};

/** Sustituto: se puede llamar, construir, leer y convertir a texto (con marca). */
function makeStub(name) {
  const label = `${STUB_MARK}(${name})`;
  const proxy = new Proxy(function stub() {}, {
    get(_target, key) {
      if (key === '__esModule') return true;
      if (key === 'then') return undefined; // `await sustituto` no se cuelga
      if (key === Symbol.toPrimitive || key === 'toString' || key === 'valueOf') return () => label;
      if (key === Symbol.iterator) return function* empty() {};
      return proxy;
    },
    apply: () => proxy,
    construct: () => proxy,
  });
  return proxy;
}

/** Paquetes que se sustituyen: la metadata no los necesita y algunos solo corren dentro de Next. */
function isStubbedPackage(request) {
  if (/^(next|react|react-dom|server-only|client-only)(\/|$)/.test(request)) return true;
  // next-intl/routing (defineRouting) es puro y lo usa src/i18n/routing.ts.
  return /^next-intl(\/|$)/.test(request) && request !== 'next-intl/routing';
}

const ASSET_RE = /\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf)$/i;
const entryFiles = new Set();
const stubbed = new Set();
const originalLoad = Module._load;
Module._load = function loadWithDoubles(request, parent, isMain) {
  if (request === 'next-intl/server') return intlServer;
  if (isStubbedPackage(request) || ASSET_RE.test(request)) {
    stubbed.add(request);
    return makeStub(request);
  }
  if (request.startsWith('.') || request.startsWith('@/') || path.isAbsolute(request)) {
    const file = Module._resolveFilename(request, parent, isMain);
    if (file.endsWith('.tsx') && !entryFiles.has(file)) {
      stubbed.add(path.relative(ROOT, file));
      return makeStub(path.relative(ROOT, file));
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};

function load(rel) {
  return require(path.join(ROOT, rel));
}

// --- Doble de next-intl/server ---------------------------------------------
// createTranslator de use-intl, resuelto desde next-intl (el que usa la web).
const { createTranslator } = createRequire(require.resolve('next-intl/server'))('use-intl/core');
let currentLocale = null;
const messagesByLocale = new Map();
let requestConfig = null; // default export de src/i18n/request.ts (getRequestConfig es la identidad)

async function messagesFor(locale) {
  if (!messagesByLocale.has(locale)) {
    const config = await requestConfig({ requestLocale: Promise.resolve(locale), locale });
    if (config.locale !== locale) throw new Error(`src/i18n/request.ts devolvió el idioma "${config.locale}" para "${locale}"`);
    messagesByLocale.set(locale, config.messages);
  }
  return messagesByLocale.get(locale);
}

function requestLocale() {
  if (!currentLocale) throw new Error('getLocale() sin idioma de ruta');
  return currentLocale;
}

const intlServerImpl = {
  __esModule: true,
  getRequestConfig: (fn) => fn,
  setRequestLocale: () => {},
  getLocale: async () => requestLocale(),
  getMessages: async (opts) => messagesFor(opts?.locale ?? requestLocale()),
  getTranslations: async (arg) => {
    const opts = typeof arg === 'string' || arg === undefined ? { namespace: arg } : arg;
    const locale = opts.locale ?? requestLocale();
    return createTranslator({
      locale,
      messages: await messagesFor(locale),
      namespace: opts.namespace,
      onError(error) {
        // Una clave inexistente o un mensaje mal formado no puede pasar como título.
        if (error.code !== 'ENVIRONMENT_FALLBACK') throw error;
      },
    });
  },
};
const intlServer = new Proxy(intlServerImpl, {
  get(target, key) {
    if (key in target || typeof key === 'symbol') return target[key];
    return () => {
      throw new Error(`next-intl/server.${String(key)} no está simulado en scripts/check-titles.mjs`);
    };
  },
});

// --- Next: resolución del título ----------------------------------------------
// Réplica de next/dist/lib/metadata/resolvers/resolve-title.js
function resolveTitle(title, stashedTemplate) {
  const apply = (tpl, s) => (tpl ? tpl.replace(/%s/g, s) : s);
  let resolved;
  const template = typeof title !== 'string' && title && 'template' in title ? title.template : null;
  if (typeof title === 'string') {
    resolved = apply(stashedTemplate, title);
  } else if (title) {
    if ('default' in title) resolved = apply(stashedTemplate, title.default);
    if ('absolute' in title && title.absolute) resolved = title.absolute;
  }
  if (title && typeof title !== 'string') return { template, absolute: resolved || '' };
  return { absolute: resolved || title || '', template };
}

/** Error si `title` no es un string ni un objeto { default, template, absolute } de strings. */
function checkTitleShape(title) {
  if (title === undefined || title === null || typeof title === 'string') return null;
  if (typeof title !== 'object') return `title es ${typeof title}`;
  for (const k of ['default', 'template', 'absolute']) {
    if (k in title && title[k] != null && typeof title[k] !== 'string') return `title.${k} es ${typeof title[k]}`;
  }
  return null;
}

function parse(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

const hasExport = (st) => st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
/** Nombres exportados de un archivo que importan aquí (metadata, generateMetadata, generateStaticParams). */
function exportedNames(file) {
  const names = new Set();
  if (!fs.existsSync(file)) return names;
  for (const st of parse(file).statements) {
    if (ts.isFunctionDeclaration(st) && hasExport(st) && st.name) names.add(st.name.text);
    if (ts.isVariableStatement(st) && hasExport(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) names.add(d.name.text);
    }
    if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) {
      for (const el of st.exportClause.elements) names.add(el.name.text);
    }
  }
  return names;
}

const exportsCache = new Map();
function exportsOf(file) {
  if (!exportsCache.has(file)) exportsCache.set(file, exportedNames(file));
  return exportsCache.get(file);
}

function loadEntry(file) {
  entryFiles.add(file);
  return require(file);
}

/**
 * Metadata que aporta un layout/page: undefined si no exporta ninguna.
 * `readParams` acumula los parámetros con valor de ejemplo que se leyeron.
 */
async function metadataOf(file, params, { isPage, parentTitle, locale, readParams }) {
  const names = exportsOf(file);
  if (!names.has('metadata') && !names.has('generateMetadata')) return undefined;
  const mod = loadEntry(file);
  if (typeof mod.generateMetadata !== 'function') return mod.metadata;
  const watched = new Proxy(params, {
    get(target, key) {
      if (typeof target[key] === 'string' && target[key].startsWith(PLACEHOLDER_MARK)) readParams.add(key);
      return target[key];
    },
  });
  const props = { params: Promise.resolve(watched) };
  if (isPage) props.searchParams = Promise.resolve({});
  currentLocale = locale;
  try {
    return await mod.generateMetadata(props, Promise.resolve({ title: parentTitle }));
  } finally {
    currentLocale = null;
  }
}

/**
 * Título final de una ruta. `items` son los archivos en el orden en que Next
 * arma la metadata (un item por segmento y el page al final), como
 * `{ file, isPage }`; `file: null` es un item vacío (segmento sin layout).
 */
async function titleOfRoute(items, params, locale) {
  let resolved = { absolute: '', template: null };
  let stashed = null;
  let source = '';
  const readParams = new Set();
  for (let i = 0; i < items.length; i++) {
    const { file, isPage } = items[i];
    const md = file ? await metadataOf(file, params, { isPage, parentTitle: resolved, locale, readParams }) : undefined;
    if (md && 'title' in md) {
      const shapeError = checkTitleShape(md.title);
      if (shapeError) throw new Error(`${path.relative(ROOT, file)}: ${shapeError}`);
      resolved = resolveTitle(md.title, stashed);
      source = path.relative(ROOT, file);
    }
    // La plantilla del layout hoja no se aplica a su propio page (Next se salta los dos últimos items).
    if (i < items.length - 2) stashed = resolved.template || null;
  }
  return { title: resolved.absolute, source, readParams };
}

// --- Rutas ----------------------------------------------------------------------
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name === 'api' || e.name.startsWith('_')) continue;
      walk(path.join(dir, e.name), acc);
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(e.name)) {
      acc.push({ dir, page: path.join(dir, e.name) });
    }
  }
  return acc;
}

function findFile(dir, base) {
  for (const ext of ['tsx', 'ts', 'jsx', 'js']) {
    const f = path.join(dir, `${base}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

const dynamicName = (segment) => segment.match(/^\[{1,2}(?:\.\.\.)?([^\]]+)\]{1,2}$/)?.[1] ?? null;

/**
 * Combinaciones de parámetros de una ruta (p. ej. [{ locale: 'es' }, { locale: 'en' }]).
 * Un parámetro sin valores conocidos lleva PLACEHOLDER_MARK.
 */
async function paramCombos(relDir) {
  let combos = [{}];
  const segments = relDir ? relDir.split(path.sep) : [];
  let cur = APP_DIR;
  for (const segment of segments) {
    cur = path.join(cur, segment);
    const name = dynamicName(segment);
    if (!name) continue;
    const routeKey = path.relative(APP_DIR, cur).split(path.sep).join('/');
    const next = [];
    for (const parent of combos) {
      let values = null;
      const withStatic = [findFile(cur, 'layout'), findFile(cur, 'page')].find((f) => f && exportsOf(f).has('generateStaticParams'));
      if (withStatic) {
        currentLocale = parent.locale ?? null;
        const list = await loadEntry(withStatic).generateStaticParams({ params: { ...parent } });
        currentLocale = null;
        values = list.map((p) => p[name]);
      } else if (PARAM_VALUES[routeKey]?.[name]) {
        values = await PARAM_VALUES[routeKey][name]();
      }
      if (values) {
        for (const v of values) next.push({ ...parent, [name]: v });
      } else {
        next.push({ ...parent, [name]: `${PLACEHOLDER_MARK}${name}` });
      }
    }
    combos = next;
  }
  return combos;
}

const { routing } = load('src/i18n/routing.ts');
requestConfig = load('src/i18n/request.ts').default;
const site = load('src/lib/site.ts');
const TITLE_TEMPLATE = site.TITLE_TEMPLATE;
const MAX = site.MAX_TITLE_LENGTH;
if (typeof TITLE_TEMPLATE !== 'string' || typeof MAX !== 'number') {
  console.error('No pude leer TITLE_TEMPLATE / MAX_TITLE_LENGTH de src/lib/site.ts');
  process.exit(2);
}

/** URL pública de una ruta: el idioma por defecto va sin prefijo (localePrefix "as-needed"). */
function publicPath(segments, params) {
  const parts = [];
  for (const segment of segments) {
    if (/^\(.*\)$/.test(segment)) continue; // grupo de rutas
    const name = dynamicName(segment);
    if (!name) {
      parts.push(segment);
      continue;
    }
    const value = params[name];
    if (name === 'locale' && routing.localePrefix !== 'always' && value === routing.defaultLocale) continue;
    parts.push(typeof value === 'string' && value.startsWith(PLACEHOLDER_MARK) ? segment : value);
  }
  return '/' + parts.join('/');
}

function layoutItems(segments) {
  const items = [{ file: findFile(APP_DIR, 'layout') }];
  let cur = APP_DIR;
  for (const s of segments) {
    cur = path.join(cur, s);
    items.push({ file: findFile(cur, 'layout') });
  }
  return items;
}

/**
 * ¿El page solo llama a `notFound()`? (p. ej. el comodín `[...rest]`, que
 * existe para que el 404 salga con el idioma de la URL). Esa ruta nunca
 * muestra metadata propia: su `<title>` es el de la página 404.
 */
function onlyCallsNotFound(file) {
  const sf = parse(file);
  const isDefault = (st) => hasExport(st) && st.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
  const fn = sf.statements.find((st) => ts.isFunctionDeclaration(st) && isDefault(st));
  const body = fn?.body?.statements;
  return (
    !!body?.length &&
    body.every(
      (st) =>
        ts.isExpressionStatement(st) &&
        ts.isCallExpression(st.expression) &&
        ts.isIdentifier(st.expression.expression) &&
        st.expression.expression.text === 'notFound',
    )
  );
}

/** not-found.tsx que atiende un segmento: el más profundo desde la raíz hasta él (como Next). */
function notFoundFor(segments) {
  let found = findFile(APP_DIR, 'not-found');
  let cur = APP_DIR;
  for (const s of segments) {
    cur = path.join(cur, s);
    found = findFile(cur, 'not-found') ?? found;
  }
  return found;
}

const rows = [];
async function checkRoute({ relDir, items, label, isHome }) {
  const segments = relDir ? relDir.split(path.sep) : [];
  for (const params of await paramCombos(relDir)) {
    const route = publicPath(segments, params) + (label ?? '');
    const row = { pattern: '/' + segments.join('/') + (label ?? ''), locale: params.locale, route, title: '', len: 0, note: '' };
    try {
      const { title, source, readParams } = await titleOfRoute(items, params, params.locale);
      row.title = title;
      row.note = source || 'ningún layout ni page define title';
      if (readParams.size) {
        row.error = `el título lee ${[...readParams].map((p) => `[${p}]`).join(', ')} y no hay valores para probarlo: agrégalos en PARAM_VALUES`;
      } else if (title.includes(STUB_MARK)) {
        row.error = `el título depende de un módulo sustituido: ${title}`;
      }
    } catch (err) {
      row.error = `error al evaluar la metadata: ${err?.message ?? err}`;
    }
    row.len = [...row.title].length;
    row.ok = !row.error && row.len <= MAX && formatOk(row.title, isHome);
    rows.push(row);
  }
}

// Página 404 (con errorConvention "not-found", Next arma los layouts de la ruta,
// el item vacío del page y al final la metadata de not-found.tsx).
const notFoundItems = (segments, file) => [...layoutItems(segments), { file: null }, { file }];
const checkedNotFound = new Set();

for (const { dir, page } of walk(APP_DIR).sort((a, b) => a.dir.localeCompare(b.dir))) {
  const relDir = path.relative(APP_DIR, dir);
  const segments = relDir ? relDir.split(path.sep) : [];
  const notFound = onlyCallsNotFound(page) ? notFoundFor(segments) : null;
  if (notFound) {
    checkedNotFound.add(notFound);
    await checkRoute({ relDir, items: notFoundItems(segments, notFound), label: ' (404)' });
    continue;
  }
  // Home: la carpeta del page no tiene segmentos de URL (solo el idioma o grupos).
  const isHome = segments.every((s) => s === '[locale]' || /^\(.*\)$/.test(s));
  await checkRoute({ relDir, items: [...layoutItems(segments), { file: page, isPage: true }], isHome });
}

// Los not-found.tsx que no atiende un comodín de arriba se revisan en su propio segmento.
function walkNotFound(dir, acc = []) {
  const nf = findFile(dir, 'not-found');
  if (nf) acc.push({ dir, file: nf });
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== 'api' && !e.name.startsWith('_')) walkNotFound(path.join(dir, e.name), acc);
  }
  return acc;
}
for (const { dir, file } of walkNotFound(APP_DIR)) {
  if (checkedNotFound.has(file)) continue;
  const relDir = path.relative(APP_DIR, dir);
  const segments = relDir ? relDir.split(path.sep) : [];
  await checkRoute({ relDir, items: notFoundItems(segments, file), label: ' (404)' });
}

// --- Salida -------------------------------------------------------------------
// Una ruta con muchos valores de un parámetro (p. ej. una por demo) muestra los
// que fallan y, si todos pasan, el título más largo.
const groups = new Map();
for (const r of rows) {
  const key = `${r.pattern}\0${r.locale}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}
const shown = [];
for (const list of groups.values()) {
  if (list.length === 1) {
    shown.push(list[0]);
    continue;
  }
  const failing = list.filter((r) => !r.ok);
  if (failing.length) {
    shown.push(...failing.map((r) => ({ ...r, extra: `${failing.length} de ${list.length} valores fallan` })));
  } else {
    const longest = list.reduce((a, b) => (b.len > a.len ? b : a));
    shown.push({ ...longest, extra: `el más largo de ${list.length} valores` });
  }
}

const w = Math.max(...shown.map((r) => r.route.length));
let failed = rows.filter((r) => !r.ok).length;
for (const r of shown) {
  console.log(`${r.ok ? '✓' : '✗'} ${String(r.len).padStart(3)}  ${r.route.padEnd(w)}  ${r.title}${r.extra ? `  (${r.extra})` : ''}`);
  if (r.error) console.log(`      ↳ ${r.error}`);
  else if (VERBOSE) console.log(`      ↳ ${r.note}`);
}

// Títulos de seoConfig en cada idioma, los use o no una ruta (con la plantilla del sitio).
const { seoConfig, pageMetadata } = load('src/lib/seo-config.ts');
const { seoConfigEn } = load('src/lib/seo-config.en.ts');
let seoChecked = 0;
for (const locale of routing.locales) {
  for (const key of Object.keys(seoConfig)) {
    const { title } = pageMetadata(key, locale);
    const final = resolveTitle(title, TITLE_TEMPLATE).absolute;
    const len = [...final].length;
    seoChecked++;
    if (len > MAX || !formatOk(final, false)) {
      failed++;
      console.log(`✗ ${String(len).padStart(3)}  seoConfig['${key}'] (${locale})  ${final}`);
    }
  }
}
for (const key of Object.keys(seoConfigEn)) {
  if (!(key in seoConfig)) {
    failed++;
    console.log(`✗      seoConfigEn['${key}']  no existe en seoConfig: pageMetadata nunca usa este título`);
  }
}

const locales = routing.locales.join(', ');
console.log(
  `\n${rows.length} títulos de ${groups.size} rutas por idioma (${locales}) y ${seoChecked} de seoConfig revisados. ` +
    `Formato "<título> | ${BRAND}", máximo ${MAX} caracteres.`,
);
if (VERBOSE) console.log(`Sustituidos: ${[...stubbed].sort().join(', ')}`);
if (failed) {
  console.error(`${failed} título(s) no cumplen el formato o superan el máximo.`);
  process.exit(1);
}
