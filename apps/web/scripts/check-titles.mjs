#!/usr/bin/env node
/**
 * Lista el `<title>` final de cada ruta de `src/app` y verifica que:
 *   - no pase de MAX_TITLE_LENGTH caracteres (sufijo " | KopTup" incluido);
 *   - tenga el formato "<título de la página> | KopTup" (la marca una sola vez).
 *     Única excepción: la home puede usar "KopTup | <título>".
 *
 * Lee por AST (sin ejecutar TypeScript):
 *   - `TITLE_TEMPLATE` y `MAX_TITLE_LENGTH` de `src/lib/site.ts`;
 *   - los títulos de `seoConfig` en `src/lib/seo-config.ts`;
 *   - `export const metadata` de cada `layout.tsx` / `page.tsx`, ya sea un
 *     objeto literal o una llamada `generateMetadata('<clave de seoConfig>')`.
 *
 * Luego simula cómo Next 14 resuelve `title.template` a lo largo de la
 * jerarquía de layouts (ver next/dist/lib/metadata/resolve-metadata.js): la
 * plantilla vigente para un segmento es la que dejó el segmento padre, y un
 * layout que define `title` como string corta la plantilla para sus hijos.
 *
 * Uso: node scripts/check-titles.mjs [--verbose]
 *      (sale con código 1 si algún título no cumple)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const BRAND = 'KopTup';

/** Formato "<título> | KopTup" (o "KopTup | <título>" solo en la home). */
function formatOk(title, route) {
  if (title.split(BRAND).length - 1 !== 1) return false;
  if (title.endsWith(` | ${BRAND}`) && title.length > BRAND.length + 3) return true;
  return route === '/' && title.startsWith(`${BRAND} | `) && title.length > BRAND.length + 3;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = path.join(ROOT, 'src/app');

function parse(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function unwrap(node) {
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression?.(node) || ts.isParenthesizedExpression(node))) {
    node = node.expression;
  }
  return node;
}

function literal(node) {
  node = unwrap(node);
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  return undefined;
}

function propName(p) {
  if (!p.name) return undefined;
  if (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) return p.name.text;
  return undefined;
}

function getProp(obj, name) {
  return obj.properties.find((p) => ts.isPropertyAssignment(p) && propName(p) === name)?.initializer;
}

function exportedConst(sf, name) {
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === name) return unwrap(d.initializer);
    }
  }
  return undefined;
}

// --- site.ts ---------------------------------------------------------------
const siteSf = parse(path.join(ROOT, 'src/lib/site.ts'));
const TITLE_TEMPLATE = literal(exportedConst(siteSf, 'TITLE_TEMPLATE'));
const MAX = literal(exportedConst(siteSf, 'MAX_TITLE_LENGTH'));
if (typeof TITLE_TEMPLATE !== 'string' || typeof MAX !== 'number') {
  console.error('No pude leer TITLE_TEMPLATE / MAX_TITLE_LENGTH de src/lib/site.ts');
  process.exit(2);
}

// --- seo-config.ts -----------------------------------------------------------
const seoSf = parse(path.join(ROOT, 'src/lib/seo-config.ts'));
const seoObj = exportedConst(seoSf, 'seoConfig');
const seoTitles = {};
for (const p of seoObj.properties) {
  if (!ts.isPropertyAssignment(p) || !ts.isObjectLiteralExpression(unwrap(p.initializer))) continue;
  seoTitles[propName(p)] = literal(getProp(unwrap(p.initializer), 'title'));
}

// --- metadata de cada layout/page -------------------------------------------
/**
 * Valor string de un nodo: literal, `TITLE_TEMPLATE` (importado de site.ts) o
 * una constante del mismo archivo inicializada con un literal.
 */
function resolveString(sf, node) {
  const lit = literal(node);
  if (lit !== undefined) return lit;
  const n = unwrap(node);
  if (n && ts.isIdentifier(n)) {
    if (n.text === 'TITLE_TEMPLATE') return TITLE_TEMPLATE;
    return literal(exportedConst(sf, n.text));
  }
  return undefined;
}

