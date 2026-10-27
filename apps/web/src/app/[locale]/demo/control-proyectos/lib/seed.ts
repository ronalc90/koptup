/**
 * Datos de ejemplo de la demo. Las tres empresas, sus clientes, NIT y personas
 * son ficticios. Todas las fechas se calculan a partir del día en que se abre
 * la demo (`base`), así el proyecto siempre está "en curso": en el proyecto
 * principal de cada sector hay exactamente una tarea vencida.
 */
import { addDays, workday } from './dates';
import type {
  AppNotification,
  AppState,
  Attachment,
  Company,
  DocKind,
  Expense,
  HistoryEntry,
  ISODate,
  Member,
  Milestone,
  OutboxItem,
  Priority,
  Project,
  RoleId,
  SectorId,
  StatusId,
  Task,
  TimeEntry,
  Workspace,
} from './types';

export const STATE_VERSION = 3;

/** Dígito de verificación de un NIT (algoritmo de la DIAN). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  const r = sum % 11;
  return r >= 2 ? 11 - r : r;
}

export function formatNit(nit: string): string {
  return `${nit.slice(0, 3)}.${nit.slice(3, 6)}.${nit.slice(6)}-${nitDv(nit)}`;
}

/* ------------------------------------------------------------------ */
/* Formato compacto de los datos de ejemplo                            */
/* ------------------------------------------------------------------ */

type Who = number; // índice en `members`
/** [autor ('c' = cliente), texto, día relativo, hora] */
type CommentSeed = [Who | 'c', string, number, string];

interface TaskSeed {
  k: string;
  t: string;
  d: string;
  who: Who | null;
  /** Inicio y vencimiento: días hábiles relativos a hoy. */
  s: number;
  e: number;
  st: StatusId;
  p?: Priority;
  est: number;
  ms: number;
  tags?: string[];
  /** Lista de chequeo; '+' al inicio = hecho. */
  cl?: string[];
  dep?: string[];
  cv?: boolean;
  /** Día relativo en que se terminó (tareas en Terminado). */
  done?: number;
  /** Fracción de la estimación ya registrada en horas (por defecto según el estado). */
  log?: number;
  att?: [string, DocKind][];
  com?: CommentSeed[];
}

interface MilestoneSeed {
  name: string;
  kind?: 'sprint';
  s: number;
  e: number;
  budget: number;
  billing: number;
  inv?: [string, number];
  closed?: boolean;
}

interface ProjectSeed {
  k: string;
  name: string;
  client: string;
  contact: string;
  city: string;
  desc: string;
  color: string;
  fav?: boolean;
  s: number;
  e: number;
  ms: MilestoneSeed[];
  tasks: TaskSeed[];
  /** [hito, día relativo, concepto, valor COP] */
  exp?: [number, number, string, number][];
}

interface WorkspaceSeed {
  sector: SectorId;
  company: Company;
  members: Omit<Member, 'id'>[];
  projects: ProjectSeed[];
}

/* ------------------------------------------------------------------ */
/* Construcción                                                         */
/* ------------------------------------------------------------------ */

