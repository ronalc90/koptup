/**
 * Base de conocimiento de ejemplo del Playground (datos de ejemplo).
 *
 * Cuatro empresas FICTICIAS de Colombia (el nombre lleva "Ejemplo" para que no
 * se confunda con ninguna empresa real), cada una con sus documentos internos.
 * Las landings por sector abren la demo con su empresa ya elegida
 * (`/demo/chatbot?empresa=salud|tienda|legal`, ver `RAG_SECTORS` en
 * src/lib/rag-page.ts), y sus "Ejemplo ilustrativo" citan estos mismos textos.
 * El Playground envía estos textos de verdad al backend
 * (`POST /api/chatbot/sample-bots`, bot de ejemplo compartido) y las
 * preguntas se responden con el pipeline real: fragmentación por párrafos → búsqueda BM25 → modelo de
 * OpenAI (o modo extractivo si no hay clave) → citas.
 *
 * Cada párrafo empieza con el número y el nombre de la sección para que el
 * fragmento citado se entienda solo. Las preguntas sugeridas usan palabras que
 * aparecen en el documento (la búsqueda es léxica) y la última de cada empresa
 * está fuera de los documentos a propósito: sirve para ver la respuesta
 * "No encontré esa información".
 *
 * Hay versión en español y en inglés (traducción) para que la búsqueda léxica
 * funcione en el idioma de la interfaz.
 */

export type SampleCompanyKey = 'rrhh' | 'tienda' | 'salud' | 'legal';
export type SampleLocale = 'es' | 'en';

/** Cambia este valor si cambian los textos: obliga a reindexar los bots de ejemplo. */
export const SAMPLE_KB_VERSION = '2026-10-v2';

export interface SampleDocument {
  /** Nombre del archivo que se sube al backend (aparece en las citas). */
  fileName: string;
  /** Texto completo; los párrafos se separan con una línea en blanco. */
  text: string;
}

export interface SampleCompany {
  key: SampleCompanyKey;
  /** Nombre de la empresa ficticia. */
  name: string;
  /** Ciudad y sector, para el selector. */
  city: string;
  sector: string;
  welcome: string;
  /** Instrucciones de rol y tono (el backend agrega siempre sus reglas anti-invención). */
  systemPrompt: string;
  docs: SampleDocument[];
  /** Preguntas sugeridas que sí están en los documentos. */
  questions: string[];
  /** Pregunta fuera de los documentos, para ver "No encontré esa información". */
  outOfScope: string;
}

export const SAMPLE_COMPANY_KEYS: readonly SampleCompanyKey[] = ['rrhh', 'tienda', 'salud', 'legal'];

/** ¿Es una empresa de ejemplo? (valida `?empresa=` de la URL). */
export function isSampleCompanyKey(value: string | null | undefined): value is SampleCompanyKey {
  return !!value && (SAMPLE_COMPANY_KEYS as readonly string[]).includes(value);
}