const usedKeys = new Set();
/** Devuelve `undefined` (sin title), un string, o { default, template, absolute }. */
function titleOf(file) {
  if (!fs.existsSync(file)) return { title: undefined };
  const sf = parse(file);
  const hasGenerate = sf.statements.some(
    (st) => ts.isFunctionDeclaration(st) && st.name?.text === 'generateMetadata',
  );
  if (hasGenerate) return { dynamic: true };
  const init = exportedConst(sf, 'metadata');
  if (!init) return { title: undefined };
  if (ts.isCallExpression(init) && ts.isIdentifier(init.expression) && init.expression.text === 'generateMetadata') {
    const key = literal(init.arguments[0]);
    if (!(key in seoTitles)) return { error: `clave "${key}" no existe en seoConfig` };
    usedKeys.add(key);
    // seo-config.generateMetadata devuelve { default, template: TITLE_TEMPLATE }.
    return { title: { default: seoTitles[key], template: TITLE_TEMPLATE }, source: `seoConfig['${key}']` };
  }
  if (!ts.isObjectLiteralExpression(init)) return { dynamic: true };
  const t = getProp(init, 'title');
  if (!t) return { title: undefined };
  const tv = unwrap(t);
  if (ts.isObjectLiteralExpression(tv)) {
    const o = {};
    for (const k of ['default', 'template', 'absolute']) {
      const v = getProp(tv, k);
      if (v) {
        const lit = resolveString(sf, v);
        if (lit === undefined) return { dynamic: true };
        o[k] = lit;
      }
    }
    return { title: o };
  }
  const lit = resolveString(sf, tv);
  return lit === undefined ? { dynamic: true } : { title: lit };
}

// Réplica de next/dist/lib/metadata/resolvers/resolve-title.js
function resolveTitle(title, stashed) {
  const apply = (tpl, s) => (tpl ? tpl.replace(/%s/g, s) : s);
  if (typeof title === 'string') return { absolute: apply(stashed, title), template: null };
  let resolved;
  if ('default' in title) resolved = apply(stashed, title.default);
  if (title.absolute) resolved = title.absolute;
  return { absolute: resolved || '', template: title.template ?? null };
}

// --- recorrer rutas ------------------------------------------------------------
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name === 'api' || e.name.startsWith('_')) continue;
      walk(path.join(dir, e.name), acc);
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(e.name)) {
      acc.push(dir);
    }
  }
  return acc;
}

const rows = [];
let failed = 0;
for (const dir of walk(APP_DIR).sort()) {
  const rel = path.relative(APP_DIR, dir);
  const segments = rel ? rel.split(path.sep) : [];
  // Items como los arma Next: un item por segmento (su layout, si existe) + el page.
  const items = [path.join(APP_DIR, 'layout.tsx')];
  let cur = APP_DIR;
  for (const s of segments) {
    cur = path.join(cur, s);
    items.push(path.join(cur, 'layout.tsx'));
  }
  items.push(path.join(dir, 'page.tsx'));

  let resolved = { absolute: '', template: null };
  let stashed = null;
  let note = '';
  for (let i = 0; i < items.length; i++) {
    const r = titleOf(items[i]);
    if (r.error) note = r.error;
    if (r.dynamic) note = `generateMetadata dinámico en ${path.relative(ROOT, items[i])}`;
    if (r.title !== undefined) {
      resolved = resolveTitle(r.title, stashed);
      note = path.relative(ROOT, items[i]) + (r.source ? ` (${r.source})` : '');
    }
    if (i < items.length - 2) stashed = resolved.template || null;
  }
  const route = '/' + segments.join('/');
  const len = [...resolved.absolute].length;
  const over = len > MAX || !formatOk(resolved.absolute, route);
  if (over) failed++;
  rows.push({ route, len, over, title: resolved.absolute, note });
}

const w = Math.max(...rows.map((r) => r.route.length));
for (const r of rows) {
  console.log(`${r.over ? '✗' : '✓'} ${String(r.len).padStart(3)}  ${r.route.padEnd(w)}  ${r.title}`);
  if (process.argv.includes('--verbose')) console.log(`      ↳ ${r.note}`);
}

// Títulos de seoConfig que no usa ninguna ruta (igual se validan).
for (const [key, t] of Object.entries(seoTitles)) {
  if (usedKeys.has(key)) continue;
  const final = TITLE_TEMPLATE.replace(/%s/g, t);
  const len = [...final].length;
  if (len > MAX || !formatOk(final, null)) {
    failed++;
    console.log(`✗ ${String(len).padStart(3)}  seoConfig['${key}']  ${final}`);
  }
}

console.log(`\n${rows.length} rutas revisadas. Formato "<título> | ${BRAND}", máximo ${MAX} caracteres.`);
if (failed) {
  console.error(`${failed} título(s) no cumplen el formato o superan el máximo.`);
  process.exit(1);
}
