/**
 * access.ts — políticas de autorización del lado del servidor.
 *
 * Cada ruta montada en `src/index.ts` declara una de estas políticas (ver el
 * inventario en `src/routes/POLICIES.md`):
 *
 *  - pública ............ sin middleware (con rate-limit / tope de gasto si usa IA)
 *  - autenticado ........ `authenticate` (JWT válido)
 *  - dueño del recurso .. `authenticate` + verificación en el controlador
 *  - staff .............. `requireStaff` (admin | manager | sales, rol leído de la BD)
 *  - admin .............. `requireAdmin` (rol leído de la BD)
 *  - acceso a demo ...... `requireStaffOrDemoAccess(slug)`
 *  - solo desarrollo .... `devOnlyAdmin` (404 en producción, admin en desarrollo)
 *
 * Los roles de staff y admin se vuelven a leer de MongoDB en cada petición:
 * si a alguien le quitan el rol o se borra su cuenta, deja de tener acceso de
 * inmediato aunque su token siga vigente.
 */
import { NextFunction, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { authenticate } from './auth';

/** Roles del equipo de KopTup con acceso a herramientas internas. */
export const STAFF_ROLES = ['admin', 'manager', 'sales'] as const;

export function isStaffRole(role: string | undefined | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export interface TokenUser {
  id: string;
  email: string;
  role: string;
  name?: string;
}

type BearerResult =
  | { user: TokenUser; error?: undefined }
  | { user?: undefined; error: 'missing' | 'expired' | 'invalid' | 'no_secret' };

/** Lee y verifica el `Authorization: Bearer` sin responder (no falla). */
export function readBearer(req: AuthRequest): BearerResult {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return { error: 'missing' };
  const secret = process.env.JWT_SECRET;
  if (!secret) return { error: 'no_secret' };
  try {
    const decoded = jwt.verify(header.substring(7), secret) as TokenUser;
    if (!decoded || typeof decoded.id !== 'string') return { error: 'invalid' };
    return { user: { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name } };
  } catch (err) {
    return { error: err instanceof jwt.TokenExpiredError ? 'expired' : 'invalid' };
  }
}

/** Autenticación opcional: si hay un token válido llena `req.user`; si no, sigue como anónimo. */
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const result = readBearer(req as AuthRequest);
  if (result.user) (req as AuthRequest).user = result.user;
  next();
};

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Usuario vigente según la BD. `null` si la cuenta no existe;
 * `'db_unavailable'` si MongoDB no está conectado (se falla cerrado).
 */
export async function loadFreshUser(id: string): Promise<TokenUser | null | 'db_unavailable'> {
  if (!isDbReady()) return 'db_unavailable';
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  try {
    const user = await User.findById(id).select('email role name').lean();
    if (!user) return null;
    return { id: String(user._id), email: user.email, role: user.role, name: user.name };
  } catch (err) {
    logger.warn(`[access] No se pudo leer el usuario: ${(err as Error)?.message ?? err}`);
    return 'db_unavailable';
  }
}

function sendDbUnavailable(res: Response): void {
  res.status(503).json({
    success: false,
    code: 'service_unavailable',
    message: 'El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.',
  });
}

/**
 * Exige uno de los roles indicados, leyendo el rol vigente de la BD
 * (401 sin sesión, 403 sin el rol, 503 si la BD no responde).
 */
export function requireRole(...roles: string[]): RequestHandler[] {
  const check: RequestHandler = async (req, res, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const fresh = await loadFreshUser(authReq.user.id);
    if (fresh === 'db_unavailable') {
      sendDbUnavailable(res);
      return;
    }
    if (!fresh) {
      res.status(401).json({ success: false, message: 'Tu sesión ya no es válida. Inicia sesión de nuevo.' });
      return;
    }
    if (!roles.includes(fresh.role)) {
      res.status(403).json({ success: false, message: 'Forbidden - Insufficient permissions' });
      return;
    }
    authReq.user = { ...authReq.user, role: fresh.role, email: fresh.email, name: fresh.name };
    next();
  };
  return [authenticate as RequestHandler, check];
}

/** Staff de KopTup: admin, manager o sales. */
export const requireStaff: RequestHandler[] = requireRole(...STAFF_ROLES);

/** Solo administradores. */
export const requireAdmin: RequestHandler[] = requireRole('admin');

/**
 * Rutas de prueba y diagnóstico: no existen en producción (404) y en
 * desarrollo solo las usa un admin.
 */
export const devOnlyAdmin: RequestHandler[] = [
  (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, message: 'Endpoint not found' });
      return;
    }
    next();
  },
  ...requireAdmin,
];

// ---------------------------------------------------------------------------
//   Acceso a demos
// ---------------------------------------------------------------------------

export type DemoAccessMode = 'publico' | 'solicitud' | 'privado';

/**
 * Modo de acceso por defecto de cada demo (semilla del sistema de demos).
 * La fase P4 los guarda en la BD y los hace editables desde el admin; esta
 * tabla es el valor inicial y el respaldo mientras no exista ese registro.
 */
export const DEFAULT_DEMO_ACCESS_MODES: Readonly<Record<string, DemoAccessMode>> = {
  chatbot: 'publico',
  'code-review-ia': 'publico',
  'crm-ia': 'publico',
  'helpdesk-ia': 'publico',
  'facturacion-electronica': 'publico',
  pos: 'publico',
  ecommerce: 'publico',
  loyalty: 'publico',
  'control-proyectos': 'publico',
  'sistema-reservas': 'publico',
  'dashboard-ejecutivo': 'publico',
  'gestor-documentos': 'publico',
  'gestor-contenido': 'publico',
  automatizacion: 'publico',
  scraping: 'publico',
  'moderacion-contenido': 'publico',
  'saas-boilerplate': 'publico',
  'firma-electronica': 'publico',
  'voice-ai': 'solicitud',
  erp: 'solicitud',
  delivery: 'solicitud',
  hrms: 'solicitud',
  lms: 'solicitud',
  telemedicina: 'solicitud',
  'wms-logistica': 'solicitud',
  'linkedin-ads': 'solicitud',
  'cuentas-medicas': 'privado',
  'sistema-experto': 'privado',
};

