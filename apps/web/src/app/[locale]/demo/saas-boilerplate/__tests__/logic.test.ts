/**
 * Reglas de negocio de la demo saas-boilerplate (funciones puras).
 */
import { apiKeyFor, defaultState, PLANS } from '../lib/data';
import { ENDPOINTS, handleApi } from '../lib/api';
import { formatNit, nitDv, readableOn, slugify } from '../lib/format';
import { checkPlanChange, expiryOk, findResource, luhnOk, mobileOk, mrr, slugError } from '../lib/logic';

const noticeText = (n: { title: string; body: string }) => ({ title: n.title, body: n.body });

describe('saas-boilerplate: formatos colombianos', () => {
  it('calcula el dígito de verificación del NIT (módulo 11)', () => {
    expect(nitDv('900731245')).toBe(9);
    expect(nitDv('901118342')).toBe(0);
    expect(formatNit('901482736')).toBe('901.482.736-8');
  });

  it('valida tarjetas (Luhn), vencimiento y celular', () => {
    expect(luhnOk('4242 4242 4242 4242')).toBe(true);
    expect(luhnOk('4242 4242 4242 4241')).toBe(false);
    expect(expiryOk('12/30')).toBe(true);
    expect(expiryOk('09/26')).toBe(false);
    expect(mobileOk('300 123 4567')).toBe(true);
    expect(mobileOk('6011234567')).toBe(false);
  });

  it('genera subdominios válidos y detecta los ocupados', () => {
    const s = defaultState();
    expect(slugify('Torres de Cañaveral')).toBe('canaveral');
    expect(slugError(s, 'arrayanes')).toBe('taken');
    expect(slugError(s, 'admin')).toBe('reserved');
    expect(slugError(s, '-mal')).toBe('format');
    expect(slugError(s, 'mirador-parque')).toBeNull();
  });

  it('elige un color de texto legible sobre el color de marca', () => {
    expect(readableOn('#2563eb')).toBe('#ffffff');
    expect(readableOn('#fde047')).toBe('#0f172a');
  });
});

describe('saas-boilerplate: cobros', () => {
  it('los ingresos recurrentes del mes salen de los clientes activos y en mora', () => {
    const s = defaultState();
    expect(mrr(s.tenants)).toBe(PLANS.mediano.price + PLANS.pequeno.price + PLANS.multi.price);
  });

  it('prorratea la subida de plan y bloquea a quien está en mora', () => {
    const s = defaultState();
    const arrayanes = s.tenants.find((t) => t.id === 't-arrayanes')!;
    const up = checkPlanChange(s, arrayanes, 'multi');
    expect(up).toEqual({ ok: true, kind: 'upgrade', days: 24, amount: Math.round(((PLANS.multi.price - PLANS.mediano.price) * 24) / 31) });
    const down = checkPlanChange(s, arrayanes, 'pequeno');
    expect(down).toEqual({ ok: false, reason: 'units' });
    const laureles = s.tenants.find((t) => t.id === 't-laureles')!;
    expect(checkPlanChange(s, laureles, 'mediano')).toEqual({ ok: false, reason: 'status' });
  });
});

describe('saas-boilerplate: aislamiento por cliente', () => {
  it('el portal no entrega recursos de otro conjunto', () => {
    const s = defaultState();
    const foreign = s.units.find((u) => u.tenantId === 't-laureles')!;
    expect(findResource(s, 't-arrayanes', foreign.id)).toEqual({ ok: false, reason: 'forbidden', ownerTenantId: 't-laureles' });
    const own = s.units.find((u) => u.tenantId === 't-arrayanes')!;
    expect(findResource(s, 't-arrayanes', own.id)).toMatchObject({ ok: true, kind: 'unit' });
    expect(findResource(s, 't-arrayanes', 'no-existe')).toEqual({ ok: false, reason: 'not_found' });
  });

  it('la API de prueba responde 404 a una unidad de otro cliente y 401 a una llave inválida', () => {
    const s = defaultState();
    const unitEp = ENDPOINTS.find((e) => e.id === 'unit')!;
    const foreign = s.units.find((u) => u.tenantId === 't-oriente')!;
    const res = handleApi(s, apiKeyFor('arrayanes'), unitEp, foreign.id, '', noticeText);
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(foreign.owner);
    expect(handleApi(s, 'ck_test_falsa', ENDPOINTS[0], '', '', noticeText).status).toBe(401);
    const list = handleApi(s, apiKeyFor('arrayanes'), ENDPOINTS.find((e) => e.id === 'units')!, '', '', noticeText);
    const ids = (list.body as { data: { id: string }[] }).data.map((u) => u.id);
    expect(ids.every((id) => s.units.find((u) => u.id === id)?.tenantId === 't-arrayanes')).toBe(true);
  });

  it('valida el cuerpo del POST de comunicados', () => {
    const s = defaultState();
    const ep = ENDPOINTS.find((e) => e.id === 'createNotice')!;
    expect(handleApi(s, apiKeyFor('arrayanes'), ep, '', '{mal', noticeText).status).toBe(400);
    expect(handleApi(s, apiKeyFor('arrayanes'), ep, '', '{"title":"a"}', noticeText).status).toBe(422);
    expect(handleApi(s, apiKeyFor('arrayanes'), ep, '', '{"title":"Corte de agua","body":"Sábado"}', noticeText).status).toBe(201);
  });
});
