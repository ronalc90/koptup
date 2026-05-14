import { Agent, Ticket } from './helpdesk.types';

export const agents: Agent[] = [
  { id: 'agt_001', name: 'Diana López', email: 'diana@koptup.com', status: 'online', loadCount: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'agt_002', name: 'Felipe Salazar', email: 'felipe@koptup.com', status: 'online', loadCount: 2, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'agt_003', name: 'Paula Méndez', email: 'paula@koptup.com', status: 'away', loadCount: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'agt_004', name: 'Esteban Rojas', email: 'esteban@koptup.com', status: 'offline', loadCount: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
];

const day = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

export const tickets: Ticket[] = [
  { id: 'tk_001', subject: 'Login bloqueado', description: 'No puedo ingresar al portal', requesterEmail: 'cliente1@globex.com', agentId: 'agt_001', status: 'open', priority: 'high', channel: 'email', slaDueAt: day(1), tags: ['auth'], createdAt: day(-1), updatedAt: day(-1) },
  { id: 'tk_002', subject: 'Factura incorrecta', description: 'Cobro duplicado en factura', requesterEmail: 'cliente2@initech.com', agentId: 'agt_002', status: 'pending', priority: 'normal', channel: 'web', slaDueAt: day(2), tags: ['billing'], createdAt: day(-2), updatedAt: day(0) },
  { id: 'tk_003', subject: 'Error 500 en dashboard', description: 'Pantalla blanca al cargar', requesterEmail: 'devops@hooli.com', agentId: 'agt_001', status: 'open', priority: 'urgent', channel: 'chat', slaDueAt: day(0), tags: ['bug', 'p1'], createdAt: day(0), updatedAt: day(0) },
  { id: 'tk_004', subject: 'Cómo exportar reportes', description: '¿Hay opción de Excel?', requesterEmail: 'analista@umbrella.co', status: 'open', priority: 'low', channel: 'email', slaDueAt: day(3), tags: ['how-to'], createdAt: day(-1), updatedAt: day(-1) },
  { id: 'tk_005', subject: 'Cambio de plan', description: 'Quiero subir a Enterprise', requesterEmail: 'cfo@pied-piper.io', agentId: 'agt_002', status: 'resolved', priority: 'normal', channel: 'phone', slaDueAt: day(-1), tags: ['sales'], createdAt: day(-3), updatedAt: day(-1) },
  { id: 'tk_006', subject: 'Onboarding nuevo usuario', description: 'Necesito agregar 5 usuarios', requesterEmail: 'it@aperture.com', agentId: 'agt_003', status: 'closed', priority: 'low', channel: 'email', slaDueAt: day(-5), tags: ['onboarding'], createdAt: day(-7), updatedAt: day(-5) },
  { id: 'tk_007', subject: 'API rate limit', description: 'Me retorna 429 constante', requesterEmail: 'dev@stark.com', agentId: 'agt_001', status: 'open', priority: 'high', channel: 'web', slaDueAt: day(1), tags: ['api'], createdAt: day(-1), updatedAt: day(0) },
  { id: 'tk_008', subject: 'Capacitación', description: 'Necesitamos demo del módulo', requesterEmail: 'rrhh@wonka.com', status: 'pending', priority: 'normal', channel: 'email', slaDueAt: day(4), tags: ['training'], createdAt: day(-2), updatedAt: day(-1) },
  { id: 'tk_009', subject: 'Backup no funciona', description: 'Job fallido desde ayer', requesterEmail: 'dba@globex.com', agentId: 'agt_001', status: 'open', priority: 'urgent', channel: 'chat', slaDueAt: day(0), tags: ['ops', 'p1'], createdAt: day(0), updatedAt: day(0) },
  { id: 'tk_010', subject: 'Integración Slack', description: 'Configurar webhook', requesterEmail: 'lead@initech.com', agentId: 'agt_002', status: 'resolved', priority: 'normal', channel: 'web', slaDueAt: day(-2), tags: ['integration'], createdAt: day(-4), updatedAt: day(-2) },
];
