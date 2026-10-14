# Políticas de autorización de la API

Inventario de cada router montado en `src/app.ts` y la política que aplica en el
servidor. Los middleware están en `src/middleware/access.ts`; las pruebas que lo
demuestran (401/403/200 por política) están en `src/__tests__/integration/`.

| Política | Middleware | Quién pasa |
|---|---|---|
| Pública | — (con rate-limit y, si usa IA, tope de gasto) | Cualquiera |
| Autenticado | `authenticate` | JWT válido |
| Dueño del recurso | `authenticate` + verificación en el controlador | El dueño o el staff (rol leído de la BD con `isStaffSession`, nunca el del token) |
| Staff | `requireStaff` | `admin`, `manager`, `sales` (rol leído de la BD en cada petición) |
| Admin | `requireAdmin` | `admin` (rol leído de la BD) |
| Acceso a demo | `requireStaffOrDemoAccess(slug)` | Staff (admin, manager, sales; `developer` vía el resolvedor), o quien tenga un `DemoGrant` vigente de esa demo; las demos en modo `publico` (catálogo editable) quedan abiertas |
| Solo desarrollo | `devOnlyAdmin` | 404 en producción; admin en desarrollo (hoy solo el chat heredado `/api/chat`; las rutas viejas de prueba de WhatsApp y correo se retiraron: la prueba vive en `POST /api/admin/notifications/test`) |

