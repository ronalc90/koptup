/**
 * retention.service.ts — plazo de conservación de los datos personales.
 *
 * Pasado DATA_RETENTION_MONTHS (24 meses por defecto, decisión conservadora
 * que el dueño debe validar) el job de conservación (jobs/retention.job.ts)
 * ANONIMIZA, sin borrar el registro (se conservan fechas, origen, servicio y
 * etapa para las estadísticas):
 *  1. Las solicitudes de demo rechazadas (incluidas las de spam) cuya
 *     revisión tiene más del plazo.
 *  2. Las personas sin actividad en el plazo: lead cuya última actividad es
 *     anterior, que no es cliente (`ganado`), no tiene cuenta ni propuestas
 *     aceptadas, pagadas o convertidas. Se anonimizan el lead, su línea de
 *     tiempo, sus contactos, sus propuestas y sus solicitudes no aprobadas.
 *  3. Los contactos sin lead (anteriores al pipeline) con más del plazo.
 * En la bitácora, el detalle de esas entidades se reemplaza por
 * `{ datosAnonimizados: true }`.
 *
 * Además borra los bots del chatbot sin uso (services/chatbot-store.service.ts).
 * Las preguntas al chatbot vencen solas (índice TTL) y los documentos de
 * "Prueba con tu documento" viven una hora en memoria.
 */
import mongoose from 'mongoose';
import Contact from '../models/Contact';
import DemoRequest from '../models/DemoRequest';
import Lead from '../models/Lead';
import LeadActivity from '../models/LeadActivity';
import Proposal from '../models/Proposal';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import { purgeIdleBots } from './chatbot-store.service';

/** Texto que reemplaza los datos personales. */
export const ANON_NAME = 'Titular anonimizado';
export const ANON_TEXT = '[Datos anonimizados por el plazo de conservación]';
const anonEmail = (id: unknown) => `anonimizado+${String(id)}@anonimizado.invalid`;

const MAX_PER_RUN = 500;

/** Meses que se conservan los datos de prospectos sin actividad (1 a 120; 24 por defecto). */
export function retentionMonths(): number {
  const n = Number(process.env.DATA_RETENTION_MONTHS);
  return Number.isInteger(n) && n >= 1 && n <= 120 ? n : 24;
}

export function retentionCutoff(now = new Date()): Date {
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() - retentionMonths());
  return d;
}

export interface RetentionResult {
  /** Solicitudes de demo anonimizadas (rechazadas y de personas sin actividad). */
  solicitudes: number;
  leads: number;
  contactos: number;
  propuestas: number;
  bitacora: number;
  botsEjemplo: number;
  botsUsuario: number;
}

async function scrubAudit(entityIds: string[]): Promise<number> {
  if (!entityIds.length) return 0;
  const res = await AuditLog.updateMany({ 'entidad.id': { $in: entityIds } }, { $set: { detalle: { datosAnonimizados: true } }, $unset: { ipHash: '' } });
  return res.modifiedCount ?? 0;
}

const DEMO_REQUEST_ANON = (id: unknown, now: Date) => ({
  $set: {
    nombre: ANON_NAME,
    empresa: 'Anonimizada',
    email: anonEmail(id),
    pais: '—',
    casoDeUso: ANON_TEXT,
    notas: [],
    motivoRechazo: null,
    anonimizadoEn: now,
  },
  $unset: { cargo: '', telefono: '', origen: '', 'consentimiento.ipHash': '', 'consentimiento.userAgent': '' },
});

const CONTACT_ANON = (id: unknown, now: Date) => ({
  $set: { name: ANON_NAME, email: anonEmail(id), message: ANON_TEXT, anonimizadoEn: now },
  $unset: { phone: '', company: '', 'consentimiento.ipHash': '', 'consentimiento.userAgent': '' },
});

