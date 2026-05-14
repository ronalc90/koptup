/**
 * Tipos comunes para los módulos demo enterprise.
 * Inmutables: usan readonly + Readonly<T> en lo posible.
 */

export interface BaseEntity {
  readonly id: string;
  readonly createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ListQuery {
  readonly q?: string;
  readonly status?: string;
  readonly limit?: string;
  readonly offset?: string;
}

export interface ListResult<T> {
  readonly items: ReadonlyArray<T>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export type CrudErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'INTERNAL';

export class DomainError extends Error {
  constructor(
    public readonly code: CrudErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
