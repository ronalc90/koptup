/**
 * Datos de ejemplo: archivo documental de una constructora ficticia de
 * Rionegro (Antioquia). Empresas, personas, NIT (con dígito de verificación
 * válido), valores y CUFE son inventados. Las fechas se escriben relativas a
 * hoy ({{d:-30}} = hace 30 días) y se calculan en el navegador.
 *
 * Los resúmenes, palabras clave y explicaciones están precalculados (no los
 * genera una IA en vivo); el texto de cada documento sí se usa de verdad para
 * buscar, detectar cláusulas, comparar versiones y descargar copias.
 */
import { addDays, fillDates, fmtCop } from './dates';
import { formatNit } from './util';
import type { DocItem, DocKind, Entity, EntityKind, Loc, OcrData, OcrField, RetentionMap, Stamp } from './types';

export const COMPANY = {
  name: 'Constructora Altos del Río S.A.S.',
  nit: '901482376',
  city: 'Rionegro, Antioquia',
};

/** Carpetas base de los datos de ejemplo (el nombre visible sale de messages). */
export const SAMPLE_FOLDERS = ['@contracts', '@invoices', '@minutes', '@licenses', '@hr', '@finance'] as const;

/** Política de retención inicial de cada carpeta (tiempos ilustrativos). */
export const SAMPLE_RETENTION: RetentionMap = {
  '@contracts': { policy: 'y10', hold: false },
  '@invoices': { policy: 'y10', hold: false },
  '@minutes': { policy: 'perm', hold: false },
  '@licenses': { policy: 'y10', hold: false },
  '@hr': { policy: 'perm', hold: false },
  '@finance': { policy: 'y5', hold: false },
};

const NIT = {
  altos: formatNit(COMPANY.nit),
  andinas: formatNit('900735218'),
  concretos: formatNit('901256049'),
  ferreteria: formatNit('830514927'),
  llanogrande: formatNit('901093615'),
  cordillera: formatNit('900418562'),
  ceiba: formatNit('901377204'),
  cumbre: formatNit('901518043'),
  andamios: formatNit('901604728'),
};

type L10n<T> = { es: T; en: T };

interface InvoiceDef {
  issuer: string;
  nit: string;
  number: string;
  dateOffset: number;
  lines: { concept: string; qty: number; unit: number }[];
  /** Confianza de lectura por campo (lo demás, 0,98). */
  lowConfidence?: Partial<Record<OcrField['key'], number>>;
}

interface SampleDef {
  id: string;
  name: string;
  kind: DocKind;
  sizeBytes: number;
  folder: (typeof SAMPLE_FOLDERS)[number];
  daysAgo: number;
  time: string;
  favorite?: boolean;
  deletedDaysAgo?: number;
  tags: L10n<string[]>;
  keywords: L10n<string[]>;
  summary: L10n<string>;
  explanation: L10n<string[]>;
  entities: [EntityKind, string][];
  text?: string;
  invoice?: InvoiceDef;
  versions?: { label: string; daysAgo: number; author: string; note: L10n<string>; text: string }[];
}

/* ------------------------- Textos de los documentos ------------------------- */

const OBRA_HEAD = `CONTRATO DE OBRA CIVIL No. CAR-OB-{{y:0}}-007
Contratante: ${COMPANY.name}, NIT ${NIT.altos}, con domicilio en Rionegro (Antioquia).
Contratista: Estructuras Andinas del Norte S.A.S., NIT ${NIT.andinas}, con domicilio en Medellín (Antioquia).`;

const OBRA_COMMON_END = `CLÁUSULA SÉPTIMA - GARANTÍAS. El contratista constituirá póliza de cumplimiento por el 20 % del valor del contrato, de salarios y prestaciones sociales por el 5 % y de estabilidad de la obra por el 20 % durante cinco años.
CLÁUSULA OCTAVA - TERMINACIÓN ANTICIPADA. El contratante podrá dar por terminado el contrato con un preaviso escrito de 30 días, pagando únicamente la obra ejecutada y recibida a satisfacción.
CLÁUSULA NOVENA - CONFIDENCIALIDAD. Las partes mantendrán en reserva los planos, presupuestos y demás información técnica y comercial del proyecto durante la ejecución y dos años más.
CLÁUSULA DÉCIMA - SOLUCIÓN DE CONTROVERSIAS. Las diferencias se intentarán resolver primero por arreglo directo y, si no hay acuerdo en 30 días, mediante conciliación en un centro de conciliación de Rionegro.`;

const OBRA_V1 = `${OBRA_HEAD}
Fecha del borrador: {{d:-260}}.

CLÁUSULA PRIMERA - OBJETO. El contratista ejecutará la estructura en concreto reforzado de la Torre B del proyecto Altos del Río, de 12 pisos y dos sótanos, según los planos y especificaciones aprobados.
CLÁUSULA SEGUNDA - VALOR. El valor total del contrato es de $1.280.000.000, incluido el AIU, pagaderos como se indica en la cláusula tercera.
CLÁUSULA TERCERA - FORMA DE PAGO. Un anticipo del 30 % a la firma del acta de inicio y pagos mensuales contra actas de avance de obra, dentro de los 45 días siguientes a la radicación de la factura electrónica.
CLÁUSULA CUARTA - PLAZO. El plazo de ejecución es de 12 meses contados desde la firma del acta de inicio.
CLÁUSULA QUINTA - MULTAS. Por cada día de retraso en los hitos del cronograma, el contratista pagará multas del 1 % del valor del hito.
CLÁUSULA SEXTA - CLÁUSULA PENAL. En caso de incumplimiento grave, el contratista pagará a título de pena una suma equivalente al 10 % del valor total del contrato.
${OBRA_COMMON_END}`;

const OBRA_V2 = `${OBRA_HEAD}
Fecha de firma: {{d:-236}}.

CLÁUSULA PRIMERA - OBJETO. El contratista ejecutará la estructura en concreto reforzado de la Torre B del proyecto Altos del Río, de 12 pisos y dos sótanos, según los planos y especificaciones aprobados.
CLÁUSULA SEGUNDA - VALOR. El valor total del contrato es de $1.280.000.000, incluido el AIU, pagaderos como se indica en la cláusula tercera.
CLÁUSULA TERCERA - FORMA DE PAGO. Un anticipo del 20 % a la firma del acta de inicio y pagos mensuales contra actas de avance de obra aprobadas por la interventoría, dentro de los 30 días siguientes a la radicación de la factura electrónica.
CLÁUSULA CUARTA - PLAZO. El plazo de ejecución es de 14 meses contados desde la firma del acta de inicio. Cualquier ampliación del plazo requiere otrosí firmado por las partes.
CLÁUSULA QUINTA - MULTAS. Por cada día de retraso injustificado en los hitos del cronograma, el contratista pagará multas del 0,5 % del valor del hito, sin que superen en total el 10 % del valor del contrato.
CLÁUSULA SEXTA - CLÁUSULA PENAL. En caso de incumplimiento grave, el contratista pagará a título de pena una suma equivalente al 20 % del valor total del contrato, sin perjuicio de la indemnización de perjuicios adicionales.
${OBRA_COMMON_END}`;

