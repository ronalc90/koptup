/**
 * Datos de ejemplo: empresa, personas, correos (dominio reservado .example),
 * celulares e IP (rangos de documentación 198.51.100.0/24 y 203.0.113.0/24)
 * son ficticios.
 */
import type { AuthMethod, Channel, Field, FieldType, Role, Signer } from './types';

export const STORAGE_KEY = 'koptup.firma-electronica.v2';
export const STATE_VERSION = 2;
/** Pasados estos días se regeneran los datos de ejemplo con fechas nuevas. */
export const MAX_AGE_DAYS = 14;

export const COMPANY = {
  name: 'Cordillera Servicios Temporales S.A.S.',
  short: 'Cordillera',
  nit: '901537284',
  city: 'Bogotá D.C.',
  domain: 'cordillera-temporales.example',
};

/** IP de ejemplo del remitente (tú) en la demo. */
export const SENDER_IP = '203.0.113.24';

export const MAX_SIGNERS = 6;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_BYTES = 512 * 1024;
export const MAX_BULK_ROWS = 50;

export const BUILTIN_TEMPLATE_IDS = ['employment', 'salaryAddendum', 'uniform', 'medicalConsent', 'lease', 'dataPolicy', 'purchaseOrder', 'clearance'] as const;
export type BuiltinTemplateId = (typeof BUILTIN_TEMPLATE_IDS)[number];

export function isBuiltin(id: string | undefined): id is BuiltinTemplateId {
  return !!id && (BUILTIN_TEMPLATE_IDS as readonly string[]).includes(id);
}

/** Variables de cada plantilla, en orden. Los valores de ejemplo están en los mensajes (templates.items.<id>.sample). */
export const TEMPLATE_VARS: Record<BuiltinTemplateId, string[]> = {
  employment: ['name', 'idNumber', 'position', 'salary', 'startDate', 'months', 'city'],
  salaryAddendum: ['name', 'idNumber', 'position', 'newSalary', 'effectiveDate'],
  uniform: ['name', 'idNumber', 'items', 'deliveryDate'],
  medicalConsent: ['patient', 'idNumber', 'procedure', 'professional', 'provider'],
  lease: ['landlord', 'landlordNit', 'address', 'rent', 'months'],
  dataPolicy: ['name', 'idNumber', 'purpose'],
  purchaseOrder: ['supplier', 'supplierNit', 'description', 'amount'],
  clearance: ['name', 'idNumber', 'exitDate'],
};

/** Variables de fecha: su valor de ejemplo se calcula con la fecha de hoy. */
export const DATE_VARS: Record<string, 'nextMonthStart' | 'today' | 'prevMonthEnd'> = {
  startDate: 'nextMonthStart',
  effectiveDate: 'nextMonthStart',
  deliveryDate: 'today',
  exitDate: 'prevMonthEnd',
};

/** Persona principal del documento (va en el título del sobre). */
export const TEMPLATE_SUBJECT_VAR: Record<BuiltinTemplateId, string> = {
  employment: 'name',
  salaryAddendum: 'name',
  uniform: 'name',
  medicalConsent: 'patient',
  lease: 'landlord',
  dataPolicy: 'name',
  purchaseOrder: 'supplier',
  clearance: 'name',
};

/** Personas de Cordillera que firman o aprueban. */
export const STAFF = {
  hr: { name: 'Marcela Ríos', email: `marcela.rios@${COMPANY.domain}`, phone: '3005550101' },
  legal: { name: 'Hernán Darío Valencia', email: `representacion.legal@${COMPANY.domain}`, phone: '3005550102' },
  warehouse: { name: 'Carlos Arias', email: `almacen@${COMPANY.domain}`, phone: '3005550103' },
  purchasing: { name: 'Natalia Suárez', email: `compras@${COMPANY.domain}`, phone: '3005550104' },
  archive: { name: 'Archivo de Gestión Humana', email: `archivo@${COMPANY.domain}`, phone: '' },
};

/** Datos de contacto de ejemplo de la persona principal de cada plantilla. */
const MAIN_CONTACT: Record<BuiltinTemplateId, { email: string; phone: string; channel: Channel }> = {
  employment: { email: 'andres.gomez@correo.example', phone: '3005550111', channel: 'whatsapp' },
  salaryAddendum: { email: 'paula.castro@correo.example', phone: '3005550112', channel: 'email' },
  uniform: { email: 'luis.mejia@correo.example', phone: '3005550113', channel: 'whatsapp' },
  medicalConsent: { email: 'diana.torres@correo.example', phone: '3005550114', channel: 'sms' },
  lease: { email: 'gerencia@lasabana.example', phone: '3005550115', channel: 'email' },
  dataPolicy: { email: 'sandra.ortiz@correo.example', phone: '3005550116', channel: 'email' },
  purchaseOrder: { email: 'ventas@dotacionesdelsur.example', phone: '3005550117', channel: 'email' },
  clearance: { email: 'jorge.pena@correo.example', phone: '3005550118', channel: 'whatsapp' },
};

