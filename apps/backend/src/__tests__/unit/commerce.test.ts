/**
 * Pruebas unitarias del pipeline comercial y las propuestas (sin BD):
 * cálculo de montos (COP/USD/IVA/descuento/anticipo), precios de las
 * plantillas, días hábiles y firmas de Wompi (integridad y eventos).
 */
import crypto from 'crypto';
import { computeItem, computeTotals, formatMoney, normalizeAmount } from '../../services/proposal-calc';
import { expandItem, listTemplates, ragPlanItem, offeringItem, copToUsd, TRM_REFERENCIA } from '../../services/pricing.service';
import { addBusinessDays, bogotaWeekday } from '../../utils/business-days';
import {
  buildCheckoutUrl,
  computeEventChecksum,
  integritySignature,
  makePaymentReference,
  proposalNumberFromReference,
  readWompiConfig,
  verifyEventChecksum,
  type WompiEvent,
} from '../../services/wompi.service';

describe('cálculo de montos de una propuesta', () => {
  it('COP: redondea a pesos, aplica descuento, IVA 19 % y anticipo', () => {
    const { items, totales } = computeTotals(
      [
        { cantidad: 1, setup: 9_900_000, mensualidad: 1_490_000, descuentoPct: 10 },
        { cantidad: 2, setup: 100_000.4, mensualidad: 0, descuentoPct: 0 },
      ],
      { currency: 'COP', ivaAplica: true, anticipoPct: 50 },
    );
    expect(items[0]).toEqual({
      setupBruto: 9_900_000,
      setupDescuento: 990_000,
      setupTotal: 8_910_000,
      mensualBruto: 1_490_000,
      mensualDescuento: 149_000,
      mensualTotal: 1_341_000,
    });
    expect(items[1].setupTotal).toBe(200_000);
    expect(totales.subtotal).toBe(9_110_000);
    expect(totales.iva).toBe(1_730_900);
    expect(totales.total).toBe(10_840_900);
    expect(totales.mensualSubtotal).toBe(1_341_000);
    expect(totales.mensualIva).toBe(254_790);
    expect(totales.mensualTotal).toBe(1_595_790);
    expect(totales.anticipo).toBe(5_420_450);
  });

  it('USD: centavos exactos y sin IVA si no aplica', () => {
    const { totales } = computeTotals([{ cantidad: 3, setup: 19.99, mensualidad: 0.1, descuentoPct: 0 }], {
      currency: 'USD',
      ivaAplica: false,
      anticipoPct: 30,
    });
    expect(totales.subtotal).toBe(59.97);
    expect(totales.iva).toBe(0);
    expect(totales.total).toBe(59.97);
    expect(totales.mensualTotal).toBe(0.3);
    expect(totales.anticipo).toBe(17.99);
  });

  it('USD con IVA redondea a centavos', () => {
    const { totales } = computeTotals([{ cantidad: 1, setup: 1200, mensualidad: 0, descuentoPct: 0 }], { currency: 'USD', ivaAplica: true, anticipoPct: 50 });
    expect(totales.iva).toBe(228);
    expect(totales.total).toBe(1428);
    expect(totales.anticipo).toBe(714);
  });

  it('limita descuentos y porcentajes a 0–100', () => {
    expect(computeItem({ cantidad: 1, setup: 100, mensualidad: 10, descuentoPct: 150 }, 'COP').setupTotal).toBe(0);
    expect(normalizeAmount(1234.567, 'USD')).toBe(1234.57);
    expect(normalizeAmount(1234.5, 'COP')).toBe(1235);
  });

  it('formatea como la web', () => {
    expect(formatMoney(3_900_000, 'COP')).toBe('COP 3.900.000');
    expect(formatMoney(1200, 'USD')).toBe('USD 1.200');
    expect(formatMoney(1200.5, 'USD')).toBe('USD 1.200,50');
  });
});