const CONSTRUCCION: WorkspaceSeed = {
  sector: 'construccion',
  company: { name: 'Constructora Ladera Verde S.A.S.', nit: '901452318', city: 'Bogotá' },
  members: [
    { name: 'Andrea Cárdenas', role: 'pm', rate: 95000, capacity: 45, me: true },
    { name: 'Julián Ospina', role: 'resident', rate: 62000, capacity: 48 },
    { name: 'Natalia Rincón', role: 'purchasing', rate: 48000, capacity: 45 },
    { name: 'Hernán Quiroga', role: 'foreman', rate: 35000, capacity: 48 },
    { name: 'Camila Prieto', role: 'architect', rate: 70000, capacity: 45 },
  ],
  projects: [
    {
      k: 'torre2',
      name: 'Torre 2 — Conjunto Reservas del Río',
      client: 'Promotora Reservas del Río S.A.S.',
      contact: 'Paula Restrepo',
      city: 'Chía, Cundinamarca',
      desc: 'Estructura en concreto de una torre de 10 pisos y sótano (64 apartamentos). Contrato por hitos con interventoría externa.',
      color: 'bg-teal-500',
      fav: true,
      s: -120,
      e: 70,
      ms: [
        { name: 'Cimentación y sótano', s: -120, e: -46, budget: 240_000_000, billing: 230_000_000, inv: ['PF-0007', -44], closed: true },
        { name: 'Estructura pisos 1 a 5', s: -45, e: 9, budget: 180_000_000, billing: 175_000_000 },
        { name: 'Estructura pisos 6 a 10', s: 10, e: 70, budget: 195_000_000, billing: 185_000_000 },
      ],
      tasks: [
        { k: 'a1', t: 'Estudio de suelos complementario', d: 'Sondeos adicionales en el costado norte por cambio en el diseño del sótano.', who: 2, s: -118, e: -105, st: 'done', done: -106, est: 16, ms: 0, tags: ['Ingeniería'], cv: true, att: [['Informe-estudio-de-suelos.pdf', 'informe']] },
        { k: 'a2', t: 'Excavación y muros de contención del sótano', d: 'Excavación a 3,5 m y muros pantalla en concreto reforzado.', who: 1, s: -104, e: -60, st: 'done', done: -58, est: 120, ms: 0, tags: ['Obra gris'], cv: true },
        { k: 'a3', t: 'Placa de cimentación', d: 'Placa maciza de 60 cm con vigas de amarre.', who: 1, s: -58, e: -47, st: 'done', done: -47, est: 60, ms: 0, tags: ['Obra gris'], cv: true },
        { k: 'a4', t: 'Vaciado de placa piso 2', d: 'Placa aligerada de entrepiso, 412 m².', who: 1, s: -40, e: -31, st: 'done', done: -31, est: 40, ms: 1, tags: ['Obra gris'], cv: true },
        { k: 'a5', t: 'Vaciado de placa piso 3', d: 'Placa aligerada de entrepiso, 412 m².', who: 1, s: -28, e: -19, st: 'done', done: -19, est: 40, ms: 1, tags: ['Obra gris'], cv: true },
        {
          k: 'a6', t: 'Vaciado de placa piso 4', d: 'Placa aligerada de entrepiso, 412 m². Ensayos de cilindros a 7 y 28 días.', who: 1, s: -16, e: -6, st: 'done', done: -6, est: 40, ms: 1, tags: ['Obra gris'], cv: true,
          cl: ['+Revisión de formaleta', '+Prueba de asentamiento del concreto', '+Toma de cilindros para ensayo'],
        },
        {
          k: 'a7', t: 'Acta de avance de obra #7', d: 'Cantidades ejecutadas de las dos últimas semanas para aprobación del cliente y cobro del hito.', who: 0, s: -4, e: 2, st: 'client', est: 6, ms: 1, tags: ['Cliente'], cv: true,
          cl: ['+Cantidades ejecutadas del periodo', '+Registro fotográfico', '+Firma del residente'],
          att: [['Acta-avance-obra-07.pdf', 'acta']],
          com: [
            [1, 'Te dejo el acta con las cantidades de las dos últimas semanas y las fotos del vaciado del piso 4.', -1, '16:20'],
            ['c', 'Recibida. La reviso con la interventoría y te confirmo mañana.', -1, '18:02'],
          ],
        },
        {
          k: 'a8', t: 'Pedido de acero de refuerzo piso 5', d: 'Siete toneladas de acero de 60.000 psi según cartilla de despiece.', who: 2, s: -10, e: -3, st: 'doing', p: 'high', est: 12, ms: 1, tags: ['Compras'],
          cl: ['+Cotización de tres proveedores', 'Orden de compra firmada', 'Confirmación de entrega en obra'],
          com: [[2, '@Andrea Cárdenas el proveedor tiene el acero listo, pero la orden de compra sigue sin firma. Sin eso no despacha.', -1, '09:40']],
        },
        { k: 'a9', t: 'Vaciado de placa piso 5', d: 'Depende de que llegue el acero de refuerzo.', who: 1, s: 2, e: 8, st: 'todo', p: 'high', est: 40, ms: 1, tags: ['Obra gris'], dep: ['a8'], cv: true },
        {
          k: 'a10', t: 'Red hidrosanitaria pisos 1 a 3', d: 'Tubería de suministro y desagües de los tres primeros pisos.', who: 3, s: -8, e: 6, st: 'doing', est: 60, ms: 1, tags: ['Redes'],
          cl: ['+Piso 1', 'Piso 2', 'Piso 3'],
        },
        {
          k: 'a11', t: 'Inspección de trabajo en alturas', d: 'Verificación semanal de seguridad y salud en el trabajo antes de seguir con la placa.', who: 1, s: -3, e: 1, st: 'review', est: 6, ms: 1, tags: ['SST'],
          cl: ['+Revisión de arneses y líneas de vida', '+Permisos de trabajo del día', 'Informe firmado'],
        },
        { k: 'a12', t: 'Comité de obra con interventoría', d: 'Revisión de avance, pendientes y cambios de diseño.', who: 0, s: 1, e: 1, st: 'todo', est: 3, ms: 1, tags: ['Cliente'], cl: ['Agenda enviada', 'Revisión de pendientes', 'Acta del comité'] },
        { k: 'a13', t: 'Pedido de concreto premezclado piso 6', d: 'Programar 48 m³ de concreto de 4.000 psi con bomba.', who: 2, s: 7, e: 11, st: 'todo', est: 6, ms: 2, tags: ['Compras'] },
        { k: 'a14', t: 'Formaleta y armado de columnas piso 6', d: 'Inicia cuando se vacíe la placa del piso 5.', who: 1, s: 10, e: 20, st: 'todo', est: 48, ms: 2, tags: ['Obra gris'], dep: ['a9'] },
      ],
      exp: [
        [0, -100, 'Subcontrato de excavación y retiro de tierra', 62_000_000],
        [0, -70, 'Concreto de 4.000 psi para cimentación (180 m³)', 79_200_000],
        [0, -55, 'Acero de refuerzo para cimentación (14 t)', 58_800_000],
        [1, -35, 'Concreto de 4.000 psi para placas (96 m³)', 42_240_000],
        [1, -25, 'Acero de refuerzo pisos 2 a 4 (7 t)', 29_400_000],
        [1, -20, 'Alquiler de formaleta metálica (2 meses)', 12_600_000],
      ],
    },
    {
      k: 'bodega',
      name: 'Adecuación de bodega — Parque Logístico Siberia',
      client: 'Logística Sabana Norte S.A.S.',
      contact: 'Ricardo Bermúdez',
      city: 'Cota, Cundinamarca',
      desc: 'Adecuación de una bodega de 1.800 m²: piso industrial, red eléctrica y red contra incendio.',
      color: 'bg-sky-500',
      s: -60,
      e: 40,
      ms: [
        { name: 'Obra civil y pisos', s: -60, e: -12, budget: 60_000_000, billing: 70_000_000, inv: ['PF-0009', -10], closed: true },
        { name: 'Redes eléctricas y contra incendio', s: -11, e: 20, budget: 120_000_000, billing: 115_000_000 },
        { name: 'Entrega y documentación', s: 21, e: 40, budget: 25_000_000, billing: 30_000_000 },
      ],
      tasks: [
        { k: 'b1', t: 'Demolición de muros internos', d: 'Retiro de divisiones en bloque y disposición de escombros.', who: 3, s: -58, e: -45, st: 'done', done: -46, est: 30, ms: 0, tags: ['Obra gris'], cv: true },
        { k: 'b2', t: 'Piso industrial de 1.800 m²', d: 'Mortero autonivelante con endurecedor de cuarzo.', who: 1, s: -44, e: -14, st: 'done', done: -13, est: 60, ms: 0, tags: ['Obra gris'], cv: true, att: [['Informe-planimetria-del-piso.pdf', 'informe']] },
        { k: 'b3', t: 'Tablero eléctrico principal', d: 'Montaje del tablero general y acometida.', who: 1, s: -6, e: 8, st: 'doing', est: 40, ms: 1, tags: ['Redes'], cl: ['+Diseño aprobado por el cliente', 'Montaje', 'Pruebas y certificado RETIE'] },
        { k: 'b4', t: 'Red contra incendio con rociadores', d: 'Tubería, rociadores y gabinetes según el diseño aprobado.', who: 1, s: 4, e: 18, st: 'todo', est: 50, ms: 1, tags: ['Redes'] },
        { k: 'b5', t: 'Registro fotográfico quincenal', d: 'Fotos del avance para el cliente.', who: 0, s: -2, e: 3, st: 'client', est: 4, ms: 1, tags: ['Cliente'], cv: true, att: [['Registro-fotografico-quincena-3.pdf', 'fotos']] },
        { k: 'b6', t: 'Plan de manejo de tránsito para entregas', d: 'Horarios de cargue y descargue durante la obra.', who: 1, s: -4, e: 2, st: 'review', est: 8, ms: 1, tags: ['SST'] },
        { k: 'b7', t: 'Manuales y planos récord', d: 'Planos finales de redes y manuales de equipos.', who: 4, s: 21, e: 38, st: 'todo', est: 24, ms: 2, tags: ['Entrega'], cv: true },
      ],
      exp: [
        [0, -50, 'Demolición y retiro de escombros', 11_800_000],
        [0, -40, 'Mortero autonivelante y endurecedor para piso', 36_500_000],
        [1, -5, 'Tablero eléctrico y cableado', 41_200_000],
      ],
    },
    {
      k: 'oficinas',
      name: 'Oficinas piso 8 — Grupo Empresarial Altavista',
      client: 'Grupo Empresarial Altavista S.A.S.',
      contact: 'Mónica Herrera',
      city: 'Bogotá',
      desc: 'Remodelación de 620 m² de oficinas: diseño, licencia, obra y mobiliario.',
      color: 'bg-amber-500',
      s: -10,
      e: 75,
      ms: [
        { name: 'Diseño y licencias', s: -10, e: 12, budget: 28_000_000, billing: 30_000_000 },
        { name: 'Obra gris y acabados', s: 13, e: 60, budget: 140_000_000, billing: 150_000_000 },
        { name: 'Mobiliario y entrega', s: 61, e: 75, budget: 45_000_000, billing: 52_000_000 },
      ],
      tasks: [
        { k: 'c1', t: 'Visita técnica con el cliente', d: 'Recorrido del piso y toma de requerimientos.', who: 0, s: -9, e: -8, st: 'done', done: -8, est: 4, ms: 0, tags: ['Cliente'], cv: true },
        { k: 'c2', t: 'Presupuesto detallado de obra', d: 'Cantidades y precios unitarios por capítulo.', who: 2, s: -8, e: -3, st: 'done', done: -3, est: 20, ms: 0, tags: ['Compras'], cv: true, att: [['Presupuesto-oficinas-piso-8.pdf', 'presupuesto']] },
        { k: 'c3', t: 'Levantamiento arquitectónico', d: 'Medidas del piso, instalaciones existentes y planos de estado actual.', who: 4, s: -9, e: -2, st: 'review', p: 'medium', est: 16, ms: 0, tags: ['Diseño'] },
        {
          k: 'c4', t: 'Licencia de remodelación ante curaduría', d: 'Trámite de la licencia de modificación con planos firmados.', who: 0, s: -7, e: -4, st: 'doing', p: 'high', est: 12, ms: 0, tags: ['Trámites'],
          cl: ['+Formulario único nacional', '+Planos firmados', 'Radicación', 'Pago de expensas'],
        },
        { k: 'c5', t: 'Diseño de distribución y renders', d: 'Propuesta de puestos de trabajo, salas y zona social.', who: 4, s: -5, e: 4, st: 'client', est: 24, ms: 0, tags: ['Diseño'], cv: true, att: [['Renders-propuesta-de-distribucion.pdf', 'piezas']] },
        { k: 'c6', t: 'Demolición de divisiones existentes', d: 'Arranca cuando esté aprobada la licencia.', who: 3, s: 13, e: 18, st: 'todo', est: 30, ms: 1, tags: ['Obra gris'], dep: ['c4'] },
        { k: 'c7', t: 'Pedido de mobiliario', d: 'Puestos de trabajo, sillas y mobiliario de salas.', who: 2, s: 40, e: 61, st: 'todo', est: 6, ms: 2, tags: ['Compras'] },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Agencia                                                              */
/* ------------------------------------------------------------------ */

const AGENCIA: WorkspaceSeed = {
  sector: 'agencia',
  company: { name: 'Estudio Ceiba Creativa S.A.S.', nit: '901637205', city: 'Medellín' },
  members: [
    { name: 'Valentina Mejía', role: 'accounts', rate: 85000, capacity: 45, me: true },
    { name: 'Santiago Arango', role: 'creative', rate: 110000, capacity: 40 },
    { name: 'Manuela Zapata', role: 'designer', rate: 60000, capacity: 45 },
    { name: 'Daniel Restrepo', role: 'producer', rate: 70000, capacity: 45 },
    { name: 'Laura Gómez', role: 'community', rate: 45000, capacity: 45 },
  ],
  projects: [
    {
      k: 'capsulas',
      name: 'Lanzamiento de cápsulas — Cafetal Nubes Altas',
      client: 'Cafetal Nubes Altas S.A.S.',
      contact: 'Juliana Ríos',
      city: 'Manizales, Caldas',
      desc: 'Lanzamiento de una línea de café en cápsulas: concepto, empaque, contenido para redes, pauta y evento en tienda.',
      color: 'bg-rose-500',
      fav: true,
      s: -35,
      e: 40,
      ms: [
        { name: 'Estrategia y concepto', s: -35, e: -16, budget: 5_000_000, billing: 9_000_000, inv: ['PF-0021', -15], closed: true },
        { name: 'Producción de piezas', s: -15, e: 10, budget: 16_000_000, billing: 26_000_000 },
        { name: 'Pauta y lanzamiento', s: 11, e: 40, budget: 12_000_000, billing: 18_000_000 },
      ],
      tasks: [
        { k: 'g1', t: 'Brief y plan de lanzamiento', d: 'Objetivos, público, mensajes y calendario del lanzamiento.', who: 0, s: -34, e: -30, st: 'done', done: -30, est: 12, ms: 0, tags: ['Estrategia'], cv: true, att: [['Brief-lanzamiento-capsulas.pdf', 'brief']] },
        { k: 'g2', t: 'Concepto creativo y línea gráfica', d: 'Concepto "Tu finca en una cápsula" y sistema gráfico.', who: 1, s: -29, e: -17, st: 'done', done: -17, est: 30, ms: 0, tags: ['Creatividad'], cv: true },
        { k: 'g3', t: 'Sesión de fotos de producto', d: 'Bodegones y fotos de ambiente para redes y empaque.', who: 3, s: -12, e: -6, st: 'done', done: -6, est: 24, ms: 1, tags: ['Producción'], cv: true },
        { k: 'g4', t: 'Video de 30 segundos para redes', d: 'Pieza principal de la campaña en formato vertical y horizontal.', who: 3, s: -6, e: 5, st: 'doing', est: 40, ms: 1, tags: ['Producción'], cl: ['+Guion aprobado', '+Rodaje', 'Edición y color', 'Música con licencia de uso'] },
        {
          k: 'g5', t: 'Piezas para redes: 12 publicaciones', d: 'Carruseles e historias del mes de lanzamiento.', who: 2, s: -5, e: 2, st: 'client', est: 28, ms: 1, tags: ['Diseño'], cv: true,
          att: [['Piezas-redes-lanzamiento.pdf', 'piezas']],
          com: [[2, 'Subí las 12 piezas en una sola presentación para que las revisen juntas.', -1, '17:05']],
        },
        {
          k: 'g6', t: 'Ajustes de etiqueta frontal del empaque', d: 'Cambios pedidos por el cliente antes de enviar a imprenta.', who: 2, s: -9, e: -2, st: 'doing', p: 'high', est: 10, ms: 1, tags: ['Diseño'],
          com: [
            ['c', 'Necesitamos que el registro sanitario quede más visible en la etiqueta.', -4, '11:30'],
            [2, '@Valentina Mejía ya hice el cambio; falta que la imprenta confirme el tamaño mínimo del texto.', -1, '10:15'],
          ],
        },
        { k: 'g7', t: 'Parrilla de contenidos del mes de lanzamiento', d: 'Calendario de publicaciones con textos y horarios.', who: 4, s: -3, e: 3, st: 'review', est: 12, ms: 1, tags: ['Redes'] },
        { k: 'g8', t: 'Plan de pauta digital', d: 'Distribución de inversión por canal y semana.', who: 4, s: 8, e: 14, st: 'todo', est: 10, ms: 2, tags: ['Pauta'], dep: ['g4'] },
        { k: 'g9', t: 'Evento de lanzamiento en tienda', d: 'Degustación y activación en la tienda principal del cliente.', who: 0, s: 25, e: 35, st: 'todo', est: 20, ms: 2, tags: ['Evento'], cv: true },
      ],
      exp: [
        [1, -10, 'Alquiler de estudio y equipos de fotografía', 2_400_000],
        [1, -3, 'Licencia de música para el video', 900_000],
      ],
    },
    {
      k: 'avanza',
      name: 'Rediseño de marca — Cooperativa Avanza',
      client: 'Cooperativa de Ahorro y Crédito Avanza',
      contact: 'Óscar Velásquez',
      city: 'Medellín',
      desc: 'Nueva identidad visual de la cooperativa: estrategia, logotipo, manual de marca y señalética.',
      color: 'bg-violet-500',
      s: -50,
      e: 20,
      ms: [
        { name: 'Investigación y estrategia de marca', s: -50, e: -30, budget: 4_500_000, billing: 9_000_000, inv: ['PF-0018', -28], closed: true },
        { name: 'Identidad visual', s: -29, e: 5, budget: 12_000_000, billing: 24_000_000 },
        { name: 'Manual de marca y aplicaciones', s: 6, e: 20, budget: 7_000_000, billing: 14_000_000 },
      ],
      tasks: [
        { k: 'h1', t: 'Entrevistas con asociados y directivos', d: 'Doce entrevistas para entender la percepción de la marca.', who: 0, s: -48, e: -40, st: 'done', done: -40, est: 16, ms: 0, tags: ['Estrategia'], cv: true },
        { k: 'h2', t: 'Estrategia y territorio de marca', d: 'Propósito, personalidad y tono de la nueva marca.', who: 1, s: -39, e: -31, st: 'done', done: -31, est: 24, ms: 0, tags: ['Estrategia'], cv: true, att: [['Estrategia-de-marca.pdf', 'brief']] },
        { k: 'h3', t: 'Propuestas de logotipo (3 rutas)', d: 'Tres rutas creativas para presentar a la junta directiva.', who: 1, s: -28, e: -14, st: 'done', done: -14, est: 40, ms: 1, tags: ['Diseño'], cv: true, log: 1.3 },
        { k: 'h4', t: 'Ajustes a la ruta elegida', d: 'Tres rondas de ajustes pedidas por la junta.', who: 2, s: -13, e: -4, st: 'done', done: -4, est: 30, ms: 1, tags: ['Diseño'], cv: true, log: 1.6 },
        { k: 'h5', t: 'Paleta, tipografías y retícula', d: 'Sistema visual completo para aprobación.', who: 2, s: -3, e: 3, st: 'client', est: 16, ms: 1, tags: ['Diseño'], cv: true, att: [['Paleta-y-tipografias.pdf', 'piezas']] },
        { k: 'h6', t: 'Señalética de oficinas', d: 'Aplicación de la marca en las 9 oficinas.', who: 2, s: 6, e: 14, st: 'todo', est: 20, ms: 2, tags: ['Diseño'] },
        { k: 'h7', t: 'Manual de marca', d: 'Usos correctos, incorrectos y plantillas.', who: 1, s: 8, e: 20, st: 'todo', est: 24, ms: 2, tags: ['Diseño'], cv: true },
      ],
      exp: [
        [1, -20, 'Honorarios del trámite de registro de marca', 3_200_000],
        [1, -9, 'Pruebas de impresión de papelería', 1_400_000],
        [1, -6, 'Fotografía de oficinas y asociados', 3_400_000],
      ],
    },
    {
      k: 'trazos',
      name: 'Campaña temporada escolar — Papelería Trazos',
      client: 'Papelería Trazos S.A.S.',
      contact: 'Marcela Duque',
      city: 'Envigado, Antioquia',
      desc: 'Campaña de regreso a clases para 14 tiendas: concepto, cuña radial, material POP y pauta.',
      color: 'bg-emerald-500',
      s: -5,
      e: 55,
      ms: [
        { name: 'Concepto de campaña', s: -5, e: 9, budget: 6_000_000, billing: 12_000_000 },
        { name: 'Producción', s: 10, e: 35, budget: 15_000_000, billing: 28_000_000 },
        { name: 'Pauta y medición', s: 36, e: 55, budget: 9_000_000, billing: 15_000_000 },
      ],
      tasks: [
        { k: 'i1', t: 'Reunión de arranque y brief', d: 'Objetivos de venta y presupuesto de la temporada.', who: 0, s: -5, e: -4, st: 'done', done: -4, est: 4, ms: 0, tags: ['Estrategia'], cv: true },
        { k: 'i2', t: 'Investigación de precios y competencia', d: 'Precios de las listas escolares en 6 cadenas de la ciudad.', who: 4, s: -3, e: 2, st: 'doing', est: 10, ms: 0, tags: ['Estrategia'] },
        { k: 'i3', t: 'Ideas de concepto (3 caminos)', d: 'Tres caminos creativos para la campaña.', who: 1, s: -2, e: 6, st: 'doing', est: 20, ms: 0, tags: ['Creatividad'], cv: true },
        { k: 'i4', t: 'Presentación de concepto al cliente', d: 'Reunión para elegir el camino creativo.', who: 0, s: 7, e: 9, st: 'todo', est: 6, ms: 0, tags: ['Cliente'], cv: true, dep: ['i3'] },
        { k: 'i5', t: 'Guion de cuña radial', d: 'Cuña de 30 segundos para emisoras locales.', who: 3, s: 10, e: 15, st: 'todo', est: 8, ms: 1, tags: ['Producción'] },
        { k: 'i6', t: 'Material POP para tiendas', d: 'Habladores, afiches y cenefas para las 14 tiendas.', who: 2, s: 12, e: 25, st: 'todo', est: 30, ms: 1, tags: ['Diseño'], cv: true },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Software                                                             */
/* ------------------------------------------------------------------ */

const SOFTWARE: WorkspaceSeed = {
  sector: 'software',
  company: { name: 'Nodo Sur Software S.A.S.', nit: '901284966', city: 'Cali' },
  members: [
    { name: 'Felipe Ocampo', role: 'pm', rate: 95000, capacity: 45, me: true },
    { name: 'Carolina Vélez', role: 'techLead', rate: 120000, capacity: 40 },
    { name: 'Andrés Mosquera', role: 'backend', rate: 90000, capacity: 45 },
    { name: 'Isabela Castaño', role: 'mobile', rate: 90000, capacity: 45 },
    { name: 'Mateo Lozano', role: 'qa', rate: 65000, capacity: 45 },
  ],
  projects: [
    {
      k: 'pedidos',
      name: 'App de pedidos — Distribuidora Pacífico Fresco',
      client: 'Distribuidora Pacífico Fresco S.A.S.',
      contact: 'Diana Caicedo',
      city: 'Cali, Valle del Cauca',
      desc: 'App para que los tenderos hagan pedidos, paguen y sigan sus entregas. Se trabaja en sprints de dos semanas.',
      color: 'bg-indigo-500',
      fav: true,
      s: -37,
      e: 32,
      ms: [
        { name: 'Sprint 6', kind: 'sprint', s: -37, e: -24, budget: 9_000_000, billing: 12_500_000, inv: ['PF-0031', -22], closed: true },
        { name: 'Sprint 7', kind: 'sprint', s: -23, e: -10, budget: 9_000_000, billing: 12_500_000, inv: ['PF-0034', -8], closed: true },
        { name: 'Sprint 8', kind: 'sprint', s: -9, e: 4, budget: 9_000_000, billing: 12_500_000 },
        { name: 'Sprint 9', kind: 'sprint', s: 5, e: 18, budget: 9_000_000, billing: 12_500_000 },
        { name: 'Sprint 10', kind: 'sprint', s: 19, e: 32, budget: 9_000_000, billing: 12_500_000 },
      ],
      tasks: [
        { k: 'j1', t: 'Diseño de pantallas y flujo de compra', d: 'Prototipo navegable validado con cinco tenderos.', who: 3, s: -37, e: -26, st: 'done', done: -26, est: 30, ms: 0, tags: ['Diseño'], cv: true, att: [['Especificacion-flujo-de-compra.pdf', 'especificacion']] },
        { k: 'j1b', t: 'Arquitectura, repositorio y ambientes', d: 'Ambientes de desarrollo, pruebas y producción con despliegue automático.', who: 1, s: -37, e: -28, st: 'done', done: -28, est: 24, ms: 0, tags: ['Backend'] },
        { k: 'j1c', t: 'API de productos y precios (versión inicial)', d: 'Servicio de catálogo con datos de prueba mientras llega el acceso al ERP.', who: 2, s: -35, e: -25, st: 'done', done: -25, est: 30, ms: 0, tags: ['Backend'] },
        { k: 'j2', t: 'Catálogo de productos con búsqueda', d: 'Listado por categorías, búsqueda y filtros.', who: 3, s: -23, e: -12, st: 'done', done: -12, est: 32, ms: 1, tags: ['App'], cv: true },
        { k: 'j3', t: 'Ingreso con número de celular y código SMS', d: 'Registro e ingreso sin contraseña.', who: 2, s: -22, e: -11, st: 'done', done: -11, est: 24, ms: 1, tags: ['Backend'], cv: true },
        { k: 'j3b', t: 'Pruebas del sprint 7', d: 'Casos de prueba de catálogo e ingreso.', who: 4, s: -14, e: -11, st: 'done', done: -11, est: 12, ms: 1, tags: ['QA'] },
        { k: 'j3c', t: 'Demostración del sprint 7 al cliente', d: 'Revisión de catálogo e ingreso con el equipo comercial del cliente.', who: 0, s: -10, e: -10, st: 'done', done: -10, est: 4, ms: 1, tags: ['Cliente'], cv: true },
        { k: 'j4', t: 'Carrito y resumen del pedido', d: 'Carrito con mínimos de compra por zona.', who: 3, s: -9, e: -2, st: 'done', done: -2, est: 28, ms: 2, tags: ['App'], cv: true },
        {
          k: 'j5', t: 'Integración con el ERP del cliente (precios e inventario)', d: 'Lectura de precios por lista y de inventario por bodega.', who: 2, s: -9, e: -1, st: 'doing', p: 'high', est: 40, ms: 2, tags: ['Backend'],
          cl: ['+Acceso al ambiente de pruebas del ERP', '+Lectura de precios', 'Lectura de inventario', 'Manejo de errores y reintentos'],
          com: [[2, '@Felipe Ocampo el ambiente de pruebas del ERP se cae dos veces al día; ¿puedes escalarlo con el proveedor del cliente?', -1, '15:50']],
        },
        { k: 'j6', t: 'Pagos con PSE y tarjeta (ambiente de pruebas)', d: 'Pasarela en modo de pruebas; la cuenta de producción la abre el cliente.', who: 2, s: -4, e: 3, st: 'doing', est: 32, ms: 2, tags: ['Backend'], dep: ['j3'] },
        {
          k: 'j7', t: 'Versión 0.8 para validación del cliente', d: 'Versión instalable con catálogo, carrito y pedido.', who: 1, s: -1, e: 3, st: 'client', est: 6, ms: 2, tags: ['Entrega'], cv: true,
          att: [['Notas-de-version-0-8.pdf', 'especificacion']],
          com: [['c', 'Gracias. Esta tarde la prueban dos vendedores en ruta y te cuento.', -1, '12:10']],
        },
        { k: 'j8', t: 'Pruebas de regresión del sprint 8', d: 'Casos de prueba de catálogo, carrito y pedido.', who: 4, s: 1, e: 4, st: 'todo', est: 16, ms: 2, tags: ['QA'], dep: ['j4'] },
        { k: 'j9', t: 'Historial de pedidos', d: 'Pedidos anteriores con opción de repetir.', who: 3, s: 5, e: 12, st: 'todo', est: 24, ms: 3, tags: ['App'], cv: true },
        { k: 'j10', t: 'Notificaciones de estado del pedido', d: 'Avisos cuando el pedido se despacha y se entrega.', who: 3, s: 8, e: 16, st: 'todo', est: 20, ms: 3, tags: ['App'], dep: ['j9'] },
        { k: 'j11', t: 'Panel de pedidos para el equipo comercial', d: 'Pedidos por vendedor, zona y estado.', who: 2, s: 19, e: 30, st: 'todo', est: 36, ms: 4, tags: ['Web'], cv: true },
      ],
    },
    {
      k: 'fondo',
      name: 'Portal de autogestión — Fondo de Empleados Solidaridad',
      client: 'Fondo de Empleados Solidaridad Norte',
      contact: 'Gloria Mina',
      city: 'Cali, Valle del Cauca',
      desc: 'Portal web para que los asociados consulten su estado de cuenta, descarguen certificados y soliciten créditos.',
      color: 'bg-cyan-500',
      s: -70,
      e: 20,
      ms: [
        { name: 'Fase 1: estado de cuenta', s: -70, e: -35, budget: 10_000_000, billing: 14_000_000, inv: ['PF-0027', -33], closed: true },
        { name: 'Fase 2: certificados y créditos', s: -34, e: -3, budget: 14_000_000, billing: 19_000_000 },
        { name: 'Fase 3: salida a producción', s: -2, e: 20, budget: 6_000_000, billing: 9_000_000 },
      ],
      tasks: [
        { k: 'k1', t: 'Estado de cuenta del asociado', d: 'Aportes, ahorros y créditos con su detalle.', who: 2, s: -70, e: -40, st: 'done', done: -38, est: 60, ms: 0, tags: ['Web'], cv: true },
        { k: 'k2', t: 'Ingreso seguro con doble factor', d: 'Código por correo o SMS en cada ingreso.', who: 1, s: -60, e: -36, st: 'done', done: -36, est: 30, ms: 0, tags: ['Seguridad'], cv: true },
        { k: 'k3', t: 'Certificados tributarios en PDF', d: 'Certificados de aportes y de intereses descargables.', who: 2, s: -34, e: -15, st: 'done', done: -15, est: 40, ms: 1, tags: ['Web'], cv: true },
        { k: 'k4', t: 'Simulador de crédito', d: 'Cuota, plazo y tasa según la línea de crédito.', who: 3, s: -25, e: -8, st: 'done', done: -8, est: 36, ms: 1, tags: ['Web'], cv: true },
        {
          k: 'k5', t: 'Solicitud de crédito con adjuntos', d: 'Formulario, carga de documentos y envío al analista.', who: 2, s: -14, e: -3, st: 'doing', p: 'high', est: 44, ms: 1, tags: ['Web'],
          cl: ['+Formulario', '+Carga de documentos', 'Validación de capacidad de pago', 'Aviso al analista de crédito'],
        },
        { k: 'k6', t: 'Pruebas de aceptación de la fase 2', d: 'Casos de prueba con el equipo del fondo.', who: 4, s: -6, e: -2, st: 'review', p: 'medium', est: 20, ms: 1, tags: ['QA'], dep: ['k4'] },
        { k: 'k7', t: 'Manual de usuario del portal', d: 'Guía con capturas para los asociados.', who: 0, s: 3, e: 12, st: 'todo', est: 12, ms: 2, tags: ['Entrega'], cv: true },
        { k: 'k8', t: 'Salida a producción y acompañamiento', d: 'Publicación y dos semanas de acompañamiento.', who: 1, s: 14, e: 20, st: 'todo', est: 24, ms: 2, tags: ['Entrega'], cv: true, dep: ['k6'] },
      ],
    },
    {
      k: 'vidaplena',
      name: 'Migración a la nube — Laboratorio Clínico Vida Plena',
      client: 'Laboratorio Clínico Vida Plena S.A.S.',
      contact: 'Jorge Valencia',
      city: 'Palmira, Valle del Cauca',
      desc: 'Migración de servidores locales a la nube con plan de copias de seguridad y recuperación.',
      color: 'bg-lime-500',
      s: -6,
      e: 60,
      ms: [
        { name: 'Diagnóstico y arquitectura', s: -6, e: 8, budget: 7_000_000, billing: 10_000_000 },
        { name: 'Migración de bases de datos y aplicaciones', s: 9, e: 45, budget: 16_000_000, billing: 24_000_000 },
        { name: 'Estabilización', s: 46, e: 60, budget: 5_000_000, billing: 8_000_000 },
      ],
      tasks: [
        { k: 'l1', t: 'Inventario de servidores y aplicaciones', d: 'Servidores, bases de datos, licencias y dependencias.', who: 1, s: -6, e: -2, st: 'done', done: -2, est: 16, ms: 0, tags: ['Infraestructura'], cv: true, att: [['Inventario-de-infraestructura.pdf', 'informe']] },
        { k: 'l2', t: 'Arquitectura objetivo y costos mensuales', d: 'Diseño de la arquitectura y estimación del costo mensual de la nube.', who: 1, s: -1, e: 6, st: 'doing', est: 24, ms: 0, tags: ['Infraestructura'], cv: true },
        { k: 'l3', t: 'Plan de copias de seguridad y recuperación', d: 'Frecuencia, retención y pruebas de restauración.', who: 2, s: 1, e: 8, st: 'todo', est: 16, ms: 0, tags: ['Infraestructura'], dep: ['l1'] },
        { k: 'l4', t: 'Migración de la base de datos de resultados', d: 'Migración con ventana de mantenimiento nocturna.', who: 2, s: 9, e: 25, st: 'todo', est: 60, ms: 1, tags: ['Backend'], dep: ['l2'] },
        { k: 'l5', t: 'Pruebas de rendimiento', d: 'Tiempos de consulta de resultados antes y después.', who: 4, s: 26, e: 35, st: 'todo', est: 24, ms: 1, tags: ['QA'], dep: ['l4'] },
      ],
    },
  ],
};

const SEEDS: Record<SectorId, WorkspaceSeed> = { construccion: CONSTRUCCION, agencia: AGENCIA, software: SOFTWARE };

/* ------------------------------------------------------------------ */
/* Construcción del estado                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_LOG: Record<StatusId, number> = { todo: 0, doing: 0.5, review: 0.85, client: 0.95, done: 1 };

/** Reparte las horas registradas de una tarea en días hábiles entre su inicio y `until`. */
function spreadHours(total: number, from: ISODate, until: ISODate): { date: ISODate; hours: number }[] {
  const days: ISODate[] = [];
  let d = from;
  while (d <= until) {
    const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) days.push(d);
    d = addDays(d, 1);
  }
  if (days.length === 0) days.push(until);
  const out: { date: ISODate; hours: number }[] = [];
  let left = Math.round(total * 2) / 2;
  // Bloques de hasta 6 h, empezando por los días más recientes.
  for (let i = days.length - 1; i >= 0 && left > 0; i--) {
    const h = Math.min(6, left);
    out.push({ date: days[i], hours: h });
    left -= h;
  }
  if (left > 0) out[out.length - 1].hours += left;
  return out.reverse();
}

export const MENTION_RE = /@([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/g;

/** Ids de las personas mencionadas con "@Nombre Apellido". */
export function findMentions(text: string, members: Member[]): string[] {
  const ids: string[] = [];
  for (const m of text.matchAll(MENTION_RE)) {
    const member = members.find((x) => x.name === m[1]);
    if (member && !ids.includes(member.id)) ids.push(member.id);
  }
  return ids;
}

function buildWorkspace(seed: WorkspaceSeed, base: ISODate): Workspace {
  let seq = 0;
  const id = (prefix: string) => `${prefix}${++seq}`;
  const wd = (n: number) => workday(base, n);
  const at = (n: number, time: string) => `${wd(n)}T${time}`;

  const members: Member[] = seed.members.map((m, i) => ({ ...m, id: `m${i + 1}` }));
  const me = members.find((m) => m.me)!;
  const projects: Project[] = [];
  const milestones: Milestone[] = [];
  const tasks: Task[] = [];
  const time: TimeEntry[] = [];
  const expenses: Expense[] = [];
  const notifications: AppNotification[] = [];
  const outbox: OutboxItem[] = [];

  seed.projects.forEach((ps, pi) => {
    const pid = `p${pi + 1}`;
    projects.push({
      id: pid,
      name: ps.name,
      client: ps.client,
      clientContact: ps.contact,
      city: ps.city,
      description: ps.desc,
      color: ps.color,
      favorite: !!ps.fav,
      start: wd(ps.s),
      end: wd(ps.e),
    });
    const msIds = ps.ms.map((ms) => {
      const mid = id('ms');
      milestones.push({
        id: mid,
        projectId: pid,
        name: ms.name,
        kind: ms.kind ?? 'milestone',
        start: wd(ms.s),
        end: wd(ms.e),
        budget: ms.budget,
        billing: ms.billing,
        invoice: ms.inv ? { number: ms.inv[0], on: wd(ms.inv[1]) } : undefined,
        closed: ms.closed,
      });
      return mid;
    });
    const keyToId = new Map<string, string>();
    ps.tasks.forEach((ts) => keyToId.set(ts.k, id('t')));

    for (const ts of ps.tasks) {
      const tid = keyToId.get(ts.k)!;
      const assignee = ts.who === null ? null : members[ts.who];
      const start = wd(ts.s);
      const due = wd(ts.e);
      const completedAt = ts.st === 'done' ? wd(ts.done ?? ts.e) : undefined;
      const history: HistoryEntry[] = [{ at: `${wd(Math.min(ts.s, -1) - 2)}T08:30`, actor: me.name, key: 'created', client: false }];
      if (ts.st !== 'todo') {
        history.push({ at: `${ts.s < 0 ? start : wd(-1)}T09:00`, actor: assignee?.name ?? me.name, key: 'moved', params: { status: 'doing' } });
      }
      if (ts.st === 'review') history.push({ at: at(-1, '17:30'), actor: assignee?.name ?? me.name, key: 'moved', params: { status: 'review' } });
      if (ts.st === 'client') {
        history.push({ at: at(-1, '15:00'), actor: assignee?.name ?? me.name, key: 'moved', params: { status: 'client' } });
        history.push({ at: at(-1, '15:01'), actor: me.name, key: 'sentToClient', client: true });
      }
      if (ts.st === 'done' && completedAt) {
        history.push({ at: `${completedAt}T16:00`, actor: assignee?.name ?? me.name, key: 'moved', params: { status: 'done' }, client: !!ts.cv });
      }
      const comments = (ts.com ?? []).map(([who, text, day, hhmm]) => {
        const author = who === 'c' ? ps.contact : members[who].name;
        return {
          id: id('c'),
          author,
          text,
          at: at(day, hhmm),
          fromClient: who === 'c',
          mentions: who === 'c' ? [] : findMentions(text, members),
        };
      });
      const attachments: Attachment[] = (ts.att ?? []).map(([name, doc]) => ({ id: id('f'), name, source: 'sample', doc }));
      tasks.push({
        id: tid,
        projectId: pid,
        milestoneId: msIds[ts.ms] ?? null,
        title: ts.t,
        description: ts.d,
        assigneeId: assignee?.id ?? null,
        start,
        due,
        priority: ts.p ?? 'medium',
        status: ts.st,
        estimate: ts.est,
        tags: ts.tags ?? [],
        checklist: (ts.cl ?? []).map((c) => ({ id: id('k'), text: c.replace(/^\+/, ''), done: c.startsWith('+') })),
        comments,
        attachments,
        history: history.sort((a, b) => a.at.localeCompare(b.at)),
        dependsOn: (ts.dep ?? []).map((k) => keyToId.get(k)!).filter(Boolean),
        clientVisible: !!ts.cv,
        completedAt,
      });

      // Horas registradas
      const frac = ts.log ?? DEFAULT_LOG[ts.st];
      if (assignee && frac > 0) {
        const until = completedAt ?? wd(-1);
        for (const chunk of spreadHours(ts.est * frac, start < until ? start : until, until)) {
          time.push({ id: id('h'), taskId: tid, memberId: assignee.id, date: chunk.date, hours: chunk.hours, note: '' });
        }
      }

      // Notificaciones de ejemplo: comentarios del cliente y menciones a ti
      for (const c of comments) {
        if (c.fromClient) {
          notifications.push({ id: id('n'), kind: 'client', at: c.at, key: 'clientCommented', params: { who: c.author, task: ts.t }, read: false, projectId: pid, taskId: tid });
        } else if (c.mentions?.includes(me.id)) {
          notifications.push({ id: id('n'), kind: 'mention', at: c.at, key: 'mentioned', params: { who: c.author, task: ts.t }, read: false, projectId: pid, taskId: tid });
        }
      }
    }

    for (const [msIdx, day, concept, amount] of ps.exp ?? []) {
      expenses.push({ id: id('x'), projectId: pid, milestoneId: msIds[msIdx], date: wd(day), concept, amount });
    }

    if (pi === 0) {
      const mine = tasks.find((t) => t.projectId === pid && t.status === 'todo' && t.assigneeId === me.id);
      if (mine) {
        const other = members[1];
        notifications.push({ id: id('n'), kind: 'assigned', at: at(-2, '08:10'), key: 'assignedYou', params: { who: other.name, task: mine.title }, read: true, projectId: pid, taskId: mine.id });
      }
      outbox.push({ id: id('o'), at: at(-5, '08:00'), projectId: pid, channel: 'email', to: ps.contact, key: 'weekly', params: { project: ps.name } });
    }
  });

  notifications.sort((a, b) => b.at.localeCompare(a.at));

  return {
    sector: seed.sector,
    company: seed.company,
    members,
    projects,
    milestones,
    tasks,
    time,
    expenses,
    notifications,
    outbox,
    automations: { clientApproval: true, notifyClient: true, overdueRaise: true },
    currentProjectId: projects[0].id,
    seq,
  };
}

export function buildWorkspaceFor(sector: SectorId, base: ISODate): Workspace {
  return buildWorkspace(SEEDS[sector], base);
}

export function buildState(base: ISODate, sector: SectorId = 'construccion'): AppState {
  return {
    version: STATE_VERSION,
    baseDate: base,
    sector,
    workspaces: {
      construccion: buildWorkspace(CONSTRUCCION, base),
      agencia: buildWorkspace(AGENCIA, base),
      software: buildWorkspace(SOFTWARE, base),
    },
    prefs: { defaultView: 'kanban', notify: { client: true, due: true, sent: true } },
  };
}

/* ------------------------------------------------------------------ */
/* Plantillas para "Nuevo proyecto"                                     */
/* ------------------------------------------------------------------ */

export interface TemplateTask {
  t: string;
  d: string;
  role: RoleId;
  s: number;
  e: number;
  est: number;
  ms: number;
  cv?: boolean;
  dep?: number[];
}

export interface Template {
  id: string;
  name: string;
  desc: string;
  ms: { name: string; kind?: 'sprint'; s: number; e: number }[];
  tasks: TemplateTask[];
}

export const TEMPLATES: Record<SectorId, Template[]> = {
  construccion: [
    {
      id: 'remodelacion',
      name: 'Remodelación de oficinas',
      desc: 'Diseño, licencia, obra y entrega con acta de recibo.',
      ms: [
        { name: 'Diseño y licencias', s: 0, e: 20 },
        { name: 'Obra', s: 21, e: 60 },
        { name: 'Entrega', s: 61, e: 70 },
      ],
      tasks: [
        { t: 'Visita técnica con el cliente', d: 'Recorrido y toma de requerimientos.', role: 'pm', s: 0, e: 1, est: 4, ms: 0, cv: true },
        { t: 'Levantamiento arquitectónico', d: 'Planos del estado actual.', role: 'architect', s: 1, e: 5, est: 16, ms: 0 },
        { t: 'Presupuesto detallado de obra', d: 'Cantidades y precios unitarios.', role: 'purchasing', s: 3, e: 8, est: 20, ms: 0, cv: true },
        { t: 'Licencia de remodelación', d: 'Trámite ante curaduría.', role: 'pm', s: 6, e: 20, est: 12, ms: 0, dep: [1] },
        { t: 'Demolición y obra gris', d: 'Demoliciones, muros y redes.', role: 'foreman', s: 21, e: 40, est: 80, ms: 1, dep: [3] },
        { t: 'Acabados', d: 'Pisos, pintura, cielos e iluminación.', role: 'resident', s: 41, e: 60, est: 90, ms: 1, dep: [4] },
        { t: 'Entrega y acta de recibo', d: 'Recorrido final con el cliente.', role: 'pm', s: 61, e: 65, est: 6, ms: 2, cv: true, dep: [5] },
      ],
    },
    {
      id: 'estructura',
      name: 'Estructura de edificio por pisos',
      desc: 'Cimentación, placas por piso, pedidos y comités de obra.',
      ms: [
        { name: 'Cimentación', s: 0, e: 45 },
        { name: 'Estructura', s: 46, e: 120 },
      ],
      tasks: [
        { t: 'Estudio de suelos', d: 'Sondeos y recomendaciones de cimentación.', role: 'purchasing', s: 0, e: 10, est: 16, ms: 0, cv: true },
        { t: 'Excavación', d: 'Excavación y retiro de tierra.', role: 'resident', s: 11, e: 25, est: 60, ms: 0, dep: [0] },
        { t: 'Placa de cimentación', d: 'Armado y vaciado.', role: 'resident', s: 26, e: 45, est: 60, ms: 0, dep: [1] },
        { t: 'Pedido de acero de refuerzo', d: 'Cotizaciones y orden de compra.', role: 'purchasing', s: 40, e: 46, est: 8, ms: 1 },
        { t: 'Vaciado de placa piso 2', d: 'Placa de entrepiso.', role: 'resident', s: 47, e: 60, est: 40, ms: 1, dep: [2, 3], cv: true },
        { t: 'Acta de avance de obra #1', d: 'Cantidades ejecutadas para el cliente.', role: 'pm', s: 58, e: 62, est: 6, ms: 1, cv: true },
      ],
    },
    {
      id: 'mantenimiento',
      name: 'Mantenimiento locativo',
      desc: 'Diagnóstico, cotización y ejecución de reparaciones.',
      ms: [{ name: 'Mantenimiento', s: 0, e: 25 }],
      tasks: [
        { t: 'Diagnóstico de daños', d: 'Inspección y registro fotográfico.', role: 'resident', s: 0, e: 2, est: 6, ms: 0, cv: true },
        { t: 'Cotización de reparaciones', d: 'Cantidades y precios.', role: 'purchasing', s: 2, e: 5, est: 8, ms: 0, cv: true },
        { t: 'Impermeabilización de cubierta', d: 'Manto y sellos.', role: 'foreman', s: 6, e: 15, est: 40, ms: 0, dep: [1] },
        { t: 'Pintura de fachada', d: 'Lavado, resanes y pintura.', role: 'foreman', s: 12, e: 22, est: 50, ms: 0, dep: [1] },
        { t: 'Informe final al cliente', d: 'Antes y después con fotos.', role: 'pm', s: 23, e: 25, est: 4, ms: 0, cv: true, dep: [2, 3] },
      ],
    },
  ],
  agencia: [
    {
      id: 'lanzamiento',
      name: 'Lanzamiento de producto',
      desc: 'Brief, concepto, piezas, pauta y evento.',
      ms: [
        { name: 'Estrategia y concepto', s: 0, e: 15 },
        { name: 'Producción', s: 16, e: 40 },
        { name: 'Lanzamiento', s: 41, e: 60 },
      ],
      tasks: [
        { t: 'Brief y plan de lanzamiento', d: 'Objetivos, público y mensajes.', role: 'accounts', s: 0, e: 4, est: 12, ms: 0, cv: true },
        { t: 'Concepto creativo', d: 'Concepto y línea gráfica.', role: 'creative', s: 5, e: 15, est: 30, ms: 0, cv: true, dep: [0] },
        { t: 'Piezas para redes', d: 'Carruseles e historias.', role: 'designer', s: 16, e: 30, est: 28, ms: 1, cv: true, dep: [1] },
        { t: 'Video principal', d: 'Guion, rodaje y edición.', role: 'producer', s: 16, e: 38, est: 40, ms: 1, cv: true, dep: [1] },
        { t: 'Plan de pauta digital', d: 'Inversión por canal y semana.', role: 'community', s: 35, e: 42, est: 10, ms: 2 },
        { t: 'Evento de lanzamiento', d: 'Activación con el cliente.', role: 'accounts', s: 50, e: 58, est: 20, ms: 2, cv: true },
      ],
    },
    {
      id: 'redes',
      name: 'Gestión mensual de redes',
      desc: 'Parrilla, diseño, aprobación del cliente e informe del mes.',
      ms: [{ name: 'Mes 1', s: 0, e: 30 }],
      tasks: [
        { t: 'Parrilla de contenidos del mes', d: 'Temas, formatos y fechas.', role: 'community', s: 0, e: 4, est: 10, ms: 0, cv: true },
        { t: 'Diseño de publicaciones', d: '16 piezas del mes.', role: 'designer', s: 5, e: 12, est: 24, ms: 0, cv: true, dep: [0] },
        { t: 'Programación de publicaciones', d: 'Programación en las cuentas del cliente.', role: 'community', s: 13, e: 14, est: 4, ms: 0, dep: [1] },
        { t: 'Informe de resultados del mes', d: 'Alcance, interacción y aprendizajes.', role: 'accounts', s: 28, e: 30, est: 6, ms: 0, cv: true },
      ],
    },
    {
      id: 'marca',
      name: 'Identidad de marca',
      desc: 'Investigación, logotipo, sistema visual y manual.',
      ms: [
        { name: 'Estrategia', s: 0, e: 15 },
        { name: 'Identidad visual', s: 16, e: 45 },
      ],
      tasks: [
        { t: 'Entrevistas y talleres', d: 'Percepción actual de la marca.', role: 'accounts', s: 0, e: 8, est: 16, ms: 0 },
        { t: 'Estrategia de marca', d: 'Propósito, personalidad y tono.', role: 'creative', s: 9, e: 15, est: 24, ms: 0, cv: true, dep: [0] },
        { t: 'Rutas de logotipo', d: 'Tres rutas para presentar.', role: 'creative', s: 16, e: 28, est: 40, ms: 1, cv: true, dep: [1] },
        { t: 'Sistema visual', d: 'Paleta, tipografías y retícula.', role: 'designer', s: 29, e: 38, est: 20, ms: 1, cv: true, dep: [2] },
        { t: 'Manual de marca', d: 'Usos y plantillas.', role: 'designer', s: 39, e: 45, est: 24, ms: 1, cv: true, dep: [3] },
      ],
    },
  ],
  software: [
    {
      id: 'app',
      name: 'App móvil (primera versión)',
      desc: 'Sprints de dos semanas con validación del cliente al cierre de cada uno.',
      ms: [
        { name: 'Sprint 1', kind: 'sprint', s: 0, e: 13 },
        { name: 'Sprint 2', kind: 'sprint', s: 14, e: 27 },
        { name: 'Sprint 3', kind: 'sprint', s: 28, e: 41 },
      ],
      tasks: [
        { t: 'Diseño de pantallas', d: 'Prototipo navegable.', role: 'mobile', s: 0, e: 8, est: 30, ms: 0, cv: true },
        { t: 'Arquitectura y ambientes', d: 'Repositorio, ambientes y despliegue continuo.', role: 'techLead', s: 0, e: 6, est: 20, ms: 0 },
        { t: 'Registro e ingreso', d: 'Ingreso con celular.', role: 'backend', s: 7, e: 13, est: 24, ms: 0, dep: [1] },
        { t: 'Funcionalidad principal', d: 'Flujo principal de la app.', role: 'mobile', s: 14, e: 27, est: 60, ms: 1, cv: true, dep: [0] },
        { t: 'Pruebas de regresión', d: 'Casos de prueba del sprint.', role: 'qa', s: 24, e: 27, est: 16, ms: 1, dep: [3] },
        { t: 'Versión para validación del cliente', d: 'Versión instalable.', role: 'techLead', s: 38, e: 41, est: 8, ms: 2, cv: true, dep: [4] },
      ],
    },
    {
      id: 'web',
      name: 'Sitio web corporativo',
      desc: 'Contenidos, diseño, desarrollo y publicación.',
      ms: [
        { name: 'Diseño', s: 0, e: 15 },
        { name: 'Desarrollo y publicación', s: 16, e: 40 },
      ],
      tasks: [
        { t: 'Mapa del sitio y contenidos', d: 'Secciones y textos con el cliente.', role: 'pm', s: 0, e: 5, est: 10, ms: 0, cv: true },
        { t: 'Diseño de páginas', d: 'Inicio y páginas internas.', role: 'mobile', s: 6, e: 15, est: 30, ms: 0, cv: true, dep: [0] },
        { t: 'Desarrollo', d: 'Maquetación y administrador de contenidos.', role: 'backend', s: 16, e: 32, est: 60, ms: 1, dep: [1] },
        { t: 'Pruebas en celulares', d: 'Navegadores y tamaños de pantalla.', role: 'qa', s: 33, e: 36, est: 12, ms: 1, dep: [2] },
        { t: 'Publicación', d: 'Dominio, certificado y analítica.', role: 'techLead', s: 37, e: 40, est: 8, ms: 1, cv: true, dep: [3] },
      ],
    },
    {
      id: 'soporte',
      name: 'Bolsa de horas de soporte',
      desc: 'Solicitudes del cliente atendidas contra una bolsa mensual.',
      ms: [{ name: 'Mes 1', s: 0, e: 30 }],
      tasks: [
        { t: 'Revisión de solicitudes pendientes', d: 'Priorización con el cliente.', role: 'pm', s: 0, e: 2, est: 4, ms: 0, cv: true },
        { t: 'Corrección de errores reportados', d: 'Errores de la última versión.', role: 'backend', s: 3, e: 15, est: 20, ms: 0, cv: true, dep: [0] },
        { t: 'Actualización de dependencias', d: 'Parches de seguridad.', role: 'techLead', s: 10, e: 20, est: 12, ms: 0 },
        { t: 'Informe de horas del mes', d: 'Horas usadas y saldo de la bolsa.', role: 'pm', s: 28, e: 30, est: 3, ms: 0, cv: true },
      ],
    },
  ],
};