/** Una corrida de la conservación (idempotente: lo anonimizado no se vuelve a tocar). */
export async function applyRetention(now = new Date()): Promise<RetentionResult> {
  const cutoff = retentionCutoff(now);
  const result: RetentionResult = { solicitudes: 0, leads: 0, contactos: 0, propuestas: 0, bitacora: 0, botsEjemplo: 0, botsUsuario: 0 };

  // 1. Solicitudes de demo rechazadas hace más del plazo.
  const rejected = await DemoRequest.find({
    estado: 'rechazada',
    anonimizadoEn: null,
    $or: [{ revisadoEn: { $lt: cutoff } }, { revisadoEn: null, updatedAt: { $lt: cutoff } }],
  })
    .select('_id')
    .limit(MAX_PER_RUN)
    .lean();
  for (const r of rejected) await DemoRequest.updateOne({ _id: r._id }, DEMO_REQUEST_ANON(r._id, now), { timestamps: false });
  result.solicitudes += rejected.length;
  result.bitacora += await scrubAudit(rejected.map((r) => String(r._id)));

  // 2. Personas sin actividad en el plazo.
  const idleLeads = await Lead.find({ anonimizadoEn: null, etapa: { $ne: 'ganado' }, usuario: null, ultimaActividadEn: { $lt: cutoff } })
    .select('_id email')
    .limit(MAX_PER_RUN)
    .lean();
  for (const lead of idleLeads) {
    const leadId = lead._id as mongoose.Types.ObjectId;
    const [contractual, account, recentRequest, recentContact] = await Promise.all([
      Proposal.exists({ lead: leadId, $or: [{ estado: { $in: ['aceptada', 'convertida'] } }, { 'pago.estado': 'recibido' }] }),
      User.exists({ email: lead.email }),
      DemoRequest.exists({ email: lead.email, createdAt: { $gte: cutoff } }),
      Contact.exists({ lead: leadId, created_at: { $gte: cutoff } }),
    ]);
    if (contractual || account || recentRequest || recentContact) continue;

    const contacts = await Contact.find({ $or: [{ lead: leadId }, { email: lead.email }], anonimizadoEn: null }).select('_id').lean();
    for (const c of contacts) await Contact.updateOne({ _id: c._id }, CONTACT_ANON(c._id, now));
    const requests = await DemoRequest.find({ email: lead.email, estado: { $ne: 'aprobada' }, anonimizadoEn: null }).select('_id').lean();
    for (const r of requests) await DemoRequest.updateOne({ _id: r._id }, DEMO_REQUEST_ANON(r._id, now), { timestamps: false });
    const proposals = await Proposal.find({ lead: leadId }).select('_id').lean();
    if (proposals.length) {
      await Proposal.updateMany(
        { _id: { $in: proposals.map((p) => p._id) } },
        { $set: { 'cliente.nombre': ANON_NAME, 'cliente.email': anonEmail(leadId) }, $unset: { 'cliente.empresa': '', 'cliente.telefono': '', 'rechazo.ipHash': '', 'rechazo.motivo': '' } },
        { timestamps: false },
      );
    }
    await LeadActivity.updateMany({ lead: leadId }, { $set: { texto: ANON_TEXT }, $unset: { meta: '' } }, { timestamps: false });
    await Lead.updateOne(
      { _id: leadId },
      {
        $set: { nombre: ANON_NAME, email: anonEmail(leadId), proximaAccion: null, solicitudPropuesta: null, detallePerdida: null, anonimizadoEn: now },
        $unset: { empresa: '', telefono: '' },
      },
      { timestamps: false },
    );
    result.leads += 1;
    result.contactos += contacts.length;
    result.solicitudes += requests.length;
    result.propuestas += proposals.length;
    result.bitacora += await scrubAudit([String(leadId), ...contacts.map((c) => String(c._id)), ...requests.map((r) => String(r._id)), ...proposals.map((p) => String(p._id))]);
  }

  // 3. Contactos sin lead con más del plazo.
  const orphanContacts = await Contact.find({ anonimizadoEn: null, lead: null, created_at: { $lt: cutoff } }).select('_id email').limit(MAX_PER_RUN).lean();
  for (const c of orphanContacts) {
    const [account, recent] = await Promise.all([User.exists({ email: c.email }), Contact.exists({ email: c.email, created_at: { $gte: cutoff } })]);
    if (account || recent) continue;
    await Contact.updateOne({ _id: c._id }, CONTACT_ANON(c._id, now));
    result.contactos += 1;
    result.bitacora += await scrubAudit([String(c._id)]);
  }

  // 4. Bots del chatbot sin uso.
  const bots = await purgeIdleBots(now);
  result.botsEjemplo = bots.sample;
  result.botsUsuario = bots.builder;
  return result;
}
