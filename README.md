<div align="center">

# Koptup

**Estudio de desarrollo de software a medida · Bogotá, Colombia**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.9%2B-43853d?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)](https://mongodb.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**www.koptup.com**](https://www.koptup.com) · [Catálogo de prototipos](https://www.koptup.com/demo) · [Planes y servicios](https://www.koptup.com/services) · [Contacto](https://www.koptup.com/contact)

</div>

---

## Qué es

Koptup es el portafolio comercial de un estudio de desarrollo a medida. Construimos software para empresas en LATAM — web, mobile, integraciones, IA aplicada. Este repo contiene:

- **2 aplicaciones reales** que puedes usar hoy: un chatbot RAG con OpenAI y un generador de copy para LinkedIn Ads.
- **24 prototipos navegables** que muestran cómo se ve y se siente cada solución antes de que la construyamos para ti.
- **Sitio comercial** (planes RAG con precios fijos en COP y USD, catálogo de otras soluciones a medida en COP con referencia en USD a una TRM fija de 3.300, sobre nosotros, contacto).

No es un SaaS ni un producto. Es la vitrina de un equipo que cobra por construir cosas a medida.

## Aplicaciones reales

### [Chatbot RAG con IA](https://www.koptup.com/demo/chatbot)

Plataforma RAG end-to-end. Ingesta PDF/Word/Excel/CSV/HTML/URLs, chunking, retrieval BM25 con TF·IDF, llamadas a OpenAI Chat Completions (GPT-4o-mini por defecto, configurable) con citas inline `[1] [2]` clickeables. Builder visual para personalizar avatar/color/posición, 3 modos de preview (desktop/móvil/bubble) y generación de embed code (iframe / script / componente React).

**Stack real:** Next.js · TypeScript · Express · OpenAI SDK · BM25 implementado a mano · persistencia en archivos JSON.
**Código:** [`apps/backend/src/routes/chatbot.routes.ts`](apps/backend/src/routes/chatbot.routes.ts) — 11 endpoints REST, 940+ líneas.

### [Generador de LinkedIn Ads](https://www.koptup.com/demo/linkedin-ads)

Generador de copies para campañas de LinkedIn con OpenAI server-side. Calendario editorial, plantillas por industria, variantes A/B, preview en formato nativo de LinkedIn.

**Stack real:** Express (backend) con OpenAI, límite por cuenta (o por IP sin sesión) en Redis y tope de gasto mensual · ruta de Next como proxy · UI con preview LinkedIn-style.
**Código:** [`apps/backend/src/routes/linkedin-ads.routes.ts`](apps/backend/src/routes/linkedin-ads.routes.ts) y el proxy [`apps/web/src/app/api/linkedin-ads/generate/route.ts`](apps/web/src/app/api/linkedin-ads/generate/route.ts).

## Prototipos navegables

El resto (24 vistas: CRM, ERP, POS, HRMS, WMS, LMS, helpdesk, telemedicina, facturación electrónica, voice AI, e-commerce, automatización de workflows, scraping, etc.) son **mockups interactivos con datos simulados realistas**. Cubren el flujo de UI completo — tabs, formularios validados, gráficas, drag-and-drop, modales — pero los datos son fixtures, no provienen de un backend de producción. Sirven para que un cliente potencial vea cómo se vería un ERP o un CRM moderno antes de contratarnos para construirlo.

Catálogo filtrable por categoría: **<https://www.koptup.com/demo>**

### Solicitud y acceso a demos

Cada demo tiene un modo de acceso que el administrador cambia en **Admin › Catálogo de demos** (`/admin/catalogo-demos`): **Abierta** (cualquiera la abre), **Requiere acceso** (solo con un acceso aprobado) o **Solo por invitación**. El modo inicial de cada una está en [`apps/web/src/lib/demo-access-defaults.ts`](apps/web/src/lib/demo-access-defaults.ts) (igual a la semilla del backend).

1. El visitante pide la demo en [`/solicitar-demo`](https://www.koptup.com/solicitar-demo) (también desde el cierre de cada demo, las tarjetas de `/demo` y la pantalla de acceso). La solicitud exige la autorización de datos (Ley 1581 de 2012) y tiene honeypot y cupos por IP y por email.
2. El equipo la revisa en **Admin › Solicitudes de demo** (`/admin/solicitudes`): aprueba (elige demos, días y nota) o rechaza (motivo). Al aprobar se crea la cuenta del prospecto y un enlace de activación de un solo uso (72 h) que el panel muestra para **copiar** o **enviar por WhatsApp**; si el servidor tiene SMTP, también se envía por email.
3. El prospecto crea su contraseña en `/activar/<token>` y entra a **Mis demos** (`/dashboard/demos`), con los días que le quedan.
4. Al abrir `/demo/<slug>`, el middleware de Next ([`apps/web/src/middleware.ts`](apps/web/src/middleware.ts)) pregunta al backend (`GET /api/demo-access/<slug>`) con la sesión; sin acceso muestra la pantalla "Solicita acceso" (`/demo-acceso/<slug>`, sin indexar). Si el backend no responde, las demos abiertas siguen abiertas y las demás no se abren.
5. En **Admin › Accesos a demos** (`/admin/accesos`) el equipo extiende, revoca (la demo deja de abrirse desde su siguiente carga; las APIs de las demos con backend real lo verifican en cada llamada) o concede acceso directo por email.

## Stack

Tecnologías que realmente usamos en este repo:

**Frontend:** Next.js 14 (App Router) · React 18 · TypeScript · TailwindCSS · next-intl (ES/EN) · next-themes · Framer Motion · React Hook Form + Zod · SWR · Axios · Recharts · date-fns

**Backend:** Node.js 20.9+ · Express · TypeScript · Mongoose (MongoDB 7) · OpenAI SDK · JWT · bcryptjs · Multer · Helmet · Swagger (OpenAPI 3)

**Storage & infra:** AWS S3 (uploads) · Docker · Vercel (web) · Railway (API)

**Testing & calidad:** Jest (ts-jest en el backend, next/jest en la web) · React Testing Library · Playwright · ESLint · TypeScript (modo `strict` en la web) · GitHub Actions

Eso es ~25 tecnologías que dominamos. Conocemos y trabajamos cuando el proyecto lo pide con: Python (FastAPI/Django), Java (Spring Boot), .NET, Postgres + pgvector, Redis, Pinecone, Anthropic, Kubernetes, Terraform, GraphQL, gRPC, WebSockets, React Native, Flutter. Si necesitas algo fuera de esta lista, lo evaluamos antes de comprometernos.

## Quick start

```bash
git clone https://github.com/ronalc90/koptup.git
cd koptup
NODE_ENV=development npm install

# Levantar backend (terminal A)
docker run -d --name koptup-mongo -p 27017:27017 mongo:7
cp apps/backend/.env.example apps/backend/.env   # editar con OPENAI_API_KEY
cd apps/backend && npm run dev                    # http://localhost:3001

# Levantar frontend (terminal B)
cd apps/web && npm run dev                        # http://localhost:3000
```

El chatbot RAG funciona sin `OPENAI_API_KEY` (fallback extractivo BM25). Con la key activa el modo LLM completo.

## Variables de entorno

Plantillas: [`apps/web/.env.example`](apps/web/.env.example) y [`apps/backend/.env.example`](apps/backend/.env.example). En producción la web se configura en **Vercel** (proyecto → *Settings* → *Environment Variables*) y el backend en **Railway** (servicio del backend → *Variables*).

### Web (Vercel): medición para anuncios

Las tres son opcionales: si una no existe, su etiqueta no se carga. Aunque exista, la etiqueta solo se carga después de que el visitante acepte cookies en el banner o en [`/cookies`](https://www.koptup.com/cookies) ("Rechazar" deja solo las esenciales). El banner de cookies aparece solo si hay al menos una de las tres configurada (sin ninguna no hay cookies opcionales que aceptar).

| Variable | Formato | Qué hace |
|---|---|---|
| `NEXT_PUBLIC_GA_ID` | `G-XXXXXXXXXX` | ID de medición de GA4 (GA4 → *Administrar* → *Flujos de datos* → flujo web). Carga Google Analytics 4 si el visitante acepta las cookies de **analítica**. |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | `AW-XXXXXXXXX` | ID de la etiqueta de Google de la cuenta de Google Ads. Carga la etiqueta de Google Ads (vinculador de conversiones y remarketing) si el visitante acepta las cookies de **marketing**. |
| `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` | número | *Partner ID* del Insight Tag en LinkedIn Campaign Manager. Carga LinkedIn Insight Tag si el visitante acepta las cookies de **marketing**. |

- Son variables `NEXT_PUBLIC_*`: Next las fija al compilar. Después de crearlas o cambiarlas en Vercel hay que **redesplegar**. La CSP de [`apps/web/next.config.js`](apps/web/next.config.js) abre los dominios de Google o de LinkedIn solo si su variable existe en ese build.
- Un valor con un formato distinto al de la tabla se ignora (la etiqueta no se carga). En Google Ads también se acepta solo el número, sin `AW-`.
- Eventos que se envían a GA4 (y a Google Ads si su etiqueta está cargada):

  | Evento | Cuándo | Parámetros |
  |---|---|---|
  | `generate_lead` | Formulario de [`/contact`](https://www.koptup.com/contact) o de [`/solicitar-demo`](https://www.koptup.com/solicitar-demo) enviado con éxito | `lead_source` (`contact_form` o `demo-request`); en contacto, `service` y `plan_id` (si viene de un plan RAG); en solicitud de demo, `demos_count` y `demo_slugs` |
  | `demo_start` | Primera pregunta en [`/demo/chatbot`](https://www.koptup.com/demo/chatbot) en cada carga de la página | `demo_mode` (`sample`: documento de ejemplo; `upload`: documento propio) |
  | `demo_upload` | Documento subido con éxito en "Prueba con tu documento" | `file_type` (`pdf`, `docx` o `txt`), `pages` |
  | `whatsapp_click` | Clic en el botón de WhatsApp de `/contact` | `link_location` |
  | `plan_click` | Clic en el botón de un plan RAG (`/services#planes-rag`, `/rag` y "Agenda un piloto" de `/chatbots-ia`) o en los botones de las tarjetas de "Otras soluciones a medida" | `plan_name` (en el idioma del visitante; para agrupar usa `plan_id`), `plan_id`, `plan_group` (`planes_rag` u `otras_soluciones`), `cta` (`quote`, `details` o `demo`) y, en el detalle de una solución, `plan_tier` y `modality` |

- **Conversiones de Google Ads:** el código no tiene etiquetas de conversión propias de Ads. Vincula GA4 con Google Ads, marca en GA4 como *eventos clave* los que quieras optimizar (por ejemplo `generate_lead` y `demo_upload`) e impórtalos en Google Ads como conversiones de Google Analytics 4.
- **Conversiones de LinkedIn:** el Insight Tag mide visitas y audiencias. Las conversiones se crean en Campaign Manager (por ejemplo, por URL); el código no tiene IDs de conversión de LinkedIn.
- Para ver `plan_name` y los demás parámetros en los informes de GA4, regístralos como dimensiones personalizadas (*Administrar* → *Definiciones personalizadas*).

La web también usa `NEXT_PUBLIC_API_URL` (URL del backend en Railway; se fija al compilar: el navegador, el middleware de `/admin`, `/dashboard` y `/demo/<slug>` y la demo "Prueba con tu documento" llaman al backend con ella) y, solo del lado del servidor, `INTERNAL_API_KEY` (opcional; ver la tabla de seguridad del backend: debe ser igual en Vercel y en Railway).

### Backend (Railway): demo "Prueba con tu documento"

La subida de documentos en `/demo/chatbot` (`/api/demo-rag`) queda **apagada** hasta que `DEMO_UPLOAD_ENABLED=true`, Redis esté conectado y exista `OPENAI_API_KEY`. Si falta algo, el sitio muestra "Agenda una demo con nosotros" y la demo con el documento de ejemplo sigue funcionando.

| Variable | Valor | Qué hace |
|---|---|---|
| `DEMO_UPLOAD_ENABLED` | `true` para encender (por defecto `false`) | Encendido explícito de la subida de documentos. |
| `DEMO_MONTHLY_BUDGET_USD` | por defecto `50` | Tope de gasto mensual (USD, mes UTC) en OpenAI de esta demo, calculado con los tokens de cada respuesta. Al alcanzarlo se desactivan la subida y las preguntas. Un valor inválido o negativo la deja desactivada. |
| `OPENAI_API_KEY` | obligatoria | Clave de OpenAI (la demo usa `gpt-4o-mini`). La usan también el chatbot y otros módulos del backend. |
| `REDIS_URL` | obligatoria para la demo | Redis de Railway (plugin Redis). Guarda el límite de 3 documentos por IP al día y el contador de gasto. |
| `MONGODB_URI` | recomendada | Base de datos donde se guardan los leads: los del formulario de contacto y el email de la demo (origen `demo-rag`). Si falla, la demo sigue funcionando y el error queda en el log. |
| `TRUST_PROXY_HOPS` | `1` en Railway | Cantidad de proxies delante del backend; define la IP real del visitante para los límites por IP. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `ADMIN_EMAIL`, `WHATSAPP_PROVIDER` y las de su proveedor | las que ya usa el formulario de contacto | Avisos por email y WhatsApp de cada lead (mismo canal que el formulario de contacto). |
| `DEMO_RAG_TTL_SECONDS` | **no la definas en Railway** | Solo para pruebas locales: baja el tiempo de vida de 1 hora de los documentos. Se ignora con `NODE_ENV=production`. |

### Backend (Railway): seguridad y topes de IA

Al arrancar, el backend valida sus variables con zod (`apps/backend/src/config/env.ts`): en producción **no arranca** si falta `MONGODB_URI`, `JWT_SECRET` o `JWT_REFRESH_SECRET`; las opcionales que faltan solo quedan como aviso en el log. La lista completa, con su efecto, está en [`apps/backend/.env.example`](apps/backend/.env.example).

| Variable | Valor | Qué hace |
|---|---|---|
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | obligatorias, largas y distintas | Firman los tokens de sesión y de renovación. |
| `CHATBOT_MONTHLY_BUDGET_USD` | por defecto `50` | Tope de gasto mensual en OpenAI del chatbot (Builder, Playground y chat por sesión). Al alcanzarlo, el chat responde en modo extractivo y lo dice. |
| `LINKEDIN_ADS_MONTHLY_BUDGET_USD` | por defecto `20` | Tope mensual del generador de LinkedIn Ads (además, 5 generaciones cada 10 minutos y 30 al día por cuenta, o por IP si no hay sesión). |
| `CONTENT_MONTHLY_BUDGET_USD` | por defecto `20` | Tope mensual del gestor de contenido con IA. |
| `INTERNAL_API_KEY` | opcional, igual en Vercel y Railway | Permite que la web (middleware de `/admin`, `/dashboard` y `/demo/<slug>`, proxy de LinkedIn Ads) informe la IP real del visitante para los límites por IP (sin ella, esas peticiones cuentan por la IP de salida de Vercel). |
| `ADMIN_EMAIL` | opcional | Si existe, el arranque asegura el rol admin de esa cuenta (solo si ya está registrada). Sin ella, el arranque no cambia roles; también se puede usar `src/scripts/set-admin.ts`. |
| `API_DOCS_ENABLED` | `false` en producción | `/api-docs` solo existe fuera de producción o con este valor en `true`. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | por defecto 15 min y `100` | Límite general de la API, por cuenta (con sesión) o por IP. |
| `AUTH_ME_RATE_LIMIT_MAX` | por defecto `120` por minuto | Cupo propio de `GET /api/auth/me` y `GET /api/demo-access/<slug>`, que el middleware de la web consulta en cada navegación del panel, del portal y de las demos con acceso. |
| `CHATBOT_RATE_LIMIT_MAX` | por defecto `60` por minuto | Peticiones por IP a `/api/chatbot`. |
| `CHATBOT_CREATE_LIMIT_PER_HOUR` | por defecto `30` | Bots nuevos por IP cada hora en el Builder del chatbot. |
| `CHATBOT_EXAMPLE_BOT_IDS` | opcional | IDs, separados por coma, de los bots de ejemplo que todos ven en `GET /api/chatbot/bots` (el resto solo lo ve su dueño). |
| `CHATBOT_STATE_DIR` | por defecto `./data/chatbots` | Carpeta del estado en disco del chatbot (en Railway el disco es efímero). |
| `CUPS_IMPORT_DIR` | por defecto `./data/imports` | Única carpeta desde la que el admin puede importar CUPS, solo por nombre de archivo. |
| `OPENAI_BASE_URL` | **no la definas en Railway** | Solo para pruebas locales y CI: apunta el backend al mock de OpenAI (ver [Pruebas y CI](#pruebas-y-ci)). |

Railway revisa `GET /health/live` (el proceso responde) al desplegar; `GET /health` responde 503 si MongoDB no está conectado.

### Backend (Railway): solicitud y acceso a demos

El modo de acceso de cada demo (abierta, requiere acceso o solo por invitación) no es una variable: se cambia en **Admin › Catálogo de demos** y queda en MongoDB. Estas variables ajustan el resto del sistema:

| Variable | Valor | Qué hace |
|---|---|---|
| `FRONTEND_URL` | URL pública de la web (`https://www.koptup.com`) | Base de los enlaces que arma el backend: activación (`/activar/<token>`), Mis demos, restablecer contraseña y los correos. Sin ella usa `http://localhost:3000`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | opcionales | Acuse a quien pide la demo, correo de aprobación con el enlace de activación y recordatorio 3 días antes de que venza el acceso. Sin SMTP no se envía ningún correo y el panel muestra siempre el enlace para copiarlo o enviarlo por WhatsApp. |
| `ADMIN_EMAIL`, `WHATSAPP_PROVIDER` y las de su proveedor | opcionales | Aviso al equipo de cada solicitud nueva, por el mismo canal del formulario de contacto. |
| `PRIVACY_POLICY_VERSION` | por defecto `2026-10` | Versión de la política de tratamiento de datos que se guarda con cada autorización (Ley 1581). Cámbiala cuando publiques una política nueva. |
| `DEMO_REQUEST_LIMIT_PER_HOUR` | por defecto `5` | Solicitudes válidas por IP cada hora en `/solicitar-demo` (las que tienen errores de formulario no cuentan). |
| `DEMO_REQUEST_LIMIT_PER_EMAIL_DAY` | por defecto `3` | Solicitudes válidas por email al día. |
| `DEMO_GRANTS_JOB_ENABLED` | por defecto `true` | Job que marca como vencidos los accesos que pasaron su fecha y envía el recordatorio (si hay SMTP). Usa un candado en Redis para que, con varias instancias, corra una sola. `false` lo apaga en esa instancia. |
| `DEMO_GRANTS_JOB_INTERVAL_MS` | por defecto `3600000` (1 hora; mínimo `60000`) | Cada cuánto corre ese job. |

## Estructura del repo

```
apps/
  web/                    # Next.js — sitio + demos en /demo
    e2e/                  # pruebas end-to-end (Playwright)
  backend/                # Express — APIs reales (chatbot) + mocks (resto)
packages/
  database/               # init.sql heredado (la app usa MongoDB)
docs/
  wiki/                   # fuente de la wiki del proyecto
.github/workflows/        # CI (ci.yml) y publicación de la wiki (wiki-sync.yml)
```

## Pruebas y CI

```bash
npm test               # Jest de backend y web (turbo)
npm run lint           # ESLint de backend y web
npm run typecheck      # TypeScript (tsc --noEmit) de backend y web, incluidas las pruebas
npm run test:e2e       # Playwright contra un sitio ya levantado (ver "E2E en local")
```

### Pruebas unitarias y de integración

- **Backend:** Jest con `ts-jest` ([`apps/backend/jest.config.js`](apps/backend/jest.config.js)). Las pruebas viven en carpetas `__tests__` dentro de `apps/backend/src`: `unit/` no necesita nada; `integration/` (supertest contra la app completa: permisos por rol, sistema de demos, chatbot, topes de gasto, perfil) necesita MongoDB y Redis y se **omite** si no se definen:

  ```bash
  MONGODB_URI_TEST=mongodb://127.0.0.1:27017/koptup_test \
  REDIS_URL_TEST=redis://127.0.0.1:6379/15 \
  npm test --workspace=apps/backend
  ```

  Usa una base y un índice de Redis solo para pruebas: cada archivo crea y borra su base `<base>_<sufijo>` y las pruebas borran claves de cupos y gasto en ese Redis.
- **Web:** Jest con `next/jest` y jsdom ([`apps/web/jest.config.js`](apps/web/jest.config.js)): `npm test --workspace=apps/web`. Las pruebas de humo de las demos renderizan cada página con los mensajes reales en español ([`apps/web/src/test-utils`](apps/web/src/test-utils)) y fallan si la página lanza un error, no pinta nada o usa una clave de traducción inexistente. También prueban el middleware de acceso a demos. Ninguna prueba unitaria sale a la red.

### E2E (Playwright)

[`apps/web/playwright.config.ts`](apps/web/playwright.config.ts), pruebas en [`apps/web/e2e`](apps/web/e2e), en escritorio y en móvil (Pixel 7) con el navegador en `es-CO`. No arranca servidores: corre contra una web y un backend ya levantados. Un tercer proyecto, `catalogo`, corre al final y solo `access-mode.spec.ts`, porque cambia el catálogo de demos (un dato global) y no debe cruzarse con las pruebas que abren esa demo.

| Archivo | Qué comprueba |
|---|---|
| `smoke.spec.ts` | Home, `/rag` y `/services#planes-rag`: 200, título, un solo H1, el ancla de planes a la vista y cero errores de consola (incluidos los de hidratación de React). |
| `demos.spec.ts` | El catálogo `/demo` y cada demo: 200, sin textos de error y sin errores de consola. Las demos con un error ya conocido están en [`e2e/support/known-issues.ts`](apps/web/e2e/support/known-issues.ts) con su motivo: la prueba falla si aparece cualquier otro error y también si el conocido deja de ocurrir (la lista solo se achica). |
| `demo-access.spec.ts` | Lo que ve un visitante: badges del catálogo, pantalla de acceso de una demo por solicitud o privada, formulario `/solicitar-demo` (este último registra una solicitud de verdad: solo con `E2E_API_URL`). |
| `demo-flow.spec.ts` | El flujo completo con la interfaz de cada persona: el visitante pide una demo → el admin la aprueba en el panel y copia el enlace → el prospecto activa su cuenta, ve Mis demos y abre la demo → el admin revoca → la demo vuelve a pedir acceso. |
| `permissions.spec.ts` | Autorización en el servidor: un prospecto no entra a `/admin`, un visitante sin sesión no entra a `/dashboard` y una demo privada sin acceso muestra la pantalla de acceso (también con sesión). |
| `access-mode.spec.ts` | El admin cambia el modo de acceso de una demo en Admin › Catálogo de demos y el sitio lo aplica (espera hasta 90 s por la caché de 60 s del middleware). Corre una vez, en escritorio, cuando terminan las demás (proyecto `catalogo`; si alguna falló, Playwright la marca como no ejecutada) y deja la demo como estaba. |
| `contact.spec.ts` | El formulario de `/contact` envía el lead y queda guardado (lo lista Admin › Contactos). |
| `rag-upload.spec.ts` | `/demo/chatbot` › "Prueba con tu documento": sube un PDF de 2 páginas ([`e2e/fixtures`](apps/web/e2e/fixtures)), pregunta, ve la cita de la página y el contador de preguntas pasa de 0/10 a 1/10. |
| `api-health.spec.ts` | `GET /health` del backend. |

Las pruebas de la plataforma siembran sus datos por la API del backend ([`e2e/support/backend.ts`](apps/web/e2e/support/backend.ts): cuentas, invitaciones, activación, catálogo) con emails únicos en el dominio reservado `.test`. La única excepción es la cuenta admin de pruebas: [`e2e/global-setup.ts`](apps/web/e2e/global-setup.ts) la registra por la API con una contraseña al azar de cada corrida y le da el rol con el script del backend `src/scripts/set-admin.ts` (la API no deja que nadie se asigne el rol admin). Cada visitante de prueba se presenta con su propia IP en `X-Forwarded-For`, como haría el proxy de Railway, para que los cupos por IP (login, contacto, solicitudes, documentos de la demo RAG) se apliquen igual que en producción sin que varias corridas seguidas los agoten.

| Variable | Para qué |
|---|---|
| `E2E_BASE_URL` | URL de la web (por defecto `http://localhost:3300`). |
| `E2E_API_URL` | URL del backend al que apunta esa web. Sin ella, las pruebas que siembran datos se omiten con el motivo y el resto corre solo contra la web. |
| `E2E_MONGODB_URI` | Base de MongoDB de ese backend, para crear la cuenta admin de pruebas. |
| `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` | En lugar de `E2E_MONGODB_URI`: una cuenta que ya es admin. Sin ninguna de las dos opciones, la corrida falla con un mensaje claro (las pruebas del panel no se saltan en silencio). |
| `E2E_ALLOW_REMOTE` | Con `E2E_API_URL`, la corrida se niega a empezar si la web o el backend no son locales (`localhost`, `127.0.0.1`), porque siembra datos y cambia el catálogo. `1` lo permite, solo para un entorno de pruebas desechable (nunca producción). |
| `E2E_INCLUDE_KNOWN_ISSUES` | `1` para exigir cero errores de consola también en las demos de la lista de problemas conocidos. |
| `OPENAI_MOCK_PORT`, `OPENAI_MOCK_HOST`, `OPENAI_MOCK_LOG` | Puerto (3999), host (127.0.0.1) y archivo de registro opcional del mock de OpenAI. |

#### E2E en local, paso a paso

Igual que el job de CI: MongoDB 7, Redis 7, el mock de OpenAI ([`apps/web/e2e/support/openai-mock.js`](apps/web/e2e/support/openai-mock.js), sin clave ni costo: responde "Respuesta simulada (mock de OpenAI)…" y cita el primer extracto que recibe), el backend y la web compilados.

```bash
# 0. MongoDB y Redis
docker run -d --name koptup-mongo -p 27017:27017 mongo:7
docker run -d --name koptup-redis -p 6379:6379 redis:7

# 1. Mock de OpenAI (terminal A)
node apps/web/e2e/support/openai-mock.js                 # http://127.0.0.1:3999/v1

# 2. Backend compilado (terminal B). Los valores son solo para pruebas locales.
npm run build --workspace=apps/backend
cd apps/backend && PORT=3001 NODE_ENV=production \
  MONGODB_URI=mongodb://127.0.0.1:27017/koptup_e2e REDIS_URL=redis://127.0.0.1:6379 \
  JWT_SECRET=solo-local-e2e JWT_REFRESH_SECRET=solo-local-e2e-refresh \
  CORS_ORIGIN=http://localhost:3000 FRONTEND_URL=http://localhost:3000 \
  OPENAI_BASE_URL=http://127.0.0.1:3999/v1 OPENAI_API_KEY=sk-test-mock \
  DEMO_UPLOAD_ENABLED=true RATE_LIMIT_MAX_REQUESTS=10000 \
  node dist/index.js

# 3. Web compilada apuntando a ese backend (terminal C)
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run build --workspace=apps/web
cd apps/web && npx next start -p 3000

# 4. Playwright (terminal D)
npx playwright install chromium                          # solo la primera vez
E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:3001 \
  E2E_MONGODB_URI=mongodb://127.0.0.1:27017/koptup_e2e npm run test:e2e

# Un archivo o un proyecto:
#   npm run test:e2e -- e2e/demo-flow.spec.ts --project=escritorio
# El proyecto "catalogo" depende de los otros dos; para correr solo su prueba:
#   npm run test:e2e -- e2e/access-mode.spec.ts --project=catalogo --no-deps
```

`RATE_LIMIT_MAX_REQUESTS` alto es necesario porque todas las páginas y demos salen de la misma máquina; los cupos por IP de login, contacto, solicitudes y la demo RAG no se tocan (cada visitante de prueba usa su propia IP). La suite completa tarda unos 4 a 5 minutos con 2 workers (minuto y medio es la prueba del proyecto `catalogo`, que espera dos veces la caché del middleware).

### CI

El workflow [`ci.yml`](.github/workflows/ci.yml) corre en cada pull request y en cada push a `main`, con Node 20:

| Job | Qué hace |
|---|---|
| Lint y tipos | Verifica que los mensajes i18n agregados estén al día, ESLint, `tsc` y el formato de los títulos de página |
| Pruebas unitarias | Jest del backend (con MongoDB y Redis, así que también corren las de integración) y de la web |
| Build | `tsc` del backend y `next build` de la web (apuntando a un backend local, nunca al de producción) |
| E2E | Levanta MongoDB 7, Redis 7, el mock de OpenAI versionado, el backend (`DEMO_UPLOAD_ENABLED=true`) y la web compilados (`next start`) y corre toda la suite de Playwright, incluido el flujo de solicitud → aprobación → activación → acceso → revocación |

## Despliegue

GitHub Actions **no despliega**: el workflow de CI solo verifica. El despliegue lo hacen las integraciones de cada plataforma con el repositorio de GitHub:

- **Web:** Vercel (proyecto conectado al repositorio).
- **API:** Railway, que construye con Nixpacks según [`apps/backend/railway.json`](apps/backend/railway.json) (`npm install && npm run build` y arranca con `npm run start`). Nixpacks elige la versión de Node con `engines.node` de [`apps/backend/package.json`](apps/backend/package.json) (`>=20.9.0`; si el servicio no define `NIXPACKS_NODE_VERSION`, hoy resuelve a Node 24 LTS) e instala también las `devDependencies` para compilar (`NPM_CONFIG_PRODUCTION=false`): TypeScript y los `@types/*` están ahí.

Las variables de cada entorno se configuran en esas plataformas (ver [Variables de entorno](#variables-de-entorno)). Los secretos nunca van en el repositorio: el único archivo de entorno versionado, `apps/web/.env.production`, solo tiene las URL públicas del sitio y de la API.

## Documentación y plan de producto

El plan para convertir Koptup en un producto vendible (flujo del cliente, sistema de solicitud y acceso a demos, panel de administración, plan por producto y por sección, roadmap) vive en la **[wiki del proyecto](https://github.com/ronalc90/koptup/wiki)**. La fuente versionada está en [`docs/wiki/`](docs/wiki/Home.md) y se publica en la wiki con el workflow [`wiki-sync.yml`](.github/workflows/wiki-sync.yml).

## Estado del proyecto

- **Producción:** [www.koptup.com](https://www.koptup.com) (Vercel) + API en Railway.
- **Chatbot RAG:** integración real con OpenAI, persistencia en disco, multi-tenant.
- **24 prototipos restantes:** UI completa, datos simulados, no production-ready sin trabajo adicional.
- **Roadmap inmediato:** S3 real para uploads del RAG, autenticación de tenants, métricas de uso.

## ¿Quieres contratarnos?

Construimos a medida lo que viste en los prototipos — o lo que necesites que no esté acá. Tarifas en COP y USD, propuesta en 48h hábiles.

- **Email:** [dirox7@gmail.com](mailto:dirox7@gmail.com)
- **Sitio:** [www.koptup.com/contact](https://www.koptup.com/contact)
- **LinkedIn:** [/in/ronalc90](https://www.linkedin.com/in/ronalc90)

## Licencia

[MIT](LICENSE) · Ronald Cipagauta · 2026
