/**
 * demo-emails.service.ts — correos del sistema de demos (español, con "tú").
 *
 * Todos se envían con el SMTP existente (email.service.ts). Sin SMTP
 * configurado no se envía nada y cada función devuelve false: el panel lo
 * muestra y el admin comparte el enlace por otro medio (WhatsApp). Todo texto
 * que viene del usuario se escapa.
 */
import { emailService } from './email.service';
import { escapeHtml } from '../utils/email-address';
import { frontendUrl } from '../config/demos';

/** Página del portal con los accesos del prospecto. */
export const MIS_DEMOS_PATH = '/dashboard/demos';

export function misDemosLoginUrl(): string {
  return `${frontendUrl()}/login?redirect=${encodeURIComponent(MIS_DEMOS_PATH)}`;
}

export function demoUrl(slug: string): string {
  return `${frontendUrl()}/demo/${slug}`;
}

export function formatDateEs(date: Date): string {
  return date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Plantilla HTML común de los correos (también la usan las propuestas). */
export function emailLayout(title: string, bodyHtml: string): string {
  return layout(title, bodyHtml);
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; }
    .container { max-width: 640px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 24px; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4F46E5; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 16px 0; }
    .muted { color: #6b7280; font-size: 13px; word-break: break-all; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${escapeHtml(title)}</h1></div>
    <div class="content">
${bodyHtml}
      <p class="muted">Equipo KopTup · Tratamos tus datos según nuestra política: ${escapeHtml(`${frontendUrl()}/privacy`)}</p>
    </div>
  </div>
</body>
</html>`;
}

export interface DemoLinkItem {
  slug: string;
  nombre: string;
}

/** Acuse al solicitante: recibimos tu solicitud. */
export async function sendRequestAck(args: { to: string; nombre: string; codigo: string; demos: DemoLinkItem[] }): Promise<boolean> {
  const lista = args.demos.map((d) => d.nombre).join(', ');
  const html = layout(
    'Recibimos tu solicitud de demo',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Recibimos tu solicitud para conocer: <strong>${escapeHtml(lista)}</strong>.</p>
      <p>El equipo de KopTup la revisará y te escribirá a este correo con la respuesta. Si la aprobamos, recibirás un enlace para activar tu acceso.</p>
      <p>Tu código de solicitud es <strong>${escapeHtml(args.codigo)}</strong>.</p>
      <p>Mientras tanto puedes probar las demos abiertas: ${escapeHtml(`${frontendUrl()}/demo`)}</p>
      <p class="muted">Si no hiciste esta solicitud, ignora este mensaje.</p>`,
  );
  const text = `Hola ${args.nombre}:

Recibimos tu solicitud para conocer: ${lista}.
El equipo de KopTup la revisará y te escribirá a este correo con la respuesta. Si la aprobamos, recibirás un enlace para activar tu acceso.

Tu código de solicitud es ${args.codigo}.
Mientras tanto puedes probar las demos abiertas: ${frontendUrl()}/demo

Si no hiciste esta solicitud, ignora este mensaje.`;
  return emailService.sendMail({ to: args.to, subject: `Recibimos tu solicitud de demo (${args.codigo})`, html, text });
}

/**
 * Aprobación o invitación directa. Con `activationUrl` (cuenta sin
 * contraseña) incluye el botón de activación; si la cuenta ya está activa,
 * lleva a iniciar sesión.
 */