const SUMINISTRO = `CONTRATO DE SUMINISTRO DE CONCRETO PREMEZCLADO No. CAR-SU-{{y:0}}-003
Comprador: ${COMPANY.name}, NIT ${NIT.altos}.
Proveedor: Concretos Valle de San Nicolás S.A.S., NIT ${NIT.concretos}.
Fecha de firma: {{d:-198}}.

CLÁUSULA PRIMERA - OBJETO. El proveedor suministrará concreto premezclado de 3.000 y 4.000 psi, puesto en obra, para la Torre B del proyecto Altos del Río.
CLÁUSULA SEGUNDA - PRECIO. El metro cúbico de concreto de 3.000 psi cuesta $520.000 más IVA y el de 4.000 psi $585.000 más IVA. Los precios se ajustan cada año con el IPC.
CLÁUSULA TERCERA - FORMA DE PAGO. El comprador pagará cada factura electrónica dentro de los 60 días siguientes a su radicación.
CLÁUSULA CUARTA - VIGENCIA Y PRÓRROGA. El contrato tiene vigencia de un año y se prorrogará automáticamente por periodos iguales si ninguna de las partes avisa por escrito su intención de no renovarlo con 60 días de anticipación al vencimiento.
CLÁUSULA QUINTA - CLÁUSULA PENAL. El incumplimiento en las entregas programadas dará lugar a una pena del 10 % del valor de los pedidos incumplidos.
CLÁUSULA SEXTA - CALIDAD. Cada despacho incluye la remisión con la resistencia, el asentamiento y la hora de salida de planta; el comprador puede tomar cilindros de ensayo.`;

const ARRIENDO = `CONTRATO DE ARRENDAMIENTO DE BODEGA
Arrendador: Inversiones Llanogrande S.A.S., NIT ${NIT.llanogrande}.
Arrendatario: ${COMPANY.name}, NIT ${NIT.altos}.
Inmueble: bodega de 450 m2 en la zona industrial de Rionegro (Antioquia), para almacenar materiales y equipos de obra.
Fecha de firma: {{d:-420}}.

PRIMERA - CANON. El canon mensual es de $8.500.000 más IVA, pagadero dentro de los cinco primeros días de cada mes.
SEGUNDA - INCREMENTO. El canon se incrementará cada año en un porcentaje igual al IPC del año anterior más dos puntos.
TERCERA - DURACIÓN. El contrato tiene una duración de dos años y se prorrogará automáticamente por periodos iguales si ninguna de las partes da aviso con tres meses de anticipación.
CUARTA - TERMINACIÓN ANTICIPADA. Si el arrendatario termina el contrato antes del vencimiento, pagará una indemnización equivalente a tres cánones mensuales.
QUINTA - DEPÓSITO. El arrendatario entrega un depósito de dos cánones, que se devolverá al restituir la bodega en buen estado.`;

const NDA = `ACUERDO DE CONFIDENCIALIDAD
Partes: ${COMPANY.name}, NIT ${NIT.altos}, y Diseño Arquitectónico Ceiba S.A.S., NIT ${NIT.ceiba}.
Fecha: {{d:-300}}.

CLÁUSULA PRIMERA - INFORMACIÓN CONFIDENCIAL. Se considera confidencial toda la información de diseños, planos, presupuestos, listas de precios y datos de clientes que una parte entregue a la otra.
CLÁUSULA SEGUNDA - OBLIGACIONES. La parte receptora usará la información solo para el diseño de la Torre B y la mantendrá en reserva durante cinco años desde su entrega.
CLÁUSULA TERCERA - INDEMNIDAD. La parte que incumpla responderá por todo daño directo e indirecto causado a la otra parte, sin límite de cuantía.
CLÁUSULA CUARTA - DEVOLUCIÓN. Al terminar la relación, la parte receptora devolverá o destruirá la información y lo certificará por escrito.`;

const COMITE = `ACTA DE COMITÉ DE OBRA No. 14
Proyecto: Torre B - Altos del Río. Fecha: {{d:-9}}. Lugar: oficina de obra, Rionegro.
Asistentes: Laura Méndez Ríos (ingeniera residente), Carlos Andrés Restrepo (gerente de proyecto), Óscar Giraldo (interventoría) y Mónica Salazar (Estructuras Andinas del Norte).

1. Avance. La obra va en 62 % frente a 65 % programado. El atraso se debe a las lluvias de las últimas tres semanas.
2. Concreto. Se vaciaron 45 m3 de la placa del piso 8; los cilindros de ensayo a 7 días cumplen la resistencia esperada.
3. Riesgos. Si el atraso supera 10 días se aplicarían multas al contratista según la cláusula quinta del contrato de obra; el contratista presentará un plan de recuperación.
4. Compromisos. Estructuras Andinas entrega el plan de recuperación el {{d:-4}}; la interventoría revisa la póliza de estabilidad; compras confirma el pedido de varilla para el piso 9.
Próximo comité: {{d:5}}.`;

const JUNTA = `ACTA DE JUNTA DIRECTIVA No. 31
${COMPANY.name}, NIT ${NIT.altos}. Fecha: {{d:-20}}. Reunión ordinaria con quórum completo.

1. Presupuesto {{y:1}}. La junta aprueba por unanimidad el presupuesto de inversión para {{y:1}} por $4.850.000.000, de los cuales $3.900.000.000 corresponden a la terminación de la Torre B.
2. Crédito constructor. Se autoriza al gerente a gestionar un crédito constructor de hasta $2.000.000.000 con la entidad financiera que ofrezca la mejor tasa.
3. Seguros. Se pide renovar la póliza todo riesgo construcción antes de su vencimiento.
4. Varios. Se aprueba contratar una auditoría de seguridad y salud en el trabajo para el primer trimestre de {{y:1}}.`;

const NOTAS = `Visita de interventoría - Torre B - {{d:-2}}
- Se revisó el refuerzo de columnas del piso 9: cumple los planos estructurales.
- Pendiente: certificado de calibración de la báscula de agregados.
- Se recomienda proteger la formaleta con lona por la temporada de lluvias.
- Próxima visita: {{d:5}}.
Responsable: Óscar Giraldo, interventoría.`;

const LICENCIA = `LICENCIA DE CONSTRUCCIÓN - MODALIDAD OBRA NUEVA
Titular: ${COMPANY.name}, NIT ${NIT.altos}.
Proyecto: Torre B - Altos del Río, 12 pisos y 2 sótanos, 96 unidades de vivienda.
Expedida por: curaduría urbana del municipio (datos de ejemplo).
Fecha de ejecutoria: {{d:-410}}.
Vigencia: 36 meses contados desde la ejecutoria, prorrogables por una sola vez por 12 meses. Vence el {{d:685}}.
Condiciones: mantener la valla informativa en la obra, cumplir el plan de manejo ambiental y tramitar el permiso de ocupación al terminar.`;

