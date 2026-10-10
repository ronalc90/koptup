import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import { submitContact, testWhatsApp, testEmail } from '../controllers/contact.controller';
import { strictRateLimiter } from '../middleware/rateLimiter';
import { devOnlyAdmin } from '../middleware/access';
import { CONTACT_QUOTE_MODALITIES, CONTACT_QUOTE_PLANS, CONTACT_QUOTE_TIERS, CONTACT_TIMELINES } from '../models/Contact';
import { PRICING_DATA } from '../data/pricing.data';

const router = Router();

/** Slug de los planes RAG en `quote.service` (el único que lleva `plan`). */
const RAG_QUOTE_SERVICE = 'sistema-rag';

/**
 * Servicios que se pueden cotizar desde /contact (apps/web/src/lib/contact-quote.ts):
 * los planes RAG, las soluciones del catálogo (la misma lista de
 * data/pricing.data.ts, sincronizada con la web) y los servicios que el portal
 * todavía enlaza sin nivel ni modalidad.
 */
const QUOTE_SERVICES = [
  RAG_QUOTE_SERVICE,
  ...PRICING_DATA.offerings.map((o) => o.slug),
  'agente-ia-ventas',
  'desarrollo-web',
  'auditoria-cups',
  'liquidacion',
];
const CATALOG_QUOTE_SERVICES = new Set(PRICING_DATA.offerings.map((o) => o.slug));

router.post(
  '/',
  strictRateLimiter,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('service').trim().notEmpty(),
    body('message').trim().notEmpty(),
    // Cotización (opcional): solo identificadores conocidos y coherentes entre
    // sí (el plan solo con los planes RAG; nivel y modalidad solo con una
    // solución del catálogo).
    body('quote').optional({ values: 'null' }).isObject(),
    body('quote.service').if(body('quote').exists({ values: 'null' })).isString().trim().isIn(QUOTE_SERVICES),
    body('quote.plan')
      .optional()
      .isIn([...CONTACT_QUOTE_PLANS])
      .custom((_value, { req }) => req.body?.quote?.service === RAG_QUOTE_SERVICE),
    body('quote.tier')
      .optional()
      .isIn([...CONTACT_QUOTE_TIERS])
      .custom((_value, { req }) => CATALOG_QUOTE_SERVICES.has(req.body?.quote?.service)),
    body('quote.modality')
      .optional()
      .isIn([...CONTACT_QUOTE_MODALITIES])
      .custom((_value, { req }) => CATALOG_QUOTE_SERVICES.has(req.body?.quote?.service)),
    // ¿Cuándo quieres empezar? (opcional; vacío = sin responder).
    body('timeline').optional({ values: 'falsy' }).isIn([...CONTACT_TIMELINES]),
  ],
  submitContact as RequestHandler
);

// Endpoints de prueba: no existen en producción; en desarrollo, solo admin.
router.post('/test-whatsapp', ...devOnlyAdmin, testWhatsApp as RequestHandler);
router.post('/test-email', ...devOnlyAdmin, testEmail as RequestHandler);

export default router;
