import { Contact, Conversation, SequenceStep } from './types';

export const CONTACTS: Contact[] = [
  { id: 1, name: 'Laura Méndez', company: 'Acme Corp', email: 'laura@acme.com', avatar: 'LM', score: 92, dealValue: 85000, nextAction: 'Llamada de cierre', lastContact: '2026-05-12', stage: 'negotiation', owner: 'Ronald', closeDate: '2026-05-28', probability: 78 },
  { id: 2, name: 'Diego Salvatierra', company: 'Globex SA', email: 'diego@globex.com', avatar: 'DS', score: 81, dealValue: 42500, nextAction: 'Enviar propuesta v2', lastContact: '2026-05-11', stage: 'proposal', owner: 'Camila', closeDate: '2026-06-05', probability: 60 },
  { id: 3, name: 'Marina Ortiz', company: 'Initech', email: 'marina@initech.io', avatar: 'MO', score: 88, dealValue: 120000, nextAction: 'Demo técnica con CTO', lastContact: '2026-05-13', stage: 'qualified', owner: 'Ronald', closeDate: '2026-06-20', probability: 45 },
  { id: 4, name: 'Pablo Henríquez', company: 'Soylent Co.', email: 'pablo@soylent.co', avatar: 'PH', score: 67, dealValue: 28000, nextAction: 'Email de seguimiento', lastContact: '2026-05-08', stage: 'qualified', owner: 'Camila', closeDate: '2026-06-15', probability: 40 },
  { id: 5, name: 'Sofía Reinoso', company: 'Umbrella Tech', email: 'sofia@umbrella.tech', avatar: 'SR', score: 54, dealValue: 18500, nextAction: 'Confirmar interés', lastContact: '2026-05-05', stage: 'prospect', owner: 'Lucas', closeDate: '2026-07-01', probability: 20 },
  { id: 6, name: 'Andrés Tello', company: 'Stark Industries', email: 'andres@stark.com', avatar: 'AT', score: 73, dealValue: 95000, nextAction: 'Reunión de descubrimiento', lastContact: '2026-05-10', stage: 'qualified', owner: 'Ronald', closeDate: '2026-06-30', probability: 50 },
  { id: 7, name: 'Renata Quiroga', company: 'Wayne Enterprises', email: 'renata@wayne.com', avatar: 'RQ', score: 96, dealValue: 210000, nextAction: 'Cierre y firma', lastContact: '2026-05-13', stage: 'negotiation', owner: 'Ronald', closeDate: '2026-05-22', probability: 85 },
  { id: 8, name: 'Tomás Villalba', company: 'Cyberdyne', email: 'tomas@cyberdyne.io', avatar: 'TV', score: 38, dealValue: 12000, nextAction: 'Reactivar lead', lastContact: '2026-04-22', stage: 'prospect', owner: 'Lucas', closeDate: '2026-08-10', probability: 12 },
  { id: 9, name: 'Bianca Estrada', company: 'Pied Piper', email: 'bianca@piedpiper.com', avatar: 'BE', score: 90, dealValue: 64000, nextAction: 'Demo de producto', lastContact: '2026-05-13', stage: 'proposal', owner: 'Camila', closeDate: '2026-06-02', probability: 65 },
  { id: 10, name: 'Iván Roldán', company: 'Hooli', email: 'ivan@hooli.com', avatar: 'IR', score: 45, dealValue: 22000, nextAction: 'Llamada de calificación', lastContact: '2026-05-02', stage: 'prospect', owner: 'Lucas', closeDate: '2026-07-15', probability: 18 },
  { id: 11, name: 'Carla Ferrer', company: 'Massive Dynamic', email: 'carla@massivedyn.com', avatar: 'CF', score: 79, dealValue: 47000, nextAction: 'Negociar términos', lastContact: '2026-05-11', stage: 'negotiation', owner: 'Camila', closeDate: '2026-06-08', probability: 70 },
  { id: 12, name: 'Mateo Sanguinetti', company: 'Tyrell Corp', email: 'mateo@tyrell.com', avatar: 'MS', score: 100, dealValue: 38000, nextAction: 'Onboarding cliente', lastContact: '2026-05-13', stage: 'closed', owner: 'Ronald', closeDate: '2026-05-10', probability: 100 },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    contactId: 1,
    date: '2026-05-12',
    duration: '32:14',
    sentiment: 'positive',
    topics: ['Pricing', 'Integraciones', 'Time-to-value'],
    actionItems: [
      'Enviar comparativa con competidor X antes del viernes.',
      'Confirmar slot para reunión con CFO.',
      'Compartir caso de éxito industria fintech.',
    ],
    talkRatioRep: 42,
  },
  {
    id: 2,
    contactId: 3,
    date: '2026-05-13',
    duration: '24:50',
    sentiment: 'neutral',
    topics: ['Stack técnico', 'Seguridad', 'SLA'],
    actionItems: [
      'Coordinar demo técnica con equipo de seguridad.',
      'Enviar documentación SOC2 actualizada.',
    ],
    talkRatioRep: 55,
  },
  {
    id: 3,
    contactId: 8,
    date: '2026-05-04',
    duration: '11:08',
    sentiment: 'negative',
    topics: ['Presupuesto', 'Prioridad Q3'],
    actionItems: [
      'Pausar cadencia 30 días.',
      'Reactivar en Julio con caso de uso ROI.',
    ],
    talkRatioRep: 70,
  },
  {
    id: 4,
    contactId: 7,
    date: '2026-05-13',
    duration: '41:02',
    sentiment: 'positive',
    topics: ['Contrato', 'Implementación', 'Soporte premium'],
    actionItems: [
      'Enviar contrato firmado para revisión legal.',
      'Asignar customer success.',
    ],
    talkRatioRep: 38,
  },
];

export const SEQUENCE_STEPS: SequenceStep[] = [
  { day: 1, channel: 'email', title: 'Email intro · valor + caso', status: 'done' },
  { day: 3, channel: 'linkedin', title: 'Conexión LinkedIn personalizada', status: 'done' },
  { day: 5, channel: 'whatsapp', title: 'WhatsApp recordatorio breve', status: 'current' },
  { day: 7, channel: 'call', title: 'Llamada de calificación · 15min', status: 'pending' },
  { day: 10, channel: 'email', title: 'Email follow-up con propuesta', status: 'pending' },
  { day: 14, channel: 'task', title: 'Tarea: revisar respuesta y derivar', status: 'pending' },
];
