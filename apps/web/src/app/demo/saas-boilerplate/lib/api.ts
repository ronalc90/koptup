/**
 * API REST simulada de la demo: corre en tu navegador sobre el mismo estado
 * que ves en pantalla. La llave identifica al cliente y CADA consulta filtra
 * por ese cliente: pedir un recurso de otro conjunto devuelve 404, igual que
 * si no existiera.
 */
import { apiKeyFor } from './data';
import type { DemoState, Notice } from './types';

export type ApiMethod = 'GET' | 'POST';

export interface ApiEndpoint {
  id: string;
  method: ApiMethod;
  path: string;
  /** Si la ruta lleva un identificador editable. */
  param?: boolean;
  body?: boolean;
}

export const ENDPOINTS: ApiEndpoint[] = [
  { id: 'tenant', method: 'GET', path: '/v1/tenant' },
  { id: 'units', method: 'GET', path: '/v1/units' },
  { id: 'unit', method: 'GET', path: '/v1/units/{id}', param: true },
  { id: 'invoices', method: 'GET', path: '/v1/invoices' },
  { id: 'notices', method: 'GET', path: '/v1/notices' },
  { id: 'createNotice', method: 'POST', path: '/v1/notices', body: true },
];

export interface ApiResult {
  status: number;
  body: unknown;
  tenantId: string | null;
  created?: { title: string; body: string };
}

export function handleApi(
  state: DemoState,
  apiKey: string,
  endpoint: ApiEndpoint,
  param: string,
  rawBody: string,
  noticeText: (n: Notice) => { title: string; body: string },
): ApiResult {
  const tenant = state.tenants.find((t) => apiKeyFor(t.slug) === apiKey.trim());
  if (!tenant || tenant.status === 'cancelado') {
    return { status: 401, tenantId: null, body: { error: 'invalid_api_key' } };
  }
  if (tenant.status === 'suspendido') {
    return { status: 402, tenantId: tenant.id, body: { error: 'account_suspended', tenant: tenant.slug } };
  }
  const tid = tenant.id;
  switch (endpoint.id) {
    case 'tenant':
      return {
        status: 200,
        tenantId: tid,
        body: { id: tenant.slug, name: tenant.name, plan: tenant.plan, status: tenant.status, units: tenant.units, modules: tenant.modules },
      };
    case 'units':
      return {
        status: 200,
        tenantId: tid,
        body: { data: state.units.filter((u) => u.tenantId === tid).map((u) => ({ id: u.id, label: u.label, fee_paid: u.paid })) },
      };
    case 'unit': {
      const u = state.units.find((x) => x.id === param.trim() && x.tenantId === tid);
      return u
        ? { status: 200, tenantId: tid, body: { id: u.id, label: u.label, owner: u.owner, fee_paid: u.paid } }
        : { status: 404, tenantId: tid, body: { error: 'not_found', id: param.trim() } };
    }
    case 'invoices':
      return {
        status: 200,
        tenantId: tid,
        body: {
          data: state.invoices
            .filter((i) => i.tenantId === tid)
            .map((i) => ({ number: i.number, period: i.period, total: i.total, currency: 'COP', method: i.method })),
        },
      };
    case 'notices':
      return {
        status: 200,
        tenantId: tid,
        body: { data: state.notices.filter((n) => n.tenantId === tid).map((n) => ({ id: n.id, title: noticeText(n).title, published_at: n.at })) },
      };
    case 'createNotice': {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        return { status: 400, tenantId: tid, body: { error: 'invalid_json' } };
      }
      const p = parsed as { title?: unknown; body?: unknown };
      const title = typeof p.title === 'string' ? p.title.trim().slice(0, 80) : '';
      const text = typeof p.body === 'string' ? p.body.trim().slice(0, 400) : '';
      if (title.length < 3) return { status: 422, tenantId: tid, body: { error: 'validation_error', field: 'title' } };
      return { status: 201, tenantId: tid, body: { title, body: text, tenant: tenant.slug }, created: { title, body: text } };
    }
    default:
      return { status: 404, tenantId: tid, body: { error: 'route_not_found' } };
  }
}
