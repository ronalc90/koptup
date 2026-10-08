/**
 * Configuración comercial del panel (Admin › Configuración). No existía un
 * backend para /admin/settings: la página guardaba en localStorage. Estas
 * rutas persisten en MongoDB (AppSetting, clave `commerce`).
 *
 *  /api/admin/settings
 *    GET /commerce   admin, sales, manager   { instruccionesTransferencia, anticipoPctPorDefecto,
 *                                              validezDiasPorDefecto, actualizadoEn, pagosEnLinea }
 *    PUT /commerce   admin                   { instruccionesTransferencia?, anticipoPctPorDefecto?, validezDiasPorDefecto? }
 *
 * `pagosEnLinea.wompi` dice si Wompi está activo (y por qué no), sin
 * exponer ninguna llave.
 */
import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRole } from '../middleware/access';
import { AuthRequest } from '../types';
import { SETTINGS_READ_ROLES, SETTINGS_WRITE_ROLES } from '../config/commerce';
import { CommerceSettingsSchema, getCommerceSettings, updateCommerceSettings, type CommerceSettings } from '../services/commerce-settings.service';
import { readWompiConfig } from '../services/wompi.service';
import { zodToAppError } from './demo-public.routes';

export const adminSettingsRouter = Router();

function onlinePayments() {
  const w = readWompiConfig();
  return { wompi: { activo: w.enabled, ambiente: w.config?.env ?? null, motivo: w.enabled ? null : w.reason ?? null } };
}

adminSettingsRouter.get(
  '/commerce',
  ...requireRole(...SETTINGS_READ_ROLES),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.json({ success: true, data: { ...(await getCommerceSettings()), pagosEnLinea: onlinePayments() } });
  }),
);

adminSettingsRouter.put(
  '/commerce',
  ...requireRole(...SETTINGS_WRITE_ROLES),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsed = CommerceSettingsSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw zodToAppError(parsed.error);
    const u = req.user!;
    const data = await updateCommerceSettings(parsed.data as Partial<CommerceSettings>, { id: u.id, email: u.email, role: u.role }, req);
    res.json({ success: true, message: 'Configuración guardada.', data: { ...data, pagosEnLinea: onlinePayments() } });
  }),
);
