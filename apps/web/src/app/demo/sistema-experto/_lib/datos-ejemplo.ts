/**
 * Datos de ejemplo del motor de reglas (todo ficticio).
 *
 * - Catálogo: códigos CUPS reales (la clasificación es pública), pero las
 *   TARIFAS son de ejemplo, no las oficiales de ningún manual.
 * - Lote: 12 facturas de prestadores, pacientes y pagador ficticios, con al
 *   menos un error sembrado por cada regla del motor.
 *
 * Nada de esto se envía al servidor: el simulador y la búsqueda en el catálogo
 * de ejemplo se ejecutan en el navegador.
 */

export type ManualTarifario = 'ISS2001' | 'ISS2004' | 'SOAT';

export const MANUALES: ManualTarifario[] = ['ISS2001', 'ISS2004', 'SOAT'];

export type Categoria = 'consulta' | 'laboratorio' | 'imagenologia' | 'diagnostico' | 'terapia';

export interface CodigoCatalogo {
  codigo: string;
  /** Descripción en español (como aparece en el catálogo). */
  descripcion: string;
  /** Traducción de apoyo para la interfaz en inglés. */
  descripcionEn: string;
  categoria: Categoria;
  requiereAutorizacion: boolean;
  /** Servicio que solo aplica a pacientes de un sexo (lo usa la regla 301). */
  soloSexo?: 'F' | 'M';
  /** Tarifas de ejemplo en COP por manual tarifario. */
  tarifas: Record<ManualTarifario, number>;
  /** Palabras de uso común que también encuentran el código en la búsqueda por texto. */
  sinonimos: string[];
}

