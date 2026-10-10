/**
 * env.ts — validación de variables de entorno al arrancar (zod).
 *
 * Reglas:
 *  - En producción el servidor NO arranca si falta una variable
 *    imprescindible: MONGODB_URI o JWT_SECRET.
 *  - JWT_REFRESH_SECRET es obligatoria para iniciar sesión, pero si falta en
 *    producción solo se registra un aviso en el log (no se bloquea el
 *    arranque): así un despliegue sin ella no tumba el resto de la API
 *    (contacto, chatbot, demos). El aviso dice que el inicio de sesión fallará.
 *  - Las opcionales que faltan o tienen un formato inválido solo generan una
 *    advertencia (la función que las usa queda deshabilitada o usa su valor
 *    por defecto). Los grupos (SMTP_USER + SMTP_PASS) se avisan juntos, y
 *    DEMO_UPLOAD_ENABLED avisa si falta (con `false` explícito no avisa).
 *  - Los mensajes nombran la variable, nunca su valor.
 *
 * El resto del código sigue leyendo `process.env` directamente; este módulo
 * garantiza que lo imprescindible existe antes de abrir el puerto.
 */
import { z } from 'zod';
import { parseDurationSeconds } from '../utils/duration';

/** Tope de JWT_REFRESH_EXPIRES_IN (igual a MAX_REFRESH_TTL_SECONDS de middleware/auth.ts). */
const MAX_REFRESH_SECONDS = 7 * 24 * 60 * 60;

/** Variables sin las cuales el backend no puede operar en producción. */
export const REQUIRED_IN_PRODUCTION = ['MONGODB_URI', 'JWT_SECRET'] as const;

/** Necesarias para iniciar sesión; si faltan en producción se avisa en el log sin bloquear el arranque. */
export const RECOMMENDED_IN_PRODUCTION = ['JWT_REFRESH_SECRET'] as const;

/**
 * Variables opcionales: si faltan se avisa qué función queda apagada.
 * (Solo nombres y efecto; nunca valores.)
 */
export const OPTIONAL_WITH_EFFECT: Record<string, string> = {
  REDIS_URL: 'sesiones de refresco, rate-limit compartido y topes de gasto de IA (las funciones de IA públicas quedan apagadas)',
  OPENAI_API_KEY: 'funciones con IA (chatbot en modo extractivo, demos de IA deshabilitadas)',
  CORS_ORIGIN: 'orígenes extra permitidos por CORS (solo se aceptan koptup.com y www.koptup.com)',
  FRONTEND_URL: 'enlaces de los correos (se usa http://localhost:3000)',
  ADMIN_EMAIL: 'avisos al equipo por correo apagados y el arranque no asegura ningún admin',
  INTERNAL_API_KEY:
    'la web no puede informar la IP real del visitante: sus peticiones del servidor (verificación de sesión, LinkedIn sin cuenta) cuentan con la IP de salida de la web',
};

/**
 * Variables que solo sirven juntas: si falta alguna, la función se apaga.
 * SMTP_HOST no decide nada (sin ella se usa smtp.gmail.com).
 */
export const OPTIONAL_GROUPS: Array<{ names: readonly string[]; effect: string }> = [
  {
    names: ['SMTP_USER', 'SMTP_PASS'],
    effect:
      'no sale ningún correo (acuse y aprobación de demos, recordatorios, restablecer contraseña, avisos al equipo); el panel muestra igual el enlace de activación',
  },
];

const optionalNumber = (opts: { min?: number; int?: boolean } = {}) =>
  z
    .string()
    .optional()
    .refine(
      (v) => {
        if (v === undefined || v.trim() === '') return true;
        const n = Number(v);
        if (!Number.isFinite(n)) return false;
        if (opts.int && !Number.isInteger(n)) return false;
        if (opts.min !== undefined && n < opts.min) return false;
        return true;
      },
      { message: 'debe ser un número válido' },
    );

/** `true` o `false` (sin repetir el valor recibido en el mensaje). */
const optionalBool = z.enum(['true', 'false'], { errorMap: () => ({ message: 'debe ser true o false' }) }).optional();

const optionalUrl = z
  .string()
  .optional()
  .refine((v) => v === undefined || v.trim() === '' || /^(https?|mongodb(\+srv)?|rediss?):\/\//i.test(v.trim()), {
    message: 'debe ser una URL válida',
  });

