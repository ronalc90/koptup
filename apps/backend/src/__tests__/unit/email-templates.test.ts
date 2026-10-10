/**
 * Plantillas de correo con datos del usuario: todo texto va escapado, los
 * enlaces solo aceptan http(s) o mailto y el asunto queda en una sola línea.
 * Se renderiza cada plantilla con datos hostiles y se captura lo que se
 * entregaría a SMTP (sin enviar nada).
 */
const HOSTILE = `<img src=x onerror="alert(1)">'"&</p><script>alert(2)</script>`;
const HOSTILE_URL = 'javascript:alert(document.cookie)';
const HOSTILE_SUBJECT = 'Hola\r\nBcc: victima@example.com';

interface Captured {
  to: string;
  subject: string;
  html: string;
  text: string;
}

describe('plantillas de correo con datos del usuario', () => {
  const captured: Captured[] = [];
  const prev = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
  let templates: {
    email: typeof import('../../services/email.service');
    demo: typeof import('../../services/demo-emails.service');
    proposal: typeof import('../../services/proposal-emails.service');
    team: typeof import('../../services/team-notify.service');
  };

  beforeAll(async () => {
    process.env.SMTP_USER = 'prueba@example.com';
    process.env.SMTP_PASS = 'no-es-real';
    jest.resetModules();
    const email = await import('../../services/email.service');
    // Transporte falso: captura el mensaje en vez de enviarlo.
    (email.emailService as unknown as { transporter: unknown }).transporter = {
      sendMail: async (msg: Captured) => {
        captured.push(msg);
        return { messageId: 'prueba', response: 'ok' };
      },
    };
    templates = {
      email,
      demo: await import('../../services/demo-emails.service'),
      proposal: await import('../../services/proposal-emails.service'),
      team: await import('../../services/team-notify.service'),
    };
  });

  afterAll(() => {
    if (prev.user === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = prev.user;
    if (prev.pass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = prev.pass;
  });

  beforeEach(() => {
    captured.length = 0;
  });

  function expectSafe(msg: Captured | undefined) {
    expect(msg).toBeDefined();
    const html = msg!.html;
    expect(html).not.toMatch(/<img|<script/i);
    expect(html).not.toMatch(/javascript:/i);
    // Todo href es http(s), mailto o "#".
    for (const [, href] of html.matchAll(/href="([^"]*)"/g)) {
      expect(href).toMatch(/^(https?:\/\/|mailto:|#$)/);
    }
    expect(msg!.subject).not.toMatch(/[\r\n]/);
  }

  it('contacto y recuperar contraseña (email.service)', async () => {
    await templates.email.emailService.sendContactNotification({
      name: HOSTILE,
      email: `x@example.com"><script>alert(1)</script>`,
      phone: HOSTILE,
      company: HOSTILE,
      service: `${HOSTILE_SUBJECT}${HOSTILE}`,
      budget: HOSTILE,
      message: `${HOSTILE}\nsegunda línea`,
      source: HOSTILE,
    });
    expectSafe(captured[0]);
    expect(captured[0].html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(captured[0].html).toContain('<br>segunda línea');

    await templates.email.emailService.sendPasswordResetEmail({ to: 'a@example.com', name: HOSTILE, resetUrl: HOSTILE_URL });
    expectSafe(captured[1]);
  });

  it('sistema de demos (demo-emails)', async () => {
    const demos = [{ slug: 'erp', nombre: HOSTILE }];
    await templates.demo.sendRequestAck({ to: 'a@example.com', nombre: HOSTILE, codigo: HOSTILE_SUBJECT, demos });
    await templates.demo.sendAccessGranted({ to: 'a@example.com', nombre: HOSTILE, demos, expiresAt: new Date(), dias: 14, activationUrl: HOSTILE_URL, mensaje: HOSTILE });
    await templates.demo.sendAccessGranted({ to: 'a@example.com', nombre: HOSTILE, demos, expiresAt: new Date(), dias: 14, activationUrl: null });
    await templates.demo.sendRequestRejected({ to: 'a@example.com', nombre: HOSTILE, motivo: HOSTILE });
    await templates.demo.sendExpiryReminder({ to: 'a@example.com', nombre: HOSTILE, demos: [{ slug: 'erp', nombre: HOSTILE, expiresAt: new Date() }] });
    await templates.demo.sendAccessExtended({ to: 'a@example.com', nombre: HOSTILE, demo: { slug: 'erp', nombre: `${HOSTILE_SUBJECT}${HOSTILE}` }, expiresAt: new Date() });
    expect(captured).toHaveLength(6);
    captured.forEach(expectSafe);
  });

  it('propuestas y pagos (proposal-emails, del flujo de compra)', async () => {
    const base = { to: 'a@example.com', nombre: HOSTILE, numero: HOSTILE_SUBJECT, titulo: HOSTILE };
    await templates.proposal.sendProposalToClient({ ...base, url: HOSTILE_URL, validaHasta: new Date(), total: HOSTILE, mensual: HOSTILE, reenvio: true });
    await templates.proposal.sendAcceptedToClient({ ...base, anticipo: HOSTILE, enlacePago: HOSTILE_URL, instrucciones: `${HOSTILE}\nCuenta 123`, wompi: true, url: HOSTILE_URL });
    await templates.proposal.sendDepositReceivedToClient({ ...base, monto: HOSTILE });
    await templates.proposal.sendWelcomeClient({ ...base, proyecto: HOSTILE, activationUrl: HOSTILE_URL, loginUrl: 'https://koptup.com/login' });
    await templates.proposal.sendWelcomeClient({ ...base, proyecto: HOSTILE, activationUrl: null, loginUrl: HOSTILE_URL });
    expect(captured).toHaveLength(5);
    captured.forEach(expectSafe);
    // El enlace de pago peligroso no queda como enlace, pero un enlace válido sí.
    await templates.proposal.sendAcceptedToClient({ ...base, anticipo: '1', enlacePago: 'https://pagos.example.com/abc', instrucciones: null, wompi: false });
    expect(captured[5].html).toContain('href="https://pagos.example.com/abc"');
  });

  it('avisos internos al equipo (team-notify)', async () => {
    await templates.team.notifyTeam({ asunto: `${HOSTILE_SUBJECT}${HOSTILE}`, lineas: [HOSTILE, `Correo: ${HOSTILE}`], enlace: HOSTILE_URL });
    expect(captured.length).toBeGreaterThan(0);
    captured.forEach(expectSafe);
  });

  it('safeHref y safeSubject', async () => {
    const { safeHref, safeSubject, escapeHtml } = await import('../../utils/html');
    expect(safeHref('https://koptup.com/x?a=1&b=2')).toBe('https://koptup.com/x?a=1&amp;b=2');
    expect(safeHref('mailto:a@b.co')).toBe('mailto:a@b.co');
    expect(safeHref(' JavaScript:alert(1)')).toBe('#');
    expect(safeHref('data:text/html,hola')).toBe('#');
    expect(safeHref('/relativa')).toBe('#');
    expect(safeSubject('a\r\nBcc: x')).toBe('a Bcc: x');
    expect(escapeHtml(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;');
  });
});
