/**
 * Reglas de la mesa de ayuda de ejemplo: festivos y días hábiles de Colombia,
 * clasificación por palabras clave, enrutamiento y coherencia de los datos de
 * ejemplo (el registro de la respuesta automática debe coincidir con lo que
 * calcula el motor con los textos en español).
 */
import esMessages from '../../../../../messages/demos/helpdesk-ia.es.json';
import enMessages from '../../../../../messages/demos/helpdesk-ia.en.json';
import { SEED_AUTO_LOG, SEED_SETTINGS, SEED_TICKETS, START_CLOCK, type Ticket } from '../components/data';
import {
  addBusinessDays,
  autoReplyDecision,
  businessDaysBetween,
  classify,
  colombianHolidays,
  dateOfDay,
  pqrsInfo,
  route,
} from '../components/engine';

type Messages = Record<string, unknown>;

function lookup(messages: Messages, key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Messages | undefined)?.[part], messages);
  if (typeof value !== 'string') throw new Error(`Falta la clave ${key}`);
  return value;
}

function customerText(ticket: Ticket, messages: Messages): string {
  return ticket.messages
    .filter((m) => m.from === 'customer')
    .map((m) => (typeof m.text === 'string' ? m.text : lookup(messages, m.text.k)))
    .join('\n');
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('festivos y días hábiles de Colombia', () => {
  it('calcula los 18 festivos de 2026 con la Ley Emiliani', () => {
    expect(colombianHolidays(2026).map(iso)).toEqual([
      '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
      '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
      '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
    ]);
  });

  it('salta fines de semana y el festivo del 12 de octubre de 2026', () => {
    // Radicada el lunes 21 de septiembre de 2026 (día -17): 15 días hábiles → martes 13 de octubre.
    expect(iso(dateOfDay(addBusinessDays(-17, 15)))).toBe('2026-10-13');
    // Del jueves 8 al martes 13 de octubre hay 2 días hábiles (viernes 9 y martes 13).
    expect(businessDaysBetween(0, 5)).toBe(2);
    expect(businessDaysBetween(5, 0)).toBe(-2);
  });
});

describe('clasificación por reglas', () => {
  it.each([
    ['es', esMessages.demoHelpdesk],
    ['en', enMessages.demoHelpdesk],
  ])('los tickets de ejemplo en %s quedan en su área y sentimiento', (_locale, messages) => {
    for (const ticket of SEED_TICKETS) {
      const c = classify(customerText(ticket, messages as Messages));
      expect([ticket.id, c.category, c.sentiment]).toEqual([ticket.id, ticket.category, ticket.sentiment]);
    }
  });

  it('el registro de respuesta automática coincide con el motor (español)', () => {
    for (const entry of SEED_AUTO_LOG) {
      const ticket = SEED_TICKETS.find((t) => t.id === entry.ticketId);
      if (!ticket) throw new Error(`No existe ${entry.ticketId}`);
      const c = classify(customerText(ticket, esMessages.demoHelpdesk as Messages));
      const d = autoReplyDecision(c, SEED_SETTINGS, 'es');
      expect([entry.ticketId, c.confidence, d.result, d.eligible]).toEqual([entry.ticketId, entry.confidence, entry.result, entry.eligible]);
    }
  });

  it('marca urgente una mención a la SIC y detecta el inglés', () => {
    const sic = classify('Si no me devuelven el cobro pongo la queja ante la SIC.');
    expect(sic.priority).toBe('urgent');
    expect(sic.priorityReason).toBe('legal');
    expect(classify('Hello, I forgot my password and I cannot log in to my account. Can you help me?').language).toBe('en');
  });
});

describe('enrutamiento', () => {
  it('asigna por habilidad y menor carga, y exige inglés solo si la mesa trabaja en español', () => {
    const ticket = { id: 'X', category: 'account' as const, language: 'en' as const };
    expect(route(ticket, SEED_TICKETS, 'es')).toMatchObject({ agent: 'carlos', required: ['account', 'english'] });
    const orders = route({ id: 'TCK-1044', category: 'orders', language: 'es' }, SEED_TICKETS, 'es');
    expect(orders.agent).toBe('luis');
  });
});

describe('PQRS de ejemplo', () => {
  it('el reclamo radicado el 21 de septiembre vence el 13 de octubre y está por vencer', () => {
    const t10 = SEED_TICKETS.find((t) => t.id === 'TCK-1050') as Ticket;
    expect(pqrsInfo(t10, START_CLOCK)).toMatchObject({ daysLeft: 2, state: 'dueSoon' });
  });
});
