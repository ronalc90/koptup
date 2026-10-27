/**
 * Textos de ejemplo de la demo en español e inglés: casos de la cola,
 * políticas de la plataforma ficticia, apelaciones, registros de auditoría y
 * el conjunto de evaluación etiquetado a mano. Son ficticios y están
 * saneados: los insultos, los grupos y los datos de contacto van enmascarados
 * («[insulto]», «[grupo]», «3XX XXX XXXX», «[correo]»).
 */
import type { Bilingual, CategoryKey, Channel, ContentType, Label, PlatformId, Reporter } from './types';

export interface SampleCase {
  id: string;
  type: ContentType;
  /** Lo que lee el clasificador: el texto, o la descripción/transcripción de ejemplo. */
  content: Bilingual;
  /** Categoría esperada (la usa el conjunto de evaluación). */
  expected: Label;
  platforms: PlatformId[];
  user: string;
  channel: Channel;
  reporter: Reporter;
  strikes: number;
  accountAgeDays: number;
  minutesAgo: number;
  sensitive: boolean;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'c-2041',
    type: 'text',
    content: {
      es: 'Escríbeme al 3XX XXX XXXX y te lo dejo más barato; pagas por fuera y nos ahorramos la comisión.',
      en: "Text me at 3XX XXX XXXX and I'll sell it cheaper; pay me outside the app and we skip the fee.",
    },
    expected: 'offPlatform',
    platforms: ['marketplace', 'fintech'],
    user: '@ventas_bici_cali',
    channel: 'listing',
    reporter: 'auto',
    strikes: 1,
    accountAgeDays: 140,
    minutesAgo: 12,
    sensitive: false,
  },
  {
    id: 'c-2042',
    type: 'text',
    content: {
      es: 'Gana $ 3.000.000 semanales desde casa y sin experiencia. Solo envía $ 50.000 para el kit de bienvenida y empiezas hoy.',
      en: 'Earn $3,000,000 a week from home, no experience needed. Just send $50,000 for the welcome kit and start today.',
    },
    expected: 'scam',
    platforms: ['jobs', 'marketplace'],
    user: '@empleos_ya_2026',
    channel: 'jobs',
    reporter: 'user',
    strikes: 3,
    accountAgeDays: 6,
    minutesAgo: 18,
    sensitive: false,
  },
  {
    id: 'c-2043',
    type: 'image',
    content: {
      es: 'Volante en la foto del aviso. Texto detectado: «Préstamos sin papeleo y sin centrales de riesgo. Cobro diario. Llama al 3XX XXX XXXX».',
      en: 'Flyer in the listing photo. Detected text: «Loans with no paperwork, no credit bureau check. Daily collection. Call 3XX XXX XXXX».',
    },
    expected: 'illegalLending',
    platforms: ['marketplace', 'fintech'],
    user: '@creditos_rapidos_bq',
    channel: 'listing',
    reporter: 'trusted',
    strikes: 0,
    accountAgeDays: 3,
    minutesAgo: 26,
    sensitive: false,
  },
  {
    id: 'c-2044',
    type: 'text',
    content: {
      es: 'La misma reseña de 5 estrellas («Excelente vendedor, 100 % recomendado») publicada por 5 cuentas creadas hoy.',
      en: 'The same review, 5 stars («Great seller, 100% recommended»), posted by 5 accounts created today.',
    },
    expected: 'fakeReview',
    platforms: ['marketplace'],
    user: '@tienda_celulares_med',
    channel: 'reviews',
    reporter: 'auto',
    strikes: 0,
    accountAgeDays: 210,
    minutesAgo: 34,
    sensitive: false,
  },
  {
    id: 'c-2045',
    type: 'text',
    content: {
      es: 'Eres un [insulto] y todo el mundo lo sabe; mejor lárgate del foro.',
      en: "You're a [insult] and everyone knows it; better get lost from this forum.",
    },
    expected: 'harassment',
    platforms: ['media'],
    user: '@lector_indignado',
    channel: 'comments',
    reporter: 'user',
    strikes: 2,
    accountAgeDays: 400,
    minutesAgo: 9,
    sensitive: false,
  },
  {
    id: 'c-2046',
    type: 'text',
    content: {
      es: 'Esa gente de [grupo] es una plaga y no debería poder vivir en este país.',
      en: "Those [group] people are a plague and shouldn't be allowed to live in this country.",
    },
    expected: 'hate',
    platforms: ['media'],
    user: '@opinion_sin_filtro',
    channel: 'comments',
    reporter: 'user',
    strikes: 1,
    accountAgeDays: 75,
    minutesAgo: 41,
    sensitive: true,
  },
  {
    id: 'c-2047',
    type: 'text',
    content: {
      es: 'Hola, soy tu nuevo tutor. Escríbeme por interno a mi número personal y no le cuentes a tus papás ni al profe.',
      en: "Hi, I'm your new tutor. Message me privately on my personal number and don't tell your parents or the teacher.",
    },
    expected: 'minors',
    platforms: ['education'],
    user: '@tutor_mate_10',
    channel: 'chat',
    reporter: 'auto',
    strikes: 0,
    accountAgeDays: 2,
    minutesAgo: 5,
    sensitive: true,
  },
  {
    id: 'c-2048',
    type: 'image',
    content: {
      es: 'Foto de perfil con desnudez explícita (marcador ilustrativo: la demo no muestra imágenes reales).',
      en: 'Profile photo with explicit nudity (illustrative placeholder: the demo shows no real images).',
    },
    expected: 'sexual',
    platforms: ['marketplace', 'media', 'education', 'fintech', 'jobs'],
    user: '@nuevo_usuario_8841',
    channel: 'profile',
    reporter: 'auto',
    strikes: 0,
    accountAgeDays: 1,
    minutesAgo: 22,
    sensitive: true,
  },
  {
    id: 'c-2049',
    type: 'text',
    content: {
      es: 'Ya no aguanto más; a veces pienso que sería mejor no despertar.',
      en: "I can't take it anymore; sometimes I think it would be better not to wake up.",
    },
    expected: 'selfHarm',
    platforms: ['media', 'education'],
    user: '@cielo_gris',
    channel: 'forum',
    reporter: 'user',
    strikes: 0,
    accountAgeDays: 520,
    minutesAgo: 3,
    sensitive: true,
  },
  {
    id: 'c-2050',
    type: 'text',
    content: {
      es: 'Usuario «Soporte_Oficial_Billetera» escribe: «Hola, somos la mesa de ayuda oficial. Para desbloquear tu cuenta envíanos el código que te llegó por SMS».',
      en: 'User «Support_Official_Wallet» writes: «Hi, this is the official help desk. To unlock your account, send us the code you got by SMS».',
    },
    expected: 'impersonation',
    platforms: ['fintech', 'marketplace'],
    user: '@Soporte_Oficial_Billetera',
    channel: 'support',
    reporter: 'user',
    strikes: 0,
    accountAgeDays: 1,
    minutesAgo: 15,
    sensitive: false,
  },
  {
    id: 'c-2051',
    type: 'audio',
    content: {
      es: 'Transcripción de la nota de voz: «Si no me devuelves la plata, te voy a buscar. Sé dónde vives».',
      en: "Voice note transcript: «If you don't give me back the money, I'm going to find you. I know where you live».",
    },
    expected: 'harassment',
    platforms: ['marketplace', 'fintech'],
    user: '@comprador_bog_77',
    channel: 'chat',
    reporter: 'user',
    strikes: 1,
    accountAgeDays: 95,
    minutesAgo: 30,
    sensitive: false,
  },
  {
    id: 'c-2052',
    type: 'video',
    content: {
      es: 'Transcripción del video (15 s): «Invierte hoy y duplica tu plata en 7 días. Rentabilidad garantizada. Link en mi perfil: bit.ly/xxxx».',
      en: 'Video transcript (15 s): «Invest today and double your money in 7 days. Guaranteed returns. Link in my profile: bit.ly/xxxx».',
    },
    expected: 'scam',
    platforms: ['media', 'fintech'],
    user: '@trader_millonario',
    channel: 'comments',
    reporter: 'trusted',
    strikes: 2,
    accountAgeDays: 20,
    minutesAgo: 48,
    sensitive: false,
  },
  {
    id: 'c-2053',
    type: 'text',
    content: {
      es: '¡¡¡OFERTA OFERTA OFERTA!!! Entra ya a bit.ly/xxxx y gana premios.',
      en: '!!!DEAL DEAL DEAL!!! Join now at bit.ly/xxxx and win prizes.',
    },
    expected: 'spam',
    platforms: ['marketplace', 'media'],
    user: '@promo_flash_co',
    channel: 'comments',
    reporter: 'auto',
    strikes: 4,
    accountAgeDays: 9,
    minutesAgo: 52,
    sensitive: false,
  },
  {
    id: 'c-2054',
    type: 'text',
    content: {
      es: '¿El precio es negociable? Te puedo pagar contraentrega aquí en Medellín.',
      en: 'Is the price negotiable? I can pay cash on delivery here in Medellín.',
    },
    expected: 'none',
    platforms: ['marketplace'],
    user: '@compras_laureles',
    channel: 'chat',
    reporter: 'user',
    strikes: 0,
    accountAgeDays: 860,
    minutesAgo: 57,
    sensitive: false,
  },
  {
    id: 'c-2055',
    type: 'text',
    content: {
      es: 'Se busca mesera: solo mujeres solteras menores de 25 años. Enviar foto de cuerpo entero.',
      en: 'Waitress wanted: women only, single, under 25. Send a full-body photo.',
    },
    expected: 'hate',
    platforms: ['jobs'],
    user: '@restaurante_el_fogon',
    channel: 'jobs',
    reporter: 'user',
    strikes: 0,
    accountAgeDays: 300,
    minutesAgo: 66,
    sensitive: false,
  },
  {
    id: 'c-2056',
    type: 'text',
    content: {
      es: 'El profe de mate es un inútil; ojalá lo echen.',
      en: 'The math teacher is useless; I hope they fire him.',
    },
    expected: 'harassment',
    platforms: ['education'],
    user: '@estudiante_11b',
    channel: 'forum',
    reporter: 'user',
    strikes: 0,
    accountAgeDays: 180,
    minutesAgo: 38,
    sensitive: false,
  },
  {
    id: 'c-2057',
    type: 'text',
    content: {
      es: 'Para la entrevista escríbeme a mi correo personal [correo] y seguimos por fuera de la plataforma.',
      en: "For the interview, message me at my personal email [email] and we'll continue outside the platform.",
    },
    expected: 'offPlatform',
    platforms: ['jobs'],
    user: '@reclutador_independiente',
    channel: 'jobs',
    reporter: 'auto',
    strikes: 1,
    accountAgeDays: 14,
    minutesAgo: 71,
    sensitive: false,
  },
];

