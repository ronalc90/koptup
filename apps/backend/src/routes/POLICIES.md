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
| Acceso a demo | `requireStaffOrDemoAccess(slug)` | Staff, o quien tenga acceso a la demo según el resolvedor (P3: demos `publico`; P4: `DemoGrant`) |
| Solo desarrollo | `devOnlyAdmin` | 404 en producción; admin en desarrollo |

| Prefijo | Rutas | Política |
|---|---|---|
| `/health/live` | GET | Pública (siempre 200; healthcheck de Railway) |
| `/health` | GET | Pública (503 si MongoDB no está conectado) |
| `/api-docs` | Swagger | Solo fuera de producción o con `API_DOCS_ENABLED=true` |
| `/api/auth` | `register`, `login`, `forgot-password`, `reset-password` | Pública con rate-limit estricto (5/min por IP) |
| | `refresh`, `google`, `google/callback` | Pública (refresh exige un refresh token válido) |
| | `me`, `profile`, `logout` | Autenticado |
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
| `/api/admin` | todas | `admin` o `manager` |
| | `PATCH /users/:id/role` | Admin (valida el rol; no permite quitarse el propio rol) |
| `/api` (cuentas.routes) | `/cuentas*`, `/ley100*`, `/process`, `/export` | Staff, ruta por ruta (el router está en la raíz `/api`) |
| `/api/auditoria` | todas | Acceso a demo `cuentas-medicas` |
| `/api/documentos-conocimiento` | `config`, `config/:id`, `config/inicializar` | Acceso a demo `cuentas-medicas` |
| | `config/resetear` | Admin |
| `/api/liquidacion` | todas | Acceso a demo `cuentas-medicas` |
| `/api/reglas-facturacion` | todas | Acceso a demo `cuentas-medicas` |
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

## Gancho para P4 (DemoGrant)

`requireStaffOrDemoAccess(slug)` deja pasar al staff y, para el resto, consulta
el resolvedor registrado con `setDemoAccessResolver`. El de P3
(`defaultDemoAccessResolver`) abre las demos `publico` de
`DEFAULT_DEMO_ACCESS_MODES` y niega las demás. P4 registra el suyo al arrancar
(modo de acceso editable + `DemoGrant` vigente del usuario) sin tocar las rutas.