const optionalEmail = z
  .string()
  .optional()
  .refine((v) => v === undefined || v.trim() === '' || z.string().email().safeParse(v.trim()).success, {
    message: 'debe ser un email válido',
  });

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: optionalNumber({ min: 0, int: true }),
  MONGODB_URI: optionalUrl,
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  REDIS_URL: optionalUrl,
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: optionalUrl,
  API_URL: optionalUrl,
  ADMIN_EMAIL: optionalEmail,
  TRUST_PROXY_HOPS: optionalNumber({ min: 0, int: true }),
  RATE_LIMIT_WINDOW_MS: optionalNumber({ min: 1, int: true }),
  RATE_LIMIT_MAX_REQUESTS: optionalNumber({ min: 1, int: true }),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: optionalUrl,
  DEMO_MONTHLY_BUDGET_USD: optionalNumber({ min: 0 }),
  CHATBOT_MONTHLY_BUDGET_USD: optionalNumber({ min: 0 }),
  LINKEDIN_ADS_MONTHLY_BUDGET_USD: optionalNumber({ min: 0 }),
  CONTENT_MONTHLY_BUDGET_USD: optionalNumber({ min: 0 }),
  DOCUMENTS_MONTHLY_BUDGET_USD: optionalNumber({ min: 0 }),
  HEALTH_MONTHLY_BUDGET_USD: optionalNumber({ min: 0 }),
  DOCUMENTS_AI_DAILY_LIMIT_PER_USER: optionalNumber({ min: 0, int: true }),
  HEALTH_AI_DAILY_LIMIT_PER_USER: optionalNumber({ min: 0, int: true }),
  LOGIN_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  LOGIN_IP_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  REGISTER_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  FORGOT_PASSWORD_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  RESET_PASSWORD_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  ACTIVATION_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  CHANGE_PASSWORD_RATE_LIMIT_MAX: optionalNumber({ min: 1, int: true }),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: optionalNumber({ min: 1, int: true }),
  SMTP_SECURE: optionalBool,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  INTERNAL_API_KEY: z.string().optional(),
  DEMO_UPLOAD_ENABLED: z
    .enum(['true', 'false'], { errorMap: () => ({ message: 'debe ser true o false → «Prueba con tu documento» queda apagada' }) })
    .optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .optional()
    .refine((v) => v === undefined || v.trim() === '' || parseDurationSeconds(v) !== null, {
      message: 'duración inválida (usa, por ejemplo, 7d, 12h o 3600) → se usan 7 días',
    })
    .refine((v) => v === undefined || (parseDurationSeconds(v) ?? 0) <= MAX_REFRESH_SECONDS, {
      message: 'mayor de 7 días → se usan 7 días (es lo que dura la cookie de sesión de la web)',
    }),
  PRIVACY_POLICY_VERSION: z.string().max(40).optional(),
  DEMO_REQUEST_LIMIT_PER_HOUR: optionalNumber({ min: 1, int: true }),
  DEMO_REQUEST_LIMIT_PER_EMAIL_DAY: optionalNumber({ min: 1, int: true }),
  DEMO_GRANTS_JOB_ENABLED: optionalBool,
  DEMO_GRANTS_JOB_INTERVAL_MS: optionalNumber({ min: 60000, int: true }),
  PROPOSALS_JOB_ENABLED: optionalBool,
  PROPOSALS_JOB_INTERVAL_MS: optionalNumber({ min: 60000, int: true }),
  // Conservación de datos (Ley 1581) y almacenamiento del chatbot en MongoDB.
  DATA_RETENTION_MONTHS: optionalNumber({ min: 1, int: true }),
  RETENTION_JOB_ENABLED: optionalBool,
  RETENTION_JOB_INTERVAL_MS: optionalNumber({ min: 60000, int: true }),
  CHATBOT_CONVERSATION_TTL_DAYS: optionalNumber({ min: 1, int: true }),
  CHATBOT_SAMPLE_BOT_RETENTION_DAYS: optionalNumber({ min: 1, int: true }),
  CHATBOT_BOT_RETENTION_DAYS: optionalNumber({ min: 1, int: true }),
  CHATBOT_MAX_BOTS: optionalNumber({ min: 1, int: true }),
  WOMPI_ENV: z.enum(['sandbox', 'production']).optional(),
  WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_INTEGRITY_SECRET: z.string().optional(),
  WOMPI_EVENTS_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export interface EnvValidationResult {
  ok: boolean;
  env: Env | null;
  /** Problemas que impiden arrancar (solo producción). */
  errors: string[];
  /** Avisos: opcionales ausentes o con formato inválido. */
  warnings: string[];
}

