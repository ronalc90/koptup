import type { CallRow, CampaignContact, Scenario, ScenarioId } from './types';

/**
 * Guiones de ejemplo (datos ficticios). Los textos están en
 * messages/demos/voice-ai.{es,en}.json → demoVoice.scenarios.<id>.turns.<key>.
 * Los documentos, correos y números aparecen SIEMPRE enmascarados.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'banca',
    direction: 'inbound',
    number: '+57 310 *** 4821',
    maskedData: { doc: 'CC ****4567' },
    turns: [
      { key: 't1', speaker: 'ai', sentiment: 'neutral', node: 'greeting', notice: true },
      { key: 't2', speaker: 'customer', sentiment: 'negative', node: 'intent', intent: 'cardDeclined', confidence: 0.93 },
      { key: 't3', speaker: 'ai', sentiment: 'neutral', node: 'identify' },
      { key: 't4', speaker: 'customer', sentiment: 'neutral', node: 'identify', masked: true },
      { key: 't5', speaker: 'ai', sentiment: 'neutral', node: 'action', fns: ['verifyCustomer', 'getTransactions'] },
      { key: 't6', speaker: 'customer', sentiment: 'neutral', node: 'intent', intent: 'travelNotice', confidence: 0.91 },
      { key: 't7', speaker: 'ai', sentiment: 'positive', node: 'action', fns: ['registerTravel', 'unblockCard'] },
      { key: 't8', speaker: 'customer', sentiment: 'positive', node: 'close' },
      { key: 't9', speaker: 'ai', sentiment: 'positive', node: 'close', fns: ['logCallCrm'] },
    ],
    fns: [
      { key: 'verifyCustomer', system: 'core', args: { documento: 'CC ****4567', canal: 'voz' } },
      { key: 'getTransactions', system: 'core', args: { tarjeta: '****1234', desde: '2026-10-07' } },
      { key: 'registerTravel', system: 'core', args: { pais: 'PE', hasta: '2026-10-16' } },
      { key: 'unblockCard', system: 'core', args: { tarjeta: '****1234', motivo: 'aviso_de_viaje' } },
      { key: 'logCallCrm', system: 'crm', args: { resultado: 'resuelta', intencion: 'aviso_de_viaje' } },
    ],
  },
  {
    id: 'salud',
    direction: 'outbound',
    number: '+57 311 *** 5129',
    maskedData: { doc: 'CC ****8912' },
    scheduled: { date: '2026-10-08', time: '08:30' },
    turns: [
      { key: 't1', speaker: 'ai', sentiment: 'neutral', node: 'greeting', notice: true },
      { key: 't2', speaker: 'customer', sentiment: 'neutral', node: 'identify' },
      { key: 't3', speaker: 'ai', sentiment: 'neutral', node: 'identify' },
      { key: 't4', speaker: 'customer', sentiment: 'neutral', node: 'identify', masked: true },
      { key: 't5', speaker: 'ai', sentiment: 'neutral', node: 'intent', intent: 'confirmAppointment', confidence: 0.97, fns: ['verifyCustomer', 'getAppointment'] },
      { key: 't6', speaker: 'customer', sentiment: 'neutral', node: 'intent', intent: 'rescheduleAppointment', confidence: 0.95 },
      { key: 't7', speaker: 'ai', sentiment: 'neutral', node: 'action', fns: ['findAvailability'] },
      { key: 't8', speaker: 'customer', sentiment: 'positive', node: 'action' },
      { key: 't9', speaker: 'ai', sentiment: 'positive', node: 'action', fns: ['rescheduleAppointment', 'sendWhatsapp'] },
      { key: 't10', speaker: 'customer', sentiment: 'positive', node: 'close' },
      { key: 't11', speaker: 'ai', sentiment: 'positive', node: 'close', fns: ['logCallCrm'] },
    ],
    fns: [
      { key: 'verifyCustomer', system: 'agenda', args: { documento: 'CC ****8912', canal: 'voz' } },
      { key: 'getAppointment', system: 'agenda', args: { paciente: 'CC ****8912', estado: 'programada' } },
      { key: 'findAvailability', system: 'agenda', args: { especialidad: 'medicina_interna', fecha: '2026-10-15', franja: 'tarde' } },
      { key: 'rescheduleAppointment', system: 'agenda', args: { cita: 'CT-77310', nueva_fecha: '2026-10-15T16:00', sede: 'Chapinero' } },
      { key: 'sendWhatsapp', system: 'whatsapp', args: { plantilla: 'confirmacion_cita', telefono: '+57 311 *** 5129' } },
      { key: 'logCallCrm', system: 'crm', args: { resultado: 'resuelta', intencion: 'reprogramar_cita' } },
    ],
  },
  {
    id: 'cobranza',
    direction: 'outbound',
    number: '+57 318 *** 4410',
    maskedData: { doc: 'CC ****3307' },
    scheduled: { date: '2026-10-08', time: '10:05' },
    collections: true,
    turns: [
      { key: 't1', speaker: 'ai', sentiment: 'neutral', node: 'greeting', notice: true },
      { key: 't2', speaker: 'customer', sentiment: 'neutral', node: 'identify' },
      { key: 't3', speaker: 'ai', sentiment: 'neutral', node: 'identify' },
      { key: 't4', speaker: 'customer', sentiment: 'neutral', node: 'identify', masked: true },
      { key: 't5', speaker: 'ai', sentiment: 'neutral', node: 'intent', intent: 'paymentReminder', confidence: 0.98, fns: ['verifyCustomer', 'getBalance'] },
      { key: 't6', speaker: 'customer', sentiment: 'negative', node: 'intent', intent: 'paymentAgreement', confidence: 0.92 },
      { key: 't7', speaker: 'ai', sentiment: 'neutral', node: 'action', fns: ['quotePaymentPlan'] },
      { key: 't8', speaker: 'customer', sentiment: 'positive', node: 'action' },
      { key: 't9', speaker: 'ai', sentiment: 'positive', node: 'action', fns: ['createAgreement', 'createPaymentLink', 'sendWhatsapp'] },
      { key: 't10', speaker: 'customer', sentiment: 'positive', node: 'close' },
      { key: 't11', speaker: 'ai', sentiment: 'positive', node: 'close', fns: ['logCallCrm'] },
    ],
    fns: [
      { key: 'verifyCustomer', system: 'cartera', args: { documento: 'CC ****3307', canal: 'voz' } },
      { key: 'getBalance', system: 'cartera', args: { credito: 'CR-40917', cuota: '2026-10' } },
      { key: 'quotePaymentPlan', system: 'cartera', args: { credito: 'CR-40917', cuotas: 2, valor_total: 412500 } },
      { key: 'createAgreement', system: 'cartera', args: { credito: 'CR-40917', fechas: '2026-10-15, 2026-10-30', valor_cuota: 206250 } },
      { key: 'createPaymentLink', system: 'pagos', args: { valor: 206250, moneda: 'COP', vence: '2026-10-15' } },
      { key: 'sendWhatsapp', system: 'whatsapp', args: { plantilla: 'link_de_pago', telefono: '+57 318 *** 4410' } },
      { key: 'logCallCrm', system: 'crm', args: { resultado: 'acuerdo_de_pago', intencion: 'acuerdo_de_pago' } },
    ],
  },
  {
    id: 'pedido',
    direction: 'inbound',
    number: '+57 315 *** 7710',
    maskedData: { email: 'f*****o@c****.com' },
    turns: [
      { key: 't1', speaker: 'ai', sentiment: 'neutral', node: 'greeting', notice: true },
      { key: 't2', speaker: 'customer', sentiment: 'neutral', node: 'intent', intent: 'orderStatus', confidence: 0.96 },
      { key: 't3', speaker: 'ai', sentiment: 'neutral', node: 'identify' },
      { key: 't4', speaker: 'customer', sentiment: 'neutral', node: 'identify', masked: true },
      { key: 't5', speaker: 'ai', sentiment: 'neutral', node: 'action', fns: ['verifyCustomer', 'getOrder'] },
      { key: 't6', speaker: 'customer', sentiment: 'negative', node: 'intent', intent: 'damagedProduct', confidence: 0.9 },
      { key: 't7', speaker: 'ai', sentiment: 'neutral', node: 'action', fns: ['createTicket', 'sendWhatsapp'] },
      { key: 't8', speaker: 'customer', sentiment: 'neutral', node: 'transfer' },
      { key: 't9', speaker: 'ai', sentiment: 'neutral', node: 'transfer', fns: ['transferToHuman', 'logCallCrm'] },
    ],
    fns: [
      { key: 'verifyCustomer', system: 'tienda', args: { correo: 'f*****o@c****.com', pedido: 'TU-58213' } },
      { key: 'getOrder', system: 'tienda', args: { pedido: 'TU-58213' } },
      { key: 'createTicket', system: 'helpdesk', args: { pedido: 'TU-58213', tipo: 'garantia', prioridad: 'alta' } },
      { key: 'sendWhatsapp', system: 'whatsapp', args: { plantilla: 'enviar_fotos_garantia', telefono: '+57 315 *** 7710' } },
      { key: 'transferToHuman', system: 'colas', args: { cola: 'servicio_al_cliente', resumen: true } },
      { key: 'logCallCrm', system: 'crm', args: { resultado: 'transferida', intencion: 'producto_danado' } },
    ],
  },
];

export const SCENARIO_IDS: ScenarioId[] = SCENARIOS.map((s) => s.id);

export function getScenario(id: ScenarioId): Scenario {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

/** Registro de llamadas de una jornada de ejemplo (jueves 8 de octubre de 2026). */
export const SAMPLE_CALLS: CallRow[] = [
  { id: 'i1', time: '08:02', number: '+57 310 *** 4821', direction: 'inbound', intent: 'travelNotice', durationSec: 192, result: 'resolved', sentiment: 'positive', csat: 5, scenario: 'banca' },
  { id: 'i2', time: '08:17', number: '+57 601 *** 2290', direction: 'inbound', intent: 'orderStatus', durationSec: 125, result: 'resolved', sentiment: 'neutral', csat: 4, scenario: 'pedido' },
  { id: 'i3', time: '08:40', number: '+57 315 *** 7710', direction: 'inbound', intent: 'damagedProduct', durationSec: 288, result: 'transferred', sentiment: 'negative', csat: 3, scenario: 'pedido' },
  { id: 'i4', time: '09:05', number: '+57 604 *** 1187', direction: 'inbound', intent: 'balanceInquiry', durationSec: 94, result: 'resolved', sentiment: 'positive', csat: null },
  { id: 'i5', time: '09:31', number: '+57 300 *** 6604', direction: 'inbound', intent: 'cardDeclined', durationSec: 171, result: 'resolved', sentiment: 'positive', csat: 5, scenario: 'banca' },
  { id: 'i6', time: '10:12', number: '+57 320 *** 0935', direction: 'inbound', intent: 'billingClaim', durationSec: 320, result: 'transferred', sentiment: 'negative', csat: 2 },
  { id: 'i7', time: '10:44', number: '+57 601 *** 8472', direction: 'inbound', intent: 'orderStatus', durationSec: 38, result: 'abandoned', sentiment: 'neutral', csat: null, scenario: 'pedido' },
  { id: 'o1', time: '08:30', number: '+57 311 *** 5129', direction: 'outbound', intent: 'confirmAppointment', durationSec: 118, result: 'resolved', sentiment: 'positive', csat: 5, scenario: 'salud' },
  { id: 'o2', time: '09:10', number: '+57 316 *** 3348', direction: 'outbound', intent: 'rescheduleAppointment', durationSec: 164, result: 'resolved', sentiment: 'positive', csat: 4, scenario: 'salud' },
  { id: 'o3', time: '09:45', number: '+57 302 *** 9021', direction: 'outbound', intent: 'paymentReminder', durationSec: 22, result: 'voicemail', sentiment: 'neutral', csat: null, scenario: 'cobranza' },
  { id: 'o4', time: '10:05', number: '+57 318 *** 4410', direction: 'outbound', intent: 'paymentAgreement', durationSec: 216, result: 'resolved', sentiment: 'positive', csat: null, scenario: 'cobranza' },
  { id: 'o5', time: '10:30', number: '+57 313 *** 7765', direction: 'outbound', intent: 'paymentReminder', durationSec: 0, result: 'noAnswer', sentiment: 'neutral', csat: null, scenario: 'cobranza' },
  { id: 'o6', time: '11:02', number: '+57 305 *** 2286', direction: 'outbound', intent: 'confirmAppointment', durationSec: 81, result: 'resolved', sentiment: 'neutral', csat: 4, scenario: 'salud' },
];