export const CATALOGO_EJEMPLO: CodigoCatalogo[] = [
  {
    codigo: '890201',
    descripcion: 'Consulta de primera vez por medicina general',
    descripcionEn: 'First-time general practitioner visit',
    categoria: 'consulta',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 37600, ISS2004: 41800, SOAT: 52000 },
    sinonimos: ['cita', 'medico general', 'consulta externa', 'doctor'],
  },
  {
    codigo: '890301',
    descripcion: 'Consulta de control o de seguimiento por medicina general',
    descripcionEn: 'Follow-up general practitioner visit',
    categoria: 'consulta',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 32500, ISS2004: 36200, SOAT: 45000 },
    sinonimos: ['cita de control', 'revision', 'medico general', 'seguimiento', 'follow up'],
  },
  {
    codigo: '890202',
    descripcion: 'Consulta de primera vez por medicina especializada',
    descripcionEn: 'First-time specialist visit',
    categoria: 'consulta',
    requiereAutorizacion: true,
    tarifas: { ISS2001: 56100, ISS2004: 62400, SOAT: 78000 },
    sinonimos: ['especialista', 'cita con especialista', 'specialist'],
  },
  {
    codigo: '890302',
    descripcion: 'Consulta de control o de seguimiento por medicina especializada',
    descripcionEn: 'Follow-up specialist visit',
    categoria: 'consulta',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 47500, ISS2004: 52800, SOAT: 66000 },
    sinonimos: ['especialista', 'control con especialista', 'specialist'],
  },
  {
    codigo: '890701',
    descripcion: 'Consulta de urgencias por medicina general',
    descripcionEn: 'Emergency visit by a general practitioner',
    categoria: 'consulta',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 51100, ISS2004: 56800, SOAT: 71000 },
    sinonimos: ['urgencia', 'emergencia', 'emergency', 'triage'],
  },
  {
    codigo: '890208',
    descripcion: 'Consulta de primera vez por psicología',
    descripcionEn: 'First-time psychology visit',
    categoria: 'consulta',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 41700, ISS2004: 46400, SOAT: 58000 },
    sinonimos: ['psicologo', 'salud mental', 'terapia psicologica', 'psychologist'],
  },
  {
    codigo: '890203',
    descripcion: 'Consulta de primera vez por odontología general',
    descripcionEn: 'First-time general dentistry visit',
    categoria: 'consulta',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 29500, ISS2004: 32800, SOAT: 41000 },
    sinonimos: ['odontologo', 'dentista', 'dientes', 'dentist'],
  },
  {
    codigo: '902210',
    descripcion:
      'Hemograma IV (hemoglobina, hematocrito, recuento de eritrocitos, índices eritrocitarios, leucograma, recuento de plaquetas, índices plaquetarios y morfología electrónica e histograma) automatizado',
    descripcionEn: 'Complete blood count (automated)',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 20500, ISS2004: 22800, SOAT: 28500 },
    sinonimos: ['cuadro hematico', 'examen de sangre', 'hemograma completo', 'blood count', 'cbc'],
  },
  {
    codigo: '903841',
    descripcion: 'Glucosa en suero u otro fluido diferente a orina',
    descripcionEn: 'Serum glucose',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 7000, ISS2004: 7800, SOAT: 9800 },
    sinonimos: ['glicemia', 'azucar en sangre', 'glucemia', 'blood sugar'],
  },
  {
    codigo: '903426',
    descripcion: 'Hemoglobina glicosilada automatizada',
    descripcionEn: 'Glycated hemoglobin (HbA1c), automated',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 30200, ISS2004: 33600, SOAT: 42000 },
    sinonimos: ['hba1c', 'glicada', 'diabetes', 'control de diabetes'],
  },
  {
    codigo: '903895',
    descripcion: 'Creatinina en suero u otros fluidos',
    descripcionEn: 'Serum creatinine',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 8000, ISS2004: 8900, SOAT: 11200 },
    sinonimos: ['funcion renal', 'rinon', 'kidney'],
  },
  {
    codigo: '903818',
    descripcion: 'Colesterol total',
    descripcionEn: 'Total cholesterol',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 7400, ISS2004: 8300, SOAT: 10400 },
    sinonimos: ['perfil lipidico', 'grasa en sangre', 'lipid panel'],
  },
  {
    codigo: '903868',
    descripcion: 'Triglicéridos',
    descripcionEn: 'Triglycerides',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 9000, ISS2004: 10000, SOAT: 12600 },
    sinonimos: ['perfil lipidico', 'grasa en sangre', 'lipid panel'],
  },
  {
    codigo: '903815',
    descripcion: 'Colesterol de alta densidad (HDL)',
    descripcionEn: 'High-density lipoprotein cholesterol (HDL)',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 10200, ISS2004: 11400, SOAT: 14300 },
    sinonimos: ['hdl', 'colesterol bueno', 'perfil lipidico', 'lipid panel'],
  },
  {
    codigo: '907106',
    descripcion: 'Uroanálisis',
    descripcionEn: 'Urinalysis',
    categoria: 'laboratorio',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 9700, ISS2004: 10800, SOAT: 13500 },
    sinonimos: ['parcial de orina', 'examen de orina', 'orina', 'urine test'],
  },
  {
    codigo: '871121',
    descripcion:
      'Radiografía de tórax (PA o AP y lateral, decúbito lateral, oblicuas o lateral con bario)',
    descripcionEn: 'Chest X-ray (PA or AP and lateral)',
    categoria: 'imagenologia',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 48900, ISS2004: 54400, SOAT: 68000 },
    sinonimos: ['rayos x de torax', 'placa de pecho', 'rx torax', 'pulmones', 'chest x-ray', 'two views'],
  },
  {
    codigo: '881302',
    descripcion: 'Ecografía de abdomen total',
    descripcionEn: 'Complete abdominal ultrasound',
    categoria: 'imagenologia',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 102200, ISS2004: 113600, SOAT: 142000 },
    sinonimos: ['ultrasonido', 'eco abdominal', 'ecografia de higado y vesicula', 'ultrasound'],
  },
  {
    codigo: '881431',
    descripcion: 'Ecografía obstétrica transabdominal',
    descripcionEn: 'Transabdominal obstetric ultrasound',
    categoria: 'imagenologia',
    requiereAutorizacion: false,
    soloSexo: 'F',
    tarifas: { ISS2001: 70500, ISS2004: 78400, SOAT: 98000 },
    sinonimos: ['embarazo', 'control prenatal', 'eco obstetrica', 'pregnancy', 'ultrasound'],
  },
  {
    codigo: '879111',
    descripcion: 'Tomografía computada de cráneo simple',
    descripcionEn: 'Non-contrast head CT scan',
    categoria: 'imagenologia',
    requiereAutorizacion: true,
    tarifas: { ISS2001: 178500, ISS2004: 198400, SOAT: 248000 },
    sinonimos: ['tac de cabeza', 'escanografia', 'tomografia de cabeza', 'head ct', 'scan'],
  },
  {
    codigo: '883101',
    descripcion: 'Resonancia magnética de cerebro',
    descripcionEn: 'Brain MRI',
    categoria: 'imagenologia',
    requiereAutorizacion: true,
    tarifas: { ISS2001: 518400, ISS2004: 576000, SOAT: 720000 },
    sinonimos: ['resonancia de cabeza', 'rmn cerebral', 'mri'],
  },
  {
    codigo: '895100',
    descripcion: 'Electrocardiograma de ritmo o de superficie',
    descripcionEn: 'Resting surface electrocardiogram',
    categoria: 'diagnostico',
    requiereAutorizacion: false,
    tarifas: { ISS2001: 28000, ISS2004: 31200, SOAT: 39000 },
    sinonimos: ['ekg', 'ecg', 'corazon', 'cardiograma', 'heart'],
  },
  {
    codigo: '931000',
    descripcion: 'Terapia física integral',
    descripcionEn: 'Comprehensive physical therapy session',
    categoria: 'terapia',
    requiereAutorizacion: true,
    tarifas: { ISS2001: 25900, ISS2004: 28800, SOAT: 36000 },
    sinonimos: ['fisioterapia', 'rehabilitacion', 'terapia de rodilla', 'physiotherapy'],
  },
];