export async function sendAccessGranted(args: {
  to: string;
  nombre: string;
  demos: DemoLinkItem[];
  expiresAt: Date;
  dias: number;
  activationUrl: string | null;
  mensaje?: string;
}): Promise<boolean> {
  const hasta = formatDateEs(args.expiresAt);
  const itemsHtml = args.demos.map((d) => `<li>${escapeHtml(d.nombre)}</li>`).join('');
  const itemsText = args.demos.map((d) => `- ${d.nombre}: ${demoUrl(d.slug)}`).join('\n');
  const loginUrl = misDemosLoginUrl();
  const accion = args.activationUrl
    ? `      <p>Activa tu cuenta y crea tu contraseña con este enlace. Es de un solo uso y vence en 72 horas:</p>
      <p><a class="button" href="${escapeHtml(args.activationUrl)}">Activar mi acceso</a></p>
      <p class="muted">Si el botón no funciona, copia este enlace en tu navegador:<br>${escapeHtml(args.activationUrl)}</p>`
    : `      <p>Entra con tu cuenta de siempre y abre la demo desde <strong>Mis demos</strong>:</p>
      <p><a class="button" href="${escapeHtml(loginUrl)}">Ir a Mis demos</a></p>`;
  const html = layout(
    'Tu acceso a las demos de KopTup está listo',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Aprobamos tu acceso a:</p>
      <ul>${itemsHtml}</ul>
      <p>Podrás usarlas hasta el <strong>${escapeHtml(hasta)}</strong> (${args.dias} días).</p>
${accion}
      ${args.mensaje ? `<p>${escapeHtml(args.mensaje).replace(/\n/g, '<br>')}</p>` : ''}
      <p class="muted">Las demos usan datos de ejemplo. No cargues información confidencial ni datos personales reales.</p>`,
  );
  const text = `Hola ${args.nombre}:

Aprobamos tu acceso a:
${itemsText}

Podrás usarlas hasta el ${hasta} (${args.dias} días).

${args.activationUrl ? `Activa tu cuenta y crea tu contraseña con este enlace (un solo uso, vence en 72 horas):\n${args.activationUrl}` : `Entra con tu cuenta de siempre: ${loginUrl}`}
${args.mensaje ? `\n${args.mensaje}\n` : ''}
Las demos usan datos de ejemplo. No cargues información confidencial ni datos personales reales.`;
  return emailService.sendMail({ to: args.to, subject: 'Tu acceso a las demos de KopTup está listo', html, text });
}

/** Rechazo (solo si el equipo elige avisar). */
export async function sendRequestRejected(args: { to: string; nombre: string; motivo?: string }): Promise<boolean> {
  const html = layout(
    'Sobre tu solicitud de demo en KopTup',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Gracias por tu interés. Por ahora no podemos habilitar la demo que pediste.</p>
      ${args.motivo ? `<p>${escapeHtml(args.motivo).replace(/\n/g, '<br>')}</p>` : ''}
      <p>Igual puedes probar las demos abiertas: ${escapeHtml(`${frontendUrl()}/demo`)}</p>
      <p>Si tu situación cambia, responde este correo y retomamos.</p>`,
  );
  const text = `Hola ${args.nombre}:

Gracias por tu interés. Por ahora no podemos habilitar la demo que pediste.
${args.motivo ? `\n${args.motivo}\n` : ''}
Igual puedes probar las demos abiertas: ${frontendUrl()}/demo
Si tu situación cambia, responde este correo y retomamos.`;
  return emailService.sendMail({ to: args.to, subject: 'Sobre tu solicitud de demo en KopTup', html, text });
}

/**
 * Recordatorio: tu acceso vence pronto (lo envía el job de expiración). Si la
 * cuenta aún no se activó, no ofrece "Mis demos" (no podría entrar): le
 * recuerda activar la cuenta con el enlace que recibió.
 */
export async function sendExpiryReminder(args: {
  to: string;
  nombre: string;
  demos: Array<DemoLinkItem & { expiresAt: Date }>;
  pendienteActivacion?: boolean;
}): Promise<boolean> {
  const itemsHtml = args.demos
    .map((d) => `<li>${escapeHtml(d.nombre)}: hasta el ${escapeHtml(formatDateEs(d.expiresAt))}</li>`)
    .join('');
  const itemsText = args.demos.map((d) => `- ${d.nombre}: hasta el ${formatDateEs(d.expiresAt)}`).join('\n');
  const loginUrl = misDemosLoginUrl();
  const accionHtml = args.pendienteActivacion
    ? '      <p>Aún no activas tu cuenta: usa el enlace de activación que te enviamos. Si ya venció, responde este correo y te enviamos uno nuevo.</p>'
    : `      <p><a class="button" href="${escapeHtml(loginUrl)}">Ir a Mis demos</a></p>`;
  const accionText = args.pendienteActivacion
    ? 'Aún no activas tu cuenta: usa el enlace de activación que te enviamos. Si ya venció, responde este correo y te enviamos uno nuevo.'
    : `Mis demos: ${loginUrl}`;
  const html = layout(
    'Tu acceso a las demos vence pronto',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Te recordamos que tu acceso vence en los próximos días:</p>
      <ul>${itemsHtml}</ul>
      <p>Si necesitas más tiempo o quieres hablar de tu proyecto, responde este correo.</p>
${accionHtml}`,
  );
  const text = `Hola ${args.nombre}:

Te recordamos que tu acceso vence en los próximos días:
${itemsText}

Si necesitas más tiempo o quieres hablar de tu proyecto, responde este correo.
${accionText}`;
  return emailService.sendMail({ to: args.to, subject: 'Tu acceso a las demos de KopTup vence pronto', html, text });
}

/** Extensión de la vigencia de un acceso. */
export async function sendAccessExtended(args: { to: string; nombre: string; demo: DemoLinkItem; expiresAt: Date }): Promise<boolean> {
  const hasta = formatDateEs(args.expiresAt);
  const loginUrl = misDemosLoginUrl();
  const html = layout(
    'Extendimos tu acceso',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Extendimos tu acceso a <strong>${escapeHtml(args.demo.nombre)}</strong> hasta el <strong>${escapeHtml(hasta)}</strong>.</p>
      <p><a class="button" href="${escapeHtml(loginUrl)}">Ir a Mis demos</a></p>`,
  );
  const text = `Hola ${args.nombre}:

Extendimos tu acceso a ${args.demo.nombre} hasta el ${hasta}.
Mis demos: ${loginUrl}`;
  return emailService.sendMail({ to: args.to, subject: `Extendimos tu acceso a ${args.demo.nombre}`, html, text });
}
