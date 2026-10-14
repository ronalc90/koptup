/**
 * Partes puras de los avisos al dueño (sin MongoDB): armado del aviso,
 * backoff de reintentos, ventana horaria y días del latido, y enmascarado.
 */
import {
  HEARTBEAT_RETRY_MS,
  MAX_NOTIFY_ATTEMPTS,
  buildContactNotice,
  contactEmailIdempotencyKey,
  noticeBodyHash,
  bogotaHour,
  heartbeatDays,
  isWithinHeartbeatWindow,
  nextHeartbeatAt,
  nextRetryAt,
  notifyJobsEnabled,
} from '../../services/owner-notify.service';
import { cleanErrorText, maskEmail, maskEmailList, maskPhone } from '../../utils/mask';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

describe('avisos al dueño: partes puras', () => {
  it('aviso de contacto: asunto, reply_to y título/detalle para la plantilla (nombre, empresa, servicio, email y extracto)', () => {
    const n = buildContactNotice({
      name: 'Ana Pérez',
      email: 'ana@cliente.co',
      company: 'ACME',
      service: 'Sistema RAG',
      message: `Hola,\nquiero un chatbot.\n${'x'.repeat(600)}`,
      source: 'demo-rag',
      plazo: '1m',
      cotizacion: { servicio: 'sistema-rag', plan: 'piloto' },
      created_at: new Date('2026-10-14T15:00:00Z'),
    });
    expect(n.asunto).toBe('🔔 Nuevo contacto: Ana Pérez - Sistema RAG');
    expect(n.replyTo).toBe('ana@cliente.co');
    expect(n.titulo).toBe('Nuevo contacto de Ana Pérez');
    expect(n.detalle).toMatch(/^Empresa: ACME · Servicio: Sistema RAG · Origen: Prueba con tu documento \(demo RAG\) · Email: ana@cliente\.co · Mensaje: Hola, quiero un chatbot\. x+…$/);
    expect(n.text).toContain('Cuándo quiere empezar: El próximo mes');
    expect(n.text).toContain('Cotizaba: sistema-rag · plan piloto');
    expect(n.text).toContain('14/10/2026');
    expect(n.html).toContain('href="mailto:ana@cliente.co"');
  });

  it('backoff: 5 min, 15 min, 1 h, 3 h, 12 h y después ya no se reintenta (máx. 6 intentos)', () => {
    const now = new Date('2026-10-14T15:00:00Z');
    const waits = [1, 2, 3, 4, 5].map((i) => (nextRetryAt(i, now) as Date).getTime() - now.getTime());
    expect(waits).toEqual([5 * MIN, 15 * MIN, 60 * MIN, 180 * MIN, 720 * MIN]);
    expect(nextRetryAt(MAX_NOTIFY_ATTEMPTS, now)).toBeNull();
    expect(MAX_NOTIFY_ATTEMPTS).toBe(6);
  });

  it('ventana del latido: de 9:00 a 18:59 en Bogotá (UTC-5)', () => {
    expect(bogotaHour(new Date('2026-10-14T14:00:00Z'))).toBe(9);
    expect(isWithinHeartbeatWindow(new Date('2026-10-14T13:59:00Z'))).toBe(false); // 8:59
    expect(isWithinHeartbeatWindow(new Date('2026-10-14T14:00:00Z'))).toBe(true); // 9:00
    expect(isWithinHeartbeatWindow(new Date('2026-10-14T23:59:00Z'))).toBe(true); // 18:59
    expect(isWithinHeartbeatWindow(new Date('2026-10-15T00:00:00Z'))).toBe(false); // 19:00
    expect(isWithinHeartbeatWindow(new Date('2026-10-15T03:00:00Z'))).toBe(false); // 22:00
  });

  it('próximo latido: último + días, movido a la ventana; sin latido previo, ahora o a las 9:00', () => {
    const ultimo = new Date('2026-10-01T15:00:00Z');
    const now = new Date('2026-10-14T15:00:00Z');
    expect(nextHeartbeatAt(ultimo, 30, now)?.toISOString()).toBe('2026-10-31T15:00:00.000Z');
    expect(nextHeartbeatAt(null, 30, now)?.toISOString()).toBe(now.toISOString());
    // A las 22:00 de Bogotá sin latido previo → mañana a las 9:00 (14:00 UTC).
    expect(nextHeartbeatAt(null, 30, new Date('2026-10-15T03:00:00Z'))?.toISOString()).toBe('2026-10-15T14:00:00.000Z');
    // A las 20:00 de Bogotá (01:00 UTC del día siguiente) → 9:00 del día siguiente en Bogotá.
    expect(nextHeartbeatAt(new Date(Date.parse('2026-10-15T01:00:00Z') - 30 * DAY), 30, new Date('2026-10-15T01:00:00Z'))?.toISOString()).toBe(
      '2026-10-15T14:00:00.000Z',
    );
    expect(nextHeartbeatAt(ultimo, 0, now)).toBeNull();
  });

  it('próximo latido tras un intento que no salió: 20 h después del intento (en la ventana), no ahora', () => {
    const intento = new Date('2026-10-14T15:30:00Z');
    expect(nextHeartbeatAt(null, 30, new Date(intento.getTime() + MIN), intento)?.toISOString()).toBe('2026-10-15T14:00:00.000Z');
    const ultimo = new Date(intento.getTime() - 40 * DAY);
    expect(nextHeartbeatAt(ultimo, 30, new Date(intento.getTime() + MIN), intento)?.toISOString()).toBe(new Date(Date.parse('2026-10-15T14:00:00Z')).toISOString());
    // Un intento anterior al último latido exitoso no cuenta.
    expect(nextHeartbeatAt(intento, 30, intento, new Date(intento.getTime() - DAY))?.toISOString()).toBe(new Date(intento.getTime() + 30 * DAY).toISOString());
    expect(HEARTBEAT_RETRY_MS).toBe(20 * 60 * MIN);
  });

  it('Idempotency-Key del correo: lleva el hash del cuerpo (otro cuerpo, otra key); el reenvío forzado agrega -r<intento>', () => {
    const base = { name: 'Ana', email: 'ana@cliente.co', service: 'RAG', message: 'Hola', _id: 'abc', created_at: new Date('2026-10-14T15:00:00Z') };
    const h1 = noticeBodyHash(buildContactNotice(base));
    expect(h1).toMatch(/^[0-9a-f]{16}$/);
    expect(noticeBodyHash(buildContactNotice(base))).toBe(h1);
    const h2 = noticeBodyHash(buildContactNotice({ ...base, message: 'Hola\nDocumento procesado: 3 páginas.' }));
    expect(h2).not.toBe(h1);
    expect(contactEmailIdempotencyKey('abc', 'reintento', 2, h1)).toBe(`contact-abc-email-${h1}`);
    expect(contactEmailIdempotencyKey('abc', 'manual_todos', 3, h1)).toBe(`contact-abc-email-${h1}-r3`);
    // El log del correo usa una etiqueta sin el nombre.
    expect(buildContactNotice(base).logLabel).toBe('aviso del contacto abc');
  });

  it('NOTIFY_HEARTBEAT_DAYS (30 por defecto, 0 apaga) y NOTIFY_JOBS_ENABLED', () => {
    expect(heartbeatDays({} as NodeJS.ProcessEnv)).toBe(30);
    expect(heartbeatDays({ NOTIFY_HEARTBEAT_DAYS: '0' } as NodeJS.ProcessEnv)).toBe(0);
    expect(heartbeatDays({ NOTIFY_HEARTBEAT_DAYS: '7' } as NodeJS.ProcessEnv)).toBe(7);
    expect(heartbeatDays({ NOTIFY_HEARTBEAT_DAYS: '-3' } as NodeJS.ProcessEnv)).toBe(30);
    expect(notifyJobsEnabled({} as NodeJS.ProcessEnv)).toBe(true);
    expect(notifyJobsEnabled({ NOTIFY_JOBS_ENABLED: 'false' } as NodeJS.ProcessEnv)).toBe(false);
  });

  it('enmascarado de destinos y limpieza de errores', () => {
    expect(maskEmail('rosa.perez.prueba@gmail.com')).toBe('ro***@gmail.com');
    expect(maskEmailList(['a@x.co', 'bb@y.co'])).toBe('a***@x.co, bb***@y.co');
    expect(maskEmailList([])).toBeNull();
    expect(maskPhone('573001234567')).toBe('+57 *** *** 4567');
    expect(maskPhone('+57 300 123 4567')).toBe('+57 *** *** 4567');
    expect(maskPhone('')).toBeNull();
    const cleaned = cleanErrorText('fallo con Bearer abc.def y key re_123456 para ana@cliente.co\nlínea 2', ['re_123456']);
    expect(cleaned).toBe('fallo con Bearer *** y key *** para an***@cliente.co línea 2');
    expect(cleanErrorText('x'.repeat(500))).toHaveLength(300);
  });
});
