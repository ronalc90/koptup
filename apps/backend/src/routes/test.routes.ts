import { Router } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/test/whatsapp
 * Envía un mensaje de prueba por WhatsApp
 */
router.get('/whatsapp', async (req, res) => {
  try {
    logger.info('Testing WhatsApp notification...');

    // Verificar configuración
    if (!whatsappService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'WhatsApp not configured',
        error: 'Please configure WhatsApp credentials in .env file',
        required: [
          'WHATSAPP_PROVIDER',
          'ADMIN_WHATSAPP_NUMBER',
          'TWILIO_ACCOUNT_SID',
          'TWILIO_AUTH_TOKEN',
          'TWILIO_WHATSAPP_NUMBER'
        ]
      });
    }

    // Enviar mensaje de prueba
    const success = await whatsappService.sendTestMessage();

    if (success) {
      return res.json({
        success: true,
        message: 'WhatsApp test message sent successfully! Check your phone.',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send WhatsApp message',
        error: 'Check server logs for details'
      });
    }
  } catch (error: any) {
    logger.error('WhatsApp test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending WhatsApp test',
      error: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/test/whatsapp/status
 * Verifica el estado de la configuración de WhatsApp
 */
router.get('/whatsapp/status', (req, res) => {
  const configured = whatsappService.isConfigured();

  res.json({
    success: true,
    configured,
    message: configured
      ? 'WhatsApp is properly configured'
      : 'WhatsApp is not configured. Check environment variables.',
    env: {
      provider: process.env.WHATSAPP_PROVIDER || 'not set',
      adminNumber: process.env.ADMIN_WHATSAPP_NUMBER ? 'set' : 'not set',
      twilioSid: process.env.TWILIO_ACCOUNT_SID ? 'set' : 'not set',
      twilioToken: process.env.TWILIO_AUTH_TOKEN ? 'set' : 'not set',
      twilioNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'not set',
    }
  });
});

export default router;
