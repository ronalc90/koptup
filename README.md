# KopTup — Soluciones tecnológicas a medida

[![CI/CD](https://github.com/ronalc90/koptup/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ronalc90/koptup/actions/workflows/ci.yml)

![KopTup Logo](https://via.placeholder.com/800x200/2563eb/ffffff?text=KopTup+Tech+Solutions)

> Empresa colombiana de desarrollo de software a medida e implementación de soluciones con inteligencia artificial para PyMEs y compañías enterprise de LATAM.

KopTup es la plataforma comercial de Ronald Cipagauta (Bogotá, Colombia). Combina una vitrina corporativa, un catálogo de **27 demos interactivas** funcionando con datos simulados realistas, un portafolio de **26+ servicios** con planes Inicial / Profesional / Enterprise, y un backend Express que sirve APIs REST para que cada demo se sienta como un producto vivo. El objetivo es que un cliente potencial pueda **probar** el tipo de solución que construimos antes de hablar con nosotros.

---

## Tabla de contenido

1. [¿Qué hace este proyecto?](#1-qué-hace-este-proyecto)
2. [Las 27 demos en detalle](#2-las-27-demos-en-detalle)
3. [Stack tecnológico completo](#3-stack-tecnológico-completo)
4. [Capacidades de IA implementadas](#4-capacidades-de-ia-implementadas)
5. [Internacionalización (i18n)](#5-internacionalización-i18n)
6. [Diseño y UX](#6-diseño-y-ux)
7. [Quick Start](#7-quick-start)
8. [Estructura de carpetas](#8-estructura-de-carpetas)
9. [Testing](#9-testing)
10. [Deploy](#10-deploy)
11. [Documentación adicional](#11-documentación-adicional)
12. [Contribución](#12-contribución)
13. [Contacto](#13-contacto)
14. [Licencia](#14-licencia)

---

## 1. ¿Qué hace este proyecto?

**KopTup** es una plataforma vitrina pensada para que clientes potenciales vean, en vivo, el tipo de software que construimos. No es un portafolio estático con capturas: cada demo es una **aplicación funcional navegable**, con tabs, datos simulados, formularios que validan, gráficas que se mueven y APIs reales detrás. La idea es que el visitante pueda jugar con la solución antes de pedir cotización.

Las **27 demos** cubren desde un e-commerce clásico hasta una plataforma de moderación de contenido multi-modal con IA, pasando por ERP multi-país, telemedicina, voice AI, automatización de workflows, scraping con IA y más. Cada una vive en su propia ruta dentro de `apps/web/src/app/demo/<slug>/` y tiene su carpeta espejo en `apps/backend/src/modules/<slug>/` con los endpoints REST que la alimentan.

El **backend Express** simula APIs REST de cada demo con datos mock pero estructurados como una API real (paginación, filtros, validación, errores con códigos HTTP). Esto cumple dos objetivos: (1) que las demos se vean dinámicas y (2) servir como punto de partida cuando un cliente nos contrata para construirle algo parecido — no arrancamos desde cero, partimos del módulo demo.

---

## 2. Las 27 demos en detalle

Todas las demos comparten estos atributos:

- **Navegables**: tabs, modales, formularios, drag-and-drop según aplique.
- **Datos simulados realistas**: mockData consistente y suficiente para que se vea poblada.
- **i18n ES/EN**: textos en `apps/web/messages/demos/<slug>.{es,en}.json` con merge automático.
- **Modo oscuro completo**: paletas `primary-*` y `secondary-*` del design system.
- **Responsive mobile-first**: probadas en breakpoints `sm`, `md`, `lg`, `xl`.
- **Backend mock**: la mayoría tienen su módulo Express con endpoints REST en `apps/backend/src/modules/<modulo>/`.

### Demos originales (1–9)

| # | Demo | Categoría | Descripción | Frontend | Backend |
|---|------|-----------|-------------|----------|---------|
| 1 | Chatbot Inteligente | Atención al Cliente | Asistente virtual con IA, RAG enterprise (19 capas), builder visual y embed multi-canal. Responde, procesa documentos y aprende de cada interacción. | [Ver demo](./apps/web/src/app/demo/chatbot/) | [Módulo backend](./apps/backend/src/routes/) |
| 2 | E-Commerce Completo | Retail & Ventas | Tienda en línea moderna con carrito, checkout, gestión de productos y dashboard de ventas en tiempo real. | [Ver demo](./apps/web/src/app/demo/ecommerce/) | — |
| 3 | Dashboard Ejecutivo | Business Intelligence | Panel de control gerencial con KPIs, métricas financieras, análisis de ventas y reportes interactivos. | [Ver demo](./apps/web/src/app/demo/dashboard-ejecutivo/) | — |
| 4 | Gestor Documental | Gestión Documental | Organiza, busca y comparte documentos con etiquetas, búsqueda semántica y control de versiones. | [Ver demo](./apps/web/src/app/demo/gestor-documentos/) | — |
| 5 | Sistema de Reservas | Servicios | Plataforma de reservas online con calendario, notificaciones y gestión de disponibilidad. | [Ver demo](./apps/web/src/app/demo/sistema-reservas/) | — |
| 6 | CMS Avanzado | Marketing Digital | Administra contenido, páginas y blog con editor visual, SEO y publicación programada. | [Ver demo](./apps/web/src/app/demo/gestor-contenido/) | — |
| 7 | Gestión de Proyectos | Productividad | Sistema ágil con tableros Kanban, sprints, tareas, dependencias y colaboración en equipo. | [Ver demo](./apps/web/src/app/demo/control-proyectos/) | — |
| 8 | Auditoría de Cuentas Médicas | Salud | Vertical médico para auditar facturación clínica con catálogos CIE-10 / CUPS, flujos de glosas y trazabilidad. Acceso con código **2020**. | [Ver demo](./apps/web/src/app/demo/cuentas-medicas/) | — |
| 9 | Sistema Experto Médico | Salud / IA | Motor de reglas y árboles de decisión para auditoría médica automatizada con explicabilidad. | [Ver demo](./apps/web/src/app/demo/sistema-experto/) | — |

### Demos enterprise nuevas (10–27)

| # | Demo | Categoría | Descripción | Frontend | Backend |
|---|------|-----------|-------------|----------|---------|
| 10 | CRM con IA | Ventas IA | Plataforma comercial inteligente: pipeline visual, lead scoring ML, forecast predictivo y asistente IA para tu equipo de ventas. | [Ver demo](./apps/web/src/app/demo/crm-ia/) | [Módulo backend](./apps/backend/src/modules/crm/) |
| 11 | ERP Modular | Gestión Empresarial | Suite empresarial integral con módulos de Contabilidad, Finanzas, Inventario, Ventas, Compras, RRHH y Manufactura. Multi-país (CO/MX/AR/CL/PE) y multi-moneda. | [Ver demo](./apps/web/src/app/demo/erp/) | [Módulo backend](./apps/backend/src/modules/erp/) |
| 12 | Help Desk con IA | Servicio al Cliente | Centro omnicanal de tickets con enrutamiento inteligente por skills y sentiment, respuestas asistidas y SLA en tiempo real. | [Ver demo](./apps/web/src/app/demo/helpdesk-ia/) | [Módulo backend](./apps/backend/src/modules/helpdesk/) |
| 13 | Plataforma LMS | Educación | E-learning interactivo con IA, gamificación, clases en vivo, certificados blockchain y analíticas para alumno, instructor y admin. | [Ver demo](./apps/web/src/app/demo/lms/) | [Módulo backend](./apps/backend/src/modules/lms/) |
| 14 | Telemedicina | Salud Digital | Plataforma integral de teleconsulta: sala de espera con triage IA, video consulta, ficha clínica, receta electrónica, laboratorio HL7/FHIR y agenda por especialidad. | [Ver demo](./apps/web/src/app/demo/telemedicina/) | [Módulo backend](./apps/backend/src/modules/telemedicine/) |
| 15 | Facturación Electrónica | Fiscal LATAM | Plataforma fiscal unificada: emite, recibe, valida y almacena documentos con cumplimiento normativo en 8 países (DIAN, SAT, AFIP, SII, SUNAT y más). | [Ver demo](./apps/web/src/app/demo/facturacion-electronica/) | [Módulo backend](./apps/backend/src/modules/e-invoicing/) |
| 16 | WMS & Logística | Supply Chain | Gestión de bodegas, picking optimizado, ruteo VRP, last-mile y 3PL multi-cliente en una sola plataforma. | [Ver demo](./apps/web/src/app/demo/wms-logistica/) | [Módulo backend](./apps/backend/src/modules/wms/) |
| 17 | POS / Punto de Venta | Retail Omnicanal | Suite omnicanal: restaurante, retail, autoservicio y kiosko con facturación electrónica, fidelización y hardware integrado (impresoras, scanners, cajones, balanzas). | [Ver demo](./apps/web/src/app/demo/pos/) | [Módulo backend](./apps/backend/src/modules/pos/) |
| 18 | HRMS | Talento Humano | Plataforma integral de talento: directorio, ATS, performance, payroll, learning y analítica con IA para LATAM. | [Ver demo](./apps/web/src/app/demo/hrms/) | [Módulo backend](./apps/backend/src/modules/hrms/) |
| 19 | Automatización | DevTools / iPaaS | Diseña flujos visuales con triggers, IA nativa, código sandboxed, observabilidad y versionado. Estilo n8n + Zapier, pensado para equipos. | [Ver demo](./apps/web/src/app/demo/automatizacion/) | [Módulo backend](./apps/backend/src/modules/automation/) |
| 20 | SaaS Boilerplate | Plataforma B2B | Plantilla productiva para construir SaaS B2B: auth empresarial, billing, multi-tenancy con RLS, webhooks, audit logs, feature flags y observabilidad. Todo listo desde el día uno. | [Ver demo](./apps/web/src/app/demo/saas-boilerplate/) | [Módulo backend](./apps/backend/src/modules/saas-platform/) |
| 21 | Voice AI / Call Center | Comunicaciones IA | Cockpit de voz: agente conversacional, transcripción en vivo, sentiment, function calling, campañas outbound y handoff a humano. | [Ver demo](./apps/web/src/app/demo/voice-ai/) | [Módulo backend](./apps/backend/src/modules/voice-ai/) |
| 22 | Firma Electrónica | LegalTech | Firma documentos legalmente vinculantes en minutos. Simple, Avanzada y Cualificada eIDAS / Ley 527 CO con audit trail criptográfico. | [Ver demo](./apps/web/src/app/demo/firma-electronica/) | [Módulo backend](./apps/backend/src/modules/e-signature/) |
| 23 | Scraping & Extracción | DataOps | Builder visual point-and-click, IA con schemas, cluster de browsers headless, anti-bot stealth, scheduler, diff detection y outputs multi-canal. | [Ver demo](./apps/web/src/app/demo/scraping/) | [Módulo backend](./apps/backend/src/modules/scraping/) |
| 24 | Code Review con IA | DevTools | Plataforma DevTools: revisión automatizada de PRs, generación de tests, escaneo de seguridad (SAST/DAST/SCA), compliance de licencias y analítica de ingeniería. | [Ver demo](./apps/web/src/app/demo/code-review-ia/) | [Módulo backend](./apps/backend/src/modules/code-review/) |
| 25 | Moderación de Contenido | Trust & Safety | Clasificación multi-modal (texto, imagen, video, audio), workflows configurables, bienestar de moderadores y trazabilidad completa para plataformas a escala. | [Ver demo](./apps/web/src/app/demo/moderacion-contenido/) | [Módulo backend](./apps/backend/src/modules/moderation/) |
| 26 | App de Delivery | Marketplaces | Plataforma multi-rol: Customer, Driver, Merchant y Operaciones con tracking en vivo, pagos in-app y routing ML. | [Ver demo](./apps/web/src/app/demo/delivery/) | [Módulo backend](./apps/backend/src/modules/delivery/) |
| 27 | Loyalty | Fidelización | Plataforma integral de puntos, tiers, misiones, coaliciones y analítica de retención para retail, banca y servicios. | [Ver demo](./apps/web/src/app/demo/loyalty/) | [Módulo backend](./apps/backend/src/modules/loyalty/) |

> **Nota sobre el catálogo de servicios**: el archivo `services-catalog.ts` con los 26+ servicios comerciales (3 planes cada uno con precios en COP) se perdió en un `git stash drop` reciente. La reconstrucción del catálogo está **pendiente** y forma parte del próximo sprint.

---

## 3. Stack tecnológico completo

Esta sección está pensada para que **cualquier persona** entienda qué hace cada pieza. Si ya conocés la herramienta, podés saltearla.

### 3.1 Frontend (`apps/web/`)

| Tecnología | Qué es | Por qué la usamos |
|------------|--------|-------------------|
| **Next.js 14** (App Router) | Framework de React para sitios web rápidos. Permite renderizar páginas en el servidor (SSR), regenerarlas con ISR, ejecutar código al filo del CDN (edge runtime) y combinar componentes de servidor + cliente. | Performance enterprise, SEO out-of-the-box, server actions para mutar datos sin endpoints manuales. |
| **TypeScript** | JavaScript con tipos. El compilador detecta errores antes de que el código se ejecute. | Previene bugs en producción, autocompletado robusto, refactors seguros. |
| **TailwindCSS** | Framework CSS basado en clases utilitarias atómicas (ej. `p-4 text-lg dark:bg-primary-900`). Compila solo lo que se usa (JIT). | Velocidad de iteración, consistencia visual, soporte nativo a dark mode con `dark:*`. |
| **next-intl** | Librería de internacionalización para Next.js. Soporta server components, formatters y mensajes anidados. | Catálogos de mensajes en ES y EN, locale persistido en cookie, fallback automático. |
| **next-themes** | Hook para alternar entre modo claro y oscuro con persistencia en `localStorage`. | Tema persistido, no hay flash al cargar. |
| **Framer Motion** | Librería declarativa de animaciones para React. | Microinteracciones suaves, gestos drag, animaciones de layout. |
| **React Hook Form + Zod** | Manejo performante de formularios (RHF) + validación con schemas (Zod). | Pocos re-renders, validación tipada de extremo a extremo. |
| **SWR** | Cliente de fetching con cache, revalidación on focus, dedupe de requests y mutations optimistas. | Datos siempre frescos sin esfuerzo manual. |
| **Axios** | Cliente HTTP basado en promesas. | Interceptors, transformación de requests, timeouts. |
| **Heroicons** | Librería de iconos SVG outline y solid, mantenida por el equipo de Tailwind. | Consistencia visual y peso bajo. |
| **date-fns** | Utilidades modulares para manipular fechas. | Tree-shakeable, sin la huella de Moment. |
| **react-markdown + rehype/remark** | Render de contenido Markdown con plugins de syntax highlighting, GFM, etc. | Contenido editorial, mensajes del chatbot, posts del CMS. |
| **jspdf** | Generación de PDFs en el navegador. | Exportar reportes, facturas, certificados sin pasar por el servidor. |

### 3.2 Backend (`apps/backend/`)

| Tecnología | Qué es | Por qué la usamos |
|------------|--------|-------------------|
| **Node.js 18+** | Runtime de JavaScript en el servidor. | Mismo lenguaje que el frontend, ecosistema enorme. |
| **Express** | Framework web minimalista para construir APIs REST. | Maduro, simple, integrable con casi cualquier librería. |
| **TypeScript** | Tipado estático en el servidor. | Contratos de API explícitos, menos errores en runtime. |
| **Mongoose** | ODM (Object Document Mapper) para MongoDB. Modela documentos con schemas, validación e hooks. | Definir colecciones de manera declarativa. |
| **JWT** (`jsonwebtoken`) | Tokens firmados para autenticación stateless. | No requiere sesión en server, escala horizontalmente. |
| **bcryptjs** | Hashing seguro de contraseñas con salt. | Almacenamos passwords nunca en texto plano. |
| **Passport** | Middleware de autenticación con estrategias plug-in. | Login con Google OAuth, GitHub, etc. |
| **Multer** | Middleware para `multipart/form-data`. Maneja uploads. | Subida de PDFs, imágenes, CSVs hacia el backend. |
| **express-validator** | Validación de inputs en endpoints (body, query, params). | Defensa en profundidad además de Zod en el front. |
| **Helmet** | Headers HTTP de seguridad (CSP, X-Frame-Options, HSTS, etc.). | Hardening de la API por defecto. |
| **cors** | Habilita Cross-Origin Resource Sharing con whitelist. | Permitir que el front llame al back en otro dominio. |
| **compression** | Comprime las respuestas con gzip / brotli. | Menos ancho de banda, latencia menor. |
| **morgan** | Logger HTTP para Express (method, url, status, tiempo). | Trazabilidad de requests en dev. |
| **winston** | Logger estructurado con niveles, transports y formatos JSON. | Logs listos para shipping a Loki / Datadog. |
| **swagger-jsdoc + swagger-ui** | Genera docs OpenAPI desde comentarios JSDoc en el código. | Docs siempre sincronizadas. Disponibles en `/api-docs`. |
| **Nodemailer** | Envío de emails vía SMTP, SendGrid, SES. | Notificaciones, recuperación de password, reportes. |
| **openai** | Cliente oficial para la API de OpenAI (chat, embeddings, function calling). | Backbone de los chatbots, embeddings semánticos, agentes. |
| **@anthropic-ai/sdk** | Cliente para LLMs de Anthropic. | Multi-LLM routing en el chatbot enterprise. |
| **@pinecone-database/pinecone** | Cliente de Pinecone, base de datos vectorial managed. | Vector store para RAG. |
| **exceljs / csv-parser / cheerio / mammoth / xlsx / pdf-parse** | Set de parsers para ingerir Excel, CSV, HTML, Word, hojas de cálculo y PDFs. | Ingesta multi-formato para el RAG y para importadores de los módulos. |

### 3.3 Bases de datos

| Motor | Rol | Notas |
|-------|-----|-------|
| **MongoDB 7** | DB principal del backend. Documentos flexibles para módulos demo. | Levantado local con Docker (`mongo:7`). |
| **PostgreSQL 15 + pgvector** | DB relacional opcional para módulos con tipos estrictos (billing, embeddings). | Schema base en `packages/database/init.sql`. |
| **Redis** | Caché y sesiones efímeras. | Opcional, mejora latencia en endpoints calientes. |

### 3.4 Infra & DevOps

| Herramienta | Uso |
|-------------|-----|
| **Turborepo** | Monorepo con cache de builds. Permite correr `dev`, `build`, `test`, `lint` solo sobre lo que cambió. |
| **Docker + docker-compose** | Entornos local (`docker-compose.dev.yml`) y production-like (`docker-compose.yml`). |
| **Kubernetes** | Manifests en `infra/k8s/` con base + overlays `dev` y `prod`. |
| **Terraform** | Stubs de Infraestructura como Código en `infra/terraform/`. |
| **GitHub Actions** | CI en `.github/workflows/`. Tests, lint, type-check y build en cada PR. |
| **Vercel** | Deploy automático del frontend en cada merge a `main`. |
| **Railway** | Hosting del backend + MongoDB. |

### 3.5 Testing

| Herramienta | Rol |
|-------------|-----|
| **Jest** | Test runner principal (unit + integration). |
| **ts-jest** | Soporte de TypeScript para Jest. |
| **React Testing Library** | Tests de componentes orientados al usuario, no a la implementación. |
| **Playwright** | End-to-end + visual regression cross-browser (Chromium, Firefox, WebKit). |
| **supertest** | Tests HTTP de los endpoints Express sin levantar puerto. |

### 3.6 Calidad de código

- **ESLint** — Linter para JS y TS, con reglas customizadas del repo.
- **Prettier** — Formatter automático para que todo el código tenga el mismo estilo.
- **TypeScript strict mode** — `strict: true` activado: nulabilidad explícita, no `any` implícito, etc.

### 3.7 Diseño compartido

- **`packages/design-system/`** — Tokens (colores, spacing, radii, tipografía, shadows) consumidos por Tailwind a través de `tailwind.config.ts`.
- **`apps/web/src/components/ui/`** — Componentes UI compartidos entre demos: `Card`, `Badge`, `Button`, `Input`, `Textarea`, `Modal`, `Tabs`, `Tooltip`, `Skeleton`, `Toast`.

---

## 4. Capacidades de IA implementadas

Cada demo con IA tiene sus capacidades explícitas, simuladas con datos coherentes para que se pueda probar el flujo de usuario sin necesidad de proveer claves de APIs reales:

### Chatbot RAG enterprise (`/demo/chatbot`)
Demo de referencia con **19 capas visibles**:

1. **Ingesta multi-fuente** — PDF, Word, Excel, CSV, HTML, scraping web, conectores SaaS.
2. **Chunking semántico** — divisiones inteligentes que respetan secciones y tablas.
3. **Hybrid retrieval** — BM25 + dense vectors + reranking.
4. **Query understanding** — clasificación de intent, rewriting, expansión.
5. **Reranking** — cross-encoder para reordenar los top-K.
6. **Context engineering** — armado dinámico del prompt con tokens contados.
7. **Agents** — agentes con planificación step-by-step.
8. **Tools** — function calling con catálogo de tools tipadas.
9. **Memory** — corto plazo, largo plazo y semántica.
10. **Multimodal** — texto, imagen, audio.
11. **Multi-LLM routing** — routing por costo, latencia o calidad entre proveedores.
12. **Observability** — traces, métricas, evals en vivo.
13. **Evaluación** — golden datasets, regresión, A/B.
14. **Optimización** — prompt tuning, caching.
15. **Knowledge graphs** — extracción de entidades y relaciones.
16. **Guardrails** — moderación, PII redaction.
17. **Compliance** — audit log, retención.
18. **Producción** — rate limiting, fallbacks, circuit breakers.
19. **Builder & Embed** — UI para configurar el bot (color picker, posición, idiomas), drag-and-drop de documentos y generación de embed code (iframe / script / componente React / webhook).

### CRM con IA (`/demo/crm-ia`)
- Lead scoring ML con explicabilidad de features.
- Conversation intelligence (transcripción, sentiment, próximos pasos).
- Email composer con brand voice y A/B variants.
- Forecasting con escenarios optimista / realista / pesimista.

### Help Desk IA (`/demo/helpdesk-ia`)
- Routing ML por skills, idioma y sentiment.
- Suggested replies con confidence score.
- SLA prediction y alertas tempranas.

### LMS (`/demo/lms`)
- AI tutor 1:1 conversacional por curso.
- Quizzes auto-generados a partir del material.
- Adaptive learning paths según el desempeño.

### Telemedicina (`/demo/telemedicina`)
- Triage IA con clasificación de síntomas y derivación por especialidad.

### Voice AI (`/demo/voice-ai`)
- STT streaming (Whisper / Deepgram).
- TTS realista (ElevenLabs / Cartesia).
- Function calling para tomar acciones durante la llamada.
- Campañas outbound y handoff a agente humano.

### Automatización (`/demo/automatizacion`)
- Nodos IA nativos: LLM, embedding, RAG, vision, STT/TTS, structured output.
- Sandbox para código custom dentro del workflow.

### Code Review IA (`/demo/code-review-ia`)
- Revisión automatizada de PRs con sugerencias accionables.
- Generación de tests faltantes.
- SAST, DAST y SCA integrados.

### Moderación de Contenido (`/demo/moderacion-contenido`)
- Clasificación multi-modal: texto, imagen, video y audio.
- Workflows configurables con human-in-the-loop.
- Bienestar de moderadores (rotación, breaks, wellbeing checks).

### Scraping (`/demo/scraping`)
- AI extraction con schemas (estilo Pydantic).
- Auto-fix de selectores rotos con LLM.
- Anti-bot stealth con browsers headless.

### HRMS (`/demo/hrms`)
- Insights de retención y riesgo de fuga.
- Sentiment de eNPS con análisis cualitativo.
- Salary benchmarks por rol y región.

---

## 5. Internacionalización (i18n)

KopTup soporta **español** (default, Colombia) e **inglés**.

### Cómo funciona el toggle ES/EN
- Componente `LanguageToggle` que escribe una cookie `NEXT_LOCALE`.
- Llamada a `router.refresh()` para que los server components re-renderen con el nuevo locale.
- Sin recarga de página completa.

### Estructura de mensajes
```
apps/web/messages/
├── es.json              # mensajes globales (homepage, navbar, services, etc.)
├── en.json              # idem en inglés
└── demos/
    ├── crm-ia.es.json   # mensajes específicos del demo CRM
    ├── crm-ia.en.json
    ├── erp.es.json
    └── …
```

Los archivos `demos/<slug>.{es,en}.json` se mergean automáticamente con `es.json` / `en.json` por el loader de next-intl. Esto evita un archivo gigante con todo y permite aislar los textos por demo.

### Cómo agregar un nuevo demo o idioma
1. Crear `apps/web/messages/demos/<slug>.es.json` y `<slug>.en.json`.
2. Usar el hook `useTranslations('demo<Slug>')` en el componente.
3. Para un idioma nuevo, duplicar el archivo y traducir; agregar el locale en `i18n/config.ts`.

---

## 6. Diseño y UX

- **Design tokens** en `packages/design-system/` con paletas `primary-*` (azul KopTup) y `secondary-*` (acento), spacing escalable, radii y tipografía (Inter por defecto).
- **Componentes UI** compartidos entre todas las demos:
  - `Card`, `Badge`, `Button`, `Input`, `Textarea`
  - `Modal` (con foco trap y cierre por escape)
  - `Tabs`, `Tooltip`, `Skeleton`, `Toast`
- **Modo oscuro completo**: todos los componentes y demos tienen contrastes verificados en dark mode.
- **Responsive mobile-first**: probadas en `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- **Accesibilidad WCAG 2.2 AA en progreso**: roles ARIA, navegación por teclado, focus visible, contraste mínimo 4.5:1.

---

## 7. Quick Start

Levantar el monorepo entero local toma menos de 5 minutos.

```bash
# 1. Clonar
git clone https://github.com/ronalc90/koptup.git
cd koptup

# 2. Instalar dependencias
#    IMPORTANTE: usar NODE_ENV=development para que se instalen las devDeps
NODE_ENV=development npm install

# 3. Copiar variables de entorno
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env

# 4. Levantar MongoDB con Docker
docker run -d --name koptup-mongo -p 27017:27017 mongo:7

# 5. Iniciar el backend (terminal A)
cd apps/backend && NODE_ENV=development npm run dev
# → http://localhost:3001
# → Health check: http://localhost:3001/health
# → Docs Swagger: http://localhost:3001/api-docs

# 6. Iniciar el frontend (terminal B)
cd apps/web && NODE_ENV=development npm run dev
# → http://localhost:3000
# → Catálogo demos: http://localhost:3000/demo
```

### Comandos útiles del monorepo

```bash
npm run dev          # Levanta web + backend en paralelo
npm run build        # Build de todos los paquetes
npm run test         # Tests de todos los paquetes
npm run lint         # Lint en todo el repo
npm run docker:up    # docker-compose up -d
npm run docker:down  # docker-compose down
```

---

## 8. Estructura de carpetas

```
koptup/
├── apps/
│   ├── web/                          # Frontend Next.js 14
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── demo/<slug>/      # 27 demos
│   │   │   │   ├── services/         # catálogo comercial
│   │   │   │   ├── pricing/
│   │   │   │   ├── contact/
│   │   │   │   ├── about/
│   │   │   │   └── …                 # landings SEO
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Card, Button, Modal, Tabs…
│   │   │   │   └── layout/           # Navbar, Footer, Sidebar
│   │   │   ├── hooks/                # useChatbot, useModalClose, etc.
│   │   │   ├── lib/                  # utils, seo-config, fetcher
│   │   │   └── i18n/                 # config next-intl
│   │   └── messages/
│   │       ├── es.json
│   │       ├── en.json
│   │       └── demos/                # i18n per-demo (auto-merge)
│   │
│   └── backend/                      # Express + TypeScript
│       └── src/
│           ├── modules/<demo>/       # 18 módulos REST mock
│           ├── routes/               # rutas legacy
│           ├── controllers/
│           ├── services/
│           ├── models/               # Mongoose schemas
│           ├── middlewares/
│           └── config/
│
├── packages/                         # Workspaces compartidos
│   ├── design-system/                # tokens + Tailwind preset
│   ├── auth-core/                    # primitives de auth
│   ├── ai-gateway/                   # routing multi-LLM
│   ├── observability/                # logger, traces, metrics
│   ├── billing/                      # stripe / paddle helpers
│   ├── feature-flags/                # toggles tipados
│   └── database/                     # init.sql, helpers Mongo
│
├── infra/
│   ├── k8s/                          # base + overlays dev/prod
│   └── terraform/                    # IaC stubs
│
├── docs/                             # documentación adicional
│   ├── deployment/
│   ├── guides/
│   └── modules/
│
├── docker-compose.yml                # production-like
├── docker-compose.dev.yml            # dev local
├── turbo.json                        # config Turborepo
└── package.json                      # workspaces
```

---

## 9. Testing

| Tipo | Stack | Comando | Ubicación |
|------|-------|---------|-----------|
| Unit / Integration | Jest + ts-jest | `npm run test` | `**/__tests__/*` y `*.test.ts` |
| Componentes React | React Testing Library | `npm run test --workspace=apps/web` | `apps/web/src/**/*.test.tsx` |
| Endpoints HTTP | supertest | `npm run test --workspace=apps/backend` | `apps/backend/src/**/*.test.ts` |
| End-to-end | Playwright | `npx playwright test` | `apps/web/tests/e2e/` |

### Smoke tests
Cada demo nueva incluye un smoke test mínimo que verifica:
1. La página carga sin error 500.
2. Los textos principales del JSON i18n se renderizan.
3. Los botones críticos responden a click.

### Cobertura objetivo
- **Componentes UI compartidos**: 80%+
- **Módulos backend con lógica**: 70%+
- **Páginas de demo**: smoke únicamente (son vitrina, no producto crítico).

---

## 10. Deploy

### Frontend → Vercel
- Auto-deploy en cada merge a `main`.
- Preview deploys en cada PR.
- Dominios: `koptup.com` (producción) + `*.koptup.vercel.app` (previews).

**Variables de entorno necesarias** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://api.koptup.com
NEXT_PUBLIC_SITE_URL=https://koptup.com
```

### Backend → Railway
- Servicio Node + MongoDB managed.
- Deploy desde rama `main`.

**Variables de entorno necesarias** (`apps/backend/.env`):
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://…
JWT_SECRET=…
OPENAI_API_KEY=…             # opcional para demos con IA real
PINECONE_API_KEY=…           # opcional para RAG
SMTP_HOST=…                  # opcional para emails
```

---

## 11. Documentación adicional

| Archivo | Contenido |
|---------|-----------|
| [SETUP.md](./SETUP.md) | Guía detallada de setup local incluyendo Docker, Mongo y variables. |
| [WHATSAPP-NOTIFICATIONS.md](./WHATSAPP-NOTIFICATIONS.md) | Integración con WhatsApp Business para notificaciones de contacto. |
| [SEO-OPTIMIZATION-GUIDE.md](./SEO-OPTIMIZATION-GUIDE.md) | Estrategia SEO técnica y de contenido. |
| [SEO-IMPLEMENTADO.md](./SEO-IMPLEMENTADO.md) | Checklist de lo implementado (metadata, sitemap, structured data). |
| [SEO-DEMOS-COMPLETO.md](./SEO-DEMOS-COMPLETO.md) | SEO por demo, keywords y estructura. |
| [SEO-RESUMEN-EJECUTIVO.md](./SEO-RESUMEN-EJECUTIVO.md) | Resumen ejecutivo SEO. |
| [SEO-FINAL-RESUMEN.md](./SEO-FINAL-RESUMEN.md) | Estado final del SEO. |
| [CONVERTIR-IMAGENES.md](./CONVERTIR-IMAGENES.md) | Pipeline para convertir SVG a PNG / WebP. |
| [docs/](./docs/) | Guías de deployment, módulos y operación. |

---

## 12. Contribución

Workflow estándar:

1. **Crear rama feature** desde `main`:
   ```bash
   git checkout -b feat/nombre-claro
   ```
2. **Commits** con mensajes en español, estilo conventional commits:
   - `feat(<scope>): …` para features nuevas
   - `fix(<scope>): …` para bugs
   - `refactor(<scope>): …` para reorganización sin cambio de comportamiento
   - `docs(<scope>): …` para documentación
   - `chore(<scope>): …` para mantenimiento
3. **Push + Pull Request** contra `main`.
4. **Vercel preview** se genera automáticamente; revisar en el comentario del bot.
5. **Merge** lo hace un admin después de revisar el preview y el CI verde.

### Convenciones de código
- TypeScript strict en todo el repo.
- Componentes funcionales con hooks (sin clases).
- Imports absolutos con alias `@/…` en el frontend.
- Tests para cualquier lógica de negocio nueva.
- Pasar `npm run lint` antes de pushear.

---

## 13. Contacto

**Ronald Cipagauta**
Desarrollo de software a medida y consultoría tecnológica
Bogotá, Colombia

- Email: [dirox7@gmail.com](mailto:dirox7@gmail.com)
- GitHub: [@ronalc90](https://github.com/ronalc90)
- Sitio: [koptup.com](https://koptup.com)

¿Querés que construyamos algo parecido a una de las demos para tu empresa? Escribinos y armamos una propuesta a medida.

---

## 14. Licencia

Todos los derechos reservados — **KopTup © 2026**.

El código de este repositorio está disponible para fines de demostración comercial. Para uso, redistribución o adaptación, contactar a Ronald Cipagauta.
