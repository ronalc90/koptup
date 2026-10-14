'use client';

import { useEffect, useState } from 'react';
import { fetchSessionUser } from '@/hooks/useSessionUser';
import { apiRequest, hasSessionCookie, type DemoAccessDecision } from '@/lib/demo-system';

/**
 * Roles que el backend deja guardar la configuración del motor
 * (`PUT /api/expert/configuracion` exige `requireStaff`: `STAFF_ROLES` en
 * apps/backend/src/middleware/access.ts). El resto de cuentas que abren la demo
 * (prospectos invitados y el rol developer) pueden editar y simular, pero no
 * guardar, porque la configuración es una sola y compartida.
 */
const ROLES_QUE_GUARDAN = ['admin', 'manager', 'sales'];

/** Demo hermana donde se ve la lectura de facturas con IA. */
export const SLUG_OTRA_DEMO = 'cuentas-medicas';

/**
 * - `si` / `no`: lo dijo el backend.
 * - `desconocido`: el backend no respondió; el servidor decide al guardar.
 */
export type Permiso = 'cargando' | 'si' | 'no' | 'desconocido';

export interface Permisos {
  /** Si la cuenta puede guardar la configuración del servidor. */
  guardar: Permiso;
  /** Si la cuenta puede abrir la otra demo (staff o invitación propia). */
  otraDemo: Permiso;
}

/** Rol de la sesión y acceso a la otra demo, leídos del backend al montar. */
export function usePermisos(): Permisos {
  const [permisos, setPermisos] = useState<Permisos>({ guardar: 'cargando', otraDemo: 'cargando' });

  useEffect(() => {
    let vigente = true;

    fetchSessionUser().then((sesion) => {
      if (!vigente) return;
      const guardar: Permiso =
        sesion.status === 'ok'
          ? ROLES_QUE_GUARDAN.includes(sesion.user.role)
            ? 'si'
            : 'no'
          : sesion.status === 'unauthenticated'
            ? 'no'
            : 'desconocido';
      setPermisos((p) => ({ ...p, guardar }));
    });

    // `registrar=0`: consultar el acceso no cuenta como visita a la otra demo.
    apiRequest<DemoAccessDecision>(`/demo-access/${SLUG_OTRA_DEMO}?registrar=0`, { auth: hasSessionCookie() })
      .then((d) => {
        if (vigente) setPermisos((p) => ({ ...p, otraDemo: d.allowed ? 'si' : 'no' }));
      })
      .catch(() => {
        if (vigente) setPermisos((p) => ({ ...p, otraDemo: 'desconocido' }));
      });

    return () => {
      vigente = false;
    };
  }, []);

  return permisos;
}
