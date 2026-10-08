/**
 * Datos de ejemplo: "Red de Clínicas Montaña Azul", una empresa ficticia con
 * seis sedes en Colombia. Personas, direcciones, teléfonos (+57 300 555 01xx)
 * y dominios (.example, reservado para ejemplos) son inventados. Las fechas se
 * calculan desde el momento en que abres la demo.
 */
import { DEFAULT_TYPES } from './models';
import { atBogota, iso } from './time';
import type { AppState, Block, Entry, EntryContent, FieldValue, L10n, Media, Person, Status, TypeId, Webhook } from './types';

export const STATE_VERSION = 3;

export const COMPANY = {
  name: 'Red de Clínicas Montaña Azul',
  domain: 'montana-azul.example',
};

export const PEOPLE: Person[] = [
  { id: 'u-valentina', name: 'Valentina Rojas', role: 'writer' },
  { id: 'u-andres', name: 'Andrés Cárdenas', role: 'editor' },
  { id: 'u-natalia', name: 'Natalia Ospina', role: 'admin' },
];

const L = (es: string, en: string): L10n => ({ es, en });

let blockSeq = 0;
const bid = (prefix: string) => `${prefix}-b${++blockSeq}`;
const H = (p: string, level: 1 | 2 | 3, es: string, en: string): Block => ({ id: bid(p), kind: 'heading', level, text: L(es, en) });
const P = (p: string, es: string, en: string): Block => ({ id: bid(p), kind: 'paragraph', html: L(es, en) });
const IMG = (p: string, mediaId: string, es: string, en: string): Block => ({ id: bid(p), kind: 'image', mediaId, caption: L(es, en) });
const BTN = (p: string, es: string, en: string, href: string): Block => ({ id: bid(p), kind: 'button', label: L(es, en), href });

function media(nowMs: number): Media[] {
  const m = (id: string, art: Media['art'], name: string, es: string, en: string, focal = { x: 50, y: 50 }): Media => ({
    id,
    name,
    src: null,
    art,
    alt: L(es, en),
    focal,
    width: 1600,
    height: 1000,
    sizeKb: 180 + id.length * 7,
    source: 'sample',
    createdAt: iso(atBogota(nowMs, -60, 9)),
  });
  return [
    m('m-fachada-chapinero', 'facade', 'fachada-chapinero.jpg', 'Fachada de la sede Chapinero con rampa de acceso', 'Front of the Chapinero location with an access ramp', { x: 50, y: 40 }),
    m('m-fachada-poblado', 'facade2', 'fachada-el-poblado.jpg', 'Entrada de la sede El Poblado', 'Entrance of the El Poblado location'),
    m('m-recepcion', 'reception', 'recepcion.jpg', 'Recepción con módulo de atención y sala de espera', 'Reception desk and waiting area'),
    m('m-consultorio', 'consult', 'consultorio.jpg', 'Consultorio de medicina general', 'General practice consulting room'),
    m('m-equipo', 'team', 'equipo.jpg', 'Equipo de profesionales de la sede', 'Healthcare team at the location', { x: 50, y: 30 }),
    m('m-laboratorio', 'lab', 'laboratorio.jpg', 'Toma de muestras en el laboratorio clínico', 'Sample collection at the clinical laboratory'),
    m('m-ecografia', 'ultrasound', 'ecografia.jpg', 'Sala de ecografía con equipo y camilla', 'Ultrasound room with scanner and exam table'),
    m('m-odontologia', 'dental', 'odontologia.jpg', 'Consultorio de odontología general', 'General dentistry office'),
    m('m-fisioterapia', 'physio', 'fisioterapia.jpg', 'Sesión de fisioterapia con ejercicios guiados', 'Physical therapy session with guided exercises'),
    m('m-calendario', 'calendar', 'horarios-fin-de-ano.jpg', 'Calendario con los horarios especiales de diciembre', 'Calendar with the special December hours'),
    m('m-chat', 'chat', 'citas-por-chat.jpg', 'Conversación de agendamiento de cita en el celular', 'Appointment booking chat on a phone'),
    // Sin texto alternativo a propósito: el panel SEO lo marca.
    m('m-bucaramanga', 'city', 'bucaramanga-cabecera.jpg', '', ''),
  ];
}

interface Spec {
  id: string;
  type: TypeId;
  status: Status;
  slug: string;
  fields: Record<string, FieldValue>;
  blocks?: Block[];
  seo?: { title: L10n; description: L10n };
  author: string;
  createdDaysAgo: number;
  updatedDaysAgo: number;
  /** Días desde la publicación (solo publicadas). */
  publishedDaysAgo?: number;
  /** Días hasta la publicación programada. */
  scheduledInDays?: number;
}

