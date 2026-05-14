<div align="center">

# Koptup

**Estudio de desarrollo de software a medida · Bogotá, Colombia**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-43853d?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)](https://mongodb.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**koptup.com**](https://koptup.com) · [Catálogo de prototipos](https://koptup.com/demo) · [Planes y servicios](https://koptup.com/services) · [Contacto](https://koptup.com/contact)

</div>

---

## Qué es

Koptup es el portafolio comercial de un estudio de desarrollo a medida. Construimos software para empresas en LATAM — web, mobile, integraciones, IA aplicada. Este repo contiene:

- **2 aplicaciones reales** que podés usar hoy: un chatbot RAG con OpenAI y un generador de copy para LinkedIn Ads.
- **25 prototipos navegables** que muestran cómo se ve y se siente cada solución antes de que la construyamos para vos.
- **Sitio comercial** (catálogo de servicios, precios en COP/USD con TRM en vivo, sobre nosotros, contacto).

No es un SaaS ni un producto. Es la vitrina de un equipo que cobra por construir cosas a medida.

## Aplicaciones reales

### [Chatbot RAG con IA](https://koptup.com/demo/chatbot)

Plataforma RAG end-to-end. Ingesta PDF/Word/Excel/CSV/HTML/URLs, chunking, retrieval BM25 con TF·IDF, llamadas a OpenAI Chat Completions (GPT-4o-mini por defecto, configurable) con citas inline `[1] [2]` clickeables. Builder visual para personalizar avatar/color/posición, 3 modos de preview (desktop/móvil/bubble) y generación de embed code (iframe / script / componente React).

**Stack real:** Next.js · TypeScript · Express · OpenAI SDK · BM25 implementado a mano · persistencia en archivos JSON.
**Código:** [`apps/backend/src/routes/chatbot.routes.ts`](apps/backend/src/routes/chatbot.routes.ts) — 11 endpoints REST, 940+ líneas.

### [Generador de LinkedIn Ads](https://koptup.com/demo/linkedin-ads)

Generador de copies para campañas de LinkedIn con OpenAI server-side. Calendario editorial, plantillas por industria, variantes A/B, preview en formato nativo de LinkedIn.

**Stack real:** Next.js API routes · OpenAI SDK server-side · UI con preview LinkedIn-style.
**Código:** [`apps/web/src/app/api/linkedin-ads/generate/route.ts`](apps/web/src/app/api/linkedin-ads/generate/route.ts).

## Prototipos navegables

El resto (25 vistas: CRM, ERP, POS, HRMS, WMS, LMS, helpdesk, telemedicina, facturación electrónica, voice AI, e-commerce, automatización de workflows, scraping, etc.) son **mockups interactivos con datos simulados realistas**. Cubren el flujo de UI completo — tabs, formularios validados, gráficas, drag-and-drop, modales — pero los datos son fixtures, no provienen de un backend de producción. Sirven para que un cliente potencial vea cómo se vería un ERP o un CRM moderno antes de contratarnos para construirlo.

Catálogo filtrable por categoría: **<https://koptup.com/demo>**

## Stack

Tecnologías que realmente usamos en este repo:

**Frontend:** Next.js 14 (App Router) · React 18 · TypeScript · TailwindCSS · next-intl (ES/EN) · next-themes · Framer Motion · React Hook Form + Zod · SWR · Axios · Recharts · date-fns

**Backend:** Node.js 18+ · Express · TypeScript · Mongoose (MongoDB 7) · OpenAI SDK · JWT · bcryptjs · Multer · Helmet · Swagger (OpenAPI 3)

**Storage & infra:** AWS S3 (uploads) · Docker · Vercel (web) · Railway (API)

**Testing & calidad:** Jest · Playwright · React Testing Library · ESLint · TypeScript strict

Eso es ~25 tecnologías que dominamos. Conocemos y trabajamos cuando el proyecto lo pide con: Python (FastAPI/Django), Java (Spring Boot), .NET, Postgres + pgvector, Redis, Pinecone, Anthropic, Kubernetes, Terraform, GraphQL, gRPC, WebSockets, React Native, Flutter. Si necesitás algo fuera de esta lista, lo evaluamos antes de comprometernos.

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

## Estructura del repo

```
apps/
  web/                    # Next.js — sitio + 27 vistas en /demo
  backend/                # Express — APIs reales (chatbot) + mocks (resto)
packages/
  design-system/          # tokens compartidos
  database/               # init.sql, helpers Mongo
infra/
  k8s/ · terraform/       # stubs de IaC
```

## Estado del proyecto

- **Producción:** [koptup.com](https://koptup.com) (Vercel) + API en Railway.
- **Chatbot RAG:** integración real con OpenAI, persistencia en disco, multi-tenant.
- **25 prototipos restantes:** UI completa, datos simulados, no production-ready sin trabajo adicional.
- **Roadmap inmediato:** S3 real para uploads del RAG, autenticación de tenants, métricas de uso.

## ¿Querés contratarnos?

Construimos a medida lo que viste en los prototipos — o lo que necesités que no esté acá. Tarifas en COP y USD, propuesta en 48h hábiles.

- **Email:** [dirox7@gmail.com](mailto:dirox7@gmail.com)
- **Sitio:** [koptup.com/contact](https://koptup.com/contact)
- **LinkedIn:** [/in/ronalc90](https://www.linkedin.com/in/ronalc90)

## Licencia

[MIT](LICENSE) · Ronald Cipagauta · 2026