/**
 * Política de la plataforma ficticia, un apartado por categoría. Se muestra
 * en el detalle de cada caso y es la base de conocimiento de «Explicar con IA».
 */
export const POLICIES: Record<CategoryKey, Bilingual> = {
  minors: {
    es: 'Protección de menores. Prohibido que un adulto contacte a un menor para pedirle pasar a un chat privado, encuentros a solas, fotos o secretos con sus padres o profesores. Acción: escalar de inmediato al equipo de protección de menores, suspender la cuenta mientras se revisa y conservar la evidencia para las autoridades.',
    en: 'Child protection. An adult may not contact a minor to ask them to move to a private chat, meet alone, send photos or keep secrets from their parents or teachers. Action: escalate immediately to the child protection team, suspend the account while it is reviewed and keep the evidence for the authorities.',
  },
  selfHarm: {
    es: 'Autolesión. Las publicaciones donde alguien expresa que quiere hacerse daño o no seguir viviendo no se castigan: se revisan con prioridad. Acción: revisión humana prioritaria, mensaje de apoyo con las líneas de ayuda que configure la plataforma y no retirar el contenido sin hablar con la persona.',
    en: 'Self-harm. Posts where someone says they want to hurt themselves or stop living are not punished: they are reviewed with priority. Action: priority human review, a support message with the help lines the platform configures, and do not remove the content without reaching out to the person.',
  },
  sexual: {
    es: 'Contenido sexual. Prohibidas la desnudez explícita, la pornografía y la venta de «packs» o fotos íntimas. El desnudo artístico o educativo se revisa según el contexto. Acción: retirar el contenido; si se repite, suspender la cuenta.',
    en: 'Sexual content. Explicit nudity, pornography and selling nudes or intimate photos are prohibited. Artistic or educational nudity is reviewed in context. Action: remove the content; if it happens again, suspend the account.',
  },
  hate: {
    es: 'Discurso de odio o discriminación. Prohibido atacar o excluir a personas por su origen, religión, género, orientación, discapacidad o edad, llamarlas plaga o animales, y publicar ofertas de empleo que discriminen. Acción: retirar el contenido y advertir; si se repite, suspender.',
    en: 'Hate speech or discrimination. Attacking or excluding people because of their origin, religion, gender, orientation, disability or age, calling them a plague or animals, and posting discriminatory job offers are prohibited. Action: remove the content and warn; if it happens again, suspend.',
  },
  harassment: {
    es: 'Acoso, insultos o amenazas. Prohibido insultar a otra persona, decirle que se vaya, amenazarla o decirle que sabes dónde vive. La crítica a una opinión o a un servicio sí se permite. Acción: retirar el contenido y advertir; las amenazas se escalan y suspenden la cuenta.',
    en: 'Harassment, insults or threats. Insulting another person, telling them to leave, threatening them or saying you know where they live is prohibited. Criticizing an opinion or a service is allowed. Action: remove the content and warn; threats are escalated and the account is suspended.',
  },
  scam: {
    es: 'Estafa o fraude. Prohibido pedir pagos por adelantado para empleos, kits, inscripciones o activaciones, prometer ganancias fuera de lo normal, duplicar dinero o rentabilidad garantizada. Acción: rechazar la publicación y revisar la cuenta; si se repite, suspenderla.',
    en: 'Scam or fraud. Asking for upfront payments for jobs, kits, registrations or activations, promising unusual earnings, doubling money or guaranteed returns are prohibited. Action: reject the post and review the account; if it happens again, suspend it.',
  },
  impersonation: {
    es: 'Suplantación. Prohibido hacerse pasar por la plataforma, un banco, la mesa de ayuda oficial u otra persona, y pedir códigos, claves o contraseñas. Acción: bloquear el nombre de usuario, retirar los mensajes y avisar a las personas contactadas.',
    en: 'Impersonation. Pretending to be the platform, a bank, the official help desk or another person, and asking for codes, PINs or passwords is prohibited. Action: block the username, remove the messages and alert the people contacted.',
  },
  illegalLending: {
    es: 'Préstamo ilegal («gota a gota»). Prohibido ofrecer préstamos sin papeleo ni estudio, con cobro diario o por fuera del sistema financiero. Acción: retirar el aviso y escalar al equipo de cumplimiento.',
    en: 'Illegal lending ("drip loans"). Offering loans with no paperwork or credit check, with daily collection or outside the financial system is prohibited. Action: remove the listing and escalate to the compliance team.',
  },
  offPlatform: {
    es: 'Pago o contacto por fuera de la plataforma. Prohibido publicar teléfonos, correos o enlaces para pagar por fuera, evitar la comisión o seguir la conversación fuera de la plataforma, porque deja al comprador sin protección. Acción: ocultar el dato de contacto y advertir al usuario.',
    en: 'Off-platform payment or contact. Posting phone numbers, emails or links to pay outside, avoid the fee or continue the conversation outside the platform is prohibited, because it leaves the buyer unprotected. Action: hide the contact details and warn the user.',
  },
  fakeReview: {
    es: 'Reseña falsa. Prohibido publicar reseñas repetidas, desde cuentas creadas para eso o pagadas a cambio de estrellas. Acción: ocultar las reseñas, revisar las cuentas y advertir al vendedor.',
    en: 'Fake review. Posting repeated reviews, reviews from accounts created for that purpose or reviews paid for with stars is prohibited. Action: hide the reviews, review the accounts and warn the seller.',
  },
  spam: {
    es: 'Spam. Prohibidos los mensajes masivos repetidos, los enlaces acortados de promociones y los sorteos o premios para atraer clics. Acción: limitar la visibilidad; si se repite, suspender la cuenta.',
    en: 'Spam. Repeated mass messages, shortened promo links and giveaways or prizes to attract clicks are prohibited. Action: limit visibility; if it happens again, suspend the account.',
  },
};