const POLIZA = `PÓLIZA DE SEGURO DE CUMPLIMIENTO No. SC-55-{{y:0}}-01872
Aseguradora: Seguros Cordillera S.A., NIT ${NIT.cordillera} (datos de ejemplo).
Tomador: Estructuras Andinas del Norte S.A.S., NIT ${NIT.andinas}.
Asegurado y beneficiario: ${COMPANY.name}, NIT ${NIT.altos}.
Contrato garantizado: contrato de obra civil No. CAR-OB-{{y:0}}-007.
Amparos:
- Cumplimiento: $256.000.000 (20 % del valor del contrato), vigente hasta el {{d:310}}.
- Salarios y prestaciones sociales: $64.000.000 (5 %), vigente hasta el {{d:1270}}.
- Estabilidad de la obra: $256.000.000 (20 %), por cinco años desde el recibo de la obra.
Prima: $9.870.000 más IVA.`;

const HOJA_VIDA = `HOJA DE VIDA
Laura Méndez Ríos - Ingeniera civil
Ciudad: Rionegro (Antioquia). Correo: laura.mendez@correo.example
Perfil: ingeniera civil con 9 años de experiencia en dirección de obra de vivienda en altura, control de presupuesto y programación.
Experiencia:
- {{y:-2}} a hoy: ingeniera residente en ${COMPANY.name}, Torres A y B.
- {{y:-6}} a {{y:-2}}: residente de estructura en una constructora de Medellín (vivienda VIS y No VIS).
- {{y:-9}} a {{y:-6}}: auxiliar de interventoría en obras de infraestructura vial.
Formación: ingeniería civil y especialización en gerencia de proyectos.
Competencias: control de presupuesto de obra, programación con ruta crítica, seguridad y salud en el trabajo y manejo de contratistas.`;

const LABORAL = `CONTRATO INDIVIDUAL DE TRABAJO POR OBRA O LABOR
Empleador: ${COMPANY.name}, NIT ${NIT.altos}.
Trabajador: Jhon Fredy Cardona Álzate, maestro de obra.
Fecha de inicio: {{d:-150}}.

PRIMERA - OBJETO. El trabajador se desempeñará como maestro de obra en la estructura de la Torre B del proyecto Altos del Río.
SEGUNDA - DURACIÓN. El contrato dura lo que dure la obra o labor contratada, es decir, hasta la terminación de la estructura de la Torre B.
TERCERA - SALARIO. El salario mensual es de $3.200.000, pagadero por quincenas vencidas, más las prestaciones sociales de ley.
CUARTA - JORNADA. La jornada es la máxima legal vigente, de lunes a sábado, con los descansos de ley.
QUINTA - CONFIDENCIALIDAD. El trabajador guardará reserva sobre los planos y la información de la empresa.`;

const PRESUPUESTO = `Capítulo,Descripción,Valor (COP)
1,Preliminares y movimiento de tierras,185000000
2,Cimentación,640000000
3,Estructura en concreto,1280000000
4,Mampostería y pañetes,410000000
5,Instalaciones hidrosanitarias,265000000
6,Instalaciones eléctricas,240000000
7,Acabados,720000000
8,Equipos especiales (ascensores),360000000
Total,,4100000000`;

const ANDAMIOS = `COTIZACIÓN No. 2214 (borrador)
Andamios y Formaletas del Oriente S.A.S., NIT ${NIT.andamios}.
Cliente: ${COMPANY.name}.
Alquiler de andamio certificado para fachada de la Torre B: 1.200 m2 por 4 meses a $3.900 por m2 al mes, más IVA.
Validez de la oferta: 30 días. Documento reemplazado por la cotización definitiva.`;

/* ------------------------------ Definiciones ------------------------------ */

