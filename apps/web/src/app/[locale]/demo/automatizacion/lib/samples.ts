/**
 * Datos de ejemplo: una distribuidora ficticia («Distribuciones Nogal Andino
 * S.A.S.»), sus proveedores, cartera y prospectos, las hojas de cálculo que
 * consultan los flujos, las políticas que usa el asistente y los eventos de
 * ejemplo con los que se ejecuta cada disparador. Nada de esto es real:
 * empresas, personas, NIT, correos (dominio reservado .example) y celulares
 * (serie 300 555 01xx) son inventados.
 */
import { CREDENTIALS, TYPE_DEFS, defaultCredential, typeKey, type SheetKey } from './catalog';
import { addDays, addMinutes, dayOf, nitDv } from './format';
import type { ConfigValue, SampleEvent, Stamp, Step, StepType, TemplateKey } from './types';

/** Textos de ejemplo que dependen del idioma (messages: demoAutomation.seed). */
export interface SeedText {
  company: string;
  city: string;
  you: string;
  authors: { ops: string; it: string; sales: string };
  approved: string;
  templates: Record<
    Exclude<TemplateKey, 'blank'>,
    { name: string; steps: Record<string, string>; config: Record<string, Record<string, string>>; versions?: Record<string, string> }
  > & { blank: { name: string; steps: Record<string, string> } };
  leads: Record<'l1' | 'l2' | 'l3', { message: string; company: string }>;
  chats: Record<'c1' | 'c2' | 'c3', string>;
  kb: { source: string; answer: string; keywords: string }[];
  emailSubject: string;
  /** Valores por defecto según el tipo (clave con _ en vez de punto: "ai_draft"). */
  defaults: Record<string, Record<string, string>>;
}

export const COMPANY_NIT = '901345678';

export const SUPPLIERS = {
  sabana: { name: 'Químicos La Sabana S.A.S.', nit: '900512347', email: 'facturacion@quimicoslasabana.example' },
  valle: { name: 'Papeles del Valle S.A.S.', nit: '900874215', email: 'fe@papelesdelvalle.example' },
  caribe: { name: 'Envases del Caribe Ltda.', nit: '800219633', email: 'facturas@envasesdelcaribe.example' },
  altiplano: { name: 'Plásticos Altiplano S.A.S.', nit: '901102458', email: 'contabilidad@plasticosaltiplano.example' },
} as const;

export type Row = Record<string, string | number>;

export function buildSheets(text: SeedText): Record<SheetKey, Row[]> {
  return {
    orders: [
      { oc: 'OC-2026-0141', nit: SUPPLIERS.sabana.nit, proveedor: SUPPLIERS.sabana.name, total: 2618000, estado: text.approved },
      { oc: 'OC-2026-0144', nit: SUPPLIERS.valle.nit, proveedor: SUPPLIERS.valle.name, total: 3998400, estado: text.approved },
      { oc: 'OC-2026-0147', nit: SUPPLIERS.caribe.nit, proveedor: SUPPLIERS.caribe.name, total: 1785000, estado: text.approved },
      { oc: 'OC-2026-0150', nit: SUPPLIERS.altiplano.nit, proveedor: SUPPLIERS.altiplano.name, total: 952000, estado: text.approved },
    ],
    receivables: [
      { nit: '901233876', cliente: 'Minimercado El Trébol', factura: 'FV-20871', saldo: 3450000, diasVencida: 12, celular: '3005550112', correo: 'pagos@mercadoeltrebol.example' },
      { nit: '900765431', cliente: 'Droguería Santa Inés', factura: 'FV-20902', saldo: 1280000, diasVencida: 3, celular: '3005550134', correo: 'tesoreria@drogueriasantaines.example' },
      { nit: '901456320', cliente: 'Hotel Brisas del Lago', factura: 'FV-20788', saldo: 6920000, diasVencida: 21, celular: '', correo: 'cartera@hotelbrisasdellago.example' },
    ],
    customers: [
      { correo: 'diana.ospina@tiendalacolmena.example', nombre: 'Diana Ospina', ciudad: 'Cali', comercial: 'Paola Giraldo' },
      { correo: 'compras@hogarsereno.example', nombre: 'Hernán Vélez', ciudad: 'Pereira', comercial: 'Mesa comercial' },
    ],
  };
}