function isBlank(v: string | undefined): boolean {
  return v === undefined || v.trim() === '';
}

/**
 * Valida el entorno sin efectos secundarios (fácil de probar). En producción,
 * `ok` es false si falta una imprescindible.
 */
export function validateEnv(source: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeEnv = source.NODE_ENV === 'production' || source.NODE_ENV === 'test' ? source.NODE_ENV : 'development';
  const isProduction = nodeEnv === 'production';

  const parsed = EnvSchema.safeParse({ ...source, NODE_ENV: nodeEnv });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const name = issue.path.join('.');
      // Un formato inválido en una imprescindible bloquea en producción; en
      // las opcionales solo se avisa.
      if (isProduction && (REQUIRED_IN_PRODUCTION as readonly string[]).includes(name)) {
        errors.push(`${name}: ${issue.message}`);
      } else {
        warnings.push(`${name}: ${issue.message}`);
      }
    }
  }

  for (const name of REQUIRED_IN_PRODUCTION) {
    if (isBlank(source[name])) {
      if (isProduction) errors.push(`${name}: falta (obligatoria en producción)`);
      else warnings.push(`${name}: no está definida`);
    }
  }

  for (const name of RECOMMENDED_IN_PRODUCTION) {
    if (isBlank(source[name])) {
      warnings.push(
        isProduction
          ? `${name}: falta en producción → el inicio de sesión fallará hasta configurarla`
          : `${name}: no está definida`,
      );
    }
  }

  if (isProduction && !isBlank(source.JWT_SECRET) && (source.JWT_SECRET as string).length < 32) {
    warnings.push('JWT_SECRET: tiene menos de 32 caracteres (se recomienda un valor largo y aleatorio)');
  }
  if (
    !isBlank(source.JWT_SECRET) &&
    !isBlank(source.JWT_REFRESH_SECRET) &&
    source.JWT_SECRET === source.JWT_REFRESH_SECRET
  ) {
    warnings.push('JWT_REFRESH_SECRET: es igual a JWT_SECRET (usa valores distintos)');
  }

  for (const [name, effect] of Object.entries(OPTIONAL_WITH_EFFECT)) {
    if (isBlank(source[name])) warnings.push(`${name}: no está definida → ${effect}`);
  }

  for (const group of OPTIONAL_GROUPS) {
    const missing = group.names.filter((name) => isBlank(source[name]));
    if (missing.length > 0) {
      warnings.push(`${missing.join(' y ')}: ${missing.length > 1 ? 'no están definidas' : 'no está definida'} → ${group.effect}`);
    }
  }

  // «Prueba con tu documento» solo se enciende con el valor exacto `true`.
  // (Un valor distinto de true/false ya produjo el aviso de formato.)
  if (isBlank(source.DEMO_UPLOAD_ENABLED)) {
    warnings.push('DEMO_UPLOAD_ENABLED: no está definida → «Prueba con tu documento» apagada (enciéndela con true)');
  }

  return {
    ok: errors.length === 0,
    env: parsed.success ? parsed.data : null,
    errors,
    warnings,
  };
}

/**
 * Valida y registra el resultado. En producción lanza un error (el proceso no
 * debe abrir el puerto) si falta una imprescindible.
 */
export function assertValidEnv(
  log: { warn: (msg: string) => void; error: (msg: string) => void },
  source: NodeJS.ProcessEnv = process.env,
): EnvValidationResult {
  const result = validateEnv(source);
  for (const w of result.warnings) log.warn(`[env] ${w}`);
  if (!result.ok) {
    for (const e of result.errors) log.error(`[env] ${e}`);
    throw new Error(`Configuración incompleta: ${result.errors.map((e) => e.split(':')[0]).join(', ')}`);
  }
  return result;
}
