/**
 * Plazo de conservación (jobs/retention.job.ts): pasado DATA_RETENTION_MONTHS
 * se anonimizan las solicitudes de demo rechazadas y los prospectos sin
 * actividad; lo reciente, los clientes y las cuentas no se tocan. El job usa
 * un candado en Redis como los demás.
 */
import mongoose from 'mongoose';
import { connectTestDb, describeDb, disconnectTestDb, REDIS_OK } from './helpers';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

describeDb('plazo de conservación de datos personales (integración)', () => {
  const prevMonths = process.env.DATA_RETENTION_MONTHS;
  const db = () => mongoose.connection;
  const ago = (months: number) => new Date(Date.now() - months * MONTH_MS);

  beforeAll(async () => {
    delete process.env.DATA_RETENTION_MONTHS;
    await connectTestDb('retention');
  });

  afterAll(async () => {
    if (prevMonths === undefined) delete process.env.DATA_RETENTION_MONTHS;
    else process.env.DATA_RETENTION_MONTHS = prevMonths;
    if (REDIS_OK) {
      const { getRedisClient } = await import('../../config/redis');
      const redis = await getRedisClient().catch(() => null);
      await redis?.del('jobs:retention:lock').catch(() => 0);
      await redis?.quit().catch(() => undefined);
    }
    await disconnectTestDb();
  });

  async function seedRequest(email: string, estado: string, revisadoEn: Date | null) {
    const res = await db().collection('demorequests').insertOne({
      codigo: `DR-T-${Math.random().toString(36).slice(2, 8)}`,
      nombre: 'Persona Vieja',
      empresa: 'Empresa Vieja',
      cargo: 'Gerente',
      email,
      telefono: '+57 300 000 0000',
      pais: 'Colombia',
      tamanoEmpresa: '1-10',
      demos: ['erp'],
      casoDeUso: 'Caso de uso con datos personales',
      consentimiento: { aceptado: true, fecha: revisadoEn ?? new Date(), ipHash: 'abc', userAgent: 'UA', versionPolitica: '2024-01' },
      estado,
      notas: [{ texto: 'Nota con datos', fecha: new Date() }],
      motivoRechazo: estado === 'rechazada' ? 'Spam' : undefined,
      revisadoEn,
      reenvios: 0,
      createdAt: revisadoEn ?? new Date(),
      updatedAt: revisadoEn ?? new Date(),
    });
    return res.insertedId;
  }

  async function seedLead(email: string, opts: { etapa?: string; ultima: Date; usuario?: mongoose.Types.ObjectId }) {
    const lead = await db().collection('leads').insertOne({
      email,
      nombre: 'Prospecto Viejo',
      empresa: 'Empresa Prospecto',
      telefono: '+57 311 111 1111',
      etapa: opts.etapa ?? 'contactado',
      etapaCambiadaEn: opts.ultima,
      origenes: ['contact-form'],
      origenPrincipal: 'contact-form',
      intereses: ['Sistema RAG'],
      usuario: opts.usuario ?? null,
      contactos: 1,
      ultimaActividadEn: opts.ultima,
      anonimizadoEn: null,
    });
    const contact = await db().collection('contacts').insertOne({
      name: 'Prospecto Viejo',
      email,
      phone: '+57 311 111 1111',
      company: 'Empresa Prospecto',
      service: 'Sistema RAG',
      message: 'Mensaje con datos personales',
      status: 'read',
      source: 'contact-form',
      lead: lead.insertedId,
      consentimiento: { aceptado: true, fecha: opts.ultima, ipHash: 'def', versionPolitica: '2024-01' },
      created_at: opts.ultima,
    });
    await db().collection('leadactivities').insertOne({ lead: lead.insertedId, tipo: 'nota', texto: 'Llamé a Prospecto Viejo al +57 311', createdAt: opts.ultima });
    await db().collection('auditlogs').insertOne({ accion: 'lead.create', entidad: { tipo: 'Lead', id: String(lead.insertedId) }, detalle: { email }, createdAt: opts.ultima });
    return { leadId: lead.insertedId, contactId: contact.insertedId };
  }

  it('anonimiza lo vencido y no toca lo reciente, a los clientes ni a quien tiene cuenta', async () => {
    const oldRejected = await seedRequest('rechazada-vieja@test.local', 'rechazada', ago(25));
    const newRejected = await seedRequest('rechazada-nueva@test.local', 'rechazada', ago(2));
    const oldApproved = await seedRequest('aprobada-vieja@test.local', 'aprobada', ago(25));
    const idle = await seedLead('inactivo@test.local', { ultima: ago(25) });
    const active = await seedLead('activo@test.local', { ultima: ago(3) });
    const client = await seedLead('cliente@test.local', { etapa: 'ganado', ultima: ago(30) });
    const userId = (await db().collection('users').insertOne({ email: 'con-cuenta@test.local', name: 'Con cuenta', role: 'prospect', provider: 'local' })).insertedId;
    const withAccount = await seedLead('con-cuenta@test.local', { ultima: ago(30), usuario: userId });
    const orphan = (
      await db().collection('contacts').insertOne({ name: 'Huérfano', email: 'huerfano@test.local', service: 'x', message: 'Mensaje viejo', status: 'new', created_at: ago(26) })
    ).insertedId;

    const { runRetentionJob } = await import('../../jobs/retention.job');
    const run = await runRetentionJob();
    expect(run.skipped).toBeUndefined();
    expect(run.result).toMatchObject({ leads: 1, solicitudes: 1 });
    expect(run.result!.contactos).toBe(2);

    // Solicitud rechazada hace más de 24 meses: sin datos personales.
    const r = await db().collection('demorequests').findOne({ _id: oldRejected });
    expect(r).toMatchObject({ nombre: 'Titular anonimizado', empresa: 'Anonimizada', notas: [], motivoRechazo: null, estado: 'rechazada', demos: ['erp'] });
    expect(r?.email).toMatch(/@anonimizado\.invalid$/);
    expect(r?.telefono).toBeUndefined();
    expect(r?.cargo).toBeUndefined();
    expect(r?.consentimiento.ipHash).toBeUndefined();
    expect(r?.anonimizadoEn).toBeInstanceOf(Date);
    // Las recientes y las aprobadas (con cuenta) siguen igual.
    expect((await db().collection('demorequests').findOne({ _id: newRejected }))?.nombre).toBe('Persona Vieja');
    expect((await db().collection('demorequests').findOne({ _id: oldApproved }))?.nombre).toBe('Persona Vieja');

    // Prospecto sin actividad: lead, contacto, línea de tiempo y bitácora anonimizados.
    const lead = await db().collection('leads').findOne({ _id: idle.leadId });
    expect(lead).toMatchObject({ nombre: 'Titular anonimizado', etapa: 'contactado', intereses: ['Sistema RAG'] });
    expect(lead?.email).toMatch(/@anonimizado\.invalid$/);
    expect(lead?.telefono).toBeUndefined();
    const contact = await db().collection('contacts').findOne({ _id: idle.contactId });
    expect(contact).toMatchObject({ name: 'Titular anonimizado', service: 'Sistema RAG' });
    expect(contact?.phone).toBeUndefined();
    expect(contact?.message).not.toContain('datos personales');
    expect(contact?.consentimiento).toMatchObject({ aceptado: true, versionPolitica: '2024-01' });
    expect(contact?.consentimiento.ipHash).toBeUndefined();
    const activity = await db().collection('leadactivities').findOne({ lead: idle.leadId });
    expect(activity?.texto).not.toContain('Prospecto Viejo');
    const audit = await db().collection('auditlogs').findOne({ 'entidad.id': String(idle.leadId) });
    expect(audit?.detalle).toEqual({ datosAnonimizados: true });

    // Lo que no se toca.
    expect((await db().collection('leads').findOne({ _id: active.leadId }))?.nombre).toBe('Prospecto Viejo');
    expect((await db().collection('leads').findOne({ _id: client.leadId }))?.nombre).toBe('Prospecto Viejo');
    expect((await db().collection('leads').findOne({ _id: withAccount.leadId }))?.nombre).toBe('Prospecto Viejo');
    // Contacto sin lead con más del plazo: anonimizado.
    expect((await db().collection('contacts').findOne({ _id: orphan }))?.name).toBe('Titular anonimizado');

    // Idempotente: la segunda corrida no encuentra nada nuevo.
    const second = await runRetentionJob();
    expect(second.result).toMatchObject({ solicitudes: 0, leads: 0, contactos: 0 });
  });

  it('el plazo es configurable (DATA_RETENTION_MONTHS)', async () => {
    const recent = await seedRequest('rechazada-6m@test.local', 'rechazada', ago(7));
    process.env.DATA_RETENTION_MONTHS = '6';
    try {
      const { runRetentionJob } = await import('../../jobs/retention.job');
      await runRetentionJob();
      expect((await db().collection('demorequests').findOne({ _id: recent }))?.nombre).toBe('Titular anonimizado');
    } finally {
      delete process.env.DATA_RETENTION_MONTHS;
    }
    const { retentionMonths } = await import('../../services/retention.service');
    expect(retentionMonths()).toBe(24);
    process.env.DATA_RETENTION_MONTHS = 'no-es-numero';
    expect(retentionMonths()).toBe(24);
    delete process.env.DATA_RETENTION_MONTHS;
  });

  (REDIS_OK ? it : it.skip)('con el candado tomado por otra instancia, se salta la corrida', async () => {
    const { acquireLock, releaseLock } = await import('../../services/redis-lock.service');
    const { runRetentionJob, RETENTION_LOCK_KEY } = await import('../../jobs/retention.job');
    const lock = await acquireLock(RETENTION_LOCK_KEY, 60_000);
    expect(lock.status).toBe('acquired');
    try {
      expect(await runRetentionJob()).toEqual({ skipped: 'lock_busy', lock: 'busy' });
    } finally {
      if (lock.status === 'acquired') await releaseLock(RETENTION_LOCK_KEY, lock.token);
    }
    expect((await runRetentionJob()).lock).toBe('acquired');
  });
});