const DEFS: SampleDef[] = [
  {
    id: 's-obra',
    name: 'Contrato de obra Torre B - Estructuras Andinas.pdf',
    kind: 'pdf',
    sizeBytes: 864_512,
    folder: '@contracts',
    daysAgo: 236,
    time: '10:24:00',
    favorite: true,
    tags: { es: ['contrato', 'obra', 'Torre B'], en: ['contract', 'construction', 'Tower B'] },
    keywords: {
      es: ['estructura en concreto', 'anticipo 20 %', 'cláusula penal 20 %', 'póliza de cumplimiento', 'plazo 14 meses'],
      en: ['reinforced concrete structure', '20% advance', '20% penalty clause', 'performance bond', '14-month term'],
    },
    summary: {
      es: 'Contrato de obra civil por $1.280.000.000 con Estructuras Andinas del Norte para la estructura de la Torre B: 14 meses de plazo, anticipo del 20 %, multas con tope del 10 % y cláusula penal del 20 %.',
      en: 'Civil works contract for COP 1,280,000,000 with Estructuras Andinas del Norte for the Tower B structure: 14-month term, 20% advance, fines capped at 10% and a 20% penalty clause.',
    },
    explanation: {
      es: [
        'Qué es: el contrato firmado (versión 2) para construir la estructura en concreto de la Torre B.',
        'Puntos clave: valor de $1.280.000.000 con AIU, pagos a 30 días contra actas aprobadas por la interventoría, multas del 0,5 % diario con tope del 10 % y cláusula penal del 20 %.',
        'Qué revisar: la versión 2 subió la cláusula penal del 10 % al 20 % y el plazo de 12 a 14 meses; compárala con el borrador.',
        'Para quién: gerencia de proyecto, jurídica y la interventoría.',
      ],
      en: [
        'What it is: the signed contract (version 2) to build the Tower B concrete structure.',
        'Key points: COP 1,280,000,000 including AIU, payments within 30 days against progress reports approved by the inspector, fines of 0.5% per day capped at 10%, and a 20% penalty clause.',
        'What to check: version 2 raised the penalty clause from 10% to 20% and the term from 12 to 14 months; compare it with the draft.',
        'Who it is for: project management, legal and the site inspector.',
      ],
    },
    entities: [
      ['party', 'Estructuras Andinas del Norte S.A.S.'],
      ['nit', NIT.andinas],
      ['value', '$1.280.000.000'],
      ['date', '{{d:-236}}'],
      ['term', '14 meses'],
      ['city', 'Rionegro (Antioquia)'],
    ],
    text: OBRA_V2,
    versions: [
      {
        label: 'v1',
        daysAgo: 260,
        author: 'Estructuras Andinas del Norte',
        note: { es: 'Borrador enviado por el contratista', en: 'Draft sent by the contractor' },
        text: OBRA_V1,
      },
      {
        label: 'v2',
        daysAgo: 236,
        author: 'Jurídica Altos del Río',
        note: { es: 'Versión negociada y firmada', en: 'Negotiated and signed version' },
        text: OBRA_V2,
      },
    ],
  },
  {
    id: 's-suministro',
    name: 'Contrato de suministro de concreto - Concretos Valle.pdf',
    kind: 'pdf',
    sizeBytes: 412_160,
    folder: '@contracts',
    daysAgo: 198,
    time: '15:02:00',
    tags: { es: ['contrato', 'suministro', 'concreto'], en: ['contract', 'supply', 'concrete'] },
    keywords: {
      es: ['concreto premezclado', 'prórroga automática', 'pago a 60 días', 'ajuste IPC'],
      en: ['ready-mix concrete', 'automatic renewal', '60-day payment', 'CPI adjustment'],
    },
    summary: {
      es: 'Suministro de concreto de 3.000 y 4.000 psi para la Torre B a $520.000 y $585.000 por m3 más IVA. Pago a 60 días y prórroga automática anual salvo aviso con 60 días de anticipación.',
      en: 'Supply of 3,000 and 4,000 psi concrete for Tower B at COP 520,000 and 585,000 per m3 plus VAT. 60-day payment and automatic yearly renewal unless notice is given 60 days in advance.',
    },
    explanation: {
      es: [
        'Qué es: el contrato marco con el proveedor de concreto de la obra.',
        'Puntos clave: precios por metro cúbico ajustables con el IPC, pago a 60 días y pena del 10 % por entregas incumplidas.',
        'Qué revisar: se renueva solo cada año; si no quieres renovarlo, hay que avisar 60 días antes del vencimiento.',
        'Para quién: compras, tesorería y la dirección de obra.',
      ],
      en: [
        'What it is: the framework contract with the site’s concrete supplier.',
        'Key points: prices per cubic meter adjusted by CPI, 60-day payment and a 10% penalty for missed deliveries.',
        'What to check: it renews automatically every year; to stop it you must give notice 60 days before it expires.',
        'Who it is for: purchasing, treasury and site management.',
      ],
    },
    entities: [
      ['party', 'Concretos Valle de San Nicolás S.A.S.'],
      ['nit', NIT.concretos],
      ['value', '$585.000 / m3'],
      ['date', '{{d:-198}}'],
      ['term', '1 año, prorrogable'],
    ],
    text: SUMINISTRO,
  },
  {
    id: 's-arriendo',
    name: 'Contrato de arrendamiento bodega Rionegro.docx',
    kind: 'docx',
    sizeBytes: 58_880,
    folder: '@contracts',
    daysAgo: 420,
    time: '11:40:00',
    tags: { es: ['contrato', 'arrendamiento', 'bodega'], en: ['contract', 'lease', 'warehouse'] },
    keywords: {
      es: ['canon $8.500.000', 'IPC + 2 puntos', 'prórroga automática', 'indemnización de 3 cánones'],
      en: ['COP 8,500,000 rent', 'CPI + 2 points', 'automatic renewal', '3-month early exit fee'],
    },
    summary: {
      es: 'Arriendo de una bodega de 450 m2 en Rionegro por $8.500.000 al mes más IVA, con incremento anual de IPC más dos puntos, prórroga automática y una indemnización de tres cánones si se termina antes.',
      en: 'Lease of a 450 m2 warehouse in Rionegro for COP 8,500,000 a month plus VAT, with a yearly CPI + 2 points increase, automatic renewal and a three-month fee for early termination.',
    },
    explanation: {
      es: [
        'Qué es: el contrato de la bodega donde se guardan materiales y equipos de la obra.',
        'Puntos clave: canon mensual de $8.500.000 más IVA, depósito de dos cánones y duración de dos años.',
        'Qué revisar: se prorroga sola si nadie avisa con tres meses de anticipación, y salir antes cuesta tres cánones.',
        'Para quién: administración y compras.',
      ],
      en: [
        'What it is: the lease for the warehouse that stores site materials and equipment.',
        'Key points: monthly rent of COP 8,500,000 plus VAT, a two-month deposit and a two-year term.',
        'What to check: it renews by itself unless notice is given three months ahead, and leaving early costs three months of rent.',
        'Who it is for: administration and purchasing.',
      ],
    },
    entities: [
      ['party', 'Inversiones Llanogrande S.A.S.'],
      ['nit', NIT.llanogrande],
      ['value', '$8.500.000 / mes'],
      ['date', '{{d:-420}}'],
      ['term', '2 años, prorrogable'],
      ['city', 'Rionegro (Antioquia)'],
    ],
    text: ARRIENDO,
  },
  {
    id: 's-nda',
    name: 'Acuerdo de confidencialidad - Diseño Ceiba.docx',
    kind: 'docx',
    sizeBytes: 36_352,
    folder: '@contracts',
    daysAgo: 300,
    time: '09:15:00',
    tags: { es: ['confidencialidad', 'diseño'], en: ['NDA', 'design'] },
    keywords: {
      es: ['información confidencial', 'reserva de cinco años', 'indemnidad sin límite'],
      en: ['confidential information', 'five-year secrecy', 'unlimited indemnity'],
    },
    summary: {
      es: 'Acuerdo de confidencialidad con Diseño Arquitectónico Ceiba sobre planos, presupuestos y datos de clientes: reserva por cinco años e indemnidad sin límite de cuantía.',
      en: 'Confidentiality agreement with Diseño Arquitectónico Ceiba covering plans, budgets and customer data: five years of secrecy and indemnity with no cap.',
    },
    explanation: {
      es: [
        'Qué es: el acuerdo que protege la información compartida con la firma de diseño.',
        'Puntos clave: cubre diseños, planos, presupuestos y datos de clientes durante cinco años.',
        'Qué revisar: la indemnidad es sin límite de cuantía, algo que conviene negociar.',
        'Para quién: jurídica y el equipo de diseño.',
      ],
      en: [
        'What it is: the agreement that protects the information shared with the design firm.',
        'Key points: it covers designs, plans, budgets and customer data for five years.',
        'What to check: the indemnity has no cap, which is worth negotiating.',
        'Who it is for: legal and the design team.',
      ],
    },
    entities: [
      ['party', 'Diseño Arquitectónico Ceiba S.A.S.'],
      ['nit', NIT.ceiba],
      ['date', '{{d:-300}}'],
      ['term', '5 años'],
    ],
    text: NDA,
  },
  {
    id: 's-fac-ferreteria',
    name: 'Factura FE-20931 Ferretería El Retiro (escaneada).pdf',
    kind: 'pdf',
    sizeBytes: 1_236_992,
    folder: '@invoices',
    daysAgo: 12,
    time: '08:51:00',
    tags: { es: ['factura', 'materiales', 'escaneada'], en: ['invoice', 'materials', 'scanned'] },
    keywords: {
      es: ['cemento gris', 'varilla corrugada', 'IVA 19 %'],
      en: ['grey cement', 'rebar', '19% VAT'],
    },
    summary: {
      es: 'Factura escaneada de Ferretería y Suministros El Retiro por cemento, varilla y alambre para la Torre B. Total $27.738.900 con IVA del 19 %.',
      en: 'Scanned invoice from Ferretería y Suministros El Retiro for cement, rebar and wire for Tower B. Total COP 27,738,900 including 19% VAT.',
    },
    explanation: {
      es: [
        'Qué es: una factura de materiales recibida en papel y digitalizada.',
        'Puntos clave: 300 bultos de cemento, 420 varillas de 1/2" y 150 kg de alambre; subtotal $23.310.000 más IVA.',
        'Qué revisar: confirma que las cantidades coinciden con la remisión de entrada al almacén.',
        'Para quién: contabilidad y compras.',
      ],
      en: [
        'What it is: a materials invoice received on paper and scanned.',
        'Key points: 300 bags of cement, 420 half-inch rebars and 150 kg of wire; subtotal COP 23,310,000 plus VAT.',
        'What to check: confirm the quantities match the warehouse receiving note.',
        'Who it is for: accounting and purchasing.',
      ],
    },
    entities: [
      ['party', 'Ferretería y Suministros El Retiro S.A.S.'],
      ['nit', NIT.ferreteria],
      ['reference', 'FE-20931'],
      ['value', '$27.738.900'],
      ['date', '{{d:-12}}'],
    ],
    invoice: {
      issuer: 'Ferretería y Suministros El Retiro S.A.S.',
      nit: NIT.ferreteria,
      number: 'FE-20931',
      dateOffset: -12,
      lines: [
        { concept: 'Cemento gris de uso general, bulto 50 kg', qty: 300, unit: 32_900 },
        { concept: 'Varilla corrugada 1/2" x 6 m', qty: 420, unit: 28_500 },
        { concept: 'Alambre negro calibre 18 (kg)', qty: 150, unit: 9_800 },
      ],
      lowConfidence: { cufe: 0.84 },
    },
  },
  {
    id: 's-fac-concreto',
    name: 'Factura CV-4417 Concretos Valle (escaneada).pdf',
    kind: 'pdf',
    sizeBytes: 984_064,
    folder: '@invoices',
    daysAgo: 21,
    time: '16:33:00',
    tags: { es: ['factura', 'concreto', 'escaneada'], en: ['invoice', 'concrete', 'scanned'] },
    keywords: {
      es: ['concreto 4.000 psi', 'bombeo', 'IVA 19 %'],
      en: ['4,000 psi concrete', 'pumping', '19% VAT'],
    },
    summary: {
      es: 'Factura escaneada de Concretos Valle de San Nicolás por 45 m3 de concreto de 4.000 psi y su bombeo para la placa del piso 8. Total $33.361.650.',
      en: 'Scanned invoice from Concretos Valle de San Nicolás for 45 m3 of 4,000 psi concrete and pumping for the 8th-floor slab. Total COP 33,361,650.',
    },
    explanation: {
      es: [
        'Qué es: la factura del concreto vaciado en la placa del piso 8.',
        'Puntos clave: 45 m3 a $585.000, el precio pactado en el contrato de suministro, más $38.000 por m3 de bombeo.',
        'Qué revisar: el contrato de suministro da 60 días para pagarla desde su radicación.',
        'Para quién: contabilidad y tesorería.',
      ],
      en: [
        'What it is: the invoice for the concrete poured on the 8th-floor slab.',
        'Key points: 45 m3 at COP 585,000, the price agreed in the supply contract, plus COP 38,000 per m3 for pumping.',
        'What to check: the supply contract allows 60 days to pay it from filing.',
        'Who it is for: accounting and treasury.',
      ],
    },
    entities: [
      ['party', 'Concretos Valle de San Nicolás S.A.S.'],
      ['nit', NIT.concretos],
      ['reference', 'CV-4417'],
      ['value', '$33.361.650'],
      ['date', '{{d:-21}}'],
    ],
    invoice: {
      issuer: 'Concretos Valle de San Nicolás S.A.S.',
      nit: NIT.concretos,
      number: 'CV-4417',
      dateOffset: -21,
      lines: [
        { concept: 'Concreto premezclado 4.000 psi (m3)', qty: 45, unit: 585_000 },
        { concept: 'Servicio de bombeo (m3)', qty: 45, unit: 38_000 },
      ],
      lowConfidence: { cufe: 0.81, date: 0.88 },
    },
  },
  {
    id: 's-fac-equipos',
    name: 'Factura AEC-1186 Equipos Cumbre (escaneada).pdf',
    kind: 'pdf',
    sizeBytes: 1_105_920,
    folder: '@invoices',
    daysAgo: 5,
    time: '10:05:00',
    tags: { es: ['factura', 'equipos', 'escaneada'], en: ['invoice', 'equipment', 'scanned'] },
    keywords: {
      es: ['alquiler torre grúa', 'formaleta metálica', 'IVA 19 %'],
      en: ['tower crane rental', 'steel formwork', '19% VAT'],
    },
    summary: {
      es: 'Factura escaneada de Alquiler de Equipos Cumbre por un mes de torre grúa, formaleta para placa y transporte. Total $26.620.300.',
      en: 'Scanned invoice from Alquiler de Equipos Cumbre for one month of tower crane, slab formwork and transport. Total COP 26,620,300.',
    },
    explanation: {
      es: [
        'Qué es: la factura mensual del alquiler de equipos de la obra.',
        'Puntos clave: torre grúa por $18.500.000, 600 m2 de formaleta y transporte con montaje.',
        'Qué revisar: el periodo facturado debe coincidir con el reporte de equipos en obra.',
        'Para quién: contabilidad y la dirección de obra.',
      ],
      en: [
        'What it is: the monthly invoice for site equipment rental.',
        'Key points: tower crane for COP 18,500,000, 600 m2 of formwork, and transport with assembly.',
        'What to check: the billed period should match the on-site equipment report.',
        'Who it is for: accounting and site management.',
      ],
    },
    entities: [
      ['party', 'Alquiler de Equipos Cumbre S.A.S.'],
      ['nit', NIT.cumbre],
      ['reference', 'AEC-1186'],
      ['value', '$26.620.300'],
      ['date', '{{d:-5}}'],
    ],
    invoice: {
      issuer: 'Alquiler de Equipos Cumbre S.A.S.',
      nit: NIT.cumbre,
      number: 'AEC-1186',
      dateOffset: -5,
      lines: [
        { concept: 'Alquiler torre grúa (mes)', qty: 1, unit: 18_500_000 },
        { concept: 'Formaleta metálica para placa (m2 por mes)', qty: 600, unit: 4_200 },
        { concept: 'Transporte y montaje', qty: 1, unit: 1_350_000 },
      ],
      lowConfidence: { cufe: 0.86, total: 0.89 },
    },
  },
  {
    id: 's-comite',
    name: 'Acta de comité de obra No. 14.docx',
    kind: 'docx',
    sizeBytes: 44_032,
    folder: '@minutes',
    daysAgo: 9,
    time: '17:10:00',
    tags: { es: ['acta', 'comité de obra', 'avance'], en: ['minutes', 'site meeting', 'progress'] },
    keywords: {
      es: ['avance 62 %', 'atraso por lluvias', 'plan de recuperación', 'multas'],
      en: ['62% progress', 'rain delay', 'recovery plan', 'fines'],
    },
    summary: {
      es: 'Comité de obra No. 14: la Torre B va en 62 % frente a 65 % programado por las lluvias. El contratista entregará un plan de recuperación y se revisa la póliza de estabilidad.',
      en: 'Site meeting No. 14: Tower B is at 62% against 65% planned because of rain. The contractor will deliver a recovery plan and the stability bond is under review.',
    },
    explanation: {
      es: [
        'Qué es: el acta de la reunión semanal de seguimiento de la obra.',
        'Puntos clave: atraso de tres puntos por lluvias, concreto del piso 8 con resistencia conforme y riesgo de multas si el atraso pasa de 10 días.',
        'Compromisos: plan de recuperación del contratista, revisión de la póliza y pedido de varilla para el piso 9.',
        'Para quién: gerencia de proyecto, interventoría y contratistas.',
      ],
      en: [
        'What it is: the minutes of the weekly site follow-up meeting.',
        'Key points: three points behind schedule due to rain, 8th-floor concrete meets strength, and risk of fines if the delay exceeds 10 days.',
        'Action items: contractor recovery plan, bond review and rebar order for the 9th floor.',
        'Who it is for: project management, inspector and contractors.',
      ],
    },
    entities: [
      ['person', 'Laura Méndez Ríos'],
      ['person', 'Carlos Andrés Restrepo'],
      ['party', 'Estructuras Andinas del Norte S.A.S.'],
      ['date', '{{d:-9}}'],
    ],
    text: COMITE,
  },
  {
    id: 's-junta',
    name: 'Acta de junta directiva No. 31 - presupuesto {{y:1}}.docx',
    kind: 'docx',
    sizeBytes: 51_200,
    folder: '@minutes',
    daysAgo: 20,
    time: '18:45:00',
    tags: { es: ['acta', 'junta directiva', 'presupuesto'], en: ['minutes', 'board', 'budget'] },
    keywords: {
      es: ['presupuesto de inversión', 'crédito constructor', 'póliza todo riesgo'],
      en: ['investment budget', 'construction loan', 'all-risk policy'],
    },
    summary: {
      es: 'La junta directiva aprobó el presupuesto de inversión del próximo año por $4.850.000.000 y autorizó gestionar un crédito constructor de hasta $2.000.000.000.',
      en: 'The board approved next year’s investment budget of COP 4,850,000,000 and authorized seeking a construction loan of up to COP 2,000,000,000.',
    },
    explanation: {
      es: [
        'Qué es: el acta de la junta directiva que aprobó el presupuesto del próximo año.',
        'Puntos clave: $3.900.000.000 del presupuesto van a terminar la Torre B y se autoriza un crédito constructor.',
        'Pendientes: renovar la póliza todo riesgo y contratar una auditoría de seguridad y salud en el trabajo.',
        'Para quién: gerencia, finanzas y revisoría.',
      ],
      en: [
        'What it is: the board minutes that approved next year’s budget.',
        'Key points: COP 3,900,000,000 of the budget goes to finishing Tower B, and a construction loan is authorized.',
        'Follow-ups: renew the all-risk policy and hire an occupational health and safety audit.',
        'Who it is for: management, finance and the statutory auditor.',
      ],
    },
    entities: [
      ['party', COMPANY.name],
      ['value', '$4.850.000.000'],
      ['value', '$2.000.000.000'],
      ['date', '{{d:-20}}'],
    ],
    text: JUNTA,
  },
  {
    id: 's-notas',
    name: 'Notas de visita de interventoría.txt',
    kind: 'txt',
    sizeBytes: 612,
    folder: '@minutes',
    daysAgo: 2,
    time: '12:20:00',
    tags: { es: ['interventoría', 'visita'], en: ['inspection', 'site visit'] },
    keywords: {
      es: ['refuerzo de columnas', 'calibración', 'temporada de lluvias'],
      en: ['column reinforcement', 'calibration', 'rainy season'],
    },
    summary: {
      es: 'Notas de la última visita de interventoría: el refuerzo de columnas del piso 9 cumple, falta el certificado de calibración de la báscula y se pide proteger la formaleta de la lluvia.',
      en: 'Notes from the latest inspection visit: the 9th-floor column reinforcement complies, the scale calibration certificate is pending, and formwork should be protected from rain.',
    },
    explanation: {
      es: [
        'Qué es: notas rápidas de la visita de la interventoría a la obra.',
        'Puntos clave: refuerzo conforme y un pendiente documental (calibración de la báscula).',
        'Para quién: la dirección de obra.',
      ],
      en: [
        'What it is: quick notes from the inspector’s site visit.',
        'Key points: compliant reinforcement and one pending document (scale calibration).',
        'Who it is for: site management.',
      ],
    },
    entities: [
      ['person', 'Óscar Giraldo'],
      ['role', 'Interventoría'],
      ['date', '{{d:-2}}'],
    ],
    text: NOTAS,
  },
  {
    id: 's-licencia',
    name: 'Licencia de construcción Torre B.pdf',
    kind: 'pdf',
    sizeBytes: 702_464,
    folder: '@licenses',
    daysAgo: 410,
    time: '14:00:00',
    tags: { es: ['licencia', 'Torre B', 'vencimiento'], en: ['permit', 'Tower B', 'expiry'] },
    keywords: {
      es: ['obra nueva', 'vigencia 36 meses', 'prórroga de 12 meses'],
      en: ['new construction', '36-month validity', '12-month extension'],
    },
    summary: {
      es: 'Licencia de construcción en modalidad obra nueva para la Torre B (12 pisos, 96 viviendas). Vigencia de 36 meses desde la ejecutoria, prorrogable una vez por 12 meses.',
      en: 'New-construction building permit for Tower B (12 floors, 96 homes). Valid for 36 months from its effective date, extendable once for 12 months.',
    },
    explanation: {
      es: [
        'Qué es: el permiso para construir la Torre B.',
        'Puntos clave: vence en 36 meses desde la ejecutoria y se puede prorrogar una sola vez por 12 meses.',
        'Qué revisar: pide la prórroga con tiempo si la obra no termina antes del vencimiento.',
        'Para quién: gerencia de proyecto y jurídica.',
      ],
      en: [
        'What it is: the permit to build Tower B.',
        'Key points: it expires 36 months after its effective date and can be extended once for 12 months.',
        'What to check: request the extension in time if the works will not finish before it expires.',
        'Who it is for: project management and legal.',
      ],
    },
    entities: [
      ['party', COMPANY.name],
      ['date', '{{d:-410}}'],
      ['date', '{{d:685}}'],
      ['term', '36 meses'],
    ],
    text: LICENCIA,
  },
  {
    id: 's-poliza',
    name: 'Póliza de cumplimiento contrato de obra.pdf',
    kind: 'pdf',
    sizeBytes: 356_352,
    folder: '@licenses',
    daysAgo: 230,
    time: '11:12:00',
    favorite: true,
    tags: { es: ['póliza', 'cumplimiento', 'seguros'], en: ['bond', 'performance', 'insurance'] },
    keywords: {
      es: ['amparo de cumplimiento', 'salarios y prestaciones', 'estabilidad de la obra'],
      en: ['performance coverage', 'wages and benefits', 'works stability'],
    },
    summary: {
      es: 'Póliza de cumplimiento del contrato de obra: cumplimiento por $256.000.000, salarios y prestaciones por $64.000.000 y estabilidad de la obra por cinco años.',
      en: 'Performance bond for the works contract: performance for COP 256,000,000, wages and benefits for COP 64,000,000, and works stability for five years.',
    },
    explanation: {
      es: [
        'Qué es: la garantía que respalda el contrato de obra de la Torre B.',
        'Puntos clave: tres amparos (cumplimiento, salarios y prestaciones, estabilidad) con sus valores y vigencias.',
        'Qué revisar: la vigencia del amparo de cumplimiento debe cubrir el plazo del contrato más cualquier otrosí.',
        'Para quién: jurídica y la interventoría.',
      ],
      en: [
        'What it is: the bond that backs the Tower B works contract.',
        'Key points: three coverages (performance, wages and benefits, stability) with their amounts and validity.',
        'What to check: the performance coverage must last as long as the contract plus any amendment.',
        'Who it is for: legal and the site inspector.',
      ],
    },
    entities: [
      ['party', 'Seguros Cordillera S.A.'],
      ['nit', NIT.cordillera],
      ['value', '$256.000.000'],
      ['date', '{{d:310}}'],
    ],
    text: POLIZA,
  },
  {
    id: 's-hv',
    name: 'Hoja de vida - Laura Méndez (ingeniera residente).pdf',
    kind: 'pdf',
    sizeBytes: 228_352,
    folder: '@hr',
    daysAgo: 480,
    time: '09:30:00',
    tags: { es: ['hoja de vida', 'ingeniería'], en: ['résumé', 'engineering'] },
    keywords: {
      es: ['ingeniera civil', '9 años de experiencia', 'dirección de obra'],
      en: ['civil engineer', '9 years of experience', 'site management'],
    },
    summary: {
      es: 'Hoja de vida de Laura Méndez Ríos, ingeniera civil con 9 años de experiencia en dirección de obra de vivienda en altura; hoy es la ingeniera residente de la Torre B.',
      en: 'Résumé of Laura Méndez Ríos, a civil engineer with 9 years of experience managing high-rise housing sites; she is now the Tower B resident engineer.',
    },
    explanation: {
      es: [
        'Qué es: la hoja de vida de la ingeniera residente del proyecto.',
        'Puntos clave: experiencia en estructura, interventoría y control de presupuesto; especialización en gerencia de proyectos.',
        'Para quién: talento humano y la gerencia de proyecto.',
      ],
      en: [
        'What it is: the résumé of the project’s resident engineer.',
        'Key points: experience in structures, inspection and budget control; a specialization in project management.',
        'Who it is for: HR and project management.',
      ],
    },
    entities: [
      ['person', 'Laura Méndez Ríos'],
      ['role', 'Ingeniera residente'],
      ['city', 'Rionegro (Antioquia)'],
    ],
    text: HOJA_VIDA,
  },
  {
    id: 's-laboral',
    name: 'Contrato laboral por obra - maestro de obra.docx',
    kind: 'docx',
    sizeBytes: 47_104,
    folder: '@hr',
    daysAgo: 150,
    time: '07:45:00',
    tags: { es: ['contrato laboral', 'personal de obra'], en: ['employment contract', 'site staff'] },
    keywords: {
      es: ['obra o labor', 'salario $3.200.000', 'maestro de obra'],
      en: ['fixed-task contract', 'COP 3,200,000 salary', 'site foreman'],
    },
    summary: {
      es: 'Contrato por obra o labor del maestro de obra de la estructura de la Torre B, con salario mensual de $3.200.000 más prestaciones de ley.',
      en: 'Fixed-task employment contract for the Tower B structure foreman, with a monthly salary of COP 3,200,000 plus statutory benefits.',
    },
    explanation: {
      es: [
        'Qué es: el contrato de trabajo del maestro de obra.',
        'Puntos clave: dura hasta terminar la estructura de la Torre B; salario de $3.200.000 pagado por quincenas.',
        'Para quién: talento humano y nómina.',
      ],
      en: [
        'What it is: the foreman’s employment contract.',
        'Key points: it lasts until the Tower B structure is finished; COP 3,200,000 salary paid every two weeks.',
        'Who it is for: HR and payroll.',
      ],
    },
    entities: [
      ['person', 'Jhon Fredy Cardona Álzate'],
      ['role', 'Maestro de obra'],
      ['value', '$3.200.000 / mes'],
      ['date', '{{d:-150}}'],
    ],
    text: LABORAL,
  },
  {
    id: 's-presupuesto',
    name: 'Presupuesto de obra Torre B.csv',
    kind: 'csv',
    sizeBytes: 1_024,
    folder: '@finance',
    daysAgo: 262,
    time: '13:05:00',
    tags: { es: ['presupuesto', 'Torre B'], en: ['budget', 'Tower B'] },
    keywords: {
      es: ['capítulos de obra', 'estructura $1.280.000.000', 'total $4.100.000.000'],
      en: ['work chapters', 'structure COP 1,280,000,000', 'total COP 4,100,000,000'],
    },
    summary: {
      es: 'Presupuesto de obra de la Torre B por capítulos: total $4.100.000.000, de los cuales la estructura en concreto es el capítulo más grande ($1.280.000.000).',
      en: 'Tower B construction budget by chapter: COP 4,100,000,000 in total, with the concrete structure as the largest chapter (COP 1,280,000,000).',
    },
    explanation: {
      es: [
        'Qué es: la hoja del presupuesto de obra por capítulos.',
        'Puntos clave: ocho capítulos; estructura (31 %), acabados (18 %) y cimentación (16 %) suman casi dos tercios.',
        'Para quién: gerencia, finanzas y la dirección de obra.',
      ],
      en: [
        'What it is: the construction budget sheet by chapter.',
        'Key points: eight chapters; structure (31%), finishes (18%) and foundations (16%) make up almost two thirds.',
        'Who it is for: management, finance and site management.',
      ],
    },
    entities: [
      ['value', '$4.100.000.000'],
      ['value', '$1.280.000.000'],
    ],
    text: PRESUPUESTO,
  },
  {
    id: 's-andamios',
    name: 'Cotización alquiler de andamios (borrador).pdf',
    kind: 'pdf',
    sizeBytes: 145_408,
    folder: '@finance',
    daysAgo: 40,
    time: '10:00:00',
    deletedDaysAgo: 3,
    tags: { es: ['cotización', 'borrador'], en: ['quote', 'draft'] },
    keywords: { es: ['andamio de fachada'], en: ['facade scaffolding'] },
    summary: {
      es: 'Borrador de cotización para alquilar andamio de fachada (1.200 m2 por 4 meses). Ya fue reemplazado por la cotización definitiva.',
      en: 'Draft quote to rent facade scaffolding (1,200 m2 for 4 months). It was replaced by the final quote.',
    },
    explanation: {
      es: ['Qué es: un borrador de cotización que ya no se usa; por eso está en la papelera.'],
      en: ['What it is: a draft quote that is no longer used; that is why it is in the trash.'],
    },
    entities: [
      ['party', 'Andamios y Formaletas del Oriente S.A.S.'],
      ['nit', NIT.andamios],
    ],
    text: ANDAMIOS,
  },
];

