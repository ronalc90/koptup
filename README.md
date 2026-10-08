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

**Stack real:** Next.js API routes · OpenAI SDK server-side · UI con preview LinkedIn-style.
**Código:** [`apps/web/src/app/api/linkedin-ads/generate/route.ts`](apps/web/src/app/api/linkedin-ads/generate/route.ts).

## Prototipos navegables

El resto (24 vistas: CRM, ERP, POS, HRMS, WMS, LMS, helpdesk, telemedicina, facturación electrónica, voice AI, e-commerce, automatización de workflows, scraping, etc.) son **mockups interactivos con datos simulados realistas**. Cubren el flujo de UI completo — tabs, formularios validados, gráficas, drag-and-drop, modales — pero los datos son fixtures, no provienen de un backend de producción. Sirven para que un cliente potencial vea cómo se vería un ERP o un CRM moderno antes de contratarnos para construirlo.

Catálogo filtrable por categoría: **<https://www.koptup.com/demo>**

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
  | `generate_lead` | Formulario de [`/contact`](https://www.koptup.com/contact) enviado con éxito | `lead_source` (`contact_form`), `service`, `plan_id` (si viene de un plan RAG) |
  | `demo_start` | Primera pregunta en [`/demo/chatbot`](https://www.koptup.com/demo/chatbot) en cada carga de la página | `demo_mode` (`sample`: documento de ejemplo; `upload`: documento propio) |
  | `demo_upload` | Documento subido con éxito en "Prueba con tu documento" | `file_type` (`pdf`, `docx` o `txt`), `pages` |
  | `whatsapp_click` | Clic en el botón de WhatsApp de `/contact` | `link_location` |
  | `plan_click` | Clic en el botón de un plan RAG (`/services#planes-rag`, `/rag` y "Agenda un piloto" de `/chatbots-ia`) o en los botones de las tarjetas de "Otras soluciones a medida" | `plan_name` (en el idioma del visitante; para agrupar usa `plan_id`), `plan_id`, `plan_group` (`planes_rag` u `otras_soluciones`), `cta` (`quote`, `details` o `demo`) y, en el detalle de una solución, `plan_tier` y `modality` |

- **Conversiones de Google Ads:** el código no tiene etiquetas de conversión propias de Ads. Vincula GA4 con Google Ads, marca en GA4 como *eventos clave* los que quieras optimizar (por ejemplo `generate_lead` y `demo_upload`) e impórtalos en Google Ads como conversiones de Google Analytics 4.
- **Conversiones de LinkedIn:** el Insight Tag mide visitas y audiencias. Las conversiones se crean en Campaign Manager (por ejemplo, por URL); el código no tiene IDs de conversión de LinkedIn.
- Para ver `plan_name` y los demás parámetros en los informes de GA4, regístralos como dimensiones personalizadas (*Administrar* → *Definiciones personalizadas*).

La web también usa `NEXT_PUBLIC_API_URL` (URL del backend en Railway; la demo "Prueba con tu documento" llama al backend con ella).

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
npm run test:e2e       # Playwright contra un sitio ya levantado (ver abajo)
```

- **Backend:** Jest con `ts-jest` ([`apps/backend/jest.config.js`](apps/backend/jest.config.js)). Las pruebas viven en carpetas `__tests__` dentro de `apps/backend/src`.
- **Web:** Jest con `next/jest` y jsdom ([`apps/web/jest.config.js`](apps/web/jest.config.js)). Las pruebas de humo de las demos renderizan cada página con los mensajes reales en español ([`apps/web/src/test-utils`](apps/web/src/test-utils)) y fallan si la página lanza un error, no pinta nada o usa una clave de traducción inexistente. Ninguna prueba unitaria sale a la red.
- **E2E:** Playwright ([`apps/web/playwright.config.ts`](apps/web/playwright.config.ts), pruebas en [`apps/web/e2e`](apps/web/e2e)), en escritorio y móvil con el navegador en `es-CO`. Revisa la home, `/rag`, el catálogo `/demo` y cada demo: responden 200, no muestran textos de error y no registran errores en la consola (incluidos los de hidratación de React). Las demos con un error de consola ya conocido están listadas, con su motivo, en [`apps/web/e2e/demos.spec.ts`](apps/web/e2e/demos.spec.ts): la prueba sigue revisándolas, falla si aparece cualquier otro error y también si el error conocido ya no ocurre (para que se borre de la lista). No arranca servidores: corre contra `E2E_BASE_URL` (por defecto `http://localhost:3300`; con `npm run dev` la web queda en el puerto 3000, así que usa `E2E_BASE_URL=http://localhost:3000 npm run test:e2e`) y, si se define `E2E_API_URL`, también revisa el `/health` del backend. Para probar sin clave de OpenAI hay un mock local: `node apps/web/e2e/support/openai-mock.js` y luego `OPENAI_BASE_URL=http://127.0.0.1:3999/v1 OPENAI_API_KEY=sk-test-mock` en el backend.

El workflow [`ci.yml`](.github/workflows/ci.yml) corre en cada pull request y en cada push a `main`, con Node 20:

| Job | Qué hace |
|---|---|
| Lint y tipos | Verifica que los mensajes i18n agregados estén al día, ESLint, `tsc` y el formato de los títulos de página |
| Pruebas unitarias | Jest del backend y de la web |
| Build | `tsc` del backend y `next build` de la web (apuntando a un backend local, nunca al de producción) |
| E2E | Levanta MongoDB 7, Redis 7, el mock de OpenAI, el backend y la web compilados (`next start`) y corre Playwright |

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