export interface SampleAppeal {
  id: string;
  caseRef: string;
  original: 'rejected' | 'limited' | 'warned';
  category: CategoryKey;
  reason: Bilingual;
  hoursAgo: number;
  reviewer: string;
}

export const SAMPLE_APPEALS: SampleAppeal[] = [
  {
    id: 'a-501',
    caseRef: 'c-1987',
    original: 'rejected',
    category: 'hate',
    reason: {
      es: 'El usuario dice que su comentario era una sátira y cita la columna original.',
      en: 'The user says the comment was satire and quotes the original column.',
    },
    hoursAgo: 17.5,
    reviewer: 'Laura M.',
  },
  {
    id: 'a-502',
    caseRef: 'c-1990',
    original: 'limited',
    category: 'spam',
    reason: {
      es: 'La cuenta dice que sus enlaces llevan a su propia tienda y no son promociones masivas.',
      en: 'The account says its links go to its own store and are not mass promotions.',
    },
    hoursAgo: 22.8,
    reviewer: 'Diego P.',
  },
  {
    id: 'a-503',
    caseRef: 'c-1979',
    original: 'warned',
    category: 'harassment',
    reason: {
      es: 'Adjunta una captura que muestra que respondía a un insulto previo.',
      en: 'Attaches a screenshot showing they were replying to an earlier insult.',
    },
    hoursAgo: 27,
    reviewer: 'Marta S.',
  },
  {
    id: 'a-504',
    caseRef: 'c-1995',
    original: 'rejected',
    category: 'sexual',
    reason: {
      es: 'Es una ilustración de un curso de dibujo de la figura humana, sin contenido explícito.',
      en: 'It is an illustration from a figure drawing course, with no explicit content.',
    },
    hoursAgo: 10,
    reviewer: 'Camilo N.',
  },
];

