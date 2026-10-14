/**
 * Lógica de la demo voice-ai: ventana de contacto (referencia Ley 2300),
 * campaña simulada, métricas del registro y línea de tiempo del guion.
 */
import {
  buildTimeline,
  callClock,
  campaignTotals,
  checkContactWindow,
  colombianHolidays,
  computeKpis,
  dayOfWeek,
  easterSunday,
  evaluateCampaign,
  evaluateContact,
  fnStatuses,
  maskColombianNumber,
  sentimentTrend,
  sortContacts,
  toCsv,
  weekStart,
} from '../components/engine';
import { CAMPAIGN_CONTACTS, SAMPLE_CALLS, SCENARIOS, SCENARIO_IDS, getScenario, scriptSeconds } from '../components/scenarios';
import { isCallRow } from '../components/storage';
import { INTENT_KEYS } from '../components/types';
import type { CampaignContact } from '../components/types';
import esMessages from '../../../../../messages/demos/voice-ai.es.json';
import enMessages from '../../../../../messages/demos/voice-ai.en.json';

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

  it('calcula los festivos de otros años (Pascua y Ley Emiliani)', () => {
    expect(easterSunday(2026)).toEqual({ m: 4, d: 5 });
    expect(easterSunday(2027)).toEqual({ m: 3, d: 28 });
    // 2027: Reyes pasa al lunes 11 de enero; Jueves y Viernes Santo 25 y 26 de marzo.
    expect(checkContactWindow('2027-01-11', '10:00')).toEqual({ kind: 'blocked', reason: 'holiday', holiday: 'epiphany' });
    expect(checkContactWindow('2027-03-25', '10:00')).toEqual({ kind: 'blocked', reason: 'holiday', holiday: 'holyThursday' });
    expect(checkContactWindow('2027-01-04', '10:00')).toEqual({ kind: 'allowed' });
    expect(Object.keys(colombianHolidays(2027))).toHaveLength(18);
  });

  it('los festivos calculados de 2026 son los 18 del calendario oficial', () => {
    expect(colombianHolidays(2026)).toEqual({
      '2026-01-01': 'newYear',
      '2026-01-12': 'epiphany',
      '2026-03-23': 'saintJoseph',
      '2026-04-02': 'holyThursday',
      '2026-04-03': 'goodFriday',
      '2026-05-01': 'labour',
      '2026-05-18': 'ascension',
      '2026-06-08': 'corpusChristi',
      '2026-06-15': 'sacredHeart',
      '2026-06-29': 'saintsPeterPaul',
      '2026-07-20': 'independence',
      '2026-08-07': 'boyaca',
      '2026-08-17': 'assumption',
      '2026-10-12': 'raceDay',
      '2026-11-02': 'allSaints',
      '2026-11-16': 'cartagena',
      '2026-12-08': 'immaculate',
      '2026-12-25': 'christmas',
    });
  });

  it('no decide fuera de 2024–2099 ni con datos inválidos', () => {
    expect(checkContactWindow('2023-01-04', '10:00')).toEqual({ kind: 'blocked', reason: 'outOfRange' });
    expect(checkContactWindow('2100-01-04', '10:00')).toEqual({ kind: 'blocked', reason: 'outOfRange' });
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

  it('la frecuencia cuenta las llamadas que la propia campaña ya hizo esa semana', () => {
    const base: CampaignContact = { id: 'a', name: 'A', number: '+57 300 *** 0001', date: '2026-10-13', time: '09:00', outcome: 'agreement' };
    const again: CampaignContact = { ...base, id: 'b', date: '2026-10-15', time: '10:00' };
    const nextWeek: CampaignContact = { ...base, id: 'c', date: '2026-10-20', time: '10:00' };
    expect(evaluateCampaign([base, again, nextWeek])).toEqual([
      { kind: 'allowed' },
      { kind: 'blocked', reason: 'frequency' },
      { kind: 'allowed' },
    ]);
    // El último contacto previo de un número cuenta para cualquier entrada con ese número.
    const previous: CampaignContact = { ...base, id: 'p', date: '2026-10-08', lastContact: '2026-10-06' };
    expect(evaluateCampaign([previous, { ...base, id: 'q', date: '2026-10-09' }])).toEqual([
      { kind: 'blocked', reason: 'frequency' },
      { kind: 'blocked', reason: 'frequency' },
    ]);
    // Una llamada bloqueada por horario no cuenta como contacto de la semana.
    const blocked: CampaignContact = { ...base, id: 'd', time: '06:00' };
    expect(evaluateCampaign([blocked, again])).toEqual([{ kind: 'blocked', reason: 'beforeOpen' }, { kind: 'allowed' }]);
  });

  it('enmascara celulares y fijos colombianos de 10 dígitos', () => {
    expect(maskColombianNumber('300 123 4567')).toBe('+57 300 *** 4567');
    expect(maskColombianNumber('+57 601 234 5678')).toBe('+57 601 *** 5678');
    expect(maskColombianNumber('12345')).toBeNull();
    expect(maskColombianNumber('2001234567')).toBeNull();
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
    expect(Math.round(k.aht)).toBe(116);
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
  it('cada turno tiene una duración fija y la llamada dura lo que suman', () => {
    SCENARIOS.forEach((s) => s.turns.forEach((tn) => expect(tn.sec).toBeGreaterThanOrEqual(2)));
    expect(scriptSeconds(getScenario('banca'))).toBe(67);
    expect(scriptSeconds(getScenario('pedido'))).toBe(73);
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

  it('las filas del registro con guion coinciden con su llamada', () => {
    const scripted = SAMPLE_CALLS.filter((r) => r.scenario);
    expect(scripted.map((r) => r.scenario).sort()).toEqual(['banca', 'cobranza', 'pedido', 'salud']);
    scripted.forEach((r) => {
      const s = getScenario(r.scenario!);
      const intents = s.turns.filter((tn) => tn.intent);
      const lastCustomer = [...s.turns].reverse().find((tn) => tn.speaker === 'customer')!;
      expect(r.number).toBe(s.number);
      expect(r.direction).toBe(s.direction);
      expect(r.durationSec).toBe(scriptSeconds(s));
      expect(r.intent).toBe(intents[intents.length - 1].intent);
      expect(r.sentiment).toBe(lastCustomer.sentiment);
      expect(r.result).toBe(s.turns[s.turns.length - 1].fns?.includes('transferToHuman') ? 'transferred' : 'resolved');
      if (s.scheduled) expect(r.time).toBe(s.scheduled.time);
    });
  });

  it('tendencia del sentimiento', () => {
    expect(sentimentTrend(['negative', 'neutral', 'positive'])).toBe('improving');
    expect(sentimentTrend(['positive', 'negative'])).toBe('declining');
    expect(sentimentTrend(['neutral'])).toBe('stable');
  });
});

describe('textos, idiomas y datos guardados', () => {
  const es = esMessages.demoVoice;
  const en = enMessages.demoVoice;

  it('cada acción trae su solicitud en inglés con los mismos campos y sin palabras en español', () => {
    SCENARIOS.forEach((s) =>
      s.fns.forEach((f) => {
        expect(f.argsEn).toBeDefined();
        expect(Object.keys(f.argsEn ?? {})).toHaveLength(Object.keys(f.args).length);
        const json = JSON.stringify(f.argsEn);
        expect(json).not.toMatch(/documento|canal|"voz"|tarjeta|desde|hasta|pais|motivo|resultado|intencion|paciente|estado|especialidad|fecha|franja|cita|sede|plantilla|telefono|credito|cuota|valor|vence|moneda|pedido|tipo|prioridad|cola|resumen|correo/);
      }),
    );
  });

  it('los nombres de las funciones están en el idioma de cada versión', () => {
    (Object.keys(es.fns) as (keyof typeof es.fns)[]).forEach((k) => {
      expect(en.fns[k].name).toMatch(/^[a-z_]+$/);
      expect(en.fns[k].name).not.toBe(es.fns[k].name);
    });
  });

  it('todos los motivos del guion y del registro existen en ambos idiomas', () => {
    const used = new Set([
      ...SAMPLE_CALLS.map((r) => r.intent),
      ...SCENARIOS.flatMap((s) => s.turns.map((tn) => tn.intent).filter((x): x is string => !!x)),
      'none',
    ]);
    used.forEach((k) => expect(INTENT_KEYS).toContain(k));
    INTENT_KEYS.forEach((k) => {
      expect(es.intents).toHaveProperty(k);
      expect(en.intents).toHaveProperty(k);
    });
  });

  it('cada escenario tiene nombre de archivo en ambos idiomas', () => {
    SCENARIO_IDS.forEach((id) => {
      expect(es.scenarios[id].file).toMatch(/^[a-z-]+$/);
      expect(en.scenarios[id].file).toMatch(/^[a-z-]+$/);
    });
    expect(en.scenarios.banca.file).toBe('banking');
  });

  it('solo se cargan del navegador las pruebas con valores conocidos', () => {
    const ok = { id: 'mine-1', time: '10:05', date: '2026-10-14', number: '+57 310 *** 4821', direction: 'inbound', intent: 'none', durationSec: 3, result: 'abandoned', sentiment: 'neutral', csat: null, scenario: 'banca', mine: true };
    expect(isCallRow(ok)).toBe(true);
    expect(isCallRow({ ...ok, intent: 'inventado' })).toBe(false);
    expect(isCallRow({ ...ok, result: 'otro' })).toBe(false);
    expect(isCallRow({ ...ok, sentiment: 'feliz' })).toBe(false);
    expect(isCallRow({ ...ok, scenario: 'otro' })).toBe(false);
    expect(isCallRow({ ...ok, csat: undefined })).toBe(false);
    expect(isCallRow({ ...ok, durationSec: -1 })).toBe(false);
    expect(isCallRow({ ...ok, date: 'ayer' })).toBe(false);
    expect(isCallRow(null)).toBe(false);
  });
});
