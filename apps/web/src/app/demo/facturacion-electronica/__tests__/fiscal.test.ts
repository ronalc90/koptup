/**
 * Reglas de la demo de facturación electrónica: DV del NIT, totales (IVA por tarifa y
 * retenciones informativas), días hábiles con festivos, saldos de notas y código QR.
 */
import {
  addBusinessDays,
  addMonthsYm,
  businessDaysUntil,
  checkNit,
  coHolidays,
  computeTotals,
  formatCOP,
  isBusinessDay,
  nitDv,
  subBusinessDays,
} from '../components/fiscal';
import { buildSampleDocs, buildSampleIncoming, DEFAULT_LINES, resolutionFor, SAMPLE_CLIENTS, SAMPLE_ISSUER } from '../components/data';
import { buildXml, claimDeadline, docTotals, incomingStage, invoiceBalance, isPendingStage, nextNumber, returnedQty } from '../components/docs';
import { draftLines, draftParty, defaultDraft } from '../components/draft';
import { initialState, restoreState } from '../components/useBillingStore';
import { periodsOf } from '../components/ReportsPanel';
import { encodeQr } from '../components/qr';

const TODAY = '2026-10-14';

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

describe('Días hábiles y festivos de Colombia (aceptación tácita RADIAN)', () => {
  it('salta fines de semana y el festivo del 12 de octubre de 2026', () => {
    expect(addBusinessDays('2026-10-06', 3)).toBe('2026-10-09');
    expect(addBusinessDays('2026-10-08', 3)).toBe('2026-10-14');
    expect(businessDaysUntil('2026-10-08', '2026-10-14')).toBe(3);
    expect(subBusinessDays('2026-10-14', 1)).toBe('2026-10-13');
    expect(subBusinessDays('2026-10-13', 1)).toBe('2026-10-09');
  });

  it('calcula los festivos de cualquier año (fijos, trasladables y de Semana Santa)', () => {
    const h2026 = coHolidays(2026);
    for (const d of ['2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25']) {
      expect(h2026.has(d)).toBe(true);
    }
    expect(h2026.size).toBe(18);
    // 2027: Pascua el 28 de marzo; Reyes se traslada al lunes 11 de enero.
    const h2027 = coHolidays(2027);
    expect(h2027.has('2027-01-11')).toBe(true);
    expect(h2027.has('2027-03-25')).toBe(true);
    expect(h2027.has('2027-03-26')).toBe(true);
    expect(isBusinessDay('2027-01-11')).toBe(false);
    expect(isBusinessDay('2027-01-12')).toBe(true);
  });

  it('suma meses con cambio de año', () => {
    expect(addMonthsYm('2026-10', -9)).toBe('2026-01');
    expect(addMonthsYm('2026-01', -1)).toBe('2025-12');
    expect(addMonthsYm('2026-12', 1)).toBe('2027-01');
  });
});

describe('Fechas de los datos de ejemplo (relativas a hoy)', () => {
  it.each(['2026-10-14', '2026-11-01', '2027-01-04', '2027-03-29', '2027-07-31'])('con hoy = %s todo queda antes de hoy y en días hábiles', (today) => {
    const docs = buildSampleDocs(today);
    for (const d of docs) {
      expect(d.issueDate < today).toBe(true);
      expect(isBusinessDay(d.issueDate)).toBe(true);
      for (const h of d.history) expect(h.date <= today).toBe(true);
    }
    // Las notas son posteriores a su factura.
    for (const n of docs.filter((d) => d.refId)) {
      const ref = docs.find((d) => d.id === n.refId)!;
      expect(ref.issueDate <= n.issueDate).toBe(true);
    }
    for (const inv of buildSampleIncoming(today)) {
      expect(inv.issueDate < today).toBe(true);
      for (const e of inv.events) expect(e.date < today).toBe(true);
    }
    // La resolución de numeración está vigente y es anterior al primer documento.
    const res = resolutionFor(today);
    const oldest = docs[docs.length - 1].issueDate;
    expect(res.date < oldest).toBe(true);
    expect(res.validTo > today).toBe(true);
  });

  it('los libros ofrecen el mes en curso y los meses con movimientos', () => {
    const s = initialState(TODAY);
    expect(periodsOf(s.docs, s.incoming, TODAY)).toEqual(['2026-10', '2026-09', '2026-08']);
  });
});

