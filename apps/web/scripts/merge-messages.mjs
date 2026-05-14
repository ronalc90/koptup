#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, '..', 'messages');
const SUBDIRS = ['demos', 'offerings'];
const LOCALES = ['es', 'en'];

function mergeSubdir(subdir, locale) {
  const dir = path.join(MESSAGES_DIR, subdir);
  if (!fs.existsSync(dir)) {
    console.warn(`[merge-messages] missing dir: ${dir}`);
    return {};
  }
  const out = {};
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(`.${locale}.json`));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    try {
      Object.assign(out, JSON.parse(raw));
    } catch (e) {
      console.error(`[merge-messages] invalid JSON in ${file}:`, e.message);
      process.exitCode = 1;
    }
  }
  return out;
}

for (const locale of LOCALES) {
  for (const subdir of SUBDIRS) {
    const merged = mergeSubdir(subdir, locale);
    const outPath = path.join(MESSAGES_DIR, `_${subdir}.${locale}.json`);
    fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    const keyCount = Object.keys(merged).length;
    console.log(`[merge-messages] wrote ${path.relative(process.cwd(), outPath)} (${keyCount} top-level keys)`);
  }
}