/** Registros de ejemplo de las últimas horas (antes de que abras la demo). */
export interface SampleAudit {
  id: string;
  minutesAgo: number;
  actor: { kind: 'person' | 'rule'; name?: string; ruleNo?: number };
  action: 'approve' | 'reject' | 'escalate' | 'recategorize' | 'autoRule' | 'appealReverse' | 'rulesEdit';
  target: string;
  policy?: Label;
  measure?: 'remove' | 'removeWarn' | 'suspend';
  team?: 'minors' | 'legal' | 'fraud' | 'lead';
  from?: Label;
  to?: Label;
  ruleAction?: 'autoReject';
  changes?: number;
  note?: Bilingual;
}

export const SAMPLE_AUDIT: SampleAudit[] = [
  {
    id: 'au-9001',
    minutesAgo: 95,
    actor: { kind: 'person', name: 'Camilo N.' },
    action: 'reject',
    target: 'c-2031',
    policy: 'sexual',
    measure: 'remove',
    note: { es: 'Desnudez explícita en la foto de perfil.', en: 'Explicit nudity in the profile photo.' },
  },
  {
    id: 'au-9002',
    minutesAgo: 110,
    actor: { kind: 'person', name: 'Laura M.' },
    action: 'escalate',
    target: 'c-2028',
    team: 'minors',
    note: { es: 'Adulto que le pide a una estudiante pasar a un chat privado.', en: 'Adult asking a student to move to a private chat.' },
  },
  {
    id: 'au-9003',
    minutesAgo: 125,
    actor: { kind: 'rule', ruleNo: 1 },
    action: 'autoRule',
    target: 'c-2026',
    policy: 'scam',
    ruleAction: 'autoReject',
  },
  {
    id: 'au-9004',
    minutesAgo: 150,
    actor: { kind: 'person', name: 'Diego P.' },
    action: 'appealReverse',
    target: 'a-498',
    note: { es: 'El usuario mostró la factura de compra: no era una venta por fuera.', en: 'The user showed the purchase invoice: it was not an off-platform sale.' },
  },
  {
    id: 'au-9005',
    minutesAgo: 185,
    actor: { kind: 'person', name: 'Marta S.' },
    action: 'approve',
    target: 'c-2019',
    note: { es: 'Falso positivo: hablaba de un partido de fútbol.', en: 'False positive: it was about a football match.' },
  },
  {
    id: 'au-9006',
    minutesAgo: 230,
    actor: { kind: 'person', name: 'Camilo N.' },
    action: 'recategorize',
    target: 'c-2012',
    from: 'spam',
    to: 'scam',
  },
  {
    id: 'au-9007',
    minutesAgo: 300,
    actor: { kind: 'person', name: 'Admin' },
    action: 'rulesEdit',
    target: '—',
    changes: 1,
    note: { es: 'Subió el umbral de Spam de 70 % a 75 % tras la revisión semanal.', en: 'Raised the Spam threshold from 70% to 75% after the weekly review.' },
  },
];