const NO_SEO = { title: L('', ''), description: L('', '') };

function specs(): Spec[] {
  const pi = 'page-inicio';
  const pn = 'page-nosotros';
  const a1 = 'art-whatsapp';
  const a2 = 'art-primera-cita';
  const a3 = 'art-fin-de-ano';
  const a4 = 'art-bucaramanga';
  return [
    // ---------------------------------------------------------------- Páginas
    {
      id: pi,
      type: 'page',
      status: 'published',
      slug: 'inicio',
      author: 'u-natalia',
      createdDaysAgo: 120,
      updatedDaysAgo: 21,
      publishedDaysAgo: 21,
      fields: {
        title: L('Tu salud, cerca de ti en seis ciudades', 'Your health, close to you in six cities'),
        summary: L(
          'Medicina general, laboratorio, ecografía, odontología y fisioterapia con cita el mismo día en la mayoría de sedes.',
          'General practice, lab tests, ultrasound, dentistry and physical therapy, with same-day appointments at most locations.',
        ),
        heroImage: 'm-recepcion',
      },
      blocks: [
        H(pi, 2, 'Agenda en minutos', 'Book in minutes'),
        P(
          pi,
          '<p>Escoge la sede más cercana, el servicio y la hora. Si prefieres, escríbenos por WhatsApp y te confirmamos la cita. Consulta los <a href="/servicios">servicios disponibles</a> y sus tarifas particulares.</p>',
          '<p>Choose the nearest location, the service and a time. If you prefer, message us on WhatsApp and we will confirm your appointment. See the <a href="/servicios">available services</a> and self-pay rates.</p>',
        ),
        BTN(pi, 'Ver sedes y horarios', 'See locations and hours', '/sedes'),
      ],
      seo: {
        title: L('Red de Clínicas Montaña Azul | Citas en seis ciudades', 'Montaña Azul Clinics | Appointments in six cities'),
        description: L(
          'Medicina general, laboratorio, ecografía, odontología y fisioterapia en Bogotá, Medellín, Cali, Barranquilla y Bucaramanga. Agenda en línea o por WhatsApp.',
          'General practice, lab tests, ultrasound, dentistry and physical therapy in Bogotá, Medellín, Cali, Barranquilla and Bucaramanga. Book online or on WhatsApp.',
        ),
      },
    },
    {
      id: pn,
      type: 'page',
      status: 'published',
      slug: 'quienes-somos',
      author: 'u-natalia',
      createdDaysAgo: 118,
      updatedDaysAgo: 64,
      publishedDaysAgo: 64,
      fields: {
        title: L('Quiénes somos', 'About us'),
        summary: L('Una red de clínicas ambulatorias fundada en 2014 con sedes en cinco ciudades de Colombia.', 'A network of outpatient clinics founded in 2014 with locations in five Colombian cities.'),
        heroImage: 'm-equipo',
      },
      blocks: [
        P(
          pn,
          '<p>Empezamos con un consultorio en Chapinero y hoy atendemos en seis sedes. Nuestro equipo combina <strong>medicina general, ayudas diagnósticas y rehabilitación</strong> para que resuelvas lo que necesitas en un solo lugar.</p>',
          '<p>We started with one office in Chapinero and today we serve patients at six locations. Our team combines <strong>general practice, diagnostic tests and rehabilitation</strong> so you can get what you need in one place.</p>',
        ),
        H(pn, 2, 'Cómo trabajamos', 'How we work'),
        P(
          pn,
          '<ul><li>Citas con hora exacta y recordatorio un día antes.</li><li>Resultados de laboratorio en tu correo.</li><li>Tarifas particulares publicadas en cada servicio.</li></ul><p>Conoce nuestras <a href="/sedes">sedes y horarios</a>.</p>',
          '<ul><li>Appointments at an exact time with a reminder the day before.</li><li>Lab results sent to your email.</li><li>Self-pay rates published for every service.</li></ul><p>See our <a href="/sedes">locations and hours</a>.</p>',
        ),
      ],
      seo: {
        title: L('Quiénes somos | Red de Clínicas Montaña Azul', 'About us | Montaña Azul Clinics'),
        description: L(
          'Red de clínicas ambulatorias con seis sedes en Colombia: medicina general, laboratorio, ecografía, odontología y fisioterapia.',
          'Outpatient clinic network with six locations in Colombia: general practice, lab tests, ultrasound, dentistry and physical therapy.',
        ),
      },
    },
    // ---------------------------------------------------------------- Sedes
    {
      id: 'loc-chapinero',
      type: 'location',
      status: 'published',
      slug: 'chapinero',
      author: 'u-valentina',
      createdDaysAgo: 110,
      updatedDaysAgo: 12,
      publishedDaysAgo: 12,
      fields: {
        name: L('Sede Chapinero', 'Chapinero location'),
        city: 'Bogotá',
        address: 'Calle 63 # 9-45, local 2',
        hours: L('Lunes a viernes: 7:00 a. m. – 7:00 p. m. · Sábados: 8:00 a. m. – 1:00 p. m.', 'Monday to Friday: 7:00 a.m. – 7:00 p.m. · Saturdays: 8:00 a.m. – 1:00 p.m.'),
        whatsapp: '+57 300 555 0101',
        photo: 'm-fachada-chapinero',
        services: ['svc-medicina-general', 'svc-ecografia', 'svc-laboratorio', 'svc-odontologia'],
        description: L(
          'A dos cuadras de la estación de TransMilenio de la calle 63. Parqueadero para bicicletas y acceso para sillas de ruedas.',
          'Two blocks from the Calle 63 TransMilenio station. Bike parking and wheelchair access.',
        ),
      },
      seo: {
        title: L('Sede Chapinero, Bogotá | Clínicas Montaña Azul', 'Chapinero location, Bogotá | Montaña Azul Clinics'),
        description: L(
          'Medicina general, ecografía, laboratorio y odontología en Chapinero. Abierto de lunes a sábado. Agenda tu cita por WhatsApp.',
          'General practice, ultrasound, lab tests and dentistry in Chapinero. Open Monday to Saturday. Book your appointment on WhatsApp.',
        ),
      },
    },
    {
      id: 'loc-usaquen',
      type: 'location',
      status: 'published',
      slug: 'usaquen',
      author: 'u-valentina',
      createdDaysAgo: 105,
      updatedDaysAgo: 40,
      publishedDaysAgo: 40,
      fields: {
        name: L('Sede Usaquén', 'Usaquén location'),
        city: 'Bogotá',
        address: 'Carrera 7 # 119-20, piso 3',
        hours: L('Lunes a viernes: 7:00 a. m. – 6:00 p. m.', 'Monday to Friday: 7:00 a.m. – 6:00 p.m.'),
        whatsapp: '+57 300 555 0102',
        photo: 'm-consultorio',
        services: ['svc-medicina-general', 'svc-laboratorio', 'svc-fisioterapia'],
        description: L('Sobre la carrera Séptima, con ascensor y sala de espera amplia.', 'On Carrera Séptima, with an elevator and a large waiting room.'),
      },
      seo: {
        title: L('Sede Usaquén, Bogotá | Clínicas Montaña Azul', 'Usaquén location, Bogotá | Montaña Azul Clinics'),
        description: L(
          'Medicina general, laboratorio clínico y fisioterapia en Usaquén, Bogotá. Atención de lunes a viernes con cita previa.',
          'General practice, clinical lab and physical therapy in Usaquén, Bogotá. Open Monday to Friday by appointment.',
        ),
      },
    },
    {
      id: 'loc-el-poblado',
      type: 'location',
      status: 'published',
      slug: 'el-poblado',
      author: 'u-valentina',
      createdDaysAgo: 100,
      updatedDaysAgo: 33,
      publishedDaysAgo: 33,
      fields: {
        name: L('Sede El Poblado', 'El Poblado location'),
        city: 'Medellín',
        address: 'Carrera 43A # 14-27, consultorio 501',
        hours: L('Lunes a viernes: 7:00 a. m. – 7:00 p. m. · Sábados: 8:00 a. m. – 12:00 m.', 'Monday to Friday: 7:00 a.m. – 7:00 p.m. · Saturdays: 8:00 a.m. – 12:00 p.m.'),
        whatsapp: '+57 300 555 0103',
        photo: 'm-fachada-poblado',
        services: ['svc-medicina-general', 'svc-ecografia', 'svc-fisioterapia'],
        description: L('Cerca de la estación Poblado del metro. Contamos con sala de lactancia.', 'Near the Poblado metro station. We have a nursing room.'),
      },
      seo: {
        title: L('Sede El Poblado, Medellín | Clínicas Montaña Azul', 'El Poblado location, Medellín | Montaña Azul Clinics'),
        description: L(
          'Medicina general, ecografía y fisioterapia en El Poblado, Medellín. Abierto de lunes a sábado. Agenda por WhatsApp.',
          'General practice, ultrasound and physical therapy in El Poblado, Medellín. Open Monday to Saturday. Book on WhatsApp.',
        ),
      },
    },
    {
      id: 'loc-granada',
      type: 'location',
      status: 'published',
      slug: 'granada-cali',
      author: 'u-valentina',
      createdDaysAgo: 96,
      updatedDaysAgo: 50,
      publishedDaysAgo: 50,
      fields: {
        name: L('Sede Granada', 'Granada location'),
        city: 'Cali',
        address: 'Avenida 9N # 15-30',
        hours: L('Lunes a viernes: 7:00 a. m. – 6:00 p. m. · Sábados: 8:00 a. m. – 12:00 m.', 'Monday to Friday: 7:00 a.m. – 6:00 p.m. · Saturdays: 8:00 a.m. – 12:00 p.m.'),
        whatsapp: '+57 300 555 0104',
        photo: 'm-recepcion',
        services: ['svc-medicina-general', 'svc-laboratorio', 'svc-odontologia'],
        description: L('En el barrio Granada, con parqueadero para visitantes.', 'In the Granada neighborhood, with visitor parking.'),
      },
      seo: {
        title: L('Sede Granada, Cali | Clínicas Montaña Azul', 'Granada location, Cali | Montaña Azul Clinics'),
        description: L(
          'Medicina general, laboratorio y odontología en el barrio Granada de Cali. Atención de lunes a sábado con cita previa.',
          'General practice, lab tests and dentistry in the Granada neighborhood of Cali. Open Monday to Saturday by appointment.',
        ),
      },
    },
    {
      id: 'loc-alto-prado',
      type: 'location',
      status: 'published',
      slug: 'alto-prado',
      author: 'u-valentina',
      createdDaysAgo: 90,
      updatedDaysAgo: 28,
      publishedDaysAgo: 28,
      fields: {
        name: L('Sede Alto Prado', 'Alto Prado location'),
        city: 'Barranquilla',
        address: 'Calle 76 # 54-12',
        hours: L('Lunes a viernes: 7:00 a. m. – 7:00 p. m.', 'Monday to Friday: 7:00 a.m. – 7:00 p.m.'),
        whatsapp: '+57 300 555 0105',
        photo: 'm-equipo',
        services: ['svc-medicina-general', 'svc-ecografia', 'svc-laboratorio'],
        // Traducción pendiente a propósito (se ve en el estado de idiomas).
        description: L('Sede climatizada con sala de espera para niños.', ''),
      },
      seo: {
        title: L('Sede Alto Prado, Barranquilla | Clínicas Montaña Azul', 'Alto Prado location, Barranquilla | Montaña Azul Clinics'),
        description: L(
          'Medicina general, ecografía y laboratorio en Alto Prado, Barranquilla. Atención de lunes a viernes, agenda por WhatsApp.',
          'General practice, ultrasound and lab tests in Alto Prado, Barranquilla. Open Monday to Friday, book on WhatsApp.',
        ),
      },
    },
    {
      id: 'loc-cabecera',
      type: 'location',
      status: 'review',
      slug: 'cabecera-bucaramanga',
      author: 'u-valentina',
      createdDaysAgo: 4,
      updatedDaysAgo: 1,
      fields: {
        name: L('Sede Cabecera', 'Cabecera location'),
        city: 'Bucaramanga',
        address: 'Carrera 33 # 48-20, local 104',
        hours: L('Lunes a viernes: 7:00 a. m. – 6:00 p. m.', ''),
        whatsapp: '+57 300 555 0106',
        photo: 'm-bucaramanga',
        services: ['svc-medicina-general', 'svc-laboratorio'],
        description: L('Nuestra sede más nueva, en el sector de Cabecera del Llano.', ''),
      },
      seo: { title: L('Sede Cabecera, Bucaramanga', ''), description: L('', '') },
    },
    // ---------------------------------------------------------------- Servicios
    {
      id: 'svc-medicina-general',
      type: 'service',
      status: 'published',
      slug: 'medicina-general',
      author: 'u-valentina',
      createdDaysAgo: 115,
      updatedDaysAgo: 30,
      publishedDaysAgo: 30,
      fields: {
        name: L('Medicina general', 'General practice'),
        summary: L('Consulta de 20 minutos para valoración, control y órdenes de exámenes.', '20-minute consultation for assessments, follow-ups and test orders.'),
        priceFrom: 65000,
        preparation: L('No requiere preparación. Llega 15 minutos antes con tu documento de identidad.', 'No preparation needed. Arrive 15 minutes early with your ID.'),
        image: 'm-consultorio',
      },
      seo: {
        title: L('Medicina general | Clínicas Montaña Azul', 'General practice | Montaña Azul Clinics'),
        description: L(
          'Consulta de medicina general con cita el mismo día en la mayoría de sedes. Tarifa particular desde $65.000. Agenda en línea o por WhatsApp.',
          'General practice visits with same-day appointments at most locations. Self-pay rate from COP 65,000. Book online or on WhatsApp.',
        ),
      },
    },
    {
      id: 'svc-ecografia',
      type: 'service',
      status: 'published',
      slug: 'ecografia-abdominal',
      author: 'u-valentina',
      createdDaysAgo: 112,
      updatedDaysAgo: 30,
      publishedDaysAgo: 30,
      fields: {
        name: L('Ecografía abdominal', 'Abdominal ultrasound'),
        summary: L('Examen de imágenes del abdomen con reporte el mismo día.', 'Imaging test of the abdomen with a same-day report.'),
        priceFrom: 180000,
        preparation: L(
          'Ayuno de 6 horas. Puedes tomar agua. Si tomas medicamentos, consulta con tu médico antes del examen.',
          'Fast for 6 hours. You may drink water. If you take medication, check with your doctor before the test.',
        ),
        image: 'm-ecografia',
      },
      seo: {
        title: L('Ecografía abdominal | Clínicas Montaña Azul', 'Abdominal ultrasound | Montaña Azul Clinics'),
        description: L(
          'Ecografía abdominal con reporte el mismo día en Bogotá, Medellín y Barranquilla. Conoce la preparación y la tarifa particular.',
          'Abdominal ultrasound with a same-day report in Bogotá, Medellín and Barranquilla. See the preparation and the self-pay rate.',
        ),
      },
    },
    {
      id: 'svc-laboratorio',
      type: 'service',
      status: 'published',
      slug: 'laboratorio-clinico',
      author: 'u-valentina',
      createdDaysAgo: 112,
      updatedDaysAgo: 45,
      publishedDaysAgo: 45,
      fields: {
        name: L('Laboratorio clínico', 'Clinical laboratory'),
        summary: L('Toma de muestras de lunes a sábado; resultados en tu correo.', 'Sample collection Monday to Saturday; results sent to your email.'),
        priceFrom: 35000,
        preparation: L('Algunos exámenes requieren ayuno. Te lo indicamos al agendar.', 'Some tests require fasting. We will tell you when you book.'),
        image: 'm-laboratorio',
      },
      seo: {
        title: L('Laboratorio clínico | Clínicas Montaña Azul', 'Clinical laboratory | Montaña Azul Clinics'),
        description: L(
          'Toma de muestras de lunes a sábado y resultados en tu correo. Exámenes desde $35.000 con tarifa particular.',
          'Sample collection Monday to Saturday with results sent to your email. Tests from COP 35,000 at self-pay rates.',
        ),
      },
    },
    {
      id: 'svc-odontologia',
      type: 'service',
      status: 'published',
      slug: 'odontologia-general',
      author: 'u-valentina',
      createdDaysAgo: 108,
      updatedDaysAgo: 70,
      publishedDaysAgo: 70,
      fields: {
        name: L('Odontología general', 'General dentistry'),
        summary: L('Valoración, limpieza y tratamientos básicos.', 'Check-ups, cleanings and basic treatments.'),
        priceFrom: 90000,
        preparation: L('', ''),
        image: 'm-odontologia',
      },
      seo: {
        title: L('Odontología general | Clínicas Montaña Azul', 'General dentistry | Montaña Azul Clinics'),
        description: L(
          'Valoración odontológica, limpieza y tratamientos básicos en Bogotá y Cali. Tarifa particular desde $90.000.',
          'Dental check-ups, cleanings and basic treatments in Bogotá and Cali. Self-pay rate from COP 90,000.',
        ),
      },
    },
    {
      id: 'svc-fisioterapia',
      type: 'service',
      status: 'published',
      slug: 'fisioterapia',
      author: 'u-valentina',
      createdDaysAgo: 100,
      updatedDaysAgo: 55,
      publishedDaysAgo: 55,
      fields: {
        name: L('Fisioterapia', 'Physical therapy'),
        summary: L('Sesiones de 45 minutos con plan de ejercicios para tu casa.', '45-minute sessions with an at-home exercise plan.'),
        priceFrom: 75000,
        preparation: L('Usa ropa cómoda y trae tus exámenes o la orden médica.', 'Wear comfortable clothes and bring your test results or referral.'),
        image: 'm-fisioterapia',
      },
      seo: {
        title: L('Fisioterapia | Clínicas Montaña Azul', 'Physical therapy | Montaña Azul Clinics'),
        description: L(
          'Sesiones de fisioterapia de 45 minutos en Bogotá y Medellín, con plan de ejercicios para tu casa. Desde $75.000 por sesión.',
          '45-minute physical therapy sessions in Bogotá and Medellín, with an at-home exercise plan. From COP 75,000 per session.',
        ),
      },
    },
    // ---------------------------------------------------------------- Artículos
    {
      id: a1,
      type: 'article',
      status: 'published',
      slug: 'agenda-tu-cita-por-whatsapp',
      author: 'u-valentina',
      createdDaysAgo: 30,
      updatedDaysAgo: 25,
      publishedDaysAgo: 25,
      fields: {
        title: L('Cómo agendar tu cita por WhatsApp en tres pasos', 'How to book your appointment on WhatsApp in three steps'),
        excerpt: L('Escribe a la línea de tu sede, elige el servicio y confirma la hora. Así de simple.', 'Message your location, choose the service and confirm the time. That simple.'),
        category: L('Guías', 'Guides'),
        cover: 'm-chat',
      },
      blocks: [
        P(
          a1,
          '<p>Cada sede tiene su propia línea de WhatsApp, que encuentras en la página de <a href="/sedes">sedes y horarios</a>. Te atiende una persona de nuestro equipo de lunes a sábado.</p>',
          '<p>Each location has its own WhatsApp line, listed on the <a href="/sedes">locations and hours</a> page. A member of our team answers Monday to Saturday.</p>',
        ),
        H(a1, 2, 'Los tres pasos', 'The three steps'),
        P(
          a1,
          '<ol><li>Escribe tu nombre completo y tu número de documento.</li><li>Cuéntanos qué servicio necesitas y en qué sede.</li><li>Elige una de las horas disponibles y recibe la confirmación.</li></ol>',
          '<ol><li>Send your full name and ID number.</li><li>Tell us which service you need and at which location.</li><li>Pick one of the available times and receive the confirmation.</li></ol>',
        ),
        IMG(a1, 'm-chat', 'Te confirmamos la cita en el mismo chat.', 'We confirm your appointment in the same chat.'),
        P(
          a1,
          '<p>Un día antes te enviamos un recordatorio. Si no puedes asistir, respóndelo para liberar el espacio y reprogramar sin costo.</p>',
          '<p>We send you a reminder the day before. If you cannot make it, reply to free up the slot and reschedule at no cost.</p>',
        ),
      ],
      seo: {
        title: L('Agenda tu cita por WhatsApp en tres pasos | Montaña Azul', 'Book your appointment on WhatsApp in three steps | Montaña Azul'),
        description: L(
          'Escribe a la línea de tu sede, elige el servicio y la hora, y recibe la confirmación en el mismo chat. Te recordamos la cita un día antes.',
          'Message your location, choose the service and time, and get the confirmation in the same chat. We remind you the day before.',
        ),
      },
    },
    {
      id: a2,
      type: 'article',
      status: 'published',
      slug: 'que-llevar-a-tu-primera-cita',
      author: 'u-valentina',
      createdDaysAgo: 48,
      updatedDaysAgo: 42,
      publishedDaysAgo: 42,
      fields: {
        title: L('Qué llevar a tu primera cita', 'What to bring to your first appointment'),
        excerpt: L('Documento, exámenes anteriores y la lista de medicamentos que tomas: te contamos por qué.', 'ID, previous test results and the list of medicines you take: here is why.'),
        category: L('Guías', 'Guides'),
        cover: 'm-recepcion',
      },
      blocks: [
        P(
          a2,
          '<p>Llegar preparado hace que la consulta rinda más. Esta es la lista que recomienda nuestro equipo:</p><ul><li>Documento de identidad.</li><li>Exámenes o informes de los últimos seis meses.</li><li>Nombre y dosis de los medicamentos que tomas.</li></ul>',
          '<p>Coming prepared makes the most of your visit. This is the list our team recommends:</p><ul><li>ID document.</li><li>Test results or reports from the last six months.</li><li>Name and dose of the medicines you take.</li></ul>',
        ),
        H(a2, 2, 'Si vas a un examen', 'If you are having a test'),
        P(
          a2,
          '<p>Algunos exámenes piden preparación. Revisa la ficha del servicio, por ejemplo la de <a href="/servicios/ecografia-abdominal">ecografía abdominal</a>, o pregúntanos al agendar.</p>',
          '<p>Some tests require preparation. Check the service page, for example <a href="/servicios/ecografia-abdominal">abdominal ultrasound</a>, or ask us when you book.</p>',
        ),
      ],
      seo: {
        title: L('Qué llevar a tu primera cita | Clínicas Montaña Azul', 'What to bring to your first appointment | Montaña Azul'),
        description: L(
          'Documento, exámenes anteriores y lista de medicamentos: lo que necesitas para que tu primera consulta rinda más.',
          'ID, previous test results and your list of medicines: what you need to make the most of your first visit.',
        ),
      },
    },
    {
      id: a3,
      type: 'article',
      status: 'scheduled',
      slug: 'horarios-especiales-fin-de-ano',
      author: 'u-valentina',
      createdDaysAgo: 6,
      updatedDaysAgo: 2,
      scheduledInDays: 3,
      fields: {
        title: L('Horarios especiales de fin de año', 'Special year-end hours'),
        excerpt: L('Del 24 de diciembre al 1.º de enero atendemos en horario reducido. Consulta tu sede.', 'From December 24 to January 1 we open with reduced hours. Check your location.'),
        category: L('Avisos', 'Announcements'),
        cover: 'm-calendario',
      },
      blocks: [
        P(
          a3,
          '<p>Durante las fiestas atendemos de <strong>8:00 a. m. a 1:00 p. m.</strong> en todas las sedes. El 25 de diciembre y el 1.º de enero las sedes permanecen cerradas.</p>',
          '<p>During the holidays all locations are open from <strong>8:00 a.m. to 1:00 p.m.</strong> Locations are closed on December 25 and January 1.</p>',
        ),
        P(
          a3,
          '<p>Los resultados de laboratorio se siguen enviando a tu correo. Revisa los <a href="/sedes">horarios de cada sede</a> antes de ir.</p>',
          '<p>Lab results are still sent to your email. Check the <a href="/sedes">hours of each location</a> before you go.</p>',
        ),
      ],
      seo: {
        title: L('Horarios especiales de fin de año | Clínicas Montaña Azul', 'Special year-end hours | Montaña Azul Clinics'),
        description: L(
          'Del 24 de diciembre al 1.º de enero atendemos de 8:00 a. m. a 1:00 p. m. El 25 de diciembre y el 1.º de enero las sedes están cerradas.',
          'From December 24 to January 1 we are open from 8:00 a.m. to 1:00 p.m. Locations are closed on December 25 and January 1.',
        ),
      },
    },
    {
      id: a4,
      type: 'article',
      status: 'draft',
      slug: 'nueva-sede-en-bucaramanga',
      author: 'u-valentina',
      createdDaysAgo: 3,
      updatedDaysAgo: 1,
      fields: {
        title: L('Abrimos nueva sede en Bucaramanga', ''),
        excerpt: L('Desde este mes atendemos en Cabecera con medicina general y laboratorio.', ''),
        category: L('Noticias', ''),
        cover: 'm-bucaramanga',
      },
      blocks: [
        P(
          a4,
          '<p>La sede Cabecera es la sexta de la red. Empieza con medicina general y laboratorio clínico, y en los próximos meses sumará ecografía.</p>',
          '',
        ),
      ],
      seo: { title: L('Nueva sede en Bucaramanga', ''), description: L('', '') },
    },
    // ---------------------------------------------------------------- Preguntas frecuentes
    {
      id: 'faq-ecografia',
      type: 'faq',
      status: 'approved',
      slug: 'preparacion-ecografia-abdominal',
      author: 'u-valentina',
      createdDaysAgo: 2,
      updatedDaysAgo: 1,
      fields: {
        question: L('¿Qué preparación necesito para una ecografía abdominal?', 'How do I prepare for an abdominal ultrasound?'),
        answer: L(
          'Necesitas ayuno de 6 horas antes del examen; puedes tomar agua. Si tomas medicamentos, consulta con tu médico. Llega 15 minutos antes con tu documento y la orden médica.',
          'You need to fast for 6 hours before the test; you may drink water. If you take medication, check with your doctor. Arrive 15 minutes early with your ID and referral.',
        ),
        service: 'svc-ecografia',
        assistant: true,
      },
    },
    {
      id: 'faq-whatsapp',
      type: 'faq',
      status: 'published',
      slug: 'agendar-por-whatsapp',
      author: 'u-valentina',
      createdDaysAgo: 40,
      updatedDaysAgo: 25,
      publishedDaysAgo: 25,
      fields: {
        question: L('¿Puedo agendar mi cita por WhatsApp?', 'Can I book my appointment on WhatsApp?'),
        answer: L(
          'Sí. Cada sede tiene su línea de WhatsApp, de lunes a sábado. Escribe tu nombre, documento y el servicio que necesitas, y te confirmamos la hora en el mismo chat.',
          'Yes. Each location has its own WhatsApp line, Monday to Saturday. Send your name, ID and the service you need, and we will confirm the time in the same chat.',
        ),
        service: null,
        assistant: true,
      },
    },
    {
      id: 'faq-documentos',
      type: 'faq',
      status: 'published',
      slug: 'documentos-para-la-cita',
      author: 'u-valentina',
      createdDaysAgo: 45,
      updatedDaysAgo: 42,
      publishedDaysAgo: 42,
      fields: {
        question: L('¿Qué documentos debo llevar a mi cita?', 'What documents should I bring to my appointment?'),
        answer: L(
          'Tu documento de identidad, la orden médica si la tienes y los exámenes de los últimos seis meses relacionados con tu consulta.',
          'Your ID, your referral if you have one and any test results from the last six months related to your visit.',
        ),
        service: 'svc-medicina-general',
        assistant: true,
      },
    },
    {
      id: 'faq-particular',
      type: 'faq',
      status: 'draft',
      slug: 'atencion-particular',
      author: 'u-valentina',
      createdDaysAgo: 1,
      updatedDaysAgo: 0,
      fields: {
        question: L('¿Atienden pacientes particulares, sin EPS?', ''),
        answer: L('Sí. Todas las tarifas particulares están publicadas en la ficha de cada servicio y puedes pagar con tarjeta o transferencia.', ''),
        service: null,
        assistant: false,
      },
    },
  ];
}