/**
 * Contactos de la campaña "Recordatorio de pago — cuota de octubre 2026".
 * El resultado de cada intento permitido es fijo (datos de ejemplo); el
 * bloqueo lo decide la regla de horario/festivos/exclusión/frecuencia.
 */
export const CAMPAIGN_CONTACTS: CampaignContact[] = [
  { id: 'c1', name: 'Natalia O.', number: '+57 318 *** 4410', date: '2026-10-08', time: '10:05', outcome: 'agreement' },
  { id: 'c2', name: 'Hernán P.', number: '+57 302 *** 9021', date: '2026-10-08', time: '09:45', outcome: 'voicemail' },
  { id: 'c3', name: 'Diana C.', number: '+57 313 *** 7765', date: '2026-10-08', time: '10:30', outcome: 'noAnswer' },
  { id: 'c4', name: 'Óscar L.', number: '+57 317 *** 6120', date: '2026-10-08', time: '11:20', excluded: true, outcome: 'agreement' },
  { id: 'c5', name: 'Mónica R.', number: '+57 301 *** 8854', date: '2026-10-08', time: '14:10', lastContact: '2026-10-06', outcome: 'agreement' },
  { id: 'c6', name: 'Julián T.', number: '+57 312 *** 2047', date: '2026-10-08', time: '19:40', outcome: 'agreement' },
  { id: 'c7', name: 'Paola V.', number: '+57 314 *** 5532', date: '2026-10-10', time: '09:15', outcome: 'paid' },
  { id: 'c8', name: 'Ricardo M.', number: '+57 319 *** 1406', date: '2026-10-10', time: '15:30', outcome: 'callback' },
  { id: 'c9', name: 'Lucía G.', number: '+57 304 *** 7319', date: '2026-10-11', time: '11:00', outcome: 'agreement' },
  { id: 'c10', name: 'Esteban F.', number: '+57 310 *** 9963', date: '2026-10-12', time: '10:00', outcome: 'agreement' },
  { id: 'c11', name: 'Sandra B.', number: '+57 316 *** 4478', date: '2026-10-13', time: '06:40', outcome: 'agreement' },
  { id: 'c12', name: 'Camilo D.', number: '+57 300 *** 2581', date: '2026-10-13', time: '08:10', outcome: 'callback' },
  { id: 'c13', name: 'Gloria S.', number: '+57 311 *** 3092', date: '2026-10-10', time: '11:40', outcome: 'agreement' },
  { id: 'c14', name: 'Fabián N.', number: '+57 315 *** 6627', date: '2026-10-13', time: '17:30', outcome: 'voicemail' },
];
