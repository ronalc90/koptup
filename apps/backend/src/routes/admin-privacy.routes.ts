/**
 * Admin › Privacidad (solo rol admin): derechos del titular, Ley 1581 de 2012.
 *
 *  POST /api/admin/privacy/search  { email }                → qué guarda el sistema de esa persona
 *  POST /api/admin/privacy/export  { email }                → lo mismo como archivo JSON
 *  POST /api/admin/privacy/erase   { email, confirmacion }  → supresión irreversible
 *
 * El email viaja en el cuerpo (no en la URL) para que no quede en los
 * registros de acceso. Cada consulta, exportación y supresión queda en la
 * bitácora sin datos personales (solo conteos; la supresión, con una
 * referencia aleatoria que el equipo le entrega al titular).
 */
import { Router, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRole } from '../middleware/access';
import type { AuthRequest } from '../types';
import { recordAudit } from '../services/audit.service';
import { erasePersonalData, erasureBlocks, findPersonalData, summarize } from '../services/privacy.service';
import { conversationTtlDays } from '../services/chatbot-store.service';
import { retentionMonths } from '../services/retention.service';

export const adminPrivacyRouter = Router();

const actorOf = (req: AuthRequest) => ({ id: req.user?.id ?? null, email: req.user?.email, role: req.user?.role });

adminPrivacyRouter.post(
  '/search',
  ...requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const findings = await findPersonalData(req.body?.email);
    const resumen = summarize(findings);
    await recordAudit({ actor: actorOf(req), accion: 'privacy.search', entidad: { tipo: 'Titular' }, detalle: { resumen }, req });
    const { correosBuscados, ...datos } = findings;
    res.json({
      success: true,
      data: {
        correosBuscados,
        resumen,
        bloqueos: erasureBlocks(findings),
        datos,
        plazos: { conservacionMeses: retentionMonths(), conversacionesChatbotDias: conversationTtlDays() },
      },
    });
  }),
);

adminPrivacyRouter.post(
  '/export',
  ...requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const findings = await findPersonalData(req.body?.email);
    const resumen = summarize(findings);
    await recordAudit({ actor: actorOf(req), accion: 'privacy.export', entidad: { tipo: 'Titular' }, detalle: { resumen }, req });
    const generadoEn = new Date().toISOString();
    res.setHeader('Content-Disposition', `attachment; filename="datos-titular-${generadoEn.slice(0, 10)}.json"`);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      responsable: 'KopTup',
      norma: 'Ley 1581 de 2012 (Colombia)',
      generadoEn,
      correosBuscados: findings.correosBuscados,
      resumen,
      datos: Object.fromEntries(Object.entries(findings).filter(([k]) => k !== 'correosBuscados')),
    });
  }),
);

adminPrivacyRouter.post(
  '/erase',
  ...requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await erasePersonalData(req.body?.email, req.body?.confirmacion, actorOf(req), req);
    res.json({ success: true, data: result });
  }),
);