/* ------------------------------ Construcción ------------------------------ */

/** CUFE de ejemplo: 96 caracteres hexadecimales deterministas por número de factura. */
export function sampleCufe(seed: string): string {
  let h = 2166136261;
  let out = '';
  for (let i = 0; out.length < 96; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out += h.toString(16).padStart(8, '0');
  }
  return out.slice(0, 96);
}

export function invoiceTotals(lines: { qty: number; unit: number }[]) {
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const iva = Math.round(subtotal * 0.19);
  return { subtotal, iva, total: subtotal + iva };
}

function buildOcr(inv: InvoiceDef, now: Stamp): OcrData {
  const { subtotal, iva, total } = invoiceTotals(inv.lines);
  const conf = (key: OcrField['key']) => inv.lowConfidence?.[key] ?? 0.98;
  const fields: OcrField[] = [
    { key: 'issuer', value: inv.issuer, confidence: conf('issuer') },
    { key: 'nit', value: inv.nit, confidence: conf('nit') },
    { key: 'number', value: inv.number, confidence: conf('number') },
    { key: 'date', value: addDays(now, inv.dateOffset).slice(0, 10), confidence: conf('date') },
    { key: 'cufe', value: sampleCufe(inv.number), confidence: conf('cufe') },
    { key: 'buyer', value: `${COMPANY.name} - NIT ${NIT.altos}`, confidence: conf('buyer') },
    { key: 'subtotal', value: fmtCop(subtotal), confidence: conf('subtotal') },
    { key: 'iva', value: fmtCop(iva), confidence: conf('iva') },
    { key: 'total', value: fmtCop(total), confidence: conf('total') },
  ];
  return { fields, lines: inv.lines.map((l) => ({ ...l })) };
}