export interface DemoAccessContext {
  slug: string;
  /** Usuario vigente (rol leído de la BD) o null si es anónimo. */
  user: TokenUser | null;
  req: AuthRequest;
}

export interface DemoAccessDecision {
  allowed: boolean;
  /**
   * staff: equipo de KopTup · public: demo en modo `publico` ·
   * grant: acceso concedido (P4) · login_required / no_access: denegado.
   */
  reason: 'staff' | 'public' | 'grant' | 'login_required' | 'no_access';
  /** Identificador del acceso concedido (lo llena el resolvedor de P4). */
  grantId?: string;
  /**
   * Motivo detallado del resolvedor de P4 (services/demo-access.service.ts):
   * `publico`, `grant`, `sin_sesion`, `sin_acceso`, `expirado`, `revocado`,
   * `desactivada`, `no_existe`… Se devuelve en la respuesta de error para que
   * la web muestre la pantalla adecuada.
   */
  motivo?: string;
}

export type DemoAccessResolver = (ctx: DemoAccessContext) => Promise<DemoAccessDecision>;

/**
 * Resolvedor por defecto (P3): abre las demos `publico` y niega el resto a
 * quien no sea staff. Solo se usa si no hay otro registrado.
 *
 * P4: createApp() registra `demoGrantResolver`
 * (services/demo-access.service.ts) con `setDemoAccessResolver`: lee el
 * `accessMode` editable de la demo y el `DemoGrant` vigente del usuario (y
 * registra el uso). El staff nunca llega al resolvedor:
 * `requireStaffOrDemoAccess` lo deja pasar antes.
 */
export const defaultDemoAccessResolver: DemoAccessResolver = async ({ slug, user }) => {
  const mode = DEFAULT_DEMO_ACCESS_MODES[slug] ?? 'privado';
  if (mode === 'publico') return { allowed: true, reason: 'public' };
  return { allowed: false, reason: user ? 'no_access' : 'login_required' };
};

let demoAccessResolver: DemoAccessResolver = defaultDemoAccessResolver;

/** Registra el resolvedor de acceso a demos (lo usa P4 con DemoGrant). */
export function setDemoAccessResolver(resolver: DemoAccessResolver | null): void {
  demoAccessResolver = resolver ?? defaultDemoAccessResolver;
}

export function getDemoAccessResolver(): DemoAccessResolver {
  return demoAccessResolver;
}

/**
 * Permite el paso al staff o a quien tenga acceso a la demo `slug`.
 *  - 401 `login_required` / `TOKEN_EXPIRED` si hace falta iniciar sesión.
 *  - 403 `demo_access_required` si la sesión no tiene acceso.
 *  - 503 si la BD no responde y la demo no es pública (falla cerrada).
 */
export function requireStaffOrDemoAccess(slug: string): RequestHandler {
  return async (req, res, next) => {
    const authReq = req as AuthRequest;
    const bearer = readBearer(authReq);
    let user: TokenUser | null = null;
    let dbDown = false;

    if (bearer.user) {
      const fresh = await loadFreshUser(bearer.user.id);
      if (fresh === 'db_unavailable') dbDown = true;
      else user = fresh;
    }

    if (user && isStaffRole(user.role)) {
      authReq.user = user;
      authReq.demoAccess = { slug, reason: 'staff' };
      next();
      return;
    }

    let decision: DemoAccessDecision;
    try {
      decision = await demoAccessResolver({ slug, user, req: authReq });
    } catch (err) {
      logger.error(`[access] Error resolviendo el acceso a la demo ${slug}: ${(err as Error)?.message ?? err}`);
      decision = { allowed: false, reason: user ? 'no_access' : 'login_required' };
      dbDown = true;
    }

    if (decision.allowed) {
      if (user) authReq.user = user;
      authReq.demoAccess = { slug, reason: decision.reason, grantId: decision.grantId };
      next();
      return;
    }

    if (dbDown) {
      sendDbUnavailable(res);
      return;
    }
    if (decision.motivo === 'desactivada' || decision.motivo === 'no_existe') {
      // Iniciar sesión no ayuda: la demo está apagada (o no existe).
      res.status(403).json({
        success: false,
        code: 'demo_disabled',
        demo: slug,
        motivo: decision.motivo,
        message: 'Esta demo no está disponible en este momento.',
      });
      return;
    }
    if (!user) {
      const expired = bearer.error === 'expired';
      res.status(401).json({
        success: false,
        code: expired ? 'TOKEN_EXPIRED' : 'login_required',
        demo: slug,
        motivo: decision.motivo ?? 'sin_sesion',
        message: expired
          ? 'Tu sesión expiró. Inicia sesión de nuevo.'
          : 'Inicia sesión con una cuenta que tenga acceso a esta demo.',
      });
      return;
    }
    res.status(403).json({
      success: false,
      code: 'demo_access_required',
      demo: slug,
      motivo: decision.motivo ?? 'sin_acceso',
      message:
        decision.motivo === 'expirado'
          ? 'Tu acceso a esta demo venció. Pide una extensión al equipo de KopTup.'
          : decision.motivo === 'revocado'
            ? 'Tu acceso a esta demo fue cerrado. Escríbenos si crees que es un error.'
            : 'Tu cuenta no tiene acceso a esta demo. Solicítalo desde la página de la demo.',
    });
  };
}
