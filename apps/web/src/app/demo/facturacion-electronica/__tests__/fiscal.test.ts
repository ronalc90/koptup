/**
 * Reglas de la demo de facturación electrónica: DV del NIT, totales (IVA por tarifa y
 * retenciones informativas), días hábiles con festivos, saldos de notas y código QR.
 */
import { addBusinessDays, businessDaysUntil, checkNit, computeTotals, formatCOP, nitDv } from '../components/fiscal';
import { buildSampleDocs, DEFAULT_LINES, SAMPLE_CLIENTS } from '../components/data';
import { buildXml, docTotals, invoiceBalance, nextNumber, returnedQty } from '../components/docs';
import { SAMPLE_ISSUER } from '../components/data';
import { encodeQr } from '../components/qr';

describe('NIT y dígito de verificación', () => {
  it('calcula el DV con el algoritmo de la DIAN (NIT de la DIAN 800.197.268-4)', () => {
    expect(nitDv('800197268')).toBe('4');
  });

  it('distingue NIT válido, sin DV, con DV errado y corto', () => {
    expect(checkNit('901234517-9').state).toBe('ok');
    expect(checkNit('901.234.517-9').state).toBe('ok');
    expect(checkNit('901234517')).toMatchObject({ state: 'missingDv', expectedDv: '9' });
    expect(checkNit('901234517-1')).toMatchObject({ state: 'badDv', expectedDv: '9' });
    expect(checkNit('1234').state).toBe('short');
  });

  it('los NIT de los datos de ejemplo tienen el DV correcto', () => {
    for (const c of SAMPLE_CLIENTS) expect(nitDv(c.idNumber)).toBe(c.dv);
  });
});

describe('Totales', () => {
  it('total = subtotal + IVA; las retenciones son informativas', () => {
    const t = computeTotals(DEFAULT_LINES, { retIva: true, retIcaPerMil: 9.66 });
    expect(t.subtotal).toBe(3_250_000);
    expect(t.iva).toBe(617_500);
    expect(t.total).toBe(3_867_500);
    expect(t.rete.iva).toBe(92_625); // 15 % del IVA
    expect(t.rete.ica).toBe(31_395); // 9,66 por mil
    expect(t.netEstimate).toBe(t.total - t.rete.total);
  });

  it('calcula el IVA por tarifa (19 %, 5 %, exento y excluido)', () => {
    const t = computeTotals(
      [
        { qty: 1, unitPrice: 100_000, tax: 'iva19', rete: 'none' },
        { qty: 1, unitPrice: 100_000, tax: 'iva5', rete: 'none' },
        { qty: 1, unitPrice: 100_000, tax: 'exento', rete: 'none' },
        { qty: 1, unitPrice: 100_000, tax: 'excluido', rete: 'none' },
      ],
      { retIva: false, retIcaPerMil: 0 },
    );
    expect(t.iva).toBe(24_000);
    expect(t.total).toBe(424_000);
  });

  it('formatea pesos sin depender del locale', () => {
    expect(formatCOP(3_867_500)).toBe('$ 3.867.500');
    expect(formatCOP(-535_500)).toBe('-$ 535.500');
  });
});

describe('Días hábiles (aceptación tácita RADIAN)', () => {
  it('salta fines de semana y el festivo del 12 de octubre de 2026', () => {
    expect(addBusinessDays('2026-10-06', 3)).toBe('2026-10-09');
    expect(addBusinessDays('2026-10-08', 3)).toBe('2026-10-14');
    expect(businessDaysUntil('2026-10-08', '2026-10-14')).toBe(3);
  });
});

describe('Documentos de ejemplo', () => {
  const docs = buildSampleDocs();

  it('arrancan con 15 de 16 aceptados y un rechazo explicado', () => {
    expect(docs).toHaveLength(16);
    expect(docs.filter((d) => d.status === 'accepted')).toHaveLength(15);
    expect(docs.find((d) => d.status === 'rejected')?.rejection).toBe('badDv');
  });

  it('la nota crédito NC101 descuenta del saldo de FE1009 y de sus cantidades', () => {
    const fe1009 = docs.find((d) => d.id === 'FE1009')!;
    expect(invoiceBalance(fe1009, docs)).toBe(docTotals(fe1009).total - 535_500);
    expect(returnedQty(fe1009, docs)).toEqual({ 'FE1009-l1': 3 });
  });

  it('numera de forma consecutiva por prefijo', () => {
    expect(nextNumber(docs, 'factura', 'FE')).toBe(1014);
    expect(nextNumber(docs, 'notaCredito', 'NC')).toBe(102);
    expect(nextNumber(docs, 'factura', 'ABC')).toBe(1001);
  });

  it('genera un XML con el total a pagar y la referencia de la nota', () => {
    const nc = docs.find((d) => d.id === 'NC101')!;
    const ref = docs.find((d) => d.id === 'FE1009');
    const xml = buildXml({ ...nc, cufe: 'x'.repeat(96) }, SAMPLE_ISSUER, ref);
    expect(xml).toContain('<CreditNote ');
    expect(xml).toContain('<cbc:PayableAmount currencyID="COP">535500.00</cbc:PayableAmount>');
    expect(xml).toContain('<cbc:ReferenceID>FE1009</cbc:ReferenceID>');
  });
});

describe('Código QR', () => {
  it('elige la versión según el largo y produce una matriz cuadrada válida', () => {
    expect(encodeQr('hola')).toHaveLength(21); // versión 1
    const big = encodeQr('x'.repeat(300));
    expect(big.length).toBe(13 * 4 + 17); // versión 13 con corrección M
    expect(big.every((row) => row.length === big.length)).toBe(true);
  });
});
