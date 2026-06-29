/**
 * Email Notification Service
 * Sends email notifications for contact forms and other events
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  adminEmail: string;
}

class EmailService {
  private transporter: any;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.EMAIL_FROM || 'KopTup <noreply@koptup.com>',
      adminEmail: process.env.ADMIN_EMAIL || 'ronald@koptup.com',
    };

    // Solo inicializar si hay credenciales configuradas
    if (this.config.auth.user && this.config.auth.pass) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });
      logger.info('✅ Email service initialized');
    } else {
      logger.warn('⚠️  Email service not configured - skipping email notifications');
    }
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return !!(this.transporter && this.config.auth.user && this.config.auth.pass);
  }

  /**
   * Envía notificación de nuevo contacto al admin
   */
  async sendContactNotification(contactData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    service: string;
    budget?: string;
    message: string;
  }): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('📧 Email not configured - skipping notification');
      return false;
    }

    try {
      logger.info('📧 Sending email notification...');
      logger.info(`   To: ${this.config.adminEmail}`);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #4F46E5; display: block; margin-bottom: 5px; }
    .value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #4F46E5; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nuevo Formulario de Contacto</h1>
      <p>KopTup - Sistema de Notificaciones</p>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">👤 Nombre:</span>
        <div class="value">${contactData.name}</div>
      </div>

      <div class="field">
        <span class="label">📧 Email:</span>
        <div class="value"><a href="mailto:${contactData.email}">${contactData.email}</a></div>
      </div>

      ${contactData.phone ? `
      <div class="field">
        <span class="label">📱 Teléfono:</span>
        <div class="value">${contactData.phone}</div>
      </div>
      ` : ''}

      ${contactData.company ? `
      <div class="field">
        <span class="label">🏢 Empresa:</span>
        <div class="value">${contactData.company}</div>
      </div>
      ` : ''}

      <div class="field">
        <span class="label">💼 Servicio:</span>
        <div class="value">${contactData.service}</div>
      </div>

      ${contactData.budget ? `
      <div class="field">
        <span class="label">💰 Presupuesto:</span>
        <div class="value">${contactData.budget}</div>
      </div>
      ` : ''}

      <div class="field">
        <span class="label">💬 Mensaje:</span>
        <div class="value">${contactData.message.replace(/\n/g, '<br>')}</div>
      </div>

      <div class="footer">
        <p>⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
        <p>Este email fue generado automáticamente por el sistema KopTup</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

      const textContent = `
🔔 Nuevo Formulario de Contacto - KopTup

👤 Nombre: ${contactData.name}
📧 Email: ${contactData.email}
${contactData.phone ? `📱 Teléfono: ${contactData.phone}\n` : ''}
${contactData.company ? `🏢 Empresa: ${contactData.company}\n` : ''}
💼 Servicio: ${contactData.service}
${contactData.budget ? `💰 Presupuesto: ${contactData.budget}\n` : ''}

💬 Mensaje:
${contactData.message}

---
⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
`;

      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: this.config.adminEmail,
        subject: `🔔 Nuevo Contacto: ${contactData.name} - ${contactData.service}`,
        text: textContent,
        html: htmlContent,
      });

      logger.info('✅ Email notification sent successfully');
      logger.info(`   Message ID: ${info.messageId}`);
      logger.info(`   Response: ${info.response}`);

      return true;
    } catch (error: any) {
      logger.error('❌ Email notification error:');
      logger.error(`   Error: ${error.message}`);
      logger.error(`   Stack: ${error.stack}`);
      return false;
    }
  }

  /**
   * Envía el email de recuperación de contraseña con el enlace de reseteo.
   */
  async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('📧 Email not configured - skipping password reset email');
      return false;
    }

    try {
      logger.info(`📧 Sending password reset email to: ${params.to}`);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .muted { color: #6b7280; font-size: 13px; word-break: break-all; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperar contraseña</h1>
      <p>KopTup</p>
    </div>
    <div class="content">
      <p>Hola ${params.name},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
      <p style="text-align:center;">
        <a class="button" href="${params.resetUrl}">Restablecer contraseña</a>
      </p>
      <p class="muted">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${params.resetUrl}</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo: tu contraseña seguirá siendo la misma.</p>
      <div class="footer">
        <p>⏰ ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
        <p>Este email fue generado automáticamente por el sistema KopTup</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

      const textContent = `Recuperar contraseña - KopTup

Hola ${params.name},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.
Abre el siguiente enlace para crear una nueva contraseña (expira en 1 hora):

${params.resetUrl}

Si no solicitaste este cambio, ignora este correo.
`;

      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: params.to,
        subject: '🔐 Recupera tu contraseña - KopTup',
        text: textContent,
        html: htmlContent,
      });

      logger.info(`✅ Password reset email sent (Message ID: ${info.messageId})`);
      return true;
    } catch (error: any) {
      logger.error(`❌ Password reset email error: ${error.message}`);
      return false;
    }
  }

  /**
   * Envía email de prueba
   */
  async sendTestEmail(): Promise<boolean> {
    return await this.sendContactNotification({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+57 300 123 4567',
      company: 'Test Company',
      service: 'Desarrollo Web',
      budget: '$5,000 - $10,000',
      message: 'This is a test email notification from KopTup contact form system.',
    });
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
export default emailService;