const SECOND_PARTIES: Record<BuiltinTemplateId, { who: keyof typeof STAFF; role: Role }[]> = {
  employment: [
    { who: 'hr', role: 'approver' },
    { who: 'legal', role: 'signer' },
  ],
  salaryAddendum: [{ who: 'legal', role: 'signer' }],
  uniform: [{ who: 'warehouse', role: 'witness' }],
  medicalConsent: [{ who: 'archive', role: 'cc' }],
  lease: [{ who: 'legal', role: 'signer' }],
  dataPolicy: [{ who: 'archive', role: 'cc' }],
  purchaseOrder: [{ who: 'purchasing', role: 'approver' }],
  clearance: [{ who: 'hr', role: 'approver' }],
};

export const AUTH_BY_TEMPLATE: Record<BuiltinTemplateId, AuthMethod> = {
  employment: 'whatsappOtp',
  salaryAddendum: 'emailOtp',
  uniform: 'whatsappOtp',
  medicalConsent: 'smsOtp',
  lease: 'emailOtp',
  dataPolicy: 'emailOtp',
  purchaseOrder: 'emailOtp',
  clearance: 'whatsappOtp',
};

/** Firmantes propuestos para una plantilla (la persona del documento primero). */
export function defaultSigners(id: BuiltinTemplateId, mainName: string, idPrefix = 's'): Signer[] {
  const main = MAIN_CONTACT[id];
  const list: Signer[] = [
    { id: `${idPrefix}1`, name: mainName, email: main.email, phone: main.phone, channel: main.channel, role: 'signer', state: 'pending' },
  ];
  SECOND_PARTIES[id].forEach((p, i) => {
    const s = STAFF[p.who];
    list.push({
      id: `${idPrefix}${i + 2}`,
      name: s.name,
      email: s.email,
      phone: s.phone,
      channel: 'email',
      role: p.role,
      state: 'pending',
    });
  });
  return list;
}

/** Firmantes de un documento PDF subido (sin plantilla). */
export function genericSigners(): Signer[] {
  return [
    { id: 's1', name: 'Andrés Felipe Gómez', email: 'andres.gomez@correo.example', phone: '3005550111', channel: 'email', role: 'signer', state: 'pending' },
    { id: 's2', name: STAFF.legal.name, email: STAFF.legal.email, phone: STAFF.legal.phone, channel: 'email', role: 'signer', state: 'pending' },
  ];
}

/** Colores por firmante (campos del documento y chips). */
export const SIGNER_COLORS = [
  { bg: 'bg-sky-100 dark:bg-sky-900/60', border: 'border-sky-500', text: 'text-sky-800 dark:text-sky-100', dot: 'bg-sky-500' },
  { bg: 'bg-amber-100 dark:bg-amber-900/60', border: 'border-amber-500', text: 'text-amber-900 dark:text-amber-100', dot: 'bg-amber-500' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/60', border: 'border-fuchsia-500', text: 'text-fuchsia-900 dark:text-fuchsia-100', dot: 'bg-fuchsia-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/60', border: 'border-emerald-500', text: 'text-emerald-900 dark:text-emerald-100', dot: 'bg-emerald-500' },
  { bg: 'bg-rose-100 dark:bg-rose-900/60', border: 'border-rose-500', text: 'text-rose-900 dark:text-rose-100', dot: 'bg-rose-500' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/60', border: 'border-indigo-500', text: 'text-indigo-900 dark:text-indigo-100', dot: 'bg-indigo-500' },
];

/** Campos sugeridos: firma y fecha de cada firmante que actúa, al final de la página. */
export function suggestedFields(signers: Signer[], idPrefix = 'f'): Field[] {
  const acting = signers.filter((s) => s.role !== 'cc');
  const out: Field[] = [];
  acting.forEach((s, i) => {
    const col = i % 2 === 0 ? 28 : 72;
    const row = 74 + Math.floor(i / 2) * 11;
    const type: FieldType = s.role === 'approver' ? 'initials' : 'signature';
    out.push({ id: `${idPrefix}${out.length + 1}`, type, x: col, y: Math.min(row, 92), signerId: s.id });
    out.push({ id: `${idPrefix}${out.length + 1}`, type: 'date', x: col, y: Math.min(row + 5, 96), signerId: s.id });
  });
  return out;
}

export const INTEGRATIONS = ['whatsapp', 'm365', 'gdrive', 'hrms', 'docs', 'api', 'crm'] as const;
export type IntegrationId = (typeof INTEGRATIONS)[number];

/** Clave del webhook de ejemplo (pública a propósito: solo sirve en esta demo). */
export const DEMO_WEBHOOK_SECRET = 'clave-de-ejemplo-cordillera';