/** Texto plano de una factura escaneada (lo que "leyó" el OCR de ejemplo). */
function invoiceText(ocr: OcrData): string {
  const get = (k: OcrField['key']) => ocr.fields.find((f) => f.key === k)?.value ?? '';
  const lines = ocr.lines.map((l) => `${l.concept} | ${l.qty} | ${fmtCop(l.unit)} | ${fmtCop(l.qty * l.unit)}`);
  return [
    'FACTURA ELECTRÓNICA DE VENTA',
    `${get('issuer')} - NIT ${get('nit')}`,
    `No. ${get('number')} - Fecha ${get('date')}`,
    `Adquiriente: ${get('buyer')}`,
    'Concepto | Cant. | Valor unitario | Total',
    ...lines,
    `Subtotal ${get('subtotal')}`,
    `IVA 19 % ${get('iva')}`,
    `Total a pagar ${get('total')}`,
    `CUFE ${get('cufe')}`,
  ].join('\n');
}

/** Cambios que el visitante hace sobre los datos de ejemplo (se guardan en su navegador). */
export interface SampleOverlayEntry {
  name?: string;
  folder?: string;
  favorite?: boolean;
  /** null = restaurado; string = fecha en que se movió a la papelera. */
  deletedAt?: string | null;
  removed?: boolean;
}

