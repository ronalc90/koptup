/**
 * admin-notifications.routes.ts — avisos al dueño desde el panel
 * (Configuración › Avisos de nuevos contactos). No depende de
 * COMMERCE_ENABLED. Se monta en /api/admin/notifications ANTES de
 * /api/admin.
 *
 *  - GET  /status (admin y manager): estado de cada canal sin secretos
 *    (proveedor, configurado, destino enmascarado, último éxito/fallo/error,
 *    qué falta) y el latido mensual.
 *  - POST /test (solo admin, 5 cada 15 min por cuenta): envía un aviso de
 *    prueba real por los dos canales y devuelve el resultado de cada uno.
 *    Queda en la bitácora (`notifications.test`).
 */
import { Response, Router } from 'express';
import { requireAdmin, requireRole } from '../middleware/access';
import { asyncHandler } from '../middleware/errorHandler';
import { notifyTestRateLimiter } from '../middleware/rateLimiter';
import { getNotificationStatus, sendOwnerTestNotice } from '../services/owner-notify.service';
import { recordAudit } from '../services/audit.service';
import type { AuthRequest } from '../types';

export const adminNotificationsRouter = Router();

adminNotificationsRouter.get(
  '/status',
  ...requireRole('admin', 'manager'),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.json({ success: true, data: await getNotificationStatus() });
  }),
);

adminNotificationsRouter.post(
  '/test',
  ...requireAdmin,
  notifyTestRateLimiter,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await sendOwnerTestNotice('prueba');
    await recordAudit({
      actor: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      accion: 'notifications.test',
      entidad: { tipo: 'Notificaciones' },
      detalle: {
        email: { configurado: result.email.configurado, enviado: result.email.enviado },
        whatsapp: { configurado: result.whatsapp.configurado, enviado: result.whatsapp.enviado, respaldo: result.whatsapp.respaldo ?? null },
      },
      req,
    });
    res.json({ success: true, data: result });
  }),
);
