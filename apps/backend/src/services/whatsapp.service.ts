/**
 * WhatsApp Notification Service
 * Soporta múltiples proveedores: Twilio, WhatsApp Business API, y alternativas
 */

import twilio from 'twilio';
import { logger } from '../utils/logger';

// Tipo de configuración
interface WhatsAppConfig {
  provider: 'twilio' | 'whatsapp-business' | 'ultramsg';
  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  // WhatsApp Business API
  whatsappApiToken?: string;
  whatsappPhoneNumberId?: string;
  // UltraMsg (alternativa simple)
  ultramsgInstanceId?: string;
  ultramsgToken?: string;
  // Número de destino
  recipientNumber: string;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private twilioClient: any;

  constructor() {
    // Configurar según variables de entorno
    this.config = {
      provider: (process.env.WHATSAPP_PROVIDER as any) || 'twilio',
      // Twilio
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER,
      // WhatsApp Business API
      whatsappApiToken: process.env.WHATSAPP_API_TOKEN,
      whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      // UltraMsg
      ultramsgInstanceId: process.env.ULTRAMSG_INSTANCE_ID,
      ultramsgToken: process.env.ULTRAMSG_TOKEN,
      // Número de destino (tu número)
      recipientNumber: process.env.ADMIN_WHATSAPP_NUMBER || '',
    };

    // Inicializar cliente Twilio si está configurado
    if (this.config.provider === 'twilio' && this.config.twilioAccountSid && this.config.twilioAuthToken) {
      this.twilioClient = twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);
      logger.info('✅ Twilio WhatsApp client initialized');
    }
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    if (!this.config.recipientNumber) {
      return false;
    }

    switch (this.config.provider) {
      case 'twilio':
        return !!(this.config.twilioAccountSid && this.config.twilioAuthToken && this.config.twilioWhatsAppNumber);
      case 'whatsapp-business':
        return !!(this.config.whatsappApiToken && this.config.whatsappPhoneNumberId);
      case 'ultramsg':
        return !!(this.config.ultramsgInstanceId && this.config.ultramsgToken);
      default:
        return false;
    }
  }

  /**
   * Envía notificación de nuevo contacto
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
      logger.warn('WhatsApp not configured - skipping notification');
      return false;
    }

    const messageText = this.formatContactMessage(contactData);

    try {
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(messageText);
        case 'whatsapp-business':
          return await this.sendViaWhatsAppBusiness(messageText);
        case 'ultramsg':
          return await this.sendViaUltraMsg(messageText);
        default:
          logger.error('Unknown WhatsApp provider');
          return false;
      }
    } catch (error: any) {
      logger.error('Error sending WhatsApp notification:', error);
      return false;
    }
  }

  /**
   * Formatea el mensaje de contacto
   */
  private formatContactMessage(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    service: string;
    budget?: string;
    message: string;
  }): string {
    let msg = `🔔 *Nuevo Formulario de Contacto - KopTup*

👤 *Nombre:* ${data.name}
📧 *Email:* ${data.email}`;

    if (data.phone) {
      msg += `\n📱 *Teléfono:* ${data.phone}`;
    }

    if (data.company) {
      msg += `\n🏢 *Empresa:* ${data.company}`;
    }

    msg += `\n💼 *Servicio:* ${data.service}`;

    if (data.budget) {
      msg += `\n💰 *Presupuesto:* ${data.budget}`;
    }

    msg += `\n\n💬 *Mensaje:*
${data.message}

---
⏰ ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}`;

    return msg;
  }

  /**
   * Envía mensaje vía Twilio
   */
  private async sendViaTwilio(message: string): Promise<boolean> {
    try {
      await this.twilioClient.messages.create({
        from: `whatsapp:${this.config.twilioWhatsAppNumber}`,
        to: `whatsapp:${this.config.recipientNumber}`,
        body: message,
      });

      logger.info(`✅ WhatsApp notification sent via Twilio to ${this.config.recipientNumber}`);
      return true;
    } catch (error: any) {
      logger.error('Twilio WhatsApp error:', error);
      throw error;
    }
  }

  /**
   * Envía mensaje vía WhatsApp Business API
   */
  private async sendViaWhatsAppBusiness(message: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.config.whatsappPhoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.whatsappApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: this.config.recipientNumber,
            type: 'text',
            text: { body: message },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`WhatsApp Business API error: ${response.statusText}`);
      }

      logger.info(`✅ WhatsApp notification sent via Business API to ${this.config.recipientNumber}`);
      return true;
    } catch (error: any) {
      logger.error('WhatsApp Business API error:', error);
      throw error;
    }
  }

  /**
   * Envía mensaje vía UltraMsg (alternativa simple)
   */
  private async sendViaUltraMsg(message: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.ultramsg.com/${this.config.ultramsgInstanceId}/messages/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: this.config.ultramsgToken,
            to: this.config.recipientNumber,
            body: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`UltraMsg error: ${response.statusText}`);
      }

      logger.info(`✅ WhatsApp notification sent via UltraMsg to ${this.config.recipientNumber}`);
      return true;
    } catch (error: any) {
      logger.error('UltraMsg error:', error);
      throw error;
    }
  }

  /**
   * Envía notificación de nuevo pedido
   */
  async sendOrderNotification(orderData: {
    orderId: string;
    name: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    hasAttachments: boolean;
  }): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('WhatsApp not configured - skipping notification');
      return false;
    }

    const messageText = this.formatOrderMessage(orderData);

    try {
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(messageText);
        case 'whatsapp-business':
          return await this.sendViaWhatsAppBusiness(messageText);
        case 'ultramsg':
          return await this.sendViaUltraMsg(messageText);
        default:
          logger.error('Unknown WhatsApp provider');
          return false;
      }
    } catch (error: any) {
      logger.error('Error sending WhatsApp order notification:', error);
      return false;
    }
  }

  /**
   * Formatea el mensaje de nuevo pedido
   */
  private formatOrderMessage(data: {
    orderId: string;
    name: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    hasAttachments: boolean;
  }): string {
    const itemsList = data.items
      .slice(0, 5)
      .map((item) => `  • ${item.name} (x${item.quantity})`)
      .join('\n');

    const moreItems = data.items.length > 5 ? `\n  ... y ${data.items.length - 5} más` : '';

    let msg = `📦 *Nuevo Pedido - KopTup*

🆔 *ID:* ${data.orderId}
📋 *Nombre:* ${data.name}

👤 *Cliente:*
  Nombre: ${data.clientName}
  Email: ${data.clientEmail}

💰 *Monto Total:* $${data.amount.toFixed(2)} USD

📦 *Items:*
${itemsList}${moreItems}`;

    if (data.hasAttachments) {
      msg += `\n\n📎 *Adjuntos:* Sí (ver en sistema)`;
    }

    msg += `\n\n---
⏰ ${new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' })}
🔗 Revisa el pedido en el panel admin`;

    return msg;
  }

  /**
   * Envía notificación de prueba
   */
  async sendTestMessage(): Promise<boolean> {
    return await this.sendContactNotification({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+57 300 123 4567',
      company: 'Test Company',
      service: 'Desarrollo Web',
      budget: '$5,000 - $10,000',
      message: 'This is a test notification from KopTup contact form',
    });
  }
}

// Exportar instancia singleton
export const whatsappService = new WhatsAppService();
export default whatsappService;
