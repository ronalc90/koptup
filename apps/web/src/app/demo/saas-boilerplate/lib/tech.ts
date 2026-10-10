/**
 * Contenido técnico de referencia (pantalla "Operación y técnica").
 *
 * Los fragmentos de código viven aquí y no en los mensajes de traducción:
 * llevan llaves y `${...}` que el formato ICU de next-intl interpretaría como
 * variables. Solo cambian los comentarios según el idioma.
 */
import type { Loc } from './format';

export type IsolationId = 'shared' | 'schema' | 'database';
export const ISOLATION_IDS: IsolationId[] = ['shared', 'schema', 'database'];

const C: Record<Loc, Record<string, string>> = {
  es: {
    rls: '-- Activar RLS y una política por cliente',
    perRequest: '-- En cada petición, el backend fija el cliente de la sesión',
    schema: '// Usar el schema del cliente en esta conexión',
    database: '// Una conexión (y una base) por cliente',
    verify: '// Verificar la firma de un webhook en el receptor (Node.js)',
    compare: '// Comparación en tiempo constante',
  },
  en: {
    rls: '-- Enable RLS and a per-tenant policy',
    perRequest: '-- On each request, the backend sets the session tenant',
    schema: '// Use the tenant schema on this connection',
    database: '// One connection (and one database) per tenant',
    verify: '// Verify a webhook signature on the receiver (Node.js)',
    compare: '// Constant-time comparison',
  },
};

export function isolationSnippet(id: IsolationId, loc: Loc): { lang: string; code: string } {
  const c = C[loc];
  if (id === 'shared') {
    return {
      lang: 'sql',
      code: [
        c.rls,
        'ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;',
        '',
        'CREATE POLICY aislamiento_por_cliente ON unidades',
        "  USING (tenant_id = current_setting('app.tenant_id')::uuid);",
        '',
        c.perRequest,
        "SET LOCAL app.tenant_id = '8f3a2c1e-5b7d-4e2a-9c61-0d4f7b2e9a10';",
      ].join('\n'),
    };
  }
  if (id === 'schema') {
    return {
      lang: 'ts',
      code: [
        c.schema,
        'const client = await pool.connect();',
        'await client.query(`SET search_path TO tenant_${tenantId}, public`);',
        "const { rows } = await client.query('SELECT * FROM unidades LIMIT 50');",
      ].join('\n'),
    };
  }
  return {
    lang: 'ts',
    code: [
      c.database,
      'const dsn = await secrets.tenantDsn(tenantId);',
      'const db = getOrCreatePool(dsn);',
      "const { rows } = await db.query('SELECT * FROM unidades LIMIT 50');",
    ].join('\n'),
  };
}

export function webhookVerifySnippet(loc: Loc): string {
  const c = C[loc];
  return [
    c.verify,
    "import crypto from 'node:crypto';",
    '',
    'function verify(rawBody: string, header: string, secret: string) {',
    "  const { t, v1 } = Object.fromEntries(header.split(',').map((p) => p.split('=')));",
    "  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');",
    c.compare.replace('//', '  //'),
    "  return v1?.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));",
    '}',
  ].join('\n');
}
