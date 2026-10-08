/**
 * Lógica de la demo voice-ai: ventana de contacto (referencia Ley 2300),
 * campaña simulada, métricas del registro y línea de tiempo del guion.
 */
import {
  buildTimeline,
  callClock,
  campaignTotals,
  checkContactWindow,
  computeKpis,
  dayOfWeek,
  estimateTurnSeconds,
  evaluateContact,
  fnStatuses,
  sentimentTrend,
  sortContacts,
  toCsv,
  weekStart,
} from '../components/engine';
import { CAMPAIGN_CONTACTS, SAMPLE_CALLS, SCENARIOS, getScenario } from '../components/scenarios';

describe('ventana de contacto en cobranza', () => {
  it('calcula el día de la semana sin depender de la zona horaria', () => {
    expect(dayOfWeek('2026-10-08')).toBe(4); // jueves
    expect(dayOfWeek('2026-10-11')).toBe(0); // domingo
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
  });

  it('permite lunes a viernes 7:00–19:00 y sábados 8:00–15:00', () => {
    expect(checkContactWindow('2026-10-08', '07:00')).toEqual({ kind: 'allowed' });
    expect(checkContactWindow('2026-10-08', '18:59')).toEqual({ kind: 'allowed' });
    expect(checkContactWindow('2026-10-08', '19:00')).toEqual({ kind: 'blocked', reason: 'afterClose' });
    expect(checkContactWindow('2026-10-08', '06:59')).toEqual({ kind: 'blocked', reason: 'beforeOpen' });
    expect(checkContactWindow('2026-10-10', '08:00')).toEqual({ kind: 'allowed' });
    expect(checkContactWindow('2026-10-10', '07:59')).toEqual({ kind: 'blocked', reason: 'beforeOpen' });
    expect(checkContactWindow('2026-10-10', '15:00')).toEqual({ kind: 'blocked', reason: 'afterClose' });
  });

  it('bloquea domingos y festivos de Colombia 2026', () => {
    expect(checkContactWindow('2026-10-11', '10:00')).toEqual({ kind: 'blocked', reason: 'sunday' });
    expect(checkContactWindow('2026-10-12', '10:00')).toEqual({ kind: 'blocked', reason: 'holiday', holiday: 'raceDay' });
    expect(checkContactWindow('2026-12-25', '10:00')).toEqual({ kind: 'blocked', reason: 'holiday', holiday: 'christmas' });
    expect(checkContactWindow('2026-04-03', '10:00')).toEqual({ kind: 'blocked', reason: 'holiday', holiday: 'goodFriday' });
  });

  it('no decide fuera de 2026 ni con datos inválidos', () => {
    expect(checkContactWindow('2027-01-04', '10:00')).toEqual({ kind: 'blocked', reason: 'outOfRange' });
    expect(checkContactWindow('2026-02-30', '10:00')).toEqual({ kind: 'blocked', reason: 'invalid' });
    expect(checkContactWindow('2026-10-08', '25:00')).toEqual({ kind: 'blocked', reason: 'invalid' });
  });
});

describe('campaña simulada', () => {
  const contacts = sortContacts(CAMPAIGN_CONTACTS);

  it('aplica exclusión y frecuencia semanal antes del horario', () => {
    const excluded = contacts.find((c) => c.excluded)!;
    expect(evaluateContact(excluded)).toEqual({ kind: 'blocked', reason: 'excluded' });
    const repeated = contacts.find((c) => c.lastContact)!;
    expect(evaluateContact(repeated)).toEqual({ kind: 'blocked', reason: 'frequency' });
  });

  it('cuenta los resultados de los 14 contactos', () => {
    expect(campaignTotals(contacts, 0)).toEqual({ scheduled: 14, blocked: 0, dialed: 0, connected: 0, voicemail: 0, agreements: 0 });
    expect(campaignTotals(contacts, contacts.length)).toEqual({
      scheduled: 14,
      blocked: 7,
      dialed: 7,
      connected: 4,
      voicemail: 2,
      agreements: 2,
    });
  });

  it('la llamada de cobranza del guion está dentro del horario permitido', () => {
    const s = getScenario('cobranza');
    expect(s.collections).toBe(true);
    expect(checkContactWindow(s.scheduled!.date, s.scheduled!.time)).toEqual({ kind: 'allowed' });
  });
});

describe('métricas del registro', () => {
  it('calcula contención, TMO, encuesta y sentimiento con los datos de ejemplo', () => {
    const k = computeKpis(SAMPLE_CALLS);
    expect(k.total).toBe(13);
    expect(k.answered).toBe(11);
    expect(k.resolved).toBe(8);
    expect(k.transferred).toBe(2);
    expect(Math.round(k.containment)).toBe(73);
    expect(Math.round(k.aht)).toBe(164);
    expect(k.csat).toBe(4);
    expect(k.csatResponses).toBe(8);
    expect(Math.round(k.positive)).toBe(55);
  });

  it('sin encuestas la satisfacción es null', () => {
    expect(computeKpis([]).csat).toBeNull();
  });

  it('exporta CSV con separador ; y comillas cuando hace falta', () => {
    expect(toCsv([['a', 'b;c'], [1, 'd"e']])).toBe('a;"b;c"\r\n1;"d""e"');
  });
});

describe('línea de tiempo y estados del guion', () => {
  it('es determinista: el mismo texto da los mismos tiempos', () => {
    const txt = 'Hola, soy Sofía, la asistente virtual de Banco Arrayán.';
    expect(estimateTurnSeconds(txt)).toBe(estimateTurnSeconds(txt));
    expect(estimateTurnSeconds('Sí.')).toBe(2);
    const at = buildTimeline([3, 4, 5]);
    expect(at).toEqual([0, 3, 7]);
    expect(callClock(at, [3, 4, 5], 1, 2500)).toBe(5.5);
    expect(callClock(at, [3, 4, 5], 2, 99000)).toBe(12);
  });

  it('las acciones pasan de pendiente a ejecutando a completada y no se marcan sin invocarse', () => {
    const s = getScenario('banca');
    const idx = s.turns.findIndex((tn) => tn.fns?.includes('verifyCustomer'));
    expect(fnStatuses(s, idx - 1, true, 'playing').verifyCustomer).toBe('pending');
    expect(fnStatuses(s, idx, false, 'playing').verifyCustomer).toBe('running');
    expect(fnStatuses(s, idx, true, 'playing').verifyCustomer).toBe('done');
    expect(fnStatuses(s, idx, true, 'playing').logCallCrm).toBe('pending');
    expect(fnStatuses(s, idx, true, 'transferred').logCallCrm).toBe('skipped');
  });

  it('cada función del escenario se invoca en algún turno y viceversa', () => {
    SCENARIOS.forEach((s) => {
      const invoked = new Set(s.turns.flatMap((tn) => tn.fns ?? []));
      expect(new Set(s.fns.map((f) => f.key))).toEqual(invoked);
    });
  });

  it('ningún dato enmascarado contiene un documento completo', () => {
    SCENARIOS.forEach((s) => {
      Object.values(s.maskedData).forEach((v) => expect(v).toMatch(/\*/));
      expect(s.number).toMatch(/^\+57 \d{3} \*\*\* \d{4}$/);
    });
  });

  it('tendencia del sentimiento', () => {
    expect(sentimentTrend(['negative', 'neutral', 'positive'])).toBe('improving');
    expect(sentimentTrend(['positive', 'negative'])).toBe('declining');
    expect(sentimentTrend(['neutral'])).toBe('stable');
  });
});
