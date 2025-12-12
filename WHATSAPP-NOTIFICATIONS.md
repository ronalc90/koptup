# WhatsApp Notifications - Guía de Configuración

## 📱 Descripción

Este sistema envía notificaciones automáticas por WhatsApp cuando alguien envía el formulario de contacto en tu sitio web.

## 🎯 Opciones Disponibles

### Opción 1: Twilio (⭐ Recomendado)

**Ventajas:**
- ✅ Más confiable y profesional
- ✅ Excelente documentación
- ✅ Soporte técnico disponible
- ✅ Fácil de configurar

**Costo:** ~$0.005 por mensaje

#### Configuración Twilio

1. **Crear cuenta en Twilio:**
   - Ve a https://www.twilio.com/try-twilio
   - Regístrate (obtienes $15 de crédito gratis)

2. **Configurar WhatsApp Sandbox:**
   - En el dashboard de Twilio, ve a "Messaging" > "Try it out" > "Send a WhatsApp message"
   - Sigue las instrucciones para conectar tu número de WhatsApp
   - Envía el mensaje de activación que te indica (ej: "join <código>")

3. **Obtener credenciales:**
   - Account SID: En el dashboard principal
   - Auth Token: Haz clic en "Show" en el dashboard
   - WhatsApp Number: El número que aparece en WhatsApp Sandbox (ej: +14155238886)

4. **Agregar al `.env`:**
   ```bash
   WHATSAPP_PROVIDER=twilio
   ADMIN_WHATSAPP_NUMBER=+57300123456  # Tu número con código de país
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=+14155238886  # El número de Twilio Sandbox
   ```

5. **Para producción (opcional):**
   - Solicita un número de WhatsApp Business dedicado en Twilio
   - Requiere verificación de negocio (~1-2 semanas)
   - Costo: ~$25/mes

---

### Opción 2: WhatsApp Business API (Meta)

**Ventajas:**
- ✅ Gratis (hasta cierto límite)
- ✅ Directamente con Meta/Facebook
- ✅ Más control y personalización

**Desventajas:**
- ❌ Configuración más compleja
- ❌ Requiere verificación de negocio
- ❌ Proceso puede tardar varios días

#### Configuración WhatsApp Business API

1. **Crear cuenta de Meta for Developers:**
   - Ve a https://developers.facebook.com/
   - Crea una aplicación de tipo "Business"

2. **Configurar WhatsApp:**
   - En la app, agrega el producto "WhatsApp"
   - Verifica tu número de teléfono empresarial
   - Obtén el Phone Number ID y Access Token

3. **Agregar al `.env`:**
   ```bash
   WHATSAPP_PROVIDER=whatsapp-business
   ADMIN_WHATSAPP_NUMBER=+573001234567
   WHATSAPP_API_TOKEN=your_access_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

---

### Opción 3: UltraMsg (Alternativa Simple)

**Ventajas:**
- ✅ Muy fácil de configurar (5 minutos)
- ✅ No requiere verificación de negocio
- ✅ Funciona con WhatsApp Web

**Desventajas:**
- ❌ Menos confiable que Twilio
- ❌ Puede violar términos de servicio de WhatsApp
- ❌ Solo para desarrollo/pruebas

#### Configuración UltraMsg

1. **Crear cuenta:**
   - Ve a https://ultramsg.com/
   - Regístrate (plan gratuito disponible)

2. **Configurar instancia:**
   - Crea una nueva instancia
   - Escanea el código QR con WhatsApp
   - Copia el Instance ID y Token

3. **Agregar al `.env`:**
   ```bash
   WHATSAPP_PROVIDER=ultramsg
   ADMIN_WHATSAPP_NUMBER=+573001234567
   ULTRAMSG_INSTANCE_ID=instance12345
   ULTRAMSG_TOKEN=your_ultramsg_token
   ```

---

## 🚀 Uso

Una vez configurado, el sistema funcionará automáticamente:

1. Usuario llena el formulario de contacto en tu web
2. El sistema guarda el contacto en la base de datos
3. **Automáticamente** se envía una notificación por WhatsApp con:
   - Nombre del contacto
   - Email
   - Asunto
   - Mensaje completo
   - Fecha y hora

### Mensaje que recibirás:

```
🔔 Nuevo Formulario de Contacto - KopTup

👤 Nombre: Juan Pérez
📧 Email: juan@example.com
📋 Asunto: Consulta sobre servicios

💬 Mensaje:
Hola, estoy interesado en conocer más sobre sus servicios...

---
⏰ 12/12/2025 15:30:45
```

---

## 🧪 Probar la Configuración

### Endpoint de prueba (desarrollo):

```bash
# Enviar mensaje de prueba
curl -X POST http://localhost:3001/api/test/whatsapp \
  -H "Content-Type: application/json"
```

### Desde código:

```typescript
import { whatsappService } from './services/whatsapp.service';

// Enviar mensaje de prueba
await whatsappService.sendTestMessage();
```

---

## 📊 Comparación de Opciones

| Característica | Twilio | WhatsApp Business | UltraMsg |
|---------------|--------|-------------------|----------|
| Confiabilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Facilidad | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Costo | Bajo | Gratis | Muy bajo |
| Tiempo setup | 15 min | 1-2 semanas | 5 min |
| Producción | ✅ | ✅ | ❌ |

---

## 🔧 Troubleshooting

### "WhatsApp not configured - skipping notification"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que `ADMIN_WHATSAPP_NUMBER` tenga el formato correcto (+código_país + número)

### Mensajes no llegan (Twilio)
- Verifica que enviaste el mensaje "join" al Sandbox
- Revisa los logs de Twilio en https://console.twilio.com
- Asegúrate de que el número en `ADMIN_WHATSAPP_NUMBER` sea el que activaste

### Error de autenticación
- Verifica que las credenciales sean correctas
- Regenera los tokens si es necesario
- Revisa que no haya espacios extra en las variables

---

## 📝 Variables de Entorno Completas

```bash
# Configuración general
WHATSAPP_PROVIDER=twilio          # O 'whatsapp-business' o 'ultramsg'
ADMIN_WHATSAPP_NUMBER=+573001234567  # TU número (con código de país)

# Si usas Twilio:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# Si usas WhatsApp Business API:
WHATSAPP_API_TOKEN=xxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxxxxxxx

# Si usas UltraMsg:
ULTRAMSG_INSTANCE_ID=instance12345
ULTRAMSG_TOKEN=xxxxxxxxxx
```

---

## 🎓 Recursos Adicionales

- [Twilio WhatsApp Quickstart](https://www.twilio.com/docs/whatsapp/quickstart)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [UltraMsg API](https://docs.ultramsg.com/)

---

## ⚡ Siguiente Paso

Para Railway (producción), agrega estas variables de entorno en el dashboard de Railway con los valores correspondientes de tu cuenta de Twilio/WhatsApp.