export type SampleOverlay = Record<string, SampleOverlayEntry>;

export const SAMPLE_IDS = DEFS.map((d) => d.id);

/** Arma los documentos de ejemplo para hoy, en el idioma pedido y con los cambios del visitante. */
export function buildSampleDocs(now: Stamp, loc: Loc, overlay: SampleOverlay = {}): DocItem[] {
  const fill = (s: string) => fillDates(s, now);
  const out: DocItem[] = [];
  for (const d of DEFS) {
    const o = overlay[d.id] || {};
    if (o.removed) continue;
    const createdAt = `${addDays(now, -d.daysAgo).slice(0, 10)}T${d.time}`;
    const ocr = d.invoice ? buildOcr(d.invoice, now) : undefined;
    const text = d.text ? fill(d.text) : ocr ? invoiceText(ocr) : undefined;
    const defaultDeleted = d.deletedDaysAgo !== undefined ? `${addDays(now, -d.deletedDaysAgo).slice(0, 10)}T09:00:00` : undefined;
    const deletedAt = o.deletedAt === undefined ? defaultDeleted : o.deletedAt ?? undefined;
    const entities: Entity[] = d.entities.map(([kind, value]) => ({ kind, value: fill(value) }));
    out.push({
      id: d.id,
      source: 'sample',
      name: o.name ?? fill(d.name),
      kind: d.kind,
      sizeBytes: d.sizeBytes,
      folder: o.folder ?? d.folder,
      tags: d.tags[loc],
      favorite: o.favorite ?? Boolean(d.favorite),
      createdAt,
      deleted: Boolean(deletedAt),
      deletedAt,
      summary: d.summary[loc],
      keywords: d.keywords[loc],
      entities,
      text,
      explanation: d.explanation[loc],
      ocr,
      versions: d.versions?.map((v) => ({
        label: v.label,
        createdAt: `${addDays(now, -v.daysAgo).slice(0, 10)}T10:00:00`,
        author: v.author,
        note: v.note[loc],
        text: fill(v.text),
      })),
    });
  }
  return out;
}

/** Preguntas sugeridas para probar la búsqueda con los datos de ejemplo. */
export const SUGGESTED_QUERIES: L10n<string[]> = {
  es: ['contratos que se renuevan solos', 'póliza de cumplimiento', 'facturas de concreto', 'cláusula penal', 'presupuesto aprobado'],
  en: ['renovación automática', 'póliza de cumplimiento', 'factura concreto', 'cláusula penal', 'presupuesto'],
};
