/**
 * Roles y permisos de la demo. El reducer vuelve a verificar cada permiso
 * (no basta con ocultar botones); en tu proyecto esta misma verificación la
 * hace el servidor del CMS.
 */
import type { Entry, RoleId } from './types';

export const PERMS = [
  'entry.create',
  'entry.editDraft',
  'entry.editAny',
  'entry.submit',
  'entry.approve',
  'entry.publish',
  'entry.unpublish',
  'entry.delete',
  'models.manage',
  'media.upload',
  'media.delete',
  'webhooks.manage',
] as const;
export type Perm = (typeof PERMS)[number];

const MATRIX: Record<RoleId, readonly Perm[]> = {
  writer: ['entry.create', 'entry.editDraft', 'entry.submit', 'media.upload'],
  editor: [
    'entry.create',
    'entry.editDraft',
    'entry.editAny',
    'entry.submit',
    'entry.approve',
    'entry.publish',
    'entry.unpublish',
    'entry.delete',
    'media.upload',
    'media.delete',
  ],
  admin: PERMS,
};

export function can(role: RoleId, perm: Perm): boolean {
  return MATRIX[role].includes(perm);
}

/**
 * Quien redacta edita borradores y entradas publicadas (editar una publicada
 * crea un borrador; el sitio sigue con la versión publicada). Mientras una
 * entrada está en revisión, aprobada o programada, solo edición y
 * administración pueden cambiarla.
 */
export function canEdit(role: RoleId, entry: Pick<Entry, 'status'>): boolean {
  if (can(role, 'entry.editAny')) return true;
  return can(role, 'entry.editDraft') && (entry.status === 'draft' || entry.status === 'published');
}

/** Quien redacta puede borrar sus propios borradores que nunca se publicaron. */
export function canDelete(role: RoleId, entry: Pick<Entry, 'authorId' | 'live' | 'status'>, userId: string): boolean {
  if (can(role, 'entry.delete')) return true;
  return role === 'writer' && entry.authorId === userId && !entry.live && entry.status === 'draft';
}
