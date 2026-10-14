/**
 * swagger.ts — especificación OpenAPI de `/api-docs` (solo fuera de
 * producción o con API_DOCS_ENABLED=true).
 *
 * Los comentarios `@swagger` de `src/routes/*.ts` describen las rutas; aquí se
 * completa lo que esos comentarios no pueden decir bien por sí solos, para que
 * la documentación no mienta:
 *  - el esquema de seguridad `bearerAuth` (antes se citaba sin definirse);
 *  - qué rutas documentadas son públicas, cuáles aceptan sesión opcional y
 *    cuáles exigen sesión (por defecto, todas: `routes/POLICIES.md` tiene el
 *    detalle de roles y accesos a demos);
 *  - las rutas de solo desarrollo (`/api/chat`), marcadas como obsoletas;
 *  - el formato único de error `{ success: false, code, message }` como
 *    respuesta por defecto de cada operación (algunas no declaraban ninguna).
 */
import swaggerJsdoc from 'swagger-jsdoc';

type Operation = {
  security?: Array<Record<string, string[]>>;
  responses?: Record<string, unknown>;
  deprecated?: boolean;
  description?: string;
};
type OpenApiSpec = {
  paths?: Record<string, Record<string, Operation>>;
  components?: Record<string, unknown>;
};

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

/** Rutas documentadas que no piden sesión. */
const PUBLIC_PATHS: RegExp[] = [
  /^\/api\/auth\/(register|login|refresh|forgot-password|reset-password|activate(\/check)?|google(\/callback|\/exchange)?)$/,
];

/** Rutas que aceptan sesión opcional (demos abiertas por defecto, con cupo por IP). */
const OPTIONAL_AUTH_PATHS: RegExp[] = [/^\/api\/content\//];

/** Rutas que solo existen fuera de producción (devOnlyAdmin). */
const DEV_ONLY_PATHS: RegExp[] = [/^\/api\/chat\//];

const DEV_ONLY_NOTE = 'Solo desarrollo: responde 404 en producción y exige una cuenta admin.';

export function completeSpec<T extends OpenApiSpec>(spec: T): T {
  spec.components = {
    ...(spec.components ?? {}),
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ...((spec.components?.schemas as Record<string, unknown> | undefined) ?? {}),
      Error: {
        type: 'object',
        required: ['success', 'code', 'message'],
        properties: {
          success: { type: 'boolean', enum: [false] },
          code: { type: 'string', description: 'Código estable para la web (p. ej. unauthorized, rate_limited)' },
          message: { type: 'string', description: 'Mensaje en español para mostrar a la persona' },
        },
      },
    },
  };

  for (const [path, operations] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(operations)) {
      if (!HTTP_METHODS.has(method) || !op || typeof op !== 'object') continue;
      if (PUBLIC_PATHS.some((re) => re.test(path))) op.security = [];
      else if (OPTIONAL_AUTH_PATHS.some((re) => re.test(path))) op.security = [{}, { bearerAuth: [] }];
      else op.security = [{ bearerAuth: [] }];

      if (DEV_ONLY_PATHS.some((re) => re.test(path))) {
        op.deprecated = true;
        op.description = op.description ? `${DEV_ONLY_NOTE}\n\n${op.description}` : DEV_ONLY_NOTE;
      }

      op.responses = {
        ...(op.responses ?? {}),
        default: {
          description: 'Error con el formato único de la API',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      };
    }
  }
  return spec;
}

export function buildSwaggerSpec(serverUrl: string): OpenApiSpec {
  const spec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'KopTup API',
        version: '1.0.0',
        description:
          'Rutas con comentarios @swagger (no todas las rutas los tienen). La referencia completa, con la política de cada ruta, está en docs/wiki/Doc-08-API.md y apps/backend/src/routes/POLICIES.md.',
      },
      servers: [{ url: serverUrl }],
    },
    apis: ['./src/routes/*.ts'],
  }) as OpenApiSpec;
  return completeSpec(spec);
}