const ES: Record<SampleCompanyKey, SampleCompany> = {
  rrhh: {
    key: 'rrhh',
    name: 'Logística Ejemplo S.A.S.',
    city: 'Bogotá',
    sector: 'Recursos humanos',
    welcome:
      'Hola, soy el asistente de Gestión Humana de Logística Ejemplo S.A.S. (empresa ficticia). Respondo con su política de vacaciones, el reglamento de trabajo en casa y el manual de beneficios, y te cito la fuente.',
    systemPrompt:
      'Eres el asistente de Gestión Humana de Logística Ejemplo S.A.S., una empresa ficticia de logística en Bogotá. Responde a los colaboradores en frases cortas y claras.',
    docs: [
      {
        fileName: 'Política de vacaciones 2026.txt',
        text: [
          '1. Días de vacaciones. Todo colaborador tiene derecho a 15 días hábiles de vacaciones remuneradas por cada año de servicio, como lo establece el Código Sustantivo del Trabajo. Quienes tienen más de cinco años en la empresa reciben 2 días hábiles adicionales por año, como beneficio extralegal.',
          '2. Cómo solicitar vacaciones. La solicitud se hace en el portal de Gestión Humana con al menos 15 días calendario de anticipación. El jefe inmediato aprueba la fecha o propone otra en un plazo de 3 días hábiles.',
          '3. Fraccionamiento y acumulación. Las vacaciones se pueden tomar en máximo dos bloques, y uno de ellos debe ser de al menos 6 días hábiles. Se pueden acumular hasta por dos años cuando el colaborador y la empresa lo acuerdan por escrito.',
          '4. Pago de las vacaciones. El valor de las vacaciones se paga en la nómina anterior a la fecha de salida. No se compensan en dinero, salvo al terminar el contrato o en los casos que permite la ley.',
          '5. Temporada alta. Del 1 al 31 de diciembre, por la operación de fin de año en las bodegas, cada área puede tener de vacaciones como máximo al 20 % de su equipo al mismo tiempo.',
        ].join('\n\n'),
      },
      {
        fileName: 'Reglamento de trabajo en casa.txt',
        text: [
          '1. Quién puede trabajar en casa. Los cargos administrativos pueden trabajar en casa hasta 2 días por semana, previo acuerdo con su jefe. Los cargos de bodega y de conducción no aplican, por la naturaleza de sus funciones.',
          '2. Horario. El horario es de lunes a viernes de 7:30 a. m. a 5:00 p. m., con una hora de almuerzo. En trabajo en casa se mantiene el mismo horario y el colaborador debe estar disponible en el chat corporativo.',
          '3. Auxilio de conectividad. Quien trabaja en casa al menos 2 días por semana recibe un auxilio de conectividad de COP 90.000 al mes, que se paga con la nómina de la segunda quincena.',
          '4. Equipos. La empresa entrega un portátil y una diadema. El colaborador responde por su cuidado y reporta cualquier daño a Soporte TI en las 24 horas siguientes.',
        ].join('\n\n'),
      },
      {
        fileName: 'Manual de beneficios.txt',
        text: [
          '1. Auxilio educativo. Los colaboradores con más de un año en la empresa pueden pedir un auxilio educativo del 50 % de la matrícula de pregrado, técnica o tecnológica, con un tope de COP 2.000.000 por semestre. La solicitud se radica en Gestión Humana con el recibo de matrícula y el certificado de notas del semestre anterior, con promedio mínimo de 3,5.',
          '2. Día de cumpleaños. Cada colaborador tiene libre el día de su cumpleaños. Si cae en fin de semana o festivo, lo toma el siguiente día hábil.',
          '3. Licencias por nacimiento o adopción. Además de las licencias de maternidad y paternidad que establece la ley, la empresa da 5 días hábiles adicionales remunerados por el nacimiento o la adopción de un hijo.',
          '4. Préstamos a colaboradores. Se pueden solicitar préstamos de libre inversión de hasta dos salarios, sin intereses, que se descuentan por nómina en máximo 12 cuotas.',
        ].join('\n\n'),
      },
    ],
    questions: [
      '¿Cuántos días de vacaciones me corresponden?',
      '¿Con cuánta anticipación debo solicitar las vacaciones?',
      '¿Cómo pido el auxilio educativo?',
      '¿Cuántos días puedo trabajar en casa?',
    ],
    outOfScope: '¿Cuánto gana el gerente general?',
  },
  tienda: {
    key: 'tienda',
    name: 'Hogar Ejemplo Tienda en Línea',
    city: 'Medellín',
    sector: 'Servicio al cliente',
    welcome:
      'Hola, soy el asistente de servicio al cliente de Hogar Ejemplo (tienda en línea ficticia de muebles y decoración). Respondo con sus políticas de cambios y devoluciones, envíos y garantías, y te cito la fuente.',
    systemPrompt:
      'Eres el asistente de servicio al cliente de Hogar Ejemplo, una tienda en línea ficticia de muebles y decoración en Medellín. Responde a los clientes con amabilidad y en frases cortas.',
    docs: [
      {
        fileName: 'Política de cambios y devoluciones.txt',
        text: [
          '1. Derecho de retracto. Si compraste en la tienda en línea, tienes 5 días hábiles desde la entrega para retractarte de la compra, como lo establece el Estatuto del Consumidor (Ley 1480 de 2011). El producto debe estar sin uso, con sus empaques y accesorios. Te devolvemos el dinero en un plazo máximo de 30 días calendario.',
          '2. Cambios por talla, color o gusto. Aceptamos cambios hasta 30 días calendario después de la entrega, con la factura y el producto en perfecto estado. El costo del envío del cambio lo asume el cliente, salvo que el cambio sea por un error nuestro.',
          '3. Productos sin cambio. No se aceptan cambios ni devoluciones de colchones y almohadas abiertos, por higiene, ni de muebles fabricados a la medida.',
          '4. Cómo solicitar un cambio o una devolución. Escribe a servicio al cliente desde la sección Mis pedidos, con el número de pedido y fotos del producto. Te respondemos en máximo 2 días hábiles con la guía de recogida.',
        ].join('\n\n'),
      },
      {
        fileName: 'Envíos y entregas.txt',
        text: [
          '1. Cobertura. Enviamos a todo el país. En Medellín y su área metropolitana la entrega es con transporte propio; en el resto de Colombia, con una transportadora aliada.',
          '2. Tiempos de entrega. Medellín y área metropolitana: 1 a 3 días hábiles. Bogotá, Cali y Barranquilla: 3 a 5 días hábiles. Otros municipios: 5 a 8 días hábiles. Los muebles fabricados a la medida tardan 15 días hábiles más.',
          '3. Costo del envío. El envío es gratis en compras desde COP 250.000. En compras menores, el envío cuesta COP 12.000 en Medellín y COP 18.000 en el resto del país, incluida Bogotá.',
          '4. Recepción del pedido. Revisa el producto al recibirlo. Si llega golpeado o incompleto, anótalo en la guía del transportador y repórtalo dentro de las 48 horas siguientes.',
        ].join('\n\n'),
      },
      {
        fileName: 'Garantías.txt',
        text: [
          '1. Tiempo de garantía. Los muebles tienen 12 meses de garantía por defectos de fabricación, contados desde la entrega. Los electrodomésticos pequeños tienen la garantía del fabricante, que se indica en su ficha.',
          '2. Qué no cubre la garantía. No cubre daños por mal uso, humedad o golpes después de la entrega, ni el desgaste normal de telas y acabados.',
          '3. Cómo hacer efectiva la garantía. Radica la solicitud en Mis pedidos con fotos o un video corto del defecto. Un técnico revisa el caso en máximo 5 días hábiles y, si aplica, reparamos, cambiamos el producto o devolvemos el dinero.',
        ].join('\n\n'),
      },
    ],
    questions: [
      '¿Cuántos días tengo para el retracto de una compra?',
      '¿Cuánto cuesta el envío a Bogotá?',
      '¿Aceptan cambios de colchones?',
      '¿Cuánto dura la garantía de los muebles?',
    ],
    outOfScope: '¿Venden bicicletas eléctricas?',
  },
  salud: {
    key: 'salud',
    name: 'IPS Ejemplo Salud',
    city: 'Cali',
    sector: 'Salud',
    welcome:
      'Hola, soy el asistente de IPS Ejemplo Salud (IPS ficticia). A los pacientes les respondo con las guías de preparación de exámenes, citas y autorizaciones, y derechos y deberes del paciente; al área de cuentas médicas, con su manual de radicación y glosas. Siempre te cito la fuente.',
    systemPrompt:
      'Eres el asistente de IPS Ejemplo Salud, una IPS ficticia en Cali: atiendes a los pacientes y al área de cuentas médicas. Responde con un tono cálido y claro. No des diagnósticos ni recomendaciones médicas que no estén en los documentos.',
    docs: [
      {
        fileName: 'Preparación de exámenes.txt',
        text: [
          '1. Glicemia en ayunas y perfil lipídico. Debes tener un ayuno de 8 a 12 horas; puedes tomar agua. Toma tus medicamentos habituales después de la muestra, salvo que tu médico indique otra cosa. La toma de muestras es de lunes a sábado de 6:00 a 9:30 a. m.',
          '2. Colonoscopia. El día anterior sigue una dieta líquida clara (caldos colados, gelatina, agua y jugos sin pulpa) y toma el laxante formulado según las instrucciones de tu médico. Ven con un acompañante adulto, porque el procedimiento se hace con sedación y no puedes conducir ese día.',
          '3. Ecografía abdominal y pélvica. Para la ecografía abdominal ven con 6 horas de ayuno. Para la ecografía pélvica, toma 4 vasos de agua una hora antes y no orines hasta después del examen.',
          '4. Parcial de orina. Recoge la primera orina de la mañana en el frasco estéril, después de lavar el área genital, y entrega la muestra en el laboratorio antes de 2 horas.',
        ].join('\n\n'),
      },
      {
        fileName: 'Citas y autorizaciones.txt',
        text: [
          '1. Cómo pedir una cita. Pide tu cita por la línea de atención, de lunes a viernes de 7:00 a. m. a 6:00 p. m., o por la página web en cualquier horario. Para medicina especializada necesitas la orden de tu médico.',
          '2. Documentos para la cita. Trae tu documento de identidad, la autorización vigente de tu EPS cuando el servicio la requiera y la orden médica. Llega 20 minutos antes para el registro en admisiones.',
          '3. Cancelar o reprogramar. Si no puedes asistir, cancela con al menos 24 horas de anticipación por la línea de atención o la página web, para que otro paciente pueda usar el turno.',
          '4. Entrega de resultados. Los resultados de laboratorio se publican en el portal de pacientes en 1 a 3 días hábiles. Las imágenes diagnósticas tienen lectura en máximo 5 días hábiles.',
        ].join('\n\n'),
      },
      {
        fileName: 'Derechos y deberes del paciente.txt',
        text: [
          '1. Derechos del paciente. Recibir atención digna y oportuna, información clara sobre tu diagnóstico y tratamiento, protección de la confidencialidad de tu historia clínica y la posibilidad de presentar peticiones, quejas, reclamos y sugerencias (PQRS).',
          '2. Deberes del paciente. Dar información veraz sobre tu estado de salud, cumplir las citas o cancelarlas a tiempo, tratar con respeto al personal y a los demás pacientes, y cuidar las instalaciones.',
          '3. PQRS. Puedes radicar una petición, queja, reclamo o sugerencia en el buzón de cada sede, en la página web o en la oficina de atención al usuario. Te respondemos en máximo 15 días hábiles.',
        ].join('\n\n'),
      },
      {
        fileName: 'Manual de cuentas médicas (ejemplo).txt',
        text: [
          '1. Radicación de facturas. El área de cuentas médicas radica cada factura ante la EPS con sus soportes (orden médica, autorización y resumen de la atención) dentro de los 5 días hábiles siguientes al egreso del paciente.',
          '2. Glosa por falta de autorización. Si la EPS glosa una factura por falta de autorización, el auditor busca la autorización en el sistema de admisiones y la adjunta a la respuesta. Si no la encuentra, escala el caso a la coordinación de admisiones.',
          '3. Glosa por tarifa. Si la glosa es por diferencia de tarifa, el auditor compara el valor facturado con el tarifario pactado en el contrato vigente con esa EPS y adjunta a la respuesta la página del contrato.',
          '4. Plazo interno para responder una glosa. El equipo de cuentas médicas responde cada glosa dentro de los 10 días hábiles siguientes a su recepción, para cumplir con holgura los plazos del contrato con la EPS.',
          '5. Conciliación. Las glosas que no se aceptan ni se levantan pasan a la mesa de conciliación mensual con la EPS, que coordina la jefatura de cuentas médicas.',
        ].join('\n\n'),
      },
    ],
    questions: [
      '¿Qué preparación necesito para una colonoscopia?',
      '¿Cuántas horas de ayuno necesito para la glicemia?',
      '¿Qué documentos llevo a la cita?',
      '¿Cuál es el plazo interno para responder una glosa?',
    ],
    outOfScope: '¿Atienden urgencias pediátricas?',
  },
  legal: {
    key: 'legal',
    name: 'Firma Ejemplo Abogados S.A.S.',
    city: 'Bogotá',
    sector: 'Legal',
    welcome:
      'Hola, soy el asistente interno de Firma Ejemplo Abogados (firma ficticia). Respondo con su contrato modelo de prestación de servicios y su manual interno de expedientes, y te cito la cláusula o la sección.',
    systemPrompt:
      'Eres el asistente interno de Firma Ejemplo Abogados, una firma ficticia en Bogotá. Responde a los abogados de la firma en frases cortas y cita la cláusula. No des opiniones jurídicas que no estén en los documentos.',
    docs: [
      {
        fileName: 'Contrato de prestación de servicios (modelo).txt',
        text: [
          'Cláusula 1. Objeto. El contratista presta al cliente servicios de asesoría en gestión documental, según la propuesta técnica anexa, que hace parte del contrato.',
          'Cláusula 2. Duración y renovación. El contrato dura 12 meses desde la firma del acta de inicio. Se renueva por periodos iguales si ninguna de las partes avisa por escrito su intención de no renovarlo con al menos 30 días calendario de anticipación.',
          'Cláusula 3. Valor y forma de pago. El cliente paga una suma mensual fija dentro de los 30 días calendario siguientes a la radicación de la factura electrónica.',
          'Cláusula 4. Confidencialidad. Las partes guardan reserva de la información que conozcan por causa del contrato. Esta obligación se mantiene durante el contrato y hasta 3 años después de su terminación.',
          'Cláusula 5. Cláusula penal. Si una de las partes incumple sus obligaciones, paga a la otra, a título de pena, una suma equivalente al 20 % del valor total del contrato, sin perjuicio de la indemnización de los perjuicios que se prueben.',
          'Cláusula 6. Terminación anticipada. Cualquiera de las partes puede terminar el contrato antes de su vencimiento avisando por escrito con 60 días calendario de anticipación. El cliente paga los servicios prestados hasta la fecha de terminación.',
          'Cláusula 7. Solución de controversias. Las diferencias se intentan resolver primero en una reunión de arreglo directo dentro de los 15 días hábiles siguientes a la reclamación escrita; si no hay acuerdo, las partes acuden a un centro de conciliación de Bogotá.',
        ].join('\n\n'),
      },
      {
        fileName: 'Manual interno de expedientes.txt',
        text: [
          '1. Apertura del expediente. Cada asunto nuevo se abre en el sistema documental de la firma el mismo día en que se firma el poder o el contrato con el cliente, con un número consecutivo por año.',
          '2. Acceso. Solo el socio a cargo, los abogados asignados y el área de archivo pueden consultar un expediente. Los practicantes acceden con la autorización escrita del socio a cargo.',
          '3. Términos. El abogado asignado registra cada término en el calendario compartido el mismo día en que recibe la notificación, con una alerta 5 días hábiles antes del vencimiento.',
          '4. Conservación. Los expedientes cerrados se conservan en el archivo digital durante 10 años desde el cierre del asunto. Después se revisan con el socio a cargo antes de eliminarlos.',
        ].join('\n\n'),
      },
    ],
    questions: [
      '¿Cuál es el valor de la cláusula penal del contrato?',
      '¿Cuánto dura la obligación de confidencialidad?',
      '¿Con cuánta anticipación se avisa la terminación anticipada?',
      '¿Cuánto tiempo se conservan los expedientes cerrados?',
    ],
    outOfScope: '¿Qué dice la Corte Suprema en sentencias recientes?',
  },
};

