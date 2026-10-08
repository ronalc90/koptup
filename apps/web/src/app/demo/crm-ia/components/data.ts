/**
 * Datos de ejemplo del CRM (todo ficticio). El CRM es de una empresa de
 * logística inventada ("Logística Quindara S.A.S.") que vende transporte,
 * bodegaje y distribución a empresas colombianas, también inventadas.
 * Correos con dominio reservado .example y teléfonos de la serie 300 000 0xxx.
 * Los textos (cargo, nombre del negocio, próxima acción, llamadas) se traducen
 * con las claves demoCrm.data.* de messages/demos/crm-ia.{es,en}.json.
 */
import type { Deal, Enrollment } from './crm';

export const SEED_DEALS: Deal[] = [
  // --- Abiertos -------------------------------------------------------------
  { id: 'd1', contactName: 'Laura Méndez', company: 'Distribuidora Ceibal del Norte S.A.S.', nit: '900.418.276-6', city: 'Barranquilla', email: 'lmendez@ceibalnorte.example', phone: '+57 300 000 0101', channel: 'whatsapp', source: 'fair', owner: 'vr', value: 186_000_000, stage: 'negotiation', createdAt: '2026-08-03', closeDate: '2026-11-12', lastContact: '2026-10-07', size: 'large', budgetConfirmed: true, decisionMaker: true, interactions30d: 4, i18n: true },
  { id: 'd2', contactName: 'Carlos Arango', company: 'Constructora Piedra Alta S.A.S.', nit: '901.236.584-1', city: 'Medellín', email: 'carango@piedraalta.example', phone: '+57 300 000 0102', channel: 'email', source: 'referral', owner: 'ac', value: 245_000_000, stage: 'proposal', createdAt: '2026-08-20', closeDate: '2026-11-14', lastContact: '2026-10-05', size: 'medium', budgetConfirmed: true, decisionMaker: false, interactions30d: 3, i18n: true },
  { id: 'd3', contactName: 'Diana Restrepo', company: 'Alimentos Sabanero Real S.A.S.', nit: '900.587.312-7', city: 'Bogotá', email: 'drestrepo@sabanero.example', phone: '+57 300 000 0103', channel: 'whatsapp', source: 'web', owner: 'vr', value: 320_000_000, stage: 'qualified', createdAt: '2026-09-10', closeDate: '2026-12-12', lastContact: '2026-10-06', size: 'large', budgetConfirmed: false, decisionMaker: true, interactions30d: 3, i18n: true },
  { id: 'd4', contactName: 'Jorge Mosquera', company: 'Ferretería Industrial El Yunque S.A.S.', nit: '890.941.267-6', city: 'Cartagena', email: 'jmosquera@elyunque.example', phone: '+57 300 000 0104', channel: 'call', source: 'inbound', owner: 'jo', value: 74_000_000, stage: 'qualified', createdAt: '2026-09-15', closeDate: '2026-11-28', lastContact: '2026-10-01', size: 'medium', budgetConfirmed: true, decisionMaker: false, interactions30d: 2, i18n: true },
  { id: 'd5', contactName: 'Paola Benítez', company: 'Instituto Técnico Valle Lindo', nit: '800.674.159-6', city: 'Cali', email: 'pbenitez@vallelindo.example', phone: '+57 300 000 0105', channel: 'email', source: 'web', owner: 'ac', value: 48_000_000, stage: 'prospect', createdAt: '2026-09-28', closeDate: '2026-12-18', lastContact: '2026-09-30', size: 'medium', budgetConfirmed: false, decisionMaker: false, interactions30d: 1, i18n: true },
  { id: 'd6', contactName: 'Santiago Villegas', company: 'Muebles Robledal S.A.S.', nit: '901.105.873-3', city: 'Medellín', email: 'svillegas@robledal.example', phone: '+57 300 000 0106', channel: 'whatsapp', source: 'referral', owner: 'jo', value: 132_000_000, stage: 'proposal', createdAt: '2026-08-25', closeDate: '2026-10-24', lastContact: '2026-10-06', size: 'medium', budgetConfirmed: true, decisionMaker: true, interactions30d: 4, i18n: true },
  { id: 'd7', contactName: 'Natalia Quintero', company: 'Farmacéutica Nativa Andes S.A.S.', nit: '900.763.421-6', city: 'Bogotá', email: 'nquintero@nativaandes.example', phone: '+57 300 000 0107', channel: 'email', source: 'fair', owner: 'vr', value: 210_000_000, stage: 'negotiation', createdAt: '2026-07-28', closeDate: '2026-10-20', lastContact: '2026-09-28', size: 'large', budgetConfirmed: true, decisionMaker: false, interactions30d: 3, i18n: true },
  { id: 'd8', contactName: 'Mauricio Peñaloza', company: 'Agroinsumos La Quinua S.A.S.', nit: '901.348.260-1', city: 'Bucaramanga', email: 'mpenaloza@laquinua.example', phone: '+57 300 000 0108', channel: 'call', source: 'inbound', owner: 'ac', value: 56_000_000, stage: 'prospect', createdAt: '2026-10-01', closeDate: '2027-01-22', lastContact: '2026-10-05', size: 'small', budgetConfirmed: false, decisionMaker: true, interactions30d: 2, i18n: true },
  { id: 'd9', contactName: 'Mónica Salcedo', company: 'IPS Bienestar Pacífico S.A.S.', nit: '900.529.834-2', city: 'Cali', email: 'msalcedo@bienestarpacifico.example', phone: '+57 300 000 0109', channel: 'whatsapp', source: 'referral', owner: 'jo', value: 38_000_000, stage: 'qualified', createdAt: '2026-09-05', closeDate: '2026-11-06', lastContact: '2026-09-18', size: 'medium', budgetConfirmed: false, decisionMaker: false, interactions30d: 1, i18n: true },
  { id: 'd10', contactName: 'Felipe Ochoa', company: 'Café Montaña Clara S.A.S.', nit: '900.914.567-1', city: 'Manizales', email: 'fochoa@montanaclara.example', phone: '+57 300 000 0110', channel: 'email', source: 'web', owner: 'vr', value: 98_000_000, stage: 'proposal', createdAt: '2026-08-12', closeDate: '2026-10-05', lastContact: '2026-09-24', size: 'medium', budgetConfirmed: true, decisionMaker: true, interactions30d: 2, i18n: true },
  { id: 'd11', contactName: 'Catalina Duarte', company: 'Cosméticos Flor de Mayo S.A.S.', nit: '901.062.398-1', city: 'Bogotá', email: 'cduarte@flordemayo.example', phone: '+57 300 000 0111', channel: 'whatsapp', source: 'fair', owner: 'ac', value: 115_000_000, stage: 'negotiation', createdAt: '2026-08-01', closeDate: '2026-11-03', lastContact: '2026-10-05', size: 'medium', budgetConfirmed: true, decisionMaker: true, interactions30d: 5, i18n: true },
  { id: 'd12', contactName: 'Ricardo Pineda', company: 'Textiles Cordillera Azul S.A.S.', nit: '900.381.745-7', city: 'Pereira', email: 'rpineda@cordilleraazul.example', phone: '+57 300 000 0112', channel: 'call', source: 'import', owner: 'jo', value: 64_000_000, stage: 'prospect', createdAt: '2026-09-22', closeDate: '2026-11-20', lastContact: '2026-09-22', size: 'medium', budgetConfirmed: false, decisionMaker: false, interactions30d: 1, i18n: true },
  { id: 'd13', contactName: 'Adriana Molina', company: 'Electro Hogar Brisa S.A.S.', nit: '901.274.906-1', city: 'Barranquilla', email: 'amolina@hogarbrisa.example', phone: '+57 300 000 0113', channel: 'email', source: 'referral', owner: 'vr', value: 82_000_000, stage: 'qualified', createdAt: '2026-09-01', closeDate: '2026-11-25', lastContact: '2026-10-02', size: 'large', budgetConfirmed: true, decisionMaker: true, interactions30d: 2, i18n: true },
  // --- Ganados (últimos 90 días) --------------------------------------------
  { id: 'w1', contactName: 'Julián Castaño', company: 'Papeles del Llano S.A.S.', nit: '900.653.128-0', city: 'Villavicencio', email: 'jcastano@papelesdelllano.example', phone: '+57 300 000 0114', channel: 'whatsapp', source: 'referral', owner: 'ac', value: 72_000_000, stage: 'won', createdAt: '2026-05-26', closeDate: '2026-07-22', lastContact: '2026-07-22', size: 'medium', budgetConfirmed: true, decisionMaker: true, interactions30d: 0, i18n: true },
  { id: 'w2', contactName: 'Sandra Lozano', company: 'Lácteos Vega Alta S.A.S.', nit: '900.827.451-3', city: 'Tunja', email: 'slozano@vegaalta.example', phone: '+57 300 000 0115', channel: 'email', source: 'fair', owner: 'vr', value: 156_000_000, stage: 'won', createdAt: '2026-06-10', closeDate: '2026-08-19', lastContact: '2026-09-30', size: 'large', budgetConfirmed: true, decisionMaker: true, interactions30d: 2, i18n: true },
  { id: 'w3', contactName: 'Óscar Ramírez', company: 'Repuestos Motor Andino S.A.S.', nit: '901.189.632-5', city: 'Bogotá', email: 'oramirez@motorandino.example', phone: '+57 300 000 0116', channel: 'call', source: 'inbound', owner: 'jo', value: 94_000_000, stage: 'won', createdAt: '2026-07-14', closeDate: '2026-09-16', lastContact: '2026-10-01', size: 'medium', budgetConfirmed: true, decisionMaker: true, interactions30d: 2, i18n: true },
  { id: 'w4', contactName: 'Lucía Herrera', company: 'Panadería Trigo Dorado S.A.S.', nit: '900.472.583-1', city: 'Medellín', email: 'lherrera@trigodorado.example', phone: '+57 300 000 0117', channel: 'whatsapp', source: 'web', owner: 'jo', value: 41_000_000, stage: 'won', createdAt: '2026-08-24', closeDate: '2026-10-02', lastContact: '2026-10-02', size: 'small', budgetConfirmed: true, decisionMaker: true, interactions30d: 3, i18n: true },
  // --- Perdidos (últimos 90 días) -------------------------------------------
  { id: 'l1', contactName: 'Esteban Rojas', company: 'Plásticos Río Claro S.A.S.', nit: '901.315.749-9', city: 'Cali', email: 'erojas@rioclaro.example', phone: '+57 300 000 0118', channel: 'email', source: 'web', owner: 'ac', value: 88_000_000, stage: 'lost', lostReason: 'price', createdAt: '2026-06-02', closeDate: '2026-08-05', lastContact: '2026-08-05', size: 'medium', budgetConfirmed: false, decisionMaker: true, interactions30d: 0, i18n: true },
  { id: 'l2', contactName: 'Marcela Gómez', company: 'Bebidas Cumbre Fría S.A.S.', nit: '900.698.214-1', city: 'Bucaramanga', email: 'mgomez@cumbrefria.example', phone: '+57 300 000 0119', channel: 'call', source: 'fair', owner: 'vr', value: 175_000_000, stage: 'lost', lostReason: 'competitor', createdAt: '2026-06-20', closeDate: '2026-08-28', lastContact: '2026-08-28', size: 'large', budgetConfirmed: true, decisionMaker: false, interactions30d: 0, i18n: true },
  { id: 'l3', contactName: 'Gustavo Pérez', company: 'Laboratorios Selva Húmeda S.A.S.', nit: '900.246.893-1', city: 'Pereira', email: 'gperez@selvahumeda.example', phone: '+57 300 000 0120', channel: 'whatsapp', source: 'referral', owner: 'jo', value: 52_000_000, stage: 'lost', lostReason: 'noResponse', createdAt: '2026-07-08', closeDate: '2026-09-24', lastContact: '2026-09-24', size: 'small', budgetConfirmed: false, decisionMaker: false, interactions30d: 0, i18n: true },
];