describe('RADIAN', () => {
  const incoming = buildSampleIncoming(TODAY);
  const byId = (id: string) => incoming.find((i) => i.id === id)!;

  it('el arriendo tiene 1 día hábil para aceptar o reclamar y el aseo ya está en aceptación tácita', () => {
    expect(claimDeadline(byId('in-3'), TODAY)).toMatchObject({ daysLeft: 1, passed: false });
    expect(incomingStage(byId('in-3'), TODAY)).toBe('received');
    expect(incomingStage(byId('in-6'), TODAY)).toBe('tacit');
    // Al vencer el plazo, opera la aceptación tácita.
    const deadline = claimDeadline(byId('in-3'), TODAY)!.deadline;
    expect(incomingStage(byId('in-3'), addBusinessDays(deadline, 1))).toBe('tacit');
  });

  it('arranca con 4 facturas por gestionar y la dirigida a otro NIT sale al avisar al proveedor', () => {
    expect(incoming.filter((i) => isPendingStage(incomingStage(i, TODAY)))).toHaveLength(4);
    const returned = { ...byId('in-5'), returnedDate: TODAY };
    expect(incomingStage(returned, TODAY)).toBe('returned');
    expect(isPendingStage('returned')).toBe(false);
  });
});

describe('Lo guardado en el navegador', () => {
  const issuer = { ...SAMPLE_ISSUER, name: 'Mi Empresa de Prueba S.A.S.' };

  it('conserva lo guardado del mismo mes', () => {
    const saved = { ...initialState('2026-10-09'), issuer };
    const { state, notice } = restoreState(saved, null, TODAY);
    expect(notice).toBeNull();
    expect(state.anchor).toBe('2026-10-09');
    expect(state.issuer.name).toBe(issuer.name);
  });

  it('si era de otro mes, arma datos nuevos con la fecha de hoy, conserva el emisor y avisa', () => {
    const saved = { ...initialState('2026-09-20'), issuer };
    const { state, notice } = restoreState(saved, null, TODAY);
    expect(notice).toEqual({ kind: 'monthChanged', from: '2026-09' });
    expect(state.anchor).toBe(TODAY);
    expect(state.issuer.name).toBe(issuer.name);
    expect(state.docs.every((d) => d.issueDate < TODAY)).toBe(true);
  });

  it('migra lo guardado por la versión con fecha fija (8 de octubre de 2026)', () => {
    const legacy = { ...initialState('2026-10-08'), v: 2, anchor: undefined };
    expect(restoreState(null, legacy, TODAY).state.anchor).toBe('2026-10-08');
    expect(restoreState(null, legacy, '2026-11-03').notice).toEqual({ kind: 'monthChanged', from: '2026-10' });
  });

  it('descarta lo que no reconoce', () => {
    expect(restoreState({ v: 3 }, 'x', TODAY)).toEqual({ state: initialState(TODAY), notice: null });
  });
});

describe('Ejemplo de la API', () => {
  it('una factura no arrastra la referencia de una nota', () => {
    const docs = buildSampleDocs(TODAY);
    const draft = { ...defaultDraft(), type: 'factura' as const, refId: 'FE1012', concept: '2' };
    expect(draftLines(draft, docs.find((d) => d.id === 'FE1012'), '')).toBe(draft.lines);
    expect(draftParty(draft, undefined).idType).toBe('NIT');
  });
});

describe('Documentos de ejemplo', () => {
  const docs = buildSampleDocs(TODAY);

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
    const xml = buildXml({ ...nc, cufe: 'x'.repeat(96) }, SAMPLE_ISSUER, ref, resolutionFor(TODAY));
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