export const CATALOGO_POR_CODIGO: Record<string, CodigoCatalogo> = Object.fromEntries(
  CATALOGO_EJEMPLO.map((c) => [c.codigo, c])
);

/** Convenio ficticio con el que se evalúa el lote. */
export const CONVENIO_EJEMPLO = {
  nombre: 'EPS Andina (demo)',
  nit: '900.000.201-9',
  vigencia: '2026',
  /** Servicios con tarifa pactada fija (regla 401, sin tolerancia). */
  tarifasPactadas: {
    '902210': 21000,
    '883101': 610000,
    '931000': 27000,
  } as Record<string, number>,
};

export interface Autorizacion {
  numero?: string;
  fecha?: string;
  vigencia?: string;
  cantidadAutorizada?: number;
}

export interface LineaFactura {
  id: string;
  cups: string;
  cantidad: number;
  valorUnitario: number;
  fechaServicio: string;
  autorizacion?: Autorizacion;
}

export interface FacturaEjemplo {
  numero: string;
  ips: string;
  nitIps: string;
  fecha: string;
  paciente: { id: string; sexo: 'F' | 'M'; edad: number };
  diagnostico: { codigo: string; descripcion: string; descripcionEn: string };
  lineas: LineaFactura[];
}

const IPS_VALLE = { ips: 'IPS Clínica del Valle (demo)', nitIps: '900.000.101-0' };
const IPS_ANDES = { ips: 'Centro Médico Los Andes (demo)', nitIps: '900.000.102-8' };
const IPS_CARIBE = { ips: 'IPS Salud Integral Caribe (demo)', nitIps: '900.000.103-5' };

