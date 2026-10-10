import { buildSwaggerSpec } from '../../config/swagger';

describe('documentación /api-docs (OpenAPI)', () => {
  const spec = buildSwaggerSpec('http://localhost:3001');
  const ops = Object.entries(spec.paths ?? {}).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, op]) => ({ path, method, op })),
  );

  it('define el esquema bearerAuth que citan las rutas', () => {
    expect(spec.components).toMatchObject({ securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } });
  });

  it('cada operación declara respuestas, con el formato único de error por defecto', () => {
    expect(ops.length).toBeGreaterThan(50);
    for (const { op } of ops) {
      expect(op.responses?.default).toMatchObject({ content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
    }
  });

  it('login y registro son públicos; documentos, cuentas y auditoría piden sesión', () => {
    const find = (method: string, path: string) => ops.find((o) => o.method === method && o.path === path)?.op;
    expect(find('post', '/api/auth/login')?.security).toEqual([]);
    expect(find('post', '/api/auth/register')?.security).toEqual([]);
    expect(find('get', '/api/auth/profile')?.security).toEqual([{ bearerAuth: [] }]);
    expect(find('get', '/api/documents')?.security).toEqual([{ bearerAuth: [] }]);
    expect(find('get', '/api/cuentas')?.security).toEqual([{ bearerAuth: [] }]);
    expect(find('get', '/api/auditoria/facturas')?.security).toEqual([{ bearerAuth: [] }]);
    expect(find('post', '/api/content/improve')?.security).toEqual([{}, { bearerAuth: [] }]);
  });

  it('las rutas de solo desarrollo quedan marcadas como obsoletas', () => {
    const chat = ops.filter((o) => o.path.startsWith('/api/chat/'));
    expect(chat.length).toBeGreaterThan(0);
    for (const { op } of chat) {
      expect(op.deprecated).toBe(true);
      expect(op.description).toMatch(/Solo desarrollo/);
    }
  });

  it('no documenta rutas retiradas', () => {
    expect(Object.keys(spec.paths ?? {}).some((p) => p.startsWith('/api/quotes'))).toBe(false);
  });
});
