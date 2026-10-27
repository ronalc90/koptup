/**
 * Catálogo fijo de la empresa de ejemplo. Alimentos Valdeora S.A.S. es una
 * empresa ficticia: el NIT, las entidades de seguridad social, los bancos y
 * las personas son inventados para la demo.
 */
import type { AreaId, ContractType, CourseId, Education, PositionId, ShiftId, SiteId } from './types';

/** Calcula el dígito de verificación de un NIT con el algoritmo de la DIAN. */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  const r = sum % 11;
  return r >= 2 ? 11 - r : r;
}

const NIT = '901738264';

export const COMPANY = {
  name: 'Alimentos Valdeora S.A.S.',
  nit: NIT,
  nitFormatted: `${NIT.slice(0, 3)}.${NIT.slice(3, 6)}.${NIT.slice(6)}-${nitDv(NIT)}`,
  city: 'Funza, Cundinamarca',
  address: 'Parque Industrial Km 2 vía Funza – Siberia, bodega 14',
  domain: 'valdeora.example',
  arl: 'ARL Amparo Laboral',
};

export const SITES: SiteId[] = ['funza', 'bogota', 'medellin'];
export const SITE_CITY: Record<SiteId, string> = { funza: 'Funza', bogota: 'Bogotá', medellin: 'Medellín' };
export const AREAS: AreaId[] = ['management', 'production', 'quality', 'maintenance', 'logistics', 'sales', 'finance', 'people'];
export const CONTRACTS: ContractType[] = ['indefinite', 'fixed', 'work', 'apprentice'];

export const EPS_LIST = ['EPS Andina Salud', 'EPS Cordillera', 'EPS Sabana Vital'];
export const AFP_LIST = ['AFP Futuro Andino', 'AFP Raíces', 'AFP Nueva Era'];
export const CCF_BY_SITE: Record<SiteId, string> = {
  funza: 'Caja de Compensación Sabana',
  bogota: 'Caja de Compensación Sabana',
  medellin: 'Caja de Compensación Montaña',
};
export const BANKS = ['Banco Andino', 'Banco Sabana', 'Banco Nevado'];

export interface PositionInfo {
  area: AreaId;
  salary: [number, number];
  arl: 1 | 2 | 3 | 4 | 5;
  shift: ShiftId;
  /** Participa en el ciclo de evaluación de desempeño. */
  evaluated: boolean;
  education: Education;
}

export const POSITIONS: Record<PositionId, PositionInfo> = {
  ceo: { area: 'management', salary: [18500000, 18500000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  plantDirector: { area: 'production', salary: [12600000, 12600000], arl: 3, shift: 'office', evaluated: true, education: 'professional' },
  cfo: { area: 'finance', salary: [11800000, 11800000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  salesDirector: { area: 'sales', salary: [11400000, 11400000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  hrHead: { area: 'people', salary: [8200000, 8200000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  logisticsHead: { area: 'logistics', salary: [7400000, 7400000], arl: 3, shift: 'office', evaluated: true, education: 'professional' },
  qualityHead: { area: 'quality', salary: [6900000, 6900000], arl: 2, shift: 'office', evaluated: true, education: 'professional' },
  maintenanceHead: { area: 'maintenance', salary: [6600000, 6600000], arl: 4, shift: 'office', evaluated: true, education: 'professional' },
  supervisor: { area: 'production', salary: [3500000, 3800000], arl: 3, shift: 'rotating', evaluated: true, education: 'technologist' },
  packer: { area: 'production', salary: [1750905, 1900000], arl: 3, shift: 'rotating', evaluated: false, education: 'highSchool' },
  operator: { area: 'production', salary: [1850000, 2150000], arl: 3, shift: 'rotating', evaluated: false, education: 'highSchool' },
  qualityAssistant: { area: 'quality', salary: [2250000, 2400000], arl: 2, shift: 'day', evaluated: true, education: 'technical' },
  qualityAnalyst: { area: 'quality', salary: [3300000, 3600000], arl: 2, shift: 'day', evaluated: true, education: 'professional' },
  technician: { area: 'maintenance', salary: [2900000, 3300000], arl: 4, shift: 'rotating', evaluated: true, education: 'technical' },
  warehouseAssistant: { area: 'logistics', salary: [1800000, 2000000], arl: 3, shift: 'day', evaluated: false, education: 'highSchool' },
  driver: { area: 'logistics', salary: [2200000, 2300000], arl: 4, shift: 'day', evaluated: false, education: 'highSchool' },
  salesRep: { area: 'sales', salary: [2600000, 3200000], arl: 1, shift: 'office', evaluated: true, education: 'technologist' },
  accountant: { area: 'finance', salary: [3800000, 4300000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  costAnalyst: { area: 'finance', salary: [4500000, 4500000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  adminAssistant: { area: 'finance', salary: [2100000, 2200000], arl: 1, shift: 'office', evaluated: true, education: 'technical' },
  hrAnalyst: { area: 'people', salary: [3900000, 3900000], arl: 1, shift: 'office', evaluated: true, education: 'professional' },
  apprentice: { area: 'production', salary: [1750905, 1750905], arl: 1, shift: 'day', evaluated: false, education: 'technical' },
};

export const EDUCATION_RANK: Record<Education, number> = { highSchool: 0, technical: 1, technologist: 2, professional: 3 };

export const COURSE_HOURS: Record<CourseId, number> = {
  induction: 4,
  sst50: 50,
  food: 10,
  heights: 20,
  pesv: 8,
  sagrilaft: 3,
  dataProtection: 2,
  harassment: 2,
};

export const FEMALE = ['Camila', 'Valentina', 'Daniela', 'Paula', 'Laura', 'Natalia', 'Diana', 'Carolina', 'Sandra', 'Yolanda', 'Marcela', 'Lina', 'Angélica', 'Johana', 'Leidy', 'Viviana', 'Paola', 'Adriana', 'Gloria', 'Mónica', 'Erika', 'Tatiana', 'Luz Mery', 'Yuliana', 'Sara', 'María José', 'Juliana', 'Ana Milena', 'Katherine', 'Jenny'];
export const MALE = ['Andrés', 'Juan Carlos', 'Jhon Fredy', 'Diego', 'Sebastián', 'Carlos', 'Luis Eduardo', 'Óscar', 'Wilson', 'Fabián', 'Jairo', 'Edwin', 'Cristian', 'Brayan', 'Julián', 'Mauricio', 'Hernán', 'Alexander', 'Camilo', 'Javier', 'Nelson', 'Duván', 'Esteban', 'Mateo', 'Santiago', 'Iván', 'Germán', 'Yeison', 'Harold', 'Rubén'];
export const SURNAMES = ['Rodríguez', 'Gómez', 'González', 'Martínez', 'García', 'López', 'Hernández', 'Sánchez', 'Ramírez', 'Pérez', 'Díaz', 'Muñoz', 'Rojas', 'Moreno', 'Jiménez', 'Torres', 'Vargas', 'Castro', 'Ortiz', 'Ruiz', 'Suárez', 'Romero', 'Herrera', 'Medina', 'Aguilar', 'Cárdenas', 'Ospina', 'Restrepo', 'Quintero', 'Valencia', 'Osorio', 'Mejía', 'Cifuentes', 'Bermúdez', 'Parra', 'Pineda', 'Salazar', 'Arango', 'Zapata', 'Gaitán', 'Rincón', 'Duarte', 'Beltrán', 'Galindo', 'Cubillos'];
