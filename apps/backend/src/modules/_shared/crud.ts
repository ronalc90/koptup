/**
 * Helpers de CRUD in-memory + utilidades HTTP.
 * Aislan repetición sin convertirse en framework: cumplen SRP.
 */
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { BaseEntity, DomainError, ListResult } from './types';

let counter = 1000;
export const nextId = (prefix: string): string =>
  `${prefix}_${(++counter).toString(36)}${Date.now().toString(36).slice(-3)}`;

export const nowIso = (): string => new Date().toISOString();

export interface Filterable {
  readonly q?: string;
  readonly status?: string;
  readonly limit?: string;
  readonly offset?: string;
}

export function paginate<T extends BaseEntity>(
  collection: ReadonlyArray<T>,
  query: Filterable,
  matcher?: (item: T, q: string) => boolean,
): ListResult<T> {
  const limit = Math.min(Math.max(parseInt(query.limit ?? '50', 10) || 50, 1), 200);
  const offset = Math.max(parseInt(query.offset ?? '0', 10) || 0, 0);
  let filtered = collection.filter((it) => !it.deletedAt);

  if (query.status) {
    filtered = filtered.filter((it) => (it as unknown as Record<string, unknown>).status === query.status);
  }
  if (query.q && matcher) {
    const needle = query.q.toLowerCase();
    filtered = filtered.filter((it) => matcher(it, needle));
  }
  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);
  return { items, total, limit, offset };
}

export function findOrThrow<T extends BaseEntity>(
  collection: ReadonlyArray<T>,
  id: string,
  resource: string,
): T {
  const found = collection.find((it) => it.id === id && !it.deletedAt);
  if (!found) {
    throw new DomainError('NOT_FOUND', `${resource} ${id} no encontrado`);
  }
  return found;
}

export function softDelete<T extends BaseEntity>(item: T): T {
  return { ...item, deletedAt: nowIso(), updatedAt: nowIso() };
}

export function applyPatch<T extends BaseEntity>(item: T, patch: Partial<T>): T {
  const { id: _i, createdAt: _c, ...rest } = patch as Record<string, unknown>;
  return { ...item, ...(rest as Partial<T>), updatedAt: nowIso() };
}

/**
 * Validación liviana: chequea que cada key requerida exista en body.
 * Devuelve null si pasa, o string con error si no.
 */
export function requireFields(body: unknown, fields: ReadonlyArray<string>): string | null {
  if (!body || typeof body !== 'object') return 'Body inválido';
  const record = body as Record<string, unknown>;
  for (const f of fields) {
    const v = record[f];
    if (v === undefined || v === null || v === '') {
      return `Campo requerido: ${f}`;
    }
  }
  return null;
}

/**
 * Wrapper estándar para handlers async. Maneja DomainError + 500 con log.
 */
export function handle(
  fn: (req: Request, res: Response) => Promise<unknown>,
  module: string,
): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    try {
      const result = await fn(req, res);
      if (!res.headersSent && result !== undefined) {
        res.json({ success: true, data: result });
      }
    } catch (err) {
      if (err instanceof DomainError) {
        const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'VALIDATION' ? 400 : err.code === 'CONFLICT' ? 409 : 500;
        res.status(status).json({ success: false, error: err.code, message: err.message, details: err.details });
        return;
      }
      logger.error(`[${module}] error`, err as Error);
      res.status(500).json({ success: false, error: 'INTERNAL', message: 'Error interno' });
    }
  };
}
