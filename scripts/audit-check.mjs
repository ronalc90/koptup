#!/usr/bin/env node
/**
 * audit-check.mjs — revisión de dependencias de producción para el job
 * "Seguridad" de CI.
 *
 * Corre `npm audit --omit=dev --json` (o lee un JSON ya generado con
 * `--input <archivo>`) y FALLA si hay una alerta de severidad alta o crítica
 * que no esté en .github/audit-allowlist.json, o si la lista venció
 * (`revisarAntesDe`). Las alertas de la lista se muestran como aviso en cada
 * corrida para que no se olviden. Las de severidad baja o moderada no hacen
 * fallar el job.
 *
 * Uso: node scripts/audit-check.mjs [--input audit.json] [--allowlist ruta]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const allowlistPath = argValue('--allowlist') ?? path.join(root, '.github', 'audit-allowlist.json');
const inputPath = argValue('--input');
const BLOCKING = new Set(['high', 'critical']);

function readAudit() {
  if (inputPath) return JSON.parse(readFileSync(inputPath, 'utf8'));
  try {
    return JSON.parse(execFileSync('npm', ['audit', '--omit=dev', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } catch (err) {
    // npm audit sale con código 1 cuando encuentra alertas: el JSON viene en stdout.
    if (err && typeof err.stdout === 'string' && err.stdout.trim().startsWith('{')) return JSON.parse(err.stdout);
    throw err;
  }
}

const audit = readAudit();
if (audit.error) {
  console.error(`::error::npm audit no pudo consultar el registro: ${audit.error.summary ?? audit.error.code ?? 'error desconocido'}`);
  process.exit(1);
}

const allowlist = JSON.parse(readFileSync(allowlistPath, 'utf8'));
const allowed = new Map(Object.entries(allowlist.advisories ?? {}));
const reviewBy = allowlist.revisarAntesDe ? new Date(`${allowlist.revisarAntesDe}T23:59:59Z`) : null;

/** Alertas altas o críticas, una por identificador (GHSA). */
const findings = new Map();
for (const [pkg, vuln] of Object.entries(audit.vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    if (typeof via !== 'object' || !BLOCKING.has(via.severity)) continue;
    const id = String(via.url ?? '').split('/').pop() || `${pkg}-${via.source}`;
    if (!findings.has(id)) findings.set(id, { id, pkg, severity: via.severity, title: via.title });
  }
}

let failed = false;
for (const f of findings.values()) {
  if (allowed.has(f.id)) {
    console.log(`::warning::${f.pkg} (${f.severity}) ${f.id}: revisada y pendiente — ${allowed.get(f.id)}`);
  } else {
    console.log(`::error::${f.pkg} (${f.severity}) ${f.id}: ${f.title}. Actualiza la dependencia o, si no tiene arreglo sin un cambio mayor, revísala y agrégala a .github/audit-allowlist.json con el motivo.`);
    failed = true;
  }
}

if (reviewBy && Date.now() > reviewBy.getTime() && findings.size > 0) {
  console.log(`::error::La lista de alertas revisadas venció (${allowlist.revisarAntesDe}). Vuelve a revisarlas y actualiza la fecha en .github/audit-allowlist.json.`);
  failed = true;
}

const stale = [...allowed.keys()].filter((id) => !findings.has(id));
for (const id of stale) console.log(`::notice::${id} ya no aparece en npm audit: quítala de .github/audit-allowlist.json.`);

const counts = audit.metadata?.vulnerabilities ?? {};
console.log(
  `Dependencias de producción: ${counts.critical ?? 0} críticas, ${counts.high ?? 0} altas, ${counts.moderate ?? 0} moderadas, ${counts.low ?? 0} bajas. ` +
    `Altas o críticas sin revisar: ${[...findings.values()].filter((f) => !allowed.has(f.id)).length}.`,
);
process.exit(failed ? 1 : 0);
