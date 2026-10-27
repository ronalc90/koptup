import type { Severidad } from '../_lib/motor';

export const VARIANTE_SEVERIDAD: Record<Severidad, 'danger' | 'warning' | 'info'> = {
  CRITICA: 'danger',
  ALTA: 'warning',
  MEDIA: 'info',
};