function build(spec: Spec, nowMs: number): Entry {
  const content: EntryContent = {
    slug: spec.slug,
    fields: spec.fields,
    blocks: spec.blocks ?? [],
    seo: spec.seo ?? NO_SEO,
  };
  const createdAt = iso(atBogota(nowMs, -spec.createdDaysAgo, 9, 10));
  // "Hoy" = hace hora y media (nunca en el futuro, abras la demo a la hora que sea).
  const updatedAt = spec.updatedDaysAgo === 0 ? iso(nowMs - 90 * 60_000) : iso(atBogota(nowMs, -spec.updatedDaysAgo, 15, 40));
  const publishedAt = spec.publishedDaysAgo !== undefined ? iso(atBogota(nowMs, -spec.publishedDaysAgo, 16, 5)) : null;
  const scheduledAt = spec.scheduledInDays !== undefined ? iso(atBogota(nowMs, spec.scheduledInDays, 7, 0)) : null;
  const copy = () => JSON.parse(JSON.stringify(content)) as EntryContent;
  const versions: Entry['versions'] = [{ id: `${spec.id}-v1`, at: createdAt, by: spec.author, reason: 'created', content: copy() }];
  if (publishedAt) versions.push({ id: `${spec.id}-v2`, at: publishedAt, by: 'u-andres', reason: 'published', content: copy() });
  else if (spec.status !== 'draft') versions.push({ id: `${spec.id}-v2`, at: updatedAt, by: spec.author, reason: 'submitted', content: copy() });
  return {
    id: spec.id,
    type: spec.type,
    status: spec.status,
    content,
    live: publishedAt ? copy() : null,
    authorId: spec.author,
    createdAt,
    updatedAt: publishedAt && publishedAt > updatedAt ? publishedAt : updatedAt,
    updatedBy: publishedAt ? 'u-andres' : spec.author,
    publishedAt,
    scheduledAt,
    reviewNote: null,
    versions,
  };
}

export const DEFAULT_WEBHOOKS: Webhook[] = [
  { id: 'site', url: `https://www.${COMPANY.domain}/api/revalidate`, enabled: true },
  { id: 'app', url: `https://app.${COMPANY.domain}/hooks/content`, enabled: true },
  { id: 'assistant', url: `https://asistente.${COMPANY.domain}/hooks/reindex`, enabled: true },
];

export function buildState(nowMs: number): AppState {
  blockSeq = 0;
  const entries = specs().map((s) => build(s, nowMs));
  return {
    version: STATE_VERSION,
    seededAt: iso(nowMs),
    currentUserId: 'u-valentina',
    people: PEOPLE,
    types: JSON.parse(JSON.stringify(DEFAULT_TYPES)),
    entries,
    media: media(nowMs),
    webhooks: DEFAULT_WEBHOOKS.map((w) => ({ ...w })),
    deliveries: [],
    activity: [],
    tour: { model: false, edit: false, assistant: false, publish: false, rag: false },
  };
}
