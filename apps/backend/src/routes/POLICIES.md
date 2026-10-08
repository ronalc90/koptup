# Políticas de autorización de la API

Inventario de cada router montado en `src/app.ts` y la política que aplica en el
servidor. Los middleware están en `src/middleware/access.ts`; las pruebas que lo
demuestran (401/403/200 por política) están en `src/__tests__/integration/`.

| Política | Middleware | Quién pasa |
|---|---|---|
| Pública | — (con rate-limit y, si usa IA, tope de gasto) | Cualquiera |
| Autenticado | `authenticate` | JWT válido |
| Dueño del recurso | `authenticate` + verificación en el controlador | El dueño o el staff |
| Staff | `requireStaff` | `admin`, `manager`, `sales` (rol leído de la BD en cada petición) |
| Admin | `requireAdmin` | `admin` (rol leído de la BD) |
| Acceso a demo | `requireStaffOrDemoAccess(slug)` | Staff (admin, manager, sales; `developer` vía el resolvedor), o quien tenga un `DemoGrant` vigente de esa demo; las demos en modo `publico` (catálogo editable) quedan abiertas |
| Solo desarrollo | `devOnlyAdmin` | 404 en producción; admin en desarrollo |

| Prefijo | Rutas | Política |
|---|---|---|
| `/health/live` | GET | Pública (siempre 200; healthcheck de Railway) |
| `/health` | GET | Pública (503 si MongoDB no está conectado) |
| `/api-docs` | Swagger | Solo fuera de producción o con `API_DOCS_ENABLED=true` |
| `/api/auth` | `register`, `login`, `forgot-password`, `reset-password` | Pública con rate-limit estricto (5/min por IP) |
| | `refresh`, `google`, `google/callback` | Pública (refresh exige un refresh token válido) |
| | `me`, `profile`, `logout`, `PATCH me` (nombre, teléfono y empresa propios) | Autenticado |
| | `change-password` | Autenticado + contraseña actual, rate-limit estricto (5/min por IP) |
| `/api/contact` | `POST /` | Pública con rate-limit estricto |
| | `test-whatsapp`, `test-email` | Solo desarrollo |
| `/api/quotes` | `POST /` | Pública con rate-limit estricto |
| `/api/chat` | todas (chat heredado de eco) | Solo desarrollo |
| `/api/test` | todas (diagnóstico) | Solo desarrollo |
| `/api/documents` | todas | Autenticado + aislamiento por usuario (`user_id` de la sesión en cada consulta) |
| `/api/projects` | todas | Autenticado + pertenencia al proyecto (servicio) |
| `/api/orders` | todas | Autenticado + dueño del pedido |
| `/api/deliverables` | `GET /`, `GET /:id`, `PUT /:id`, `approve`, `reject` | Autenticado + dueño o staff |
| | `POST /` | `admin`, `manager`, `developer` |
| `/api/invoices` | `GET /`, `GET /:id`, `pay`, `download` | Autenticado + dueño o staff |
| | `POST /` | `admin`, `manager` |
| `/api/messages` | todas | Autenticado + participante de la conversación |
| `/api/notifications` | todas | Autenticado + dueño; `targetUserId` de otra cuenta solo staff |
| `/api/demo-requests` | `POST /` | Pública: honeypot `website`, autorización Ley 1581 obligatoria, zod y cupos de envíos válidos por IP (`DEMO_REQUEST_LIMIT_PER_HOUR`, 5/h) y por email (`DEMO_REQUEST_LIMIT_PER_EMAIL_DAY`, 3/día) en Redis (respaldo en memoria) |
| `/api/demo-catalog` | `GET /` | Pública (slug, nombre, accessMode, activo de las 28 demos) |
| `/api/demo-access` | `GET /:slug` | Pública con sesión opcional: `{ allowed, accessMode, reason, expiresAt }`; con un acceso vigente registra el uso (una visita nueva tras 30 min sin actividad) |
| `/api/me` | `GET /demos` | Autenticado (solo los accesos de la propia cuenta) |
| `/api/auth` | `activate`, `activate/check` | Pública con token mágico de un solo uso (`activate` con rate-limit estricto) |
| `/api/admin/demo-requests` | `GET /`, `GET /:id` | `admin`, `sales`, `manager` |
| | `approve` | `admin`, `sales`; si alguna demo aprobada es `privado`, solo `admin` (403 `requires_admin`) |
| | `PATCH /:id` (estado o nota), `reject`, `resend-activation` | `admin`, `sales` |
| `/api/admin/demo-grants` | `GET /` | `admin`, `sales`, `manager` |
| | `POST /` (invitación directa), `extend`, `revoke` | `admin`, `sales`; con demos `privado`, solo `admin` |
| | `resend-activation` (enlace nuevo para la cuenta; no da accesos) | `admin`, `sales` |
| `/api/admin/demo-catalog` | `GET /` | `admin`, `sales`, `manager` |
| | `PATCH /:slug` (o `PATCH /` con `slug`) | Admin (el chatbot RAG queda siempre público) |
| `/api/admin/audit-log` | `GET /` | Admin |
| `/api/admin` | todas las demás | `admin` o `manager` (los routers del sistema de demos se montan antes y tienen sus propios permisos) |
| | `PATCH /users/:id/role` | Admin (valida el rol; no permite quitarse el propio rol) |
| `/api` (cuentas.routes) | `/cuentas*`, `/ley100*`, `/process`, `/export` | Staff, ruta por ruta (el router está en la raíz `/api`) |
| `/api/auditoria` | todas | Acceso a demo `cuentas-medicas` |
| `/api/documentos-conocimiento` | `GET config`, `config/inicializar` | Acceso a demo `cuentas-medicas` |
| | `PATCH config/:id` (activar o desactivar un documento: configuración global del motor) | Staff |
| | `config/resetear` | Admin |
| `/api/liquidacion` | todas | Staff (herramienta interna `/liquidacion`; sus datos no son de la demo) |
| `/api/reglas-facturacion` | todas | Staff (reglas globales de la herramienta interna `/liquidacion`) |
| `/api/expert` | `procesar`, `generar-excel`, `procesar-y-descargar`, `GET configuracion`, `estadisticas` | Acceso a demo `sistema-experto` |
| | `PUT configuracion` | Staff |
| `/api/cups` | `estadisticas`, `incompletos`, `buscar-semantica`, `buscar-similares`, `estadisticas-vectorizacion` | Acceso a demo `sistema-experto` |
| | `importar-csv`, `importar-excel`, `vectorizar`, `revectorizar` | Admin; la importación solo acepta un nombre de archivo dentro de `CUPS_IMPORT_DIR` |
| `/api/content` | todas | Acceso a demo `gestor-contenido` (pública por defecto) + cupo por IP y `CONTENT_MONTHLY_BUDGET_USD` |
| `/api/linkedin-ads` | `POST /generate` | Acceso a demo `linkedin-ads` + cupo por cuenta (o por IP sin sesión) en Redis y `LINKEDIN_ADS_MONTHLY_BUDGET_USD` |
| `/api/demo-rag` | todas | Pública con cupos por IP en Redis y `DEMO_MONTHLY_BUDGET_USD` |
| `/api/chatbot` | `GET /models`, `POST /bots`, `GET /bots`, `GET /bots/:id`, `POST /bots/:id/chat` | Pública (lista y vista completa solo para el dueño; chat solo para bots existentes; `CHATBOT_MONTHLY_BUDGET_USD`) |
| | `PATCH/DELETE /bots/:id`, `docs`, `urls`, `conversations` | Dueño del bot (cabecera `X-Bot-Owner-Token`) |
| | `session`, `upload`, `message`, `info`, `config`, `messages`, `documents` (API heredada por sesión) | Pública por `sessionId`, con límites y el mismo tope de gasto del chatbot |

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
