import { Call, Transcript } from './voice-ai.types';

const t = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const calls: Call[] = [
  { id: 'call_001', from: '+57 300 111 2222', to: '+57 (1) 600-1234', direction: 'inbound', status: 'completed', startedAt: t(60), endedAt: t(57), durationSec: 180, agentId: 'agent_ai_01', recordingUrl: '/rec/call_001.mp3', createdAt: t(60), updatedAt: t(57) },
  { id: 'call_002', from: '+57 (1) 600-1234', to: '+57 311 444 5555', direction: 'outbound', status: 'completed', startedAt: t(120), endedAt: t(115), durationSec: 320, agentId: 'agent_ai_01', recordingUrl: '/rec/call_002.mp3', createdAt: t(120), updatedAt: t(115) },
  { id: 'call_003', from: '+57 320 999 8888', to: '+57 (1) 600-1234', direction: 'inbound', status: 'in-progress', startedAt: t(2), agentId: 'agent_ai_02', createdAt: t(2), updatedAt: t(2) },
  { id: 'call_004', from: '+1 415 555 0100', to: '+57 (1) 600-1234', direction: 'inbound', status: 'failed', createdAt: t(180), updatedAt: t(180) },
  { id: 'call_005', from: '+57 (1) 600-1234', to: '+57 312 222 1111', direction: 'outbound', status: 'queued', createdAt: t(1), updatedAt: t(1) },
  { id: 'call_006', from: '+57 318 777 6666', to: '+57 (1) 600-1234', direction: 'inbound', status: 'completed', startedAt: t(300), endedAt: t(295), durationSec: 285, agentId: 'agent_ai_01', recordingUrl: '/rec/call_006.mp3', createdAt: t(300), updatedAt: t(295) },
  { id: 'call_007', from: '+57 (1) 600-1234', to: '+57 314 555 4444', direction: 'outbound', status: 'ringing', startedAt: t(0), createdAt: t(0), updatedAt: t(0) },
];

export const transcripts: Transcript[] = [
  { id: 'tr_001', callId: 'call_001', segments: [{ speaker: 'agent', text: 'Hola, soy Aria de KopTup, ¿en qué puedo ayudarle?', tStart: 0, tEnd: 4 }, { speaker: 'customer', text: 'Tengo problemas con mi factura', tStart: 4, tEnd: 7 }, { speaker: 'agent', text: 'Comprendo, déjeme revisar', tStart: 7, tEnd: 10 }], sentiment: 'neutral', summary: 'Consulta sobre factura, escalada a soporte humano', createdAt: t(57), updatedAt: t(57) },
  { id: 'tr_002', callId: 'call_002', segments: [{ speaker: 'agent', text: 'Buenos días, llamo de KopTup para confirmar su cita', tStart: 0, tEnd: 5 }, { speaker: 'customer', text: 'Sí, confirmo para mañana 10am', tStart: 5, tEnd: 8 }], sentiment: 'positive', summary: 'Confirmación exitosa de cita', createdAt: t(115), updatedAt: t(115) },
  { id: 'tr_003', callId: 'call_006', segments: [{ speaker: 'customer', text: 'Quiero cancelar mi suscripción', tStart: 0, tEnd: 3 }, { speaker: 'agent', text: 'Lamento escuchar eso, ¿hay algo que podamos mejorar?', tStart: 3, tEnd: 8 }], sentiment: 'negative', summary: 'Cliente solicita cancelación', createdAt: t(295), updatedAt: t(295) },
];
