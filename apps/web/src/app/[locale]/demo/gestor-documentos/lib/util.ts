/**
 * Utilidades puras: NIT con dígito de verificación (algoritmo DIAN),
 * retención por carpeta, tipos de archivo y CSV.
 */
import { addYears, dayOf } from './dates';
import type { DocItem, DocKind, PolicyKey, RetentionMap, RetentionRule, Stamp } from './types';

/* ------------------------------ NIT ------------------------------ */

const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dígito de verificación de un NIT colombiano (módulo 11 de la DIAN). */
export function nitCheckDigit(nit: string): number {
  const digits = nit.replace(/\D/g, '').split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * NIT_WEIGHTS[i], 0);
  const r = sum % 11;
  return r === 0 || r === 1 ? r : 11 - r;
}

/** "901482376" → "901.482.376-1" */
export function formatNit(nit: string): string {
  const base = nit.replace(/\D/g, '');
  return `${base.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${nitCheckDigit(base)}`;
}

/** Valida un NIT escrito con su dígito ("901.482.376-1"). */
export function isValidNit(text: string): boolean {
  const m = /^([\d.]+)-(\d)$/.exec(text.trim());
  return Boolean(m) && nitCheckDigit(m![1]) === Number(m![2]);
}

/* --------------------------- Retención --------------------------- */

export const POLICY_KEYS: PolicyKey[] = ['none', 'y1', 'y3', 'y5', 'y10', 'perm'];

const POLICY_YEARS: Record<PolicyKey, number | null> = { none: null, y1: 1, y3: 3, y5: 5, y10: 10, perm: null };

export const NO_RULE: RetentionRule = { policy: 'none', hold: false };

export function ruleFor(map: RetentionMap, folder: string): RetentionRule {
  return map[folder] ?? NO_RULE;
}

/** Hasta cuándo se conserva un documento: fecha, "permanente" o sin política. */
export function keepUntil(createdAt: Stamp, policy: PolicyKey): string | 'perm' | null {
  if (policy === 'perm') return 'perm';
  const years = POLICY_YEARS[policy];
  return years ? dayOf(addYears(createdAt, years)) : null;
}

/** Un documento en una carpeta con retención legal no se puede eliminar. */
export function isOnHold(map: RetentionMap, doc: Pick<DocItem, 'folder'>): boolean {
  return ruleFor(map, doc.folder).hold;
}

/* ----------------------------- Tipos ----------------------------- */

export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'csv'] as const;
export const ACCEPT_ATTR = '.pdf,.docx,.txt,.csv';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function kindFromName(name: string): DocKind {
  const ext = name.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'txt') return 'txt';
  if (ext === 'csv') return 'csv';
  return 'other';
}

export function kindFromMime(mime: string, name: string): DocKind {
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('word')) return 'docx';
  if (mime.includes('csv')) return 'csv';
  if (mime.startsWith('text/')) return kindFromName(name) === 'csv' ? 'csv' : 'txt';
  return kindFromName(name);
}

export type FileProblem = 'type' | 'size' | 'empty';

/** Valida un archivo antes de subirlo (las mismas reglas que el servidor). */
export function checkUpload(file: { name: string; size: number }): FileProblem | null {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) return 'type';
  if (file.size === 0) return 'empty';
  if (file.size > MAX_UPLOAD_BYTES) return 'size';
  return null;
}

/* ------------------------------ CSV ------------------------------ */

function csvCell(value: string | number | boolean | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con BOM (para que Excel lea bien las tildes) y separador coma. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

/** Descarga un archivo generado en el navegador. */
export function downloadBlob(content: BlobPart, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nombre de archivo seguro: sin tildes ni caracteres raros. */
export function safeFileName(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'documento'
  );
}

/** Identificador corto para la marca de agua ("WM-3F9A-21C7"). */
export function watermarkId(rand: () => number = Math.random): string {
  const hex = () => Math.floor(rand() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
  return `WM-${hex()}-${hex()}`;
}