export const LOTE_EJEMPLO: FacturaEjemplo[] = [
  {
    numero: 'FEV-2026-0412',
    ...IPS_VALLE,
    fecha: '2026-09-02',
    paciente: { id: 'PAC-001', sexo: 'F', edad: 34 },
    diagnostico: { codigo: 'J18.9', descripcion: 'Neumonía, no especificada', descripcionEn: 'Pneumonia, unspecified' },
    lineas: [
      { id: 'L01', cups: '890701', cantidad: 1, valorUnitario: 56800, fechaServicio: '2026-09-01' },
      { id: 'L02', cups: '871121', cantidad: 1, valorUnitario: 54400, fechaServicio: '2026-09-01' },
      // 401: el hemograma tiene tarifa pactada de $21.000.
      { id: 'L03', cups: '902210', cantidad: 1, valorUnitario: 22800, fechaServicio: '2026-09-01' },
    ],
  },
  {
    numero: 'FEV-2026-0418',
    ...IPS_ANDES,
    fecha: '2026-09-03',
    paciente: { id: 'PAC-002', sexo: 'M', edad: 58 },
    diagnostico: { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)', descripcionEn: 'Essential (primary) hypertension' },
    lineas: [
      // +4,0 % sobre ISS 2004: glosa solo con tolerancia menor a 4 %.
      { id: 'L04', cups: '890301', cantidad: 1, valorUnitario: 37650, fechaServicio: '2026-09-02' },
      { id: 'L05', cups: '895100', cantidad: 1, valorUnitario: 31200, fechaServicio: '2026-09-02' },
      { id: 'L06', cups: '903818', cantidad: 1, valorUnitario: 8300, fechaServicio: '2026-09-02' },
      // +8 % sobre ISS 2004: glosa 102 con la tolerancia por defecto (5 %).
      { id: 'L07', cups: '903868', cantidad: 1, valorUnitario: 10800, fechaServicio: '2026-09-02' },
    ],
  },
  {
    numero: 'FEV-2026-0425',
    ...IPS_VALLE,
    fecha: '2026-09-04',
    paciente: { id: 'PAC-003', sexo: 'F', edad: 45 },
    diagnostico: {
      codigo: 'E11.9',
      descripcion: 'Diabetes mellitus tipo 2 sin mención de complicación',
      descripcionEn: 'Type 2 diabetes mellitus without complications',
    },
    lineas: [
      // 101: consulta especializada sin autorización.
      { id: 'L08', cups: '890202', cantidad: 1, valorUnitario: 62400, fechaServicio: '2026-09-03' },
      { id: 'L09', cups: '903426', cantidad: 1, valorUnitario: 33600, fechaServicio: '2026-09-03' },
      { id: 'L10', cups: '903841', cantidad: 1, valorUnitario: 7800, fechaServicio: '2026-09-03' },
    ],
  },
  {
    numero: 'FEV-2026-0431',
    ...IPS_ANDES,
    fecha: '2026-09-05',
    paciente: { id: 'PAC-004', sexo: 'M', edad: 41 },
    diagnostico: { codigo: 'R51', descripcion: 'Cefalea', descripcionEn: 'Headache' },
    lineas: [
      // 401: resonancia pactada en $610.000.
      {
        id: 'L11',
        cups: '883101',
        cantidad: 1,
        valorUnitario: 640000,
        fechaServicio: '2026-09-04',
        autorizacion: { numero: 'AUT-77120', fecha: '2026-08-28', vigencia: '2026-09-27', cantidadAutorizada: 1 },
      },
    ],
  },
  {
    numero: 'FEV-2026-0437',
    ...IPS_CARIBE,
    fecha: '2026-09-07',
    paciente: { id: 'PAC-005', sexo: 'M', edad: 29 },
    diagnostico: { codigo: 'R10.4', descripcion: 'Otros dolores abdominales y los no especificados', descripcionEn: 'Other and unspecified abdominal pain' },
    lineas: [
      { id: 'L12', cups: '890201', cantidad: 1, valorUnitario: 41800, fechaServicio: '2026-09-06' },
      // 301: ecografía obstétrica facturada a un paciente masculino.
      { id: 'L13', cups: '881431', cantidad: 1, valorUnitario: 78400, fechaServicio: '2026-09-06' },
    ],
  },
  {
    numero: 'FEV-2026-0442',
    ...IPS_VALLE,
    fecha: '2026-09-09',
    paciente: { id: 'PAC-006', sexo: 'F', edad: 63 },
    diagnostico: { codigo: 'M17.1', descripcion: 'Otras gonartrosis primarias', descripcionEn: 'Other primary osteoarthritis of knee' },
    lineas: [
      // 402: 12 sesiones facturadas, 10 autorizadas.
      {
        id: 'L14',
        cups: '931000',
        cantidad: 12,
        valorUnitario: 27000,
        fechaServicio: '2026-09-08',
        autorizacion: { numero: 'AUT-77344', fecha: '2026-08-10', vigencia: '2026-10-31', cantidadAutorizada: 10 },
      },
    ],
  },
  {
    numero: 'FEV-2026-0450',
    ...IPS_ANDES,
    fecha: '2026-09-10',
    paciente: { id: 'PAC-007', sexo: 'M', edad: 52 },
    diagnostico: { codigo: 'S06.0', descripcion: 'Concusión', descripcionEn: 'Concussion' },
    lineas: [
      // 202: autorización vencida el 31 de agosto.
      {
        id: 'L15',
        cups: '879111',
        cantidad: 1,
        valorUnitario: 198400,
        fechaServicio: '2026-09-09',
        autorizacion: { numero: 'AUT-77391', fecha: '2026-08-01', vigencia: '2026-08-31', cantidadAutorizada: 1 },
      },
      { id: 'L16', cups: '890701', cantidad: 1, valorUnitario: 56800, fechaServicio: '2026-09-09' },
    ],
  },
  {
    numero: 'FEV-2026-0456',
    ...IPS_CARIBE,
    fecha: '2026-09-11',
    paciente: { id: 'PAC-008', sexo: 'F', edad: 37 },
    diagnostico: { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado', descripcionEn: 'Urinary tract infection, site not specified' },
    lineas: [
      { id: 'L17', cups: '890201', cantidad: 1, valorUnitario: 41800, fechaServicio: '2026-09-10' },
      // +3,98 % sobre ISS 2004: glosa solo con tolerancia menor a 4 %.
      { id: 'L18', cups: '907106', cantidad: 1, valorUnitario: 11230, fechaServicio: '2026-09-10' },
      // 303: la misma consulta, mismo paciente y misma fecha, cobrada dos veces.
      { id: 'L19', cups: '890201', cantidad: 1, valorUnitario: 41800, fechaServicio: '2026-09-10' },
    ],
  },
  {
    numero: 'FEV-2026-0463',
    ...IPS_VALLE,
    fecha: '2026-09-14',
    paciente: { id: 'PAC-009', sexo: 'M', edad: 46 },
    diagnostico: { codigo: 'K80.2', descripcion: 'Cálculo de la vesícula biliar sin colecistitis', descripcionEn: 'Calculus of gallbladder without cholecystitis' },
    lineas: [
      { id: 'L20', cups: '881302', cantidad: 1, valorUnitario: 113600, fechaServicio: '2026-09-12' },
      // 201: código mal digitado (871121 → 871211), no existe en el catálogo.
      { id: 'L21', cups: '871211', cantidad: 1, valorUnitario: 54400, fechaServicio: '2026-09-12' },
    ],
  },
  {
    numero: 'FEV-2026-0470',
    ...IPS_ANDES,
    fecha: '2026-09-15',
    paciente: { id: 'PAC-010', sexo: 'F', edad: 71 },
    diagnostico: { codigo: 'I50.0', descripcion: 'Insuficiencia cardíaca congestiva', descripcionEn: 'Congestive heart failure' },
    lineas: [
      { id: 'L22', cups: '890302', cantidad: 1, valorUnitario: 52800, fechaServicio: '2026-09-14' },
      // +2,5 % sobre ISS 2004: glosa solo con tolerancia de 2 % o menos.
      { id: 'L23', cups: '895100', cantidad: 1, valorUnitario: 31980, fechaServicio: '2026-09-14' },
      { id: 'L24', cups: '903895', cantidad: 1, valorUnitario: 8900, fechaServicio: '2026-09-14' },
    ],
  },
  {
    numero: 'FEV-2026-0476',
    ...IPS_CARIBE,
    fecha: '2026-09-17',
    paciente: { id: 'PAC-011', sexo: 'F', edad: 26 },
    diagnostico: { codigo: 'Z34.0', descripcion: 'Supervisión de primer embarazo normal', descripcionEn: 'Supervision of normal first pregnancy' },
    lineas: [
      { id: 'L25', cups: '890301', cantidad: 1, valorUnitario: 36200, fechaServicio: '2026-09-16' },
      { id: 'L26', cups: '881431', cantidad: 1, valorUnitario: 78400, fechaServicio: '2026-09-16' },
      { id: 'L27', cups: '902210', cantidad: 1, valorUnitario: 21000, fechaServicio: '2026-09-16' },
    ],
  },
  {
    numero: 'FEV-2026-0481',
    ...IPS_VALLE,
    fecha: '2026-09-19',
    paciente: { id: 'PAC-012', sexo: 'M', edad: 39 },
    diagnostico: { codigo: 'F41.1', descripcion: 'Trastorno de ansiedad generalizada', descripcionEn: 'Generalized anxiety disorder' },
    lineas: [
      // +8,2 % sobre ISS 2004: glosa 102 con la tolerancia por defecto.
      { id: 'L28', cups: '890208', cantidad: 1, valorUnitario: 50200, fechaServicio: '2026-09-18' },
      // 202: autorización sin fecha de expedición.
      {
        id: 'L29',
        cups: '890202',
        cantidad: 1,
        valorUnitario: 62400,
        fechaServicio: '2026-09-18',
        autorizacion: { numero: 'AUT-77502', vigencia: '2026-10-15', cantidadAutorizada: 1 },
      },
    ],
  },
];