describe('precios de las plantillas', () => {
  it('planes RAG con sus USD fijos (sin TRM)', () => {
    const piloto = ragPlanItem('piloto', 'USD');
    expect(piloto).toMatchObject({ setup: 1200, mensualidad: 0, modalidad: 'piloto' });
    const pro = ragPlanItem('profesional', 'USD');
    expect(pro).toMatchObject({ setup: 7490, mensualidad: 890, modalidad: 'suscripcion' });
    expect(ragPlanItem('profesional', 'COP')).toMatchObject({ setup: 24_900_000, mensualidad: 2_990_000 });
    expect(ragPlanItem('empresarial', 'COP').notaPrecio).toMatch(/desde/i);
  });

  it('catálogo: COP de lista y USD con la TRM de referencia redondeado a decenas', () => {
    const cop = offeringItem('crm-ia', 'basico', 'COP', TRM_REFERENCIA);
    expect(cop).toMatchObject({ modalidad: 'compra', setup: 56_000_000 });
    const usd = offeringItem('crm-ia', 'basico', 'USD', TRM_REFERENCIA);
    expect(usd.setup).toBe(copToUsd(56_000_000, 3300));
    expect(usd.setup).toBe(16_970);
  });

  it('expande plantillas y respeta precios ajustados', () => {
    expect(expandItem({ plantilla: 'rag:piloto' }, 'COP', 3300).setup).toBe(3_900_000);
    const ajustado = expandItem({ plantilla: 'rag:esencial', setup: 9_000_000, descuentoPct: 5 }, 'COP', 3300);
    expect(ajustado.setup).toBe(9_000_000);
    expect(ajustado.precioLista.setup).toBe(9_900_000);
    expect(ajustado.descuentoPct).toBe(5);
  });

  it('rechaza SaaS en productos del catálogo (lista de espera) y mensualidad en el piloto', () => {
    expect(() => expandItem({ tipo: 'producto', offeringSlug: 'crm-ia', plan: 'basico', modalidad: 'saas' }, 'COP', 3300)).toThrow(/lista de espera/);
    expect(() => expandItem({ plantilla: 'rag:piloto', mensualidad: 10 }, 'COP', 3300)).toThrow(/pago único/);
    expect(() => expandItem({ plantilla: 'rag:inexistente' }, 'COP', 3300)).toThrow();
    expect(() => expandItem({ tipo: 'personalizado' }, 'COP', 3300)).toThrow(/Describe/);
  });

  it('lista plantillas RAG y del catálogo (sin la tarjeta del chatbot RAG)', () => {
    const t = listTemplates('COP');
    expect(t.filter((x) => x.grupo === 'planes_rag').map((x) => x.id)).toEqual(['rag:piloto', 'rag:esencial', 'rag:profesional', 'rag:empresarial']);
    expect(t.some((x) => x.id.startsWith('producto:chatbot-rag-ia'))).toBe(false);
    expect(t.some((x) => x.id === 'producto:crm-ia:basico')).toBe(true);
  });
});

describe('días hábiles (Bogotá)', () => {
  it('un día hábil desde viernes vence el lunes; desde martes, el miércoles', () => {
    const viernes = new Date('2026-10-09T15:00:00Z'); // viernes 10:00 en Bogotá
    expect(bogotaWeekday(viernes)).toBe(5);
    const vence = addBusinessDays(viernes, 1);
    expect(bogotaWeekday(vence)).toBe(1);
    expect(vence.toISOString()).toBe('2026-10-12T15:00:00.000Z');
    const martes = new Date('2026-10-06T15:00:00Z');
    expect(addBusinessDays(martes, 1).toISOString()).toBe('2026-10-07T15:00:00.000Z');
    const sabado = new Date('2026-10-10T15:00:00Z');
    expect(addBusinessDays(sabado, 1).toISOString()).toBe('2026-10-12T15:00:00.000Z');
  });
});