/** Inscripciones iniciales a la secuencia "Seguimiento a cotizaciones B2B". */
export const SEED_ENROLLMENTS: Enrollment[] = [
  { dealId: 'd2', start: '2026-10-03', stepsDone: 2, status: 'active' },
  { dealId: 'd6', start: '2026-09-28', stepsDone: 3, status: 'replied' },
  { dealId: 'd10', start: '2026-09-12', stepsDone: 4, status: 'paused' },
  { dealId: 'd7', start: '2026-09-20', stepsDone: 1, status: 'paused' },
];

export type Speaker = 'rep' | 'client';
export interface CallRecord {
  id: 'c1' | 'c2' | 'c3';
  dealId: string;
  date: string;
  duration: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  /** Quién habla en cada línea de demoCrm.data.calls.<id>.transcript. */
  speakers: Speaker[];
  topics: number;
  actions: number;
}

export const CALLS: CallRecord[] = [
  { id: 'c1', dealId: 'd1', date: '2026-10-07', duration: '14:20', sentiment: 'positive', speakers: ['rep', 'client', 'rep', 'client', 'rep', 'client', 'rep'], topics: 3, actions: 3 },
  { id: 'c2', dealId: 'd7', date: '2026-09-28', duration: '11:05', sentiment: 'neutral', speakers: ['rep', 'client', 'rep', 'client', 'rep', 'client'], topics: 3, actions: 2 },
  { id: 'c3', dealId: 'd10', date: '2026-09-24', duration: '08:40', sentiment: 'negative', speakers: ['rep', 'client', 'rep', 'client', 'rep', 'client'], topics: 3, actions: 2 },
];