/**
 * Conjunto de evaluación: textos etiquetados a mano además de los casos de la
 * cola. Incluye a propósito casos difíciles donde las reglas fallan (sátira,
 * arte, «plaga» en un cultivo, pedir un código de producto…), para que las
 * métricas muestren los límites de un clasificador por reglas.
 */
export const EVAL_SET: Array<{ id: string; text: Bilingual; label: Label }> = [
  { id: 'e-01', label: 'offPlatform', text: { es: 'Te lo vendo más barato si me consignas directo, sin pasar por la app.', en: "I'll sell it cheaper if you pay me directly, without going through the app." } },
  { id: 'e-02', label: 'offPlatform', text: { es: 'Escríbeme al 3XX XXX XXXX para cuadrar la entrega.', en: 'Text me at 3XX XXX XXXX to arrange the delivery.' } },
  { id: 'e-03', label: 'scam', text: { es: 'Trabajo desde casa: gana $ 200.000 diarios. Paga $ 30.000 de inscripción y empiezas.', en: "Work from home: earn $200,000 a day. Pay $30,000 for registration and you're in." } },
  { id: 'e-04', label: 'none', text: { es: 'Mi primo ganó mucho con esa inversión, pregúntale a él.', en: 'My cousin did well with that investment, ask him.' } },
  { id: 'e-05', label: 'illegalLending', text: { es: 'Plata prestada al instante, sin fiador, pagas en cuotas diarias.', en: 'Instant cash loans, no guarantor, you pay in daily installments.' } },
  { id: 'e-06', label: 'none', text: { es: 'Excelente producto, 5 estrellas.', en: 'Great product, 5 stars.' } },
  { id: 'e-07', label: 'fakeReview', text: { es: 'Te pago $ 5.000 por cada reseña de 5 estrellas que me dejes.', en: "I'll pay you $5,000 for each 5-star review you leave me." } },
  { id: 'e-08', label: 'harassment', text: { es: 'Cállate, [insulto], nadie te preguntó.', en: 'Shut up, [insult], nobody asked you.' } },
  { id: 'e-09', label: 'none', text: { es: 'Ese gol me mató, ¡qué golazo!', en: 'That goal killed me, what a strike!' } },
  { id: 'e-10', label: 'hate', text: { es: 'Los de [grupo] no deberían poder entrar a este barrio.', en: "People from [group] shouldn't be allowed to come into this neighborhood." } },
  { id: 'e-11', label: 'none', text: { es: 'Hay que fumigar porque el cultivo tiene plaga.', en: 'We need to fumigate because the crop has a plague.' } },
  { id: 'e-12', label: 'minors', text: { es: '¿Cuántos años tienes? Vernos a solas será nuestro secreto.', en: "How old are you? Let's meet alone, it'll be our secret." } },
  { id: 'e-13', label: 'none', text: { es: 'Profe, ¿mañana hay tarea de matemáticas?', en: 'Teacher, is there math homework tomorrow?' } },
  { id: 'e-14', label: 'sexual', text: { es: 'Vendo packs, escríbeme por interno.', en: 'Selling spicy pics, message me privately.' } },
  { id: 'e-15', label: 'none', text: { es: 'Clase de arte: dibujo de la figura humana desnuda.', en: 'Art class: drawing the nude human figure.' } },
  { id: 'e-16', label: 'selfHarm', text: { es: 'Me siento vacía y nadie me extrañaría.', en: 'I feel empty and no one would miss me.' } },
  { id: 'e-17', label: 'none', text: { es: 'Me quiero morir de la risa con ese video.', en: "I'm dying of laughter with that video." } },
  { id: 'e-18', label: 'impersonation', text: { es: 'Soy el administrador del grupo, dame tu clave para verificarte.', en: "I'm the group admin, give me your password to verify you." } },
  { id: 'e-19', label: 'spam', text: { es: '¡¡¡Sorteo!!! Haz clic aquí para ganar un celular gratis.', en: '!!!Giveaway!!! Click here to win a free phone.' } },
  { id: 'e-20', label: 'spam', text: { es: 'Compra ya, compra ya, compra ya: últimas unidades.', en: 'Buy now, buy now, buy now: last units.' } },
  { id: 'e-21', label: 'none', text: { es: 'Hola, ¿todavía tienes disponible la bicicleta?', en: 'Hi, is the bike still available?' } },
  { id: 'e-22', label: 'none', text: { es: 'Gracias por la entrega, todo llegó perfecto.', en: 'Thanks for the delivery, everything arrived perfectly.' } },
  { id: 'e-23', label: 'none', text: { es: 'No estoy de acuerdo con la columna; el autor ignora los datos.', en: 'I disagree with the column; the author ignores the data.' } },
  { id: 'e-24', label: 'none', text: { es: '¿Me puedes enviar el código del producto para buscarlo?', en: 'Can you send me the product code so I can look it up?' } },
  { id: 'e-25', label: 'none', text: { es: 'Busco profesora de inglés para mi hijo de 10 años.', en: 'Looking for an English teacher for my 10-year-old son.' } },
  { id: 'e-26', label: 'none', text: { es: 'Te escribo por el chat de la plataforma con los detalles.', en: "I'll write to you through the platform chat with the details." } },
  { id: 'e-27', label: 'scam', text: { es: 'Duplica tu inversión en una semana, rentabilidad garantizada.', en: 'Double your investment in a week, guaranteed returns.' } },
  { id: 'e-28', label: 'none', text: { es: 'El banco me aprobó un crédito con estudio y fiador.', en: 'The bank approved my loan after a credit check and with a guarantor.' } },
  { id: 'e-29', label: 'harassment', text: { es: 'Te voy a encontrar y vas a ver.', en: "I'm going to find you and you'll see." } },
  { id: 'e-30', label: 'none', text: { es: 'Solo hombres en el equipo de fútbol de los sábados.', en: 'Men only on the Saturday football team.' } },
];

/** Ejemplos rápidos para «Prueba con tu texto». */
export const QUICK_EXAMPLES: Bilingual[] = [
  { es: 'Te lo dejo en $ 80.000 si me pagas por fuera. Escríbeme al 3XX XXX XXXX.', en: "I'll let it go for $80,000 if you pay me outside the app. Text me at 3XX XXX XXXX." },
  { es: 'Préstamos al instante, sin fiador. Cobro diario en tu negocio.', en: 'Instant loans, no guarantor. Daily collection at your shop.' },
  { es: 'Muy buen vendedor, el producto llegó a tiempo y bien empacado.', en: 'Very good seller, the product arrived on time and well packed.' },
];