describe('Wompi', () => {
  it('firma de integridad: reproduce el ejemplo de la documentación oficial', () => {
    expect(
      integritySignature({ reference: 'sk8-438k4-xmxm392-sn2m', amountInCents: 2490000, currency: 'COP' }, 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6'),
    ).toBe('37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5');
    expect(() => integritySignature({ reference: 'x', amountInCents: 0, currency: 'COP' }, 's')).toThrow();
  });

  it('URL del Web Checkout con los parámetros firmados', () => {
    const url = new URL(
      buildCheckoutUrl({ publicKey: 'pub_test_x', reference: 'KOP-2026-0001-ABCDEFGH', amountInCents: 195000000, currency: 'COP', signature: 'abc', redirectUrl: 'https://koptup.com/propuesta/t' }),
    );
    expect(url.origin + url.pathname).toBe('https://checkout.wompi.co/p/');
    expect(url.searchParams.get('public-key')).toBe('pub_test_x');
    expect(url.searchParams.get('amount-in-cents')).toBe('195000000');
    expect(url.searchParams.get('signature:integrity')).toBe('abc');
    expect(url.searchParams.get('currency')).toBe('COP');
  });

  it('referencias = número de propuesta + sufijo', () => {
    const ref = makePaymentReference('KOP-2026-0042');
    expect(ref).toMatch(/^KOP-2026-0042-[A-Z0-9]{8}$/);
    expect(proposalNumberFromReference(ref)).toBe('KOP-2026-0042');
    expect(proposalNumberFromReference('otra')).toBeNull();
    expect(makePaymentReference('KOP-2026-0042')).not.toBe(ref);
  });

  const secret = 'test_events_secreto_de_prueba';
  function event(overrides: Partial<WompiEvent> = {}): WompiEvent {
    const base: WompiEvent = {
      event: 'transaction.updated',
      data: { transaction: { id: '1234-1610641025-49201', status: 'APPROVED', amount_in_cents: 4490000, reference: 'KOP-2026-0001-ABCDEFGH', currency: 'COP' } },
      environment: 'test',
      signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'] },
      timestamp: 1530291411,
      ...overrides,
    };
    const checksum = crypto.createHash('sha256').update(`1234-1610641025-49201APPROVED44900001530291411${secret}`).digest('hex');
    return { ...base, signature: { ...base.signature, checksum: (base.signature as { checksum?: string }).checksum ?? checksum } };
  }

  it('checksum de eventos: valores de signature.properties + timestamp + secreto (SHA-256)', () => {
    const e = event();
    expect(computeEventChecksum(e, secret)).toBe(crypto.createHash('sha256').update(`1234-1610641025-49201APPROVED44900001530291411${secret}`).digest('hex'));
    expect(verifyEventChecksum(e, secret)).toBe(true);
    // Mayúsculas (como en la documentación) también valen.
    expect(verifyEventChecksum({ ...e, signature: { ...e.signature, checksum: String(e.signature!.checksum).toUpperCase() } }, secret)).toBe(true);
    // Cabecera X-Event-Checksum coherente.
    expect(verifyEventChecksum(e, secret, String(e.signature!.checksum))).toBe(true);
  });

  it('rechaza eventos alterados, con otro secreto o sin firma', () => {
    const e = event();
    const tampered: WompiEvent = { ...e, data: { transaction: { ...e.data!.transaction!, amount_in_cents: 1 } } };
    expect(verifyEventChecksum(tampered, secret)).toBe(false);
    expect(verifyEventChecksum(e, 'otro_secreto')).toBe(false);
    expect(verifyEventChecksum({ ...e, signature: { properties: e.signature!.properties } }, secret)).toBe(false);
    expect(verifyEventChecksum({ ...e, signature: { properties: [], checksum: e.signature!.checksum } }, secret)).toBe(false);
    expect(verifyEventChecksum(e, secret, 'f'.repeat(64))).toBe(false);
    expect(verifyEventChecksum({ ...e, timestamp: undefined }, secret)).toBe(false);
  });

  it('solo se activa con las 3 llaves y un ambiente válido coherente con la llave pública', () => {
    expect(readWompiConfig({}).enabled).toBe(false);
    const keys = { WOMPI_PUBLIC_KEY: 'pub_test_a', WOMPI_INTEGRITY_SECRET: 'test_integrity_b', WOMPI_EVENTS_SECRET: 'test_events_c' };
    expect(readWompiConfig({ ...keys }).reason).toBe('ambiente_invalido');
    expect(readWompiConfig({ ...keys, WOMPI_ENV: 'sandbox' }).enabled).toBe(true);
    expect(readWompiConfig({ ...keys, WOMPI_ENV: 'production' }).reason).toBe('llave_no_coincide_con_ambiente');
    expect(readWompiConfig({ ...keys, WOMPI_EVENTS_SECRET: '' , WOMPI_ENV: 'sandbox' }).reason).toBe('faltan_variables');
  });
});