| Prefijo | Rutas | Política |
|---|---|---|
| `/health/live` | GET | Pública (siempre 200: el proceso responde) |
| `/health` | GET | Pública (503 si MongoDB no está conectado; healthcheck de Railway y del monitoreo de GitHub Actions) |
| `/api-docs` | Swagger | Solo fuera de producción o con `API_DOCS_ENABLED=true` |
| `/api/auth` | `register`, `login`, `forgot-password`, `reset-password` | Pública; cada ruta con su propio límite (`middleware/rateLimiter.ts`): login por IP + email (correo normalizado) y por IP, registro por IP, recuperación por IP + email y por IP, restablecer por IP; 429 en español |
| | `refresh`, `google`, `google/callback`, `google/exchange` | Pública (refresh exige un refresh token válido; el callback de Google no pone tokens en la URL: deja un código de un solo uso de 60 s que la web canjea con `POST google/exchange`, con límite por IP) |
| | `me`, `profile`, `logout`, `PATCH me` (nombre, teléfono y empresa propios) | Autenticado |
| | `change-password` | Autenticado + contraseña actual, límite propio por cuenta (5 cada 15 min) |
| `/api/contact` | `POST /` | Pública con rate-limit estricto; guarda el contacto y avisa al dueño por correo y WhatsApp sin bloquear la respuesta (`Contact.notificaciones`) |
| `/api/webhooks/whatsapp` | `GET /` (verificación de Meta), `POST /` (estados) | Pública con límite propio por IP (600/min); solo existe con `WHATSAPP_WEBHOOK_VERIFY_TOKEN` y `WHATSAPP_APP_SECRET` (si no, 404). `GET` exige `hub.verify_token`; `POST` exige `X-Hub-Signature-256` válida sobre el cuerpo crudo (401 si no). Montado antes del parser JSON global |
| `/api/chat` | todas (chat heredado de eco) | Solo desarrollo |
| `/api/documents` | todas | Autenticado + aislamiento por usuario (`user_id` de la sesión en cada consulta); `DELETE` solo del dueño, sin PIN (la confirmación la pide la interfaz) |
| | `upload`, `search/semantic`, `:id/explain`, `:id/explain-similarity` | Además: tope `DOCUMENTS_MONTHLY_BUDGET_USD` y cupo diario por usuario `DOCUMENTS_AI_DAILY_LIMIT_PER_USER` (sin cupo, `upload` guarda el archivo sin análisis) |
| `/api/projects` | todas | Autenticado + pertenencia al proyecto (servicio) |
| `/api/orders` | `GET`, `POST /` | Autenticado + dueño del pedido |
| | `GET /:id/attachments/:attachmentId` | Dueño del pedido o staff (rol leído de la BD); siempre como descarga |
| | `PUT /:id`, `POST /:id/cancel` | Dueño, solo mientras el pedido está pendiente de revisión; `PUT` acepta solo nombre, descripción y adjuntos (el estado lo cambia el equipo en `/api/admin/orders`) |
| `/api/deliverables` | `GET /`, `GET /:id`, `PUT /:id`, `approve`, `reject` | Autenticado + dueño o staff (rol leído de la BD) |
| | `POST /` | `admin`, `manager`, `developer` |
| `/api/invoices` | `GET /`, `GET /:id`, `download`, `GET /payment-methods` | Autenticado + dueño o staff (rol leído de la BD) |
| | `POST /`, `POST /:id/pay` | `admin`, `manager` (el pago lo registra el equipo; el cliente ve los métodos configurados) |
| `/api/messages` | todas | Autenticado + participante de la conversación |
| | `POST /conversations` | Staff (rol leído de la BD) |
| `/api/notifications` | todas | Autenticado + dueño; `targetUserId` de otra cuenta solo staff (rol leído de la BD) |
| `/api/demo-requests` | `POST /` | Pública: honeypot `website`, autorización Ley 1581 obligatoria, zod y cupos de envíos válidos por IP (`DEMO_REQUEST_LIMIT_PER_HOUR`, 5/h) y por email (`DEMO_REQUEST_LIMIT_PER_EMAIL_DAY`, 3/día) en Redis (respaldo en memoria) |
| `/api/demo-catalog` | `GET /` | Pública (slug, nombre, accessMode, activo de las 28 demos) |
| `/api/demo-access` | `GET /:slug` | Pública con sesión opcional: `{ allowed, accessMode, reason, expiresAt }`; con un acceso vigente registra el uso (una visita nueva tras 30 min sin actividad) |
| `/api/me` | `GET /demos` | Autenticado (solo los accesos de la propia cuenta) |
| `/api/auth` | `activate`, `activate/check` | Pública con token mágico de un solo uso (cada una con su límite por IP) |
| `/api/admin/demo-requests` | `GET /`, `GET /:id` | `admin`, `sales`, `manager` |
| | `approve` | `admin`, `sales`; si alguna demo aprobada es `privado`, solo `admin` (403 `requires_admin`) |
| | `PATCH /:id` (estado o nota), `reject`, `resend-activation` | `admin`, `sales` |
| `/api/admin/demo-grants` | `GET /` | `admin`, `sales`, `manager` |
| | `POST /` (invitación directa), `extend`, `revoke` | `admin`, `sales`; con demos `privado`, solo `admin` |
| | `resend-activation` (enlace nuevo para la cuenta; no da accesos) | `admin`, `sales` |
| `/api/admin/demo-catalog` | `GET /` | `admin`, `sales`, `manager` |
| | `PATCH /:slug` (o `PATCH /` con `slug`) | Admin (el chatbot RAG queda siempre público) |
| `/api/admin/audit-log` | `GET /` | Admin |
| `/api/admin/notifications` | `GET /status` (estado de los avisos al dueño, sin secretos y con destinos enmascarados) | `admin` o `manager` (no depende de `COMMERCE_ENABLED`) |
| | `POST /test` (aviso de prueba real por correo y WhatsApp) | Admin; 5 cada 15 min por cuenta; queda en la bitácora (`notifications.test`) |
| `/api/admin/privacy` | `POST /search`, `POST /export`, `POST /erase` | Admin (rol de la BD); cada acción queda en la bitácora (`privacy.search`, `privacy.export`, `privacy.erase`) sin el email buscado |
| `/api/admin` | todas las demás | `admin` o `manager` (los routers del sistema de demos se montan antes y tienen sus propios permisos) |
| | `PATCH /users/:id/role` | Admin (valida el rol; no permite quitarse el propio rol) |
| | `POST /contacts/:id/notify` (reenviar el aviso al dueño; `?todos=1` reenvía también los canales ya enviados) | Admin; 10 cada 15 min por cuenta; queda en la bitácora (`contact.notify_resend`) |
| `/api` (cuentas.routes) | `/cuentas*`, `/ley100*`, `/process`, `/export` | Staff, ruta por ruta (el router está en la raíz `/api`); `/process` y `/cuentas/procesar-hibrido` con tope `HEALTH_MONTHLY_BUDGET_USD` |
| `/api/auditoria` | todas | Acceso a demo `cuentas-medicas`; `procesar-facturas-pdf`, `procesar-modular` y `aprendizaje/feedback` con tope `HEALTH_MONTHLY_BUDGET_USD` y cupo diario por usuario `HEALTH_AI_DAILY_LIMIT_PER_USER` |
| `/api/documentos-conocimiento` | `GET config`, `config/inicializar` | Acceso a demo `cuentas-medicas` |
| | `PATCH config/:id` (activar o desactivar un documento: configuración global del motor) | Staff |
| | `config/resetear` | Admin |
| `/api/liquidacion` | todas | Staff (herramienta interna `/liquidacion`; sus datos no son de la demo) |
| `/api/reglas-facturacion` | todas | Staff (reglas globales de la herramienta interna `/liquidacion`); la interpretación con IA cuenta contra `HEALTH_MONTHLY_BUDGET_USD` |
| `/api/expert` | `procesar`, `generar-excel`, `procesar-y-descargar`, `GET configuracion`, `estadisticas` | Acceso a demo `sistema-experto` (`procesar*` y `generar-excel` con tope `HEALTH_MONTHLY_BUDGET_USD` y cupo diario por usuario) |
| | `PUT configuracion` | Staff |
| `/api/cups` | `estadisticas`, `incompletos`, `buscar-semantica`, `buscar-similares`, `estadisticas-vectorizacion` | Acceso a demo `sistema-experto` (`buscar-*` con tope `HEALTH_MONTHLY_BUDGET_USD` y cupo diario por usuario) |
| | `importar-csv`, `importar-excel`, `vectorizar`, `revectorizar` | Admin; la importación solo acepta un nombre de archivo dentro de `CUPS_IMPORT_DIR`; `vectorizar` y `revectorizar` con tope `HEALTH_MONTHLY_BUDGET_USD` |
| `/api/content` | todas | Acceso a demo `gestor-contenido` (pública por defecto) + cupo por IP y `CONTENT_MONTHLY_BUDGET_USD` |
| `/api/linkedin-ads` | `POST /generate` | Acceso a demo `linkedin-ads` + cupo por cuenta (o por IP sin sesión) en Redis y `LINKEDIN_ADS_MONTHLY_BUDGET_USD` |
| `/api/demo-rag` | todas | Pública con cupos por IP en Redis y `DEMO_MONTHLY_BUDGET_USD` |
| `/api/chatbot` | `GET /models`, `POST /bots`, `GET /bots`, `GET /bots/:id`, `POST /bots/:id/chat`, `POST /sample-bots` | Pública (lista y vista completa solo para el dueño; chat solo para bots existentes, con cupo propio de preguntas por IP; `CHATBOT_MONTHLY_BUDGET_USD`; el chat guarda la conversación solo con `channel: 'widget'` en bots creados por usuarios, con vencimiento `CHATBOT_CONVERSATION_TTL_DAYS`; `sample-bots` solo acepta textos cortos y reutiliza el bot de ejemplo por huella; las rutas de bots responden 503 `storage_unavailable` sin MongoDB) |
| | `PATCH/DELETE /bots/:id`, `docs`, `urls`, `conversations` | Dueño del bot (cabecera `X-Bot-Owner-Token`); un bot heredado sin dueño registrado solo lo administra el staff (sesión, rol de la BD) |
| | API anterior "por sesión" (`session`, `upload`, `message`, `info`, `config`, `messages`, `documents`) | Retirada: responde 404. Al arrancar se borra lo que dejó (colección `chatbots` y `uploads/chatbot`) |

## Acceso a demos (P4, DemoGrant)

`requireStaffOrDemoAccess(slug)` deja pasar al staff y, para el resto, consulta
el resolvedor registrado con `setDemoAccessResolver`. `createApp()` registra
`demoGrantResolver` (`services/demo-access.service.ts`), que aplica las reglas
de `evaluateDemoAccess`: catálogo editable (`DemoCatalogItem`: modo y activo) y
`DemoGrant` del usuario con `expiresAt` comparado con la hora actual en cada
petición (un acceso vencido o revocado se niega de inmediato, sin esperar al
job). Si MongoDB no responde, las demos públicas siguen abiertas y el resto
responde 503 (falla cerrada). Las respuestas de error llevan `motivo`
(`sin_sesion`, `sin_acceso`, `expirado`, `revocado`, `desactivada`).

Las pruebas están en `src/__tests__/integration/demos.test.ts`.
