import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import { submitContact } from '../controllers/contact.controller';
import { strictRateLimiter } from '../middleware/rateLimiter';
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

/**
 * POST /api/contact — formulario de /contact. Cupo de 5 envíos por minuto e
 * IP. El controlador descarta en silencio a los bots (campo trampa
 * `website`), exige la autorización de datos (`consentimiento: true`, Ley
 * 1581) y responde los errores de validación con el campo que falló
 * (`fields` y `errores`).
 */
router.post(
  '/',
  strictRateLimiter,
  [
    body('name').trim().notEmpty().withMessage('Escribe tu nombre.').bail().isLength({ max: 120 }).withMessage('El nombre es muy largo (máximo 120 caracteres).'),
    body('email').trim().isEmail().withMessage('Escribe un email válido.').bail().isLength({ max: 254 }).withMessage('Escribe un email válido.').normalizeEmail(),
    body('phone').optional({ values: 'falsy' }).isString().trim().isLength({ max: 40 }).withMessage('El teléfono es muy largo (máximo 40 caracteres).'),
    body('company').optional({ values: 'falsy' }).isString().trim().isLength({ max: 160 }).withMessage('El nombre de la empresa es muy largo (máximo 160 caracteres).'),
    body('budget').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }).withMessage('Elige un presupuesto de la lista.'),
    body('service').trim().notEmpty().withMessage('Elige el servicio que te interesa.').bail().isLength({ max: 300 }).withMessage('Elige el servicio que te interesa.'),
    body('message').trim().notEmpty().withMessage('Cuéntanos sobre tu proyecto.').bail().isLength({ max: 5000 }).withMessage('El mensaje es muy largo (máximo 5.000 caracteres).'),
    // Cotización (opcional): solo identificadores conocidos y coherentes entre
    // sí (el plan solo con los planes RAG; nivel y modalidad solo con una
    // solución del catálogo).
    body('quote').optional({ values: 'null' }).isObject().withMessage('La cotización no es válida.'),
    body('quote.service').if(body('quote').exists({ values: 'null' })).isString().trim().isIn(QUOTE_SERVICES).withMessage('La cotización no es válida.'),
    body('quote.plan')
      .optional()
      .isIn([...CONTACT_QUOTE_PLANS])
      .custom((_value, { req }) => req.body?.quote?.service === RAG_QUOTE_SERVICE)
      .withMessage('La cotización no es válida.'),
    body('quote.tier')
      .optional()
      .isIn([...CONTACT_QUOTE_TIERS])
      .custom((_value, { req }) => CATALOG_QUOTE_SERVICES.has(req.body?.quote?.service))
      .withMessage('La cotización no es válida.'),
    body('quote.modality')
      .optional()
      .isIn([...CONTACT_QUOTE_MODALITIES])
      .custom((_value, { req }) => CATALOG_QUOTE_SERVICES.has(req.body?.quote?.service))
      .withMessage('La cotización no es válida.'),
    // ¿Cuándo quieres empezar? (opcional; vacío = sin responder).
    body('timeline').optional({ values: 'falsy' }).isIn([...CONTACT_TIMELINES]).withMessage('Elige cuándo quieres empezar de la lista.'),
  ],
  submitContact as RequestHandler
);

// La prueba de los avisos ya no vive aquí: POST /api/admin/notifications/test
// (solo admin, también en producción; routes/admin-notifications.routes.ts).

export default router;