/*
 * Versión en inglés: traducción de los mismos documentos ficticios, escrita en
 * tercera persona para que la búsqueda léxica no coincida por palabras como
 * "you" con preguntas que no están en los documentos.
 */
const EN: Record<SampleCompanyKey, SampleCompany> = {
  rrhh: {
    key: 'rrhh',
    name: 'Logística Ejemplo S.A.S.',
    city: 'Bogotá',
    sector: 'Human resources',
    welcome:
      'Hi, I am the HR assistant of Logística Ejemplo S.A.S. (a fictitious company). I answer with its vacation policy, remote work rules and benefits handbook, and I cite the source.',
    systemPrompt:
      'You are the HR assistant of Logística Ejemplo S.A.S., a fictitious logistics company in Bogotá. Answer employees in short, clear sentences.',
    docs: [
      {
        fileName: 'Vacation policy 2026.txt',
        text: [
          '1. Vacation days. Every employee is entitled to 15 paid working days of vacation per year of service, as established by the Colombian Labor Code. Employees with more than five years at the company receive 2 additional working days per year as an extra benefit.',
          '2. How to request vacation. Requests are made on the HR portal at least 15 calendar days in advance. The direct supervisor approves the date or proposes another one within 3 working days.',
          '3. Splitting and carrying over. Vacation can be taken in at most two blocks, and one of them must be at least 6 working days long. Vacation can be carried over for up to two years when the employee and the company agree in writing.',
          '4. Vacation pay. Vacation pay is included in the payroll before the start date. Unused vacation is not paid out in cash, except when the contract ends or in the cases allowed by law.',
          '5. Peak season. From December 1 to 31, because of the year-end warehouse operation, each area can have at most 20% of its team on vacation at the same time.',
        ].join('\n\n'),
      },
      {
        fileName: 'Remote work rules.txt',
        text: [
          '1. Eligibility for remote work. Administrative roles can work remotely up to 2 days per week, with the supervisor’s approval. Warehouse and driver roles are not eligible due to the nature of their duties.',
          '2. Working hours. Working hours are Monday to Friday from 7:30 a.m. to 5:00 p.m., with a one-hour lunch break. Remote workers keep the same schedule and must be available on the corporate chat.',
          '3. Connectivity allowance. Employees who work remotely at least 2 days per week receive a connectivity allowance of COP 90,000 per month, paid with the second payroll of the month.',
          '4. Equipment. The company provides a laptop and a headset. Employees are responsible for their care and must report any damage to IT Support within 24 hours.',
        ].join('\n\n'),
      },
      {
        fileName: 'Benefits handbook.txt',
        text: [
          '1. Education allowance. Employees with more than one year at the company can request an education allowance covering 50% of undergraduate, technical or technological tuition, capped at COP 2,000,000 per semester. Requests are filed with HR along with the tuition receipt and the previous semester grade report, with a minimum average of 3.5.',
          '2. Birthday day off. Every employee gets their birthday off. When it falls on a weekend or holiday, the next working day is taken instead.',
          '3. Birth or adoption leave. In addition to the maternity and paternity leave established by law, the company grants 5 additional paid working days for the birth or adoption of a child.',
          '4. Employee loans. Employees can request interest-free personal loans of up to two salaries, deducted from payroll in at most 12 installments.',
        ].join('\n\n'),
      },
    ],
    questions: [
      'How many vacation days per year of service?',
      'How far in advance must vacation be requested?',
      'How to request the education allowance?',
      'How many days per week is remote work allowed?',
    ],
    outOfScope: "General manager's salary?",
  },
  tienda: {
    key: 'tienda',
    name: 'Hogar Ejemplo Online Store',
    city: 'Medellín',
    sector: 'Customer service',
    welcome:
      'Hi, I am the customer service assistant of Hogar Ejemplo (a fictitious online furniture and home decor store). I answer with its returns, shipping and warranty policies, and I cite the source.',
    systemPrompt:
      'You are the customer service assistant of Hogar Ejemplo, a fictitious online furniture and home decor store in Medellín. Answer customers kindly and in short sentences.',
    docs: [
      {
        fileName: 'Exchanges and returns policy.txt',
        text: [
          '1. Right of withdrawal. Customers who bought in the online store have 5 working days from delivery to withdraw from the purchase, as established by the Colombian Consumer Statute (Law 1480 of 2011). The product must be unused, with its packaging and accessories. Refunds are made within 30 calendar days.',
          '2. Exchanges for size, color or preference. Exchanges are accepted up to 30 calendar days after delivery, with the invoice and the product in perfect condition. The customer pays the exchange shipping, unless the exchange is due to a store error.',
          '3. Products without exchange. Opened mattresses and pillows cannot be exchanged or returned for hygiene reasons, nor can custom-made furniture.',
          '4. How to request an exchange or a return. Customers write to customer service from the My orders section, with the order number and photos of the product. The store replies within 2 working days with the pickup label.',
        ].join('\n\n'),
      },
      {
        fileName: 'Shipping and delivery.txt',
        text: [
          '1. Coverage. Orders ship nationwide. In Medellín and its metropolitan area deliveries use the store’s own transport; in the rest of Colombia, a partner carrier.',
          '2. Delivery times. Medellín and metropolitan area: 1 to 3 working days. Bogotá, Cali and Barranquilla: 3 to 5 working days. Other towns: 5 to 8 working days. Custom-made furniture takes 15 more working days.',
          '3. Shipping cost. Shipping is free on purchases from COP 250,000. On smaller purchases, shipping costs COP 12,000 in Medellín and COP 18,000 in the rest of the country, including Bogotá.',
          '4. Receiving the order. Customers check the product on delivery. If it arrives damaged or incomplete, they write it on the carrier’s waybill and report it within 48 hours.',
        ].join('\n\n'),
      },
      {
        fileName: 'Warranties.txt',
        text: [
          '1. Warranty period. Furniture has a 12-month warranty against manufacturing defects, counted from delivery. Small appliances carry the manufacturer’s warranty, shown on their product sheet.',
          '2. What the warranty does not cover. It does not cover damage from misuse, moisture or impacts after delivery, nor normal wear of fabrics and finishes.',
          '3. How to claim the warranty. Customers file the claim in My orders with photos or a short video of the defect. A technician reviews the case within 5 working days and, when it applies, the store repairs or replaces the product or refunds the money.',
        ].join('\n\n'),
      },
    ],
    questions: [
      'How many days for the right of withdrawal?',
      'How much is shipping to Bogotá?',
      'Can opened mattresses be exchanged?',
      'How long is the furniture warranty?',
    ],
    outOfScope: 'Electric bicycles?',
  },
  salud: {
    key: 'salud',
    name: 'IPS Ejemplo Salud',
    city: 'Cali',
    sector: 'Healthcare',
    welcome:
      'Hi, I am the assistant of IPS Ejemplo Salud (a fictitious healthcare provider). I answer patients with its exam preparation guides, appointments and authorizations, and patient rights and duties, and the medical claims team with its filing and denials manual. I always cite the source.',
    systemPrompt:
      'You are the assistant of IPS Ejemplo Salud, a fictitious healthcare provider in Cali: you help patients and the medical claims team. Answer warmly and clearly. Do not give diagnoses or medical advice that is not in the documents.',
    docs: [
      {
        fileName: 'Exam preparation.txt',
        text: [
          '1. Fasting glucose and lipid profile. Patients must fast for 8 to 12 hours; drinking water is allowed. Usual medication is taken after the sample, unless the doctor says otherwise. Samples are taken Monday to Saturday from 6:00 to 9:30 a.m.',
          '2. Colonoscopy. The day before, patients follow a clear liquid diet (strained broth, gelatin, water and pulp-free juice) and take the prescribed laxative following the doctor’s instructions. An adult companion is required, because the procedure is done under sedation and driving is not allowed that day.',
          '3. Abdominal and pelvic ultrasound. Abdominal ultrasound requires 6 hours of fasting. For a pelvic ultrasound, patients drink 4 glasses of water one hour before and do not urinate until after the exam.',
          '4. Urinalysis. Patients collect the first morning urine in the sterile container, after washing the genital area, and deliver the sample to the laboratory within 2 hours.',
        ].join('\n\n'),
      },
      {
        fileName: 'Appointments and authorizations.txt',
        text: [
          '1. Booking an appointment. Appointments are booked through the service line, Monday to Friday from 7:00 a.m. to 6:00 p.m., or on the website at any time. Specialist appointments require a referral from the doctor.',
          '2. Documents for the appointment. Patients bring their ID, the valid authorization from their EPS health insurer when the service requires it, and the medical order. Arrival 20 minutes early is required for check-in.',
          '3. Cancelling or rescheduling. Patients who cannot attend cancel at least 24 hours in advance through the service line or the website, so another patient can use the slot.',
          '4. Test results. Laboratory results are published on the patient portal within 1 to 3 working days. Diagnostic imaging reports are ready within 5 working days.',
        ].join('\n\n'),
      },
      {
        fileName: 'Patient rights and duties.txt',
        text: [
          '1. Patient rights. Dignified and timely care, clear information about diagnosis and treatment, confidentiality of the medical record and the option to file requests, complaints, claims and suggestions (PQRS).',
          '2. Patient duties. Giving truthful information about one’s health, attending appointments or cancelling them on time, treating staff and other patients with respect, and taking care of the facilities.',
          '3. PQRS. Requests, complaints, claims or suggestions can be filed in the box at each site, on the website or at the patient service office. Responses are given within 15 working days.',
        ].join('\n\n'),
      },
      {
        fileName: 'Medical claims manual (sample).txt',
        text: [
          '1. Filing invoices. The medical claims team files each invoice with the EPS together with its supporting documents (medical order, authorization and care summary) within 5 working days after the patient is discharged.',
          '2. Denial for missing authorization. When the EPS denies an invoice for missing authorization, the auditor looks for the authorization in the admissions system and attaches it to the reply. If it cannot be found, the case is escalated to the admissions coordinator.',
          '3. Denial for rates. When the denial is about a rate difference, the auditor compares the billed amount with the fee schedule agreed in the current contract with that EPS and attaches the contract page to the reply.',
          '4. Internal deadline to answer a denial. The medical claims team answers each denial within 10 working days of receiving it, to meet the deadlines in the EPS contract with time to spare.',
          '5. Reconciliation. Denials that are neither accepted nor lifted go to the monthly reconciliation meeting with the EPS, coordinated by the head of medical claims.',
        ].join('\n\n'),
      },
    ],
    questions: [
      'What preparation is needed for a colonoscopy?',
      'How many hours of fasting for the glucose test?',
      'Which documents to bring to the appointment?',
      'What is the internal deadline to answer a denial?',
    ],
    outOfScope: 'Pediatric emergencies?',
  },
  legal: {
    key: 'legal',
    name: 'Firma Ejemplo Abogados S.A.S.',
    city: 'Bogotá',
    sector: 'Legal',
    welcome:
      'Hi, I am the internal assistant of Firma Ejemplo Abogados (a fictitious law firm). I answer with its model service agreement and its internal case file manual, and I cite the clause or section.',
    systemPrompt:
      'You are the internal assistant of Firma Ejemplo Abogados, a fictitious law firm in Bogotá. Answer the firm’s lawyers in short sentences and cite the clause. Do not give legal opinions that are not in the documents.',
    docs: [
      {
        fileName: 'Service agreement (model).txt',
        text: [
          'Clause 1. Purpose. The contractor provides the client with document management advisory services, as described in the attached technical proposal, which is part of the agreement.',
          'Clause 2. Term and renewal. The agreement lasts 12 months from the signing of the start record. It renews for equal periods unless either party gives written notice of non-renewal at least 30 calendar days in advance.',
          'Clause 3. Fee and payment terms. The client pays a fixed monthly amount within 30 calendar days after the electronic invoice is filed.',
          'Clause 4. Confidentiality. The parties keep confidential the information they learn because of the agreement. This obligation lasts for the term of the agreement and for 3 years after its termination.',
          'Clause 5. Penalty clause. If a party breaches its obligations, it pays the other party, as a penalty, an amount equal to 20% of the total value of the agreement, without prejudice to compensation for proven damages.',
          'Clause 6. Early termination. Either party may terminate the agreement before its expiry with 60 calendar days of written notice. The client pays for the services provided up to the termination date.',
          'Clause 7. Dispute resolution. Disagreements are first addressed in a direct settlement meeting within 15 working days after the written claim; if there is no agreement, the parties go to a conciliation center in Bogotá.',
        ].join('\n\n'),
      },
      {
        fileName: 'Internal case file manual.txt',
        text: [
          '1. Opening a case file. Each new matter is opened in the firm’s document system on the same day the power of attorney or the client agreement is signed, with a consecutive number per year.',
          '2. Access. Only the partner in charge, the assigned lawyers and the records team can view a case file. Interns need written authorization from the partner in charge.',
          '3. Deadlines. The assigned lawyer records each deadline in the shared calendar on the same day the notice is received, with an alert 5 working days before it expires.',
          '4. Retention. Closed case files are kept in the digital archive for 10 years after the matter closes. After that, they are reviewed with the partner in charge before deletion.',
        ].join('\n\n'),
      },
    ],
    questions: [
      'What is the penalty clause amount?',
      'How long does the confidentiality obligation last?',
      'How much notice for early termination?',
      'How long are closed case files kept?',
    ],
    outOfScope: 'Recent Supreme Court rulings?',
  },
};

export function getSampleCompany(key: SampleCompanyKey, locale: SampleLocale): SampleCompany {
  return (locale === 'en' ? EN : ES)[key];
}

export function getSampleCompanies(locale: SampleLocale): SampleCompany[] {
  return SAMPLE_COMPANY_KEYS.map((k) => getSampleCompany(k, locale));
}

/** Párrafos de un documento (mismo criterio de separación que usa el backend). */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Busca el documento de ejemplo por nombre de archivo (para abrir la fuente citada). */
export function findSampleDocument(company: SampleCompany, fileName: string): SampleDocument | undefined {
  return company.docs.find((d) => d.fileName === fileName);
}
