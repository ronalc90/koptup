# Avisos al dueño por WhatsApp (y por correo)

Cada vez que una persona escribe desde el sitio (formulario de [`/contact`](https://www.koptup.com/contact), «Solicitar demo» o «Prueba con tu documento»), el backend guarda el contacto y avisa al dueño por **dos canales independientes**:

- **Correo**, por la API HTTPS de **Resend** (SMTP queda solo como respaldo: Railway Free, Trial y Hobby bloquean el SMTP saliente).
- **WhatsApp**, por la **WhatsApp Cloud API de Meta** con la plantilla aprobada `koptup_aviso`.

El resultado de cada canal queda en el contacto (**Admin › Contactos**: Enviado, Entregado, Leído, Falló con el motivo, Pendiente o No configurado), un job reintenta los que fallan y una prueba mensual automática mantiene vivos los dos canales aunque lleguen pocos mensajes.

> **Guía completa, paso a paso** (Resend, Meta, Namecheap, Gmail y Railway): [Operación y despliegue › 4.5 Configurar los avisos al dueño](docs/wiki/Doc-11-Operacion-y-Despliegue.md#45-configurar-los-avisos-al-dueño-paso-a-paso).
> Qué hacer si algo no llega: runbooks [9.7 El correo no sale](docs/wiki/Doc-11-Operacion-y-Despliegue.md#97-el-correo-no-sale) y [9.11 El WhatsApp no llega](docs/wiki/Doc-11-Operacion-y-Despliegue.md#911-el-whatsapp-no-llega).

## Por qué con plantilla de Meta

- Con un aviso al mes casi nunca hay una conversación abierta en las últimas 24 horas, y fuera de esa ventana Meta **solo** acepta plantillas aprobadas (un texto libre falla con el error 131047).
- **Twilio y UltraMsg ya no se soportan:** el sandbox de Twilio vence a los 3 días y UltraMsg depende de una sesión de WhatsApp Web que se cae y no es oficial. Si `WHATSAPP_PROVIDER` vale `twilio` o `ultramsg`, el canal queda «no configurado» y el arranque lo avisa.

La plantilla se crea en el Administrador de WhatsApp de Meta con estos datos exactos:

| Campo | Valor |
|---|---|
| Nombre | `koptup_aviso` |
| Categoría | Utility (utilidad) |
| Idioma | Spanish (`es`) |
| Cuerpo | `Aviso de KopTup: {{1}}. Detalle: {{2}}. Revisa tu correo o el panel de KopTup para ver todo y responder.` |

`{{1}}` es el título (por ejemplo «Nuevo contacto de Ana Pérez», máximo 120 caracteres) y `{{2}}` el detalle (empresa, servicio, email y un extracto del mensaje, máximo 700). El backend les quita los saltos de línea y los tabs, porque Meta los rechaza.

## Variables del backend (Railway)

Solo nombres; los valores van en Railway, nunca en el repositorio. La explicación de cada una está en [`apps/backend/.env.example`](apps/backend/.env.example).

| Variable | Para qué |
|---|---|
| `WHATSAPP_PROVIDER` | `meta` (también acepta el valor viejo `whatsapp-business`) |
| `WHATSAPP_API_TOKEN` | Token **permanente** de un usuario del sistema de Meta (caducidad «Nunca»), con los permisos `whatsapp_business_messaging` y `whatsapp_business_management` |
| `WHATSAPP_PHONE_NUMBER_ID` | Identificador del número que envía (en WhatsApp › Configuración de la API) |
| `ADMIN_WHATSAPP_NUMBER` | Tu número con indicativo, por ejemplo `+57 3XX XXX XXXX` (se toman solo los dígitos) |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | `koptup_aviso` y `es` por defecto |
| `WHATSAPP_GRAPH_VERSION` | `v25.0` por defecto |
| `WHATSAPP_HELLO_WORLD_FALLBACK` | `true` por defecto: si la plantilla propia falla por un error de plantilla, envía la de ejemplo `hello_world` para que al menos suene el teléfono |
| `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Opcionales: encienden el webhook firmado `/api/webhooks/whatsapp`, que confirma entregado, leído o fallido y te avisa por correo si un WhatsApp no se entregó |
| `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFY_EMAIL` | El canal de correo (Resend, remitente y a quién le llegan los avisos) |
| `NOTIFY_HEARTBEAT_DAYS`, `NOTIFY_JOBS_ENABLED` | Prueba mensual (cada 30 días por defecto; `0` la apaga) y reintentos (`false` los apaga) |

Con el **número de prueba gratis** de Meta no hace falta tarjeta ni verificar el negocio, pero tu número debe estar en la lista de destinatarios verificados de ese número de prueba.

## Cómo probarlo

1. Despliega el backend con las variables y revisa el registro del arranque: debe decir `Avisos por WhatsApp: Meta plantilla koptup_aviso → +57 *** *** XXXX` (el número sale enmascarado).
2. Entra con una cuenta **admin** a **Admin › Configuración › Avisos de nuevos contactos** y pulsa **Enviar aviso de prueba**. Te muestra lo que respondió Meta: «Enviado» con el id del mensaje, o el código de error de Meta con qué revisar. Se permiten 5 pruebas cada 15 minutos.
3. Envía un mensaje real desde `/contact` y mira en **Admin › Contactos** que los dos canales digan «Enviado».

Las rutas viejas de prueba (`POST /api/contact/test-whatsapp`, `POST /api/contact/test-email` y `GET /api/test/whatsapp`) se retiraron: solo funcionaban fuera de producción. La prueba ahora es `POST /api/admin/notifications/test` (solo admin, también en producción) y el estado de los canales, sin secretos, `GET /api/admin/notifications/status` (admin y manager).

## Para desarrolladores

- Código: `apps/backend/src/services/whatsapp.service.ts` (plantilla, errores de Meta y respaldo), `email.service.ts` (Resend y SMTP), `owner-notify.service.ts` (arma el aviso, lo envía por canal y guarda el resultado), `jobs/notify-retry.job.ts`, `jobs/notify-heartbeat.job.ts` y `routes/whatsapp-webhook.routes.ts`.
- Pruebas: nunca uses credenciales reales. Las pruebas de Jest simulan `fetch`, y la suite e2e apunta `RESEND_API_URL` y `WHATSAPP_GRAPH_URL` al mock [`apps/web/e2e/support/notify-mock.js`](apps/web/e2e/support/notify-mock.js) (ver el [README](README.md#e2e-en-local-paso-a-paso)).
- Diagramas del envío, los reintentos y el webhook: [Flujos técnicos › 9](docs/wiki/Doc-14-3-Flujos-Tecnicos.md#9-avisos-al-dueño-correo-y-whatsapp).
