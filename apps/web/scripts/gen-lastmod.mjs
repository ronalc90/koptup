#!/usr/bin/env node
/**
 * Genera src/lib/sitemap-lastmod.json: la fecha de la última modificación de
 * cada URL del sitemap, tomada del historial de git de sus archivos.
 *
 * Se vuelve a ejecutar antes de desplegar cambios de páginas:
 *   node scripts/gen-lastmod.mjs
 *
 * Si una ruta no tiene historial (archivo nuevo sin commit), el script falla:
 * así no se publica una fecha inventada.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(webRoot, '..', '..');
const OUT = path.join(webRoot, 'src', 'lib', 'sitemap-lastmod.json');

// Demos de vitrina (lib/demo-showcase.ts): las únicas del sitemap.
const VITRINA = ['chatbot', 'helpdesk-ia', 'gestor-documentos', 'dashboard-ejecutivo', 'ecommerce'];

const W = 'apps/web/src';
const ROUTES = {
  '/': [`${W}/app/page.tsx`, `${W}/components/home`, `${W}/components/layout`, `${W}/components/seo`],
  '/rag': [`${W}/app/rag/page.tsx`, `${W}/lib/rag-page.ts`],
  '/rag/salud': [`${W}/app/rag/salud`],
  '/rag/legal': [`${W}/app/rag/legal`],
  '/rag/soporte': [`${W}/app/rag/soporte`],
  '/desarrollo-web-colombia': [`${W}/app/desarrollo-web-colombia`],
  '/chatbots-ia': [`${W}/app/chatbots-ia`],
  '/services': [`${W}/app/services`, `${W}/components/offerings`, `${W}/lib/services-catalog.ts`],
  '/demo': [`${W}/app/demo/page.tsx`, `${W}/app/demo/layout.tsx`, `${W}/components/demo`],
  '/solicitar-demo': [`${W}/app/solicitar-demo`],
  '/contact': [`${W}/app/contact`],
  '/about': [`${W}/app/about`],
  '/privacy': [`${W}/app/privacy`],
  '/terms': [`${W}/app/terms`],
  '/cookies': [`${W}/app/cookies`],
};
for (const slug of VITRINA) {
  ROUTES[`/demo/${slug}`] = [`${W}/app/demo/${slug}`, `${W}/lib/demo-showcase.ts`];
}

function lastCommitDate(paths) {
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) {
    throw new Error(`Sin historial de git para: ${paths.join(', ')}`);
  }
  return out;
}

const result = {};
for (const [route, paths] of Object.entries(ROUTES)) {
  result[route] = lastCommitDate(paths);
}
const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`escrito ${path.relative(repoRoot, OUT)} con ${Object.keys(sorted).length} rutas`);