/** Factura electrónica de ejemplo en un XML simplificado al estilo UBL 2.1. */
export function invoiceXml(p: {
  number: string;
  date?: string;
  supplier: { name: string; nit: string };
  subtotal: number;
  iva?: number;
  total: number;
}): string {
  const lines = [
    '<Invoice xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    `  <cbc:ID>${p.number}</cbc:ID>`,
    p.date ? `  <cbc:IssueDate>${p.date}</cbc:IssueDate>` : null,
    '  <cac:AccountingSupplierParty>',
    `    <cbc:RegistrationName>${p.supplier.name}</cbc:RegistrationName>`,
    `    <cbc:CompanyID schemeID="${nitDv(p.supplier.nit)}">${p.supplier.nit}</cbc:CompanyID>`,
    '  </cac:AccountingSupplierParty>',
    '  <cac:AccountingCustomerParty>',
    `    <cbc:CompanyID schemeID="${nitDv(COMPANY_NIT)}">${COMPANY_NIT}</cbc:CompanyID>`,
    '  </cac:AccountingCustomerParty>',
    p.iva !== undefined ? `  <cbc:TaxAmount currencyID="COP">${p.iva}</cbc:TaxAmount>` : null,
    '  <cac:LegalMonetaryTotal>',
    `    <cbc:LineExtensionAmount currencyID="COP">${p.subtotal}</cbc:LineExtensionAmount>`,
    `    <cbc:PayableAmount currencyID="COP">${p.total}</cbc:PayableAmount>`,
    '  </cac:LegalMonetaryTotal>',
    '</Invoice>',
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

/** Eventos de ejemplo de cada disparador, con fechas relativas a «ahora». */
export function buildSamples(now: Stamp, text: SeedText): SampleEvent[] {
  const yesterday = dayOf(addDays(now, -1));
  const twoDaysAgo = dayOf(addDays(now, -2));
  const email = (
    id: string,
    labelKey: string,
    s: { name: string; nit: string; email: string },
    number: string,
    xml: string,
    transient?: StepType[],
  ): SampleEvent => ({
    id,
    trigger: 'trigger.email',
    labelKey,
    transient,
    payload: {
      correo: {
        de: s.email,
        asunto: text.emailSubject.replace('{number}', number).replace('{supplier}', s.name),
        adjunto: `${number}.zip`,
      },
      documento: { nombre: `${number}.xml`, contenido: xml },
    },
  });
  const lead = (id: string, key: 'l1' | 'l2' | 'l3', data: Record<string, string>): SampleEvent => ({
    id,
    trigger: 'trigger.webhook',
    labelKey: `samples.${id}`,
    payload: { lead: { ...data, empresa: text.leads[key].company, mensaje: text.leads[key].message } },
  });
  const chat = (id: string, key: 'c1' | 'c2' | 'c3', from: string, name: string): SampleEvent => ({
    id,
    trigger: 'trigger.chat',
    labelKey: `samples.${id}`,
    payload: { mensaje: { de: from, nombre: name, texto: text.chats[key] } },
  });
  const collection = (id: string, nit: string): SampleEvent => ({
    id,
    trigger: 'trigger.schedule',
    labelKey: `samples.${id}`,
    payload: { revision: { fecha: dayOf(now), cliente: nit } },
  });

  return [
    email(
      'invOk',
      'samples.invOk',
      SUPPLIERS.sabana,
      'FE-5521',
      invoiceXml({ number: 'FE-5521', date: yesterday, supplier: SUPPLIERS.sabana, subtotal: 2200000, iva: 418000, total: 2618000 }),
    ),
    email(
      'invMismatch',
      'samples.invMismatch',
      SUPPLIERS.valle,
      'FE-10234',
      invoiceXml({ number: 'FE-10234', date: yesterday, supplier: SUPPLIERS.valle, subtotal: 3600000, iva: 684000, total: 4284000 }),
    ),
    email(
      'invRetry',
      'samples.invRetry',
      SUPPLIERS.caribe,
      'FE-889',
      invoiceXml({ number: 'FE-889', date: twoDaysAgo, supplier: SUPPLIERS.caribe, subtotal: 1500000, iva: 285000, total: 1785000 }),
      ['app.accounting'],
    ),
    email(
      'invPartial',
      'samples.invPartial',
      SUPPLIERS.altiplano,
      'FE-3307',
      invoiceXml({ number: 'FE-3307', supplier: SUPPLIERS.altiplano, subtotal: 800000, total: 952000 }),
    ),
    collection('colOk', '901233876'),
    collection('colRecent', '900765431'),
    collection('colNoPhone', '901456320'),
    lead('leadMde', 'l1', {
      nombre: 'Catalina Restrepo',
      correo: 'catalina.restrepo@colegiomontecielo.example',
      telefono: '3005550156',
      ciudad: 'Medellín',
    }),
    lead('leadBog', 'l2', {
      nombre: 'Mauricio Pardo',
      correo: 'compras@fogonsabanero.example',
      telefono: '3005550167',
      ciudad: 'Bogotá',
    }),
    lead('leadComplaint', 'l3', {
      nombre: 'Diana Ospina',
      correo: 'diana.ospina@tiendalacolmena.example',
      telefono: '3005550178',
      ciudad: 'Cali',
    }),
    chat('chatShipping', 'c1', '3005550189', 'Jorge Castaño'),
    chat('chatReturns', 'c2', '3005550190', 'Liliana Gómez'),
    chat('chatUnknown', 'c3', '3005550191', 'Fabio Quintero'),
  ];
}

export function samplesFor(samples: SampleEvent[], trigger: StepType | undefined): SampleEvent[] {
  return trigger ? samples.filter((s) => s.trigger === trigger) : [];
}

/* ------------------------------------------------------------------------ */
/* Plantillas de flujo                                                       */
/* ------------------------------------------------------------------------ */

interface StepSpec {
  key: string;
  type: StepType;
  config?: Record<string, ConfigValue>;
}

const TEMPLATE_SPECS: Record<TemplateKey, StepSpec[]> = {
  invoices: [
    { key: 'trigger', type: 'trigger.email' },
    { key: 'extract', type: 'ai.extract' },
    { key: 'lookup', type: 'app.sheet', config: { sheet: 'orders', column: 'nit', value: '{{factura.nit}}', saveAs: 'oc' } },
    { key: 'check', type: 'logic.condition', config: { left: '{{factura.total}}', op: 'approx', right: '{{oc.total}}', tolerance: 1, onFalse: 'review' } },
    { key: 'post', type: 'app.accounting' },
    { key: 'notify', type: 'notify.chat', config: { channel: 'team' } },
  ],
  collections: [
    { key: 'trigger', type: 'trigger.schedule' },
    { key: 'lookup', type: 'app.sheet', config: { sheet: 'receivables', column: 'nit', value: '{{revision.cliente}}', saveAs: 'cartera' } },
    { key: 'check', type: 'logic.condition', config: { left: '{{cartera.diasVencida}}', op: 'gt', right: '5', tolerance: 0, onFalse: 'stop' } },
    { key: 'link', type: 'app.payment' },
    { key: 'draft', type: 'ai.draft', config: { saveAs: 'borrador' } },
    { key: 'send', type: 'notify.chat', config: { channel: 'whatsapp', to: '{{cartera.celular}}' } },
  ],
  leads: [
    { key: 'trigger', type: 'trigger.webhook' },
    { key: 'classify', type: 'ai.classify', config: { text: '{{lead.mensaje}} {{lead.ciudad}}' } },
    { key: 'check', type: 'logic.condition', config: { left: '{{clasificacion.categoria}}', op: 'eq', tolerance: 0, onFalse: 'review' } },
    { key: 'assign', type: 'logic.assign' },
    { key: 'crm', type: 'app.crm' },
    { key: 'reply', type: 'notify.email', config: { to: '{{lead.correo}}' } },
  ],
  assistant: [
    { key: 'trigger', type: 'trigger.chat' },
    { key: 'rag', type: 'ai.rag' },
    { key: 'reply', type: 'notify.chat', config: { channel: 'whatsapp', to: '{{mensaje.de}}' } },
  ],
  blank: [{ key: 'trigger', type: 'trigger.webhook' }],
};

export const TEMPLATE_KEYS: TemplateKey[] = ['invoices', 'collections', 'leads', 'assistant', 'blank'];

/** Ritmo de ejemplo de cada plantilla: ejecuciones al día y % exitosas. */
export const TEMPLATE_RATES: Record<TemplateKey, { perDay: number; ok: number; minutes: number }> = {
  invoices: { perDay: 18, ok: 0.93, minutes: 9 },
  collections: { perDay: 34, ok: 0.95, minutes: 4 },
  leads: { perDay: 9, ok: 0.9, minutes: 6 },
  assistant: { perDay: 0, ok: 0.9, minutes: 3 },
  blank: { perDay: 0, ok: 0.9, minutes: 5 },
};

/** Valores por defecto de un paso nuevo (los del catálogo más los del idioma). */
export function defaultConfig(type: StepType, text: SeedText): Record<string, ConfigValue> {
  return { ...TYPE_DEFS[type].defaults, ...(text.defaults[typeKey(type)] ?? {}) };
}

export function newStep(id: string, type: StepType, name: string, text: SeedText, config?: Record<string, ConfigValue>): Step {
  return {
    id,
    type,
    name,
    config: { ...defaultConfig(type, text), ...(config ?? {}) },
    retry: { ...TYPE_DEFS[type].retry },
    credential: defaultCredential(type),
  };
}

export function templateSteps(key: TemplateKey, text: SeedText): Step[] {
  const tpl = text.templates[key];
  const tplConfig = 'config' in tpl ? (tpl as { config: Record<string, Record<string, string>> }).config : {};
  return TEMPLATE_SPECS[key].map((spec, i) => {
    // Textos del idioma para ese paso: config.<clave del paso>.<campo>
    const localized: Record<string, ConfigValue> = { ...(tplConfig[spec.key] ?? {}) };
    return newStep(`s${i + 1}`, spec.type, tpl.steps[spec.key] ?? spec.key, text, { ...(spec.config ?? {}), ...localized });
  });
}

/** Versiones anteriores de ejemplo: qué pasos tenía cada una. */
export const VERSION_PLAN: Partial<Record<TemplateKey, { keep: number[]; author: keyof SeedText['authors']; daysAgo: number; hour: string }[]>> = {
  invoices: [
    { keep: [0, 1, 4], author: 'ops', daysAgo: 6, hour: '10:14:00' },
    { keep: [0, 1, 2, 3, 4], author: 'it', daysAgo: 2, hour: '15:40:00' },
    { keep: [0, 1, 2, 3, 4, 5], author: 'ops', daysAgo: 1, hour: '09:05:00' },
  ],
  collections: [
    { keep: [0, 1, 3, 4, 5], author: 'it', daysAgo: 9, hour: '11:20:00' },
    { keep: [0, 1, 2, 3, 4, 5], author: 'ops', daysAgo: 3, hour: '16:02:00' },
  ],
  leads: [{ keep: [0, 1, 2, 3, 4, 5], author: 'sales', daysAgo: 4, hour: '14:31:00' }],
};

/** Credenciales disponibles para un tipo de paso. */
export function credentialsFor(type: StepType) {
  const kind = TYPE_DEFS[type].credential;
  return kind ? CREDENTIALS.filter((c) => c.kind === kind) : [];
}

/** Hora de la última revisión diaria de cartera (8:00 de hoy o de ayer). */
export function lastScheduleRun(now: Stamp): Stamp {
  const today8 = `${dayOf(now)}T08:00:00`;
  return now >= addMinutes(today8, 15) ? today8 : `${dayOf(addDays(now, -1))}T08:00:00`;
}

