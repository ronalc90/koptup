/**
 * proposal-emails.service.ts — correos de las propuestas al cliente
 * (español, con "tú"). Usan el SMTP existente (email.service.ts): sin SMTP
 * no se envía nada y cada función devuelve false; el panel muestra siempre
 * el enlace público para copiarlo o enviarlo por WhatsApp.
 */
import { emailService } from './email.service';
import { emailLayout, formatDateEs } from './demo-emails.service';
import { escapeHtml } from '../utils/email-address';

export interface ProposalMailBase {
  to: string;
  nombre: string;
  numero: string;
  titulo: string;
}

export async function sendProposalToClient(args: ProposalMailBase & { url: string; validaHasta: Date; total: string; mensual?: string | null; reenvio?: boolean }): Promise<boolean> {
  const html = emailLayout(
    `Tu propuesta ${args.numero}`,
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>${args.reenvio ? 'Te reenviamos' : 'Te enviamos'} la propuesta <strong>${escapeHtml(args.titulo)}</strong> (${escapeHtml(args.numero)}).</p>
      <p>Pago inicial: <strong>${escapeHtml(args.total)}</strong>${args.mensual ? ` · Mensualidad: <strong>${escapeHtml(args.mensual)}</strong>` : ''}</p>
      <p><a class="button" href="${escapeHtml(args.url)}">Ver la propuesta</a></p>
      <p>Desde ese enlace puedes revisarla, aceptarla o decirnos que no te interesa. Es válida hasta el ${escapeHtml(formatDateEs(args.validaHasta))}.</p>
      <p class="muted">Si el botón no funciona, copia este enlace en tu navegador:<br>${escapeHtml(args.url)}</p>${args.reenvio ? '\n      <p class="muted">Este enlace reemplaza al anterior.</p>' : ''}`,
  );
  const text = `Hola ${args.nombre}:

${args.reenvio ? 'Te reenviamos' : 'Te enviamos'} la propuesta "${args.titulo}" (${args.numero}).
Pago inicial: ${args.total}${args.mensual ? ` · Mensualidad: ${args.mensual}` : ''}

Revísala, acéptala o recházala aquí (válida hasta el ${formatDateEs(args.validaHasta)}):
${args.url}
${args.reenvio ? '\nEste enlace reemplaza al anterior.\n' : ''}`;
  return emailService.sendMail({ to: args.to, subject: `Propuesta ${args.numero}: ${args.titulo}`, html, text });
}

export async function sendAcceptedToClient(
  args: ProposalMailBase & { anticipo: string; enlacePago?: string | null; instrucciones?: string | null; wompi: boolean; url?: string | null },
): Promise<boolean> {
  const metodosHtml: string[] = [];
  const metodosText: string[] = [];
  if (args.wompi && args.url) {
    metodosHtml.push(`<li>En línea con Wompi desde la propuesta: <a href="${escapeHtml(args.url)}">${escapeHtml(args.url)}</a></li>`);
    metodosText.push(`- En línea con Wompi desde la propuesta: ${args.url}`);
  }
  if (args.enlacePago) {
    metodosHtml.push(`<li>Enlace de pago: <a href="${escapeHtml(args.enlacePago)}">${escapeHtml(args.enlacePago)}</a></li>`);
    metodosText.push(`- Enlace de pago: ${args.enlacePago}`);
  }
  if (args.instrucciones) {
    metodosHtml.push(`<li>Transferencia:<br>${escapeHtml(args.instrucciones).replace(/\n/g, '<br>')}</li>`);
    metodosText.push(`- Transferencia:\n${args.instrucciones}`);
  }
  const sinMetodos = 'El equipo de KopTup te escribirá con los datos para pagar el anticipo.';
  const html = emailLayout(
    `Aceptaste la propuesta ${args.numero}`,
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Recibimos tu aceptación de la propuesta <strong>${escapeHtml(args.titulo)}</strong> (${escapeHtml(args.numero)}). ¡Gracias!</p>
      <p>El siguiente paso es el anticipo de <strong>${escapeHtml(args.anticipo)}</strong>.</p>
      ${metodosHtml.length ? `<ul>${metodosHtml.join('')}</ul>` : `<p>${sinMetodos}</p>`}
      <p>Cuando confirmemos el pago, creamos tu proyecto y te damos acceso al portal de clientes.</p>`,
  );
  const text = `Hola ${args.nombre}:

Recibimos tu aceptación de la propuesta "${args.titulo}" (${args.numero}). ¡Gracias!
El siguiente paso es el anticipo de ${args.anticipo}.
${metodosText.length ? metodosText.join('\n') : sinMetodos}

Cuando confirmemos el pago, creamos tu proyecto y te damos acceso al portal de clientes.`;
  return emailService.sendMail({ to: args.to, subject: `Aceptaste la propuesta ${args.numero}: siguiente paso, el anticipo`, html, text });
}

export async function sendDepositReceivedToClient(args: ProposalMailBase & { monto: string }): Promise<boolean> {
  const html = emailLayout(
    'Recibimos tu anticipo',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Confirmamos el pago del anticipo (${escapeHtml(args.monto)}) de la propuesta <strong>${escapeHtml(args.titulo)}</strong> (${escapeHtml(args.numero)}).</p>
      <p>En breve creamos tu proyecto y te escribimos con el acceso al portal de clientes.</p>`,
  );
  const text = `Hola ${args.nombre}:

Confirmamos el pago del anticipo (${args.monto}) de la propuesta "${args.titulo}" (${args.numero}).
En breve creamos tu proyecto y te escribimos con el acceso al portal de clientes.`;
  return emailService.sendMail({ to: args.to, subject: `Recibimos tu anticipo (${args.numero})`, html, text });
}

export async function sendWelcomeClient(
  args: ProposalMailBase & { proyecto: string; activationUrl: string | null; loginUrl: string },
): Promise<boolean> {
  const accion = args.activationUrl
    ? `<p><a class="button" href="${escapeHtml(args.activationUrl)}">Crear mi contraseña</a></p>
      <p class="muted">El enlace sirve una sola vez y vence en 72 horas. Si no funciona, copia este enlace:<br>${escapeHtml(args.activationUrl)}</p>`
    : `<p><a class="button" href="${escapeHtml(args.loginUrl)}">Entrar al portal</a></p>`;
  const html = emailLayout(
    '¡Bienvenido a KopTup!',
    `      <p>Hola ${escapeHtml(args.nombre)}:</p>
      <p>Creamos tu proyecto <strong>${escapeHtml(args.proyecto)}</strong> a partir de la propuesta ${escapeHtml(args.numero)}.</p>
      <p>En el portal de clientes ves el avance, los entregables, las facturas y los mensajes con el equipo. Las demos que usaste siguen disponibles 90 días como referencia.</p>
      ${accion}`,
  );
  const text = `Hola ${args.nombre}:

Creamos tu proyecto "${args.proyecto}" a partir de la propuesta ${args.numero}.
En el portal de clientes ves el avance, los entregables, las facturas y los mensajes con el equipo. Las demos que usaste siguen disponibles 90 días como referencia.

${args.activationUrl ? `Crea tu contraseña (enlace de un solo uso, vence en 72 horas):\n${args.activationUrl}` : `Entra al portal: ${args.loginUrl}`}`;
  return emailService.sendMail({ to: args.to, subject: `Tu proyecto con KopTup: ${args.proyecto}`, html, text });
}
