<div align="center">

# Koptup

### Plataforma enterprise de soluciones tecnológicas a medida y SaaS

[![CI/CD](https://github.com/ronalc90/koptup/actions/workflows/ci.yml/badge.svg)](https://github.com/ronalc90/koptup/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)](https://www.mongodb.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://vercel.com)
[![Railway](https://img.shields.io/badge/Railway-Deploy-7B1FA2?logo=railway)](https://railway.app)

**Empresa colombiana de desarrollo de software a medida con IA · 27 demos interactivos · 4 tiers por producto · Precios en COP y USD**

[Demos en vivo](https://koptup.com/demo) · [Servicios y planes](https://koptup.com/services) · [Documentación](./README.md) · [Contribuir](./CONTRIBUTING.md)

</div>

---

## Demo en vivo

> **https://koptup.com** — Probá las 27 demos interactivas sin registrarte

## Screenshots

| Catálogo de demos | Chatbot RAG enterprise | Catálogo de servicios |
|---|---|---|
| ![Demos](https://github.com/ronalc90/koptup/raw/main/docs/screenshots/demos.png) | ![Chatbot](https://github.com/ronalc90/koptup/raw/main/docs/screenshots/chatbot.png) | ![Services](https://github.com/ronalc90/koptup/raw/main/docs/screenshots/services.png) |

> Screenshots en preparación — las imágenes aparecerán cuando se publiquen los archivos en `docs/screenshots/`.

## Stats

| | |
|---|---|
| **27** | Demos enterprise funcionales |
| **170+** | Tecnologías dominadas |
| **8** | Países LatAm en facturación electrónica |
| **4 × 2** | Tiers × Modalidades (compra/SaaS) por producto |
| **2** | Idiomas (ES/EN) en toda la plataforma |
| **GPT-4o** | LLM real integrado con OpenAI |

---

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

Todas las demos son **aplicaciones interactivas navegables** con datos simulados realistas, soporte completo de internacionalización ES/EN, modo oscuro y diseño responsive mobile-first. Cada una expone además un módulo backend Express con endpoints REST funcionales y se monta automáticamente en `/demo/<slug>` del frontend.

**Demos en vivo: [https://www.koptup.com/demo](https://www.koptup.com/demo)**

### Categorías

- [Inteligencia Artificial](#inteligencia-artificial) — 4 demos
- [Ventas y CRM](#ventas-y-crm) — 2 demos
- [Operaciones y Logística](#operaciones-y-logística) — 3 demos
- [Finanzas](#finanzas) — 3 demos
- [Comercio y Retail](#comercio-y-retail) — 3 demos
- [Atención al Cliente y Soporte](#atención-al-cliente-y-soporte) — 2 demos
- [Salud](#salud) — 2 demos
- [Educación](#educación) — 1 demo
- [Contenido y Documentos](#contenido-y-documentos) — 2 demos
- [Productividad y Gestión](#productividad-y-gestión) — 2 demos
- [Seguridad y Compliance](#seguridad-y-compliance) — 2 demos
- [DevTools y QA](#devtools-y-qa) — 1 demo

---

### Inteligencia Artificial

#### 1. Chatbot RAG con IA
> **Asistente virtual que aprende de tus documentos y responde con citas verificables**

Plataforma RAG (Retrieval-Augmented Generation) end-to-end que ingiere PDFs, Word, Excel, CSV, HTML y URLs, los chunkea por párrafos y los indexa con búsqueda BM25-lite (TF·IDF). Cuando un usuario pregunta, recupera los top-k chunks más relevantes y los manda a OpenAI GPT-4o-mini (configurable a GPT-4o o GPT-4 Turbo) para que sintetice una respuesta natural con citas inline `[1] [2]` clickeables. Está pensado como demo de referencia del nivel enterprise que construimos: 19 capas reales documentadas, builder visual y embed multi-canal.

**Capacidades destacadas**:
- 19 capas enterprise visibles: ingesta multi-fuente, chunking semántico, hybrid retrieval, query understanding, reranking, context engineering, agents, tools, memory, multimodal, multi-LLM routing, observability, evaluación, optimization, knowledge graphs, guardrails, compliance, producción y builder/embed.
- Modo Builder & Embed para personalizar avatar (emoji o imagen subida), color, posición del widget y generar código embed (iframe, script tag, componente React, webhook URL).
- 3 modos de preview: Desktop, Mobile (frame de iPhone) y Bubble (FAB integrable).
- Tenants persistentes con CRUD completo (crear, listar, eliminar bots, historial de conversaciones).
- Fallback a modo extractivo BM25 si no hay clave de OpenAI configurada.

**Tecnologías**: Next.js 14 App Router · React 18 · TypeScript · OpenAI Chat Completions · Express + Node 18 · BM25-lite custom · TailwindCSS + dark mode · next-intl

**Backend**: `apps/backend/src/routes/chatbot.routes.ts` con 11 endpoints REST
**Demo**: [Ver código](./apps/web/src/app/demo/chatbot/) · [https://www.koptup.com/demo/chatbot](https://www.koptup.com/demo/chatbot)

---

#### 2. Voice AI / Call Center
> **Centro de llamadas conversacional con STT/TTS streaming y function calling**

Mock de call center moderno con IVR sin menús, transcripción en vivo, sentiment analysis por turno, function calling (transferir / agendar / consultar), llamadas inbound y outbound con campañas, handoff a humano con contexto compartido y agent assist en tiempo real. Pensado para equipos que quieren reducir tiempo de cola, automatizar L1 y dar al agente humano todo el contexto antes de tomar la llamada.

**Capacidades destacadas**:
- STT streaming objetivo <300 ms con Whisper, Deepgram y AssemblyAI (badges seleccionables).
- TTS realista con ElevenLabs, Cartesia y Play.ht + barge-in detection.
- Sentiment gauge actualizado por turno (positivo / neutro / negativo).
- PCI redaction automática en transcripciones (números de tarjeta enmascarados como `****1234`).
- Compliance: DNC list checker, recording disclosure, code-switching ES/EN.
- Telefonía: Twilio, Vonage y Telnyx integradas como providers seleccionables.

**Tecnologías**: Next.js · React · TypeScript · waveform CSS animado · function calling tipado · Express mock backend

**Backend**: `apps/backend/src/modules/voice-ai/`
**Demo**: [Ver código](./apps/web/src/app/demo/voice-ai/) · [https://www.koptup.com/demo/voice-ai](https://www.koptup.com/demo/voice-ai)

---

#### 3. Automatización de Workflows
> **Plataforma estilo n8n + Zapier con IA nativa y código sandboxed**

Editor visual drag-and-drop para construir flujos con triggers (webhook, cron, eventos), 500+ integraciones simuladas (Slack, Gmail, Notion, Stripe, HubSpot, etc.), nodos de IA nativos (LLM, embeddings, RAG, vision, STT/TTS) y nodos de código JS o Python ejecutados en sandbox. Está pensado para que un equipo de operaciones diseñe automatizaciones complejas sin depender de un dev y para que la organización mantenga versionado y observabilidad de cada workflow.

**Capacidades destacadas**:
- Visual workflow builder con 500+ integraciones y catálogo searchable.
- AI nodes nativos: LLM, embedding, RAG, vision, STT/TTS y structured output.
- Code nodes JS / Python sandboxed con SDK custom y secrets manager.
- Versioning git-backed, environments (dev/staging/prod) y replay paso a paso.
- Observabilidad: traces por ejecución, métricas por nodo, retries con backoff.

**Tecnologías**: Next.js · React Flow para el canvas · TypeScript · Express · OpenAI SDK · sandbox VM mock

**Backend**: `apps/backend/src/modules/automation/`
**Demo**: [Ver código](./apps/web/src/app/demo/automatizacion/) · [https://www.koptup.com/demo/automatizacion](https://www.koptup.com/demo/automatizacion)

---

#### 4. Moderación de Contenido con IA
> **Trust & Safety multi-modal con human-in-the-loop y compliance DSA**

Plataforma para clasificar y moderar contenido en tiempo real: detecta NSFW, hate speech, spam, violencia y self-harm sobre texto, imagen, video y audio. Combina modelos automáticos con cola de revisión humana priorizada por severidad. Incluye un módulo de bienestar para los moderadores (blur de contenido sensible, breaks programados, rotación) y trazabilidad completa para compliance.

**Capacidades destacadas**:
- Clasificación multi-modal: texto, imagen, video y audio en tiempo real.
- Custom models por vertical (gaming, dating, kids, fintech).
- Human-in-the-loop con priority routing por severidad y appeals workflow.
- Moderator wellness: blur, breaks, rotación de categorías difíciles.
- Compliance DSA (Digital Services Act) + audit trail por decisión.

**Tecnologías**: Next.js · React · TypeScript · clasificadores mock · Express · OpenAI Moderation API · TailwindCSS

**Backend**: `apps/backend/src/modules/moderation/`
**Demo**: [Ver código](./apps/web/src/app/demo/moderacion-contenido/) · [https://www.koptup.com/demo/moderacion-contenido](https://www.koptup.com/demo/moderacion-contenido)

---

### Ventas y CRM

#### 5. CRM con IA
> **Pipeline kanban con lead scoring ML, conversation intelligence y forecasting**

CRM comercial pensado para equipos de ventas B2B: pipeline visual estilo Pipedrive con drag-and-drop entre etapas, scoring de leads basado en machine learning con explicabilidad de features (qué señales pesan más), conversation intelligence sobre llamadas grabadas (transcripción, sentiment por turno, next steps automáticos) y forecasting con escenarios optimista / realista / pesimista.

**Capacidades destacadas**:
- Lead scoring ML con propensity-to-buy y explicabilidad por feature.
- AI email composer con brand voice + A/B variants y secuencias omnicanal.
- Conversation intelligence: grabación, sentiment por turno, action items.
- Customer 360 unificado y forecasting con escenarios + simuladores.

**Tecnologías**: Next.js · React · TypeScript · OpenAI · Recharts · drag-and-drop · Express + Mongoose

**Backend**: `apps/backend/src/modules/crm/`
**Demo**: [Ver código](./apps/web/src/app/demo/crm-ia/) · [https://www.koptup.com/demo/crm-ia](https://www.koptup.com/demo/crm-ia)

---

#### 6. HRMS / Gestión de Talento
> **Plataforma de RRHH end-to-end con payroll multi-país e IA de retención**

Suite integral para gestionar el ciclo completo del empleado: ATS (applicant tracking) con scoring CV asistido por IA, onboarding y offboarding con firma electrónica de contratos, performance management con OKRs y 1:1s, payroll multi-país con compliance laboral (Colombia, México, Argentina), y un módulo de analytics con IA que predice fuga de talento, calcula eNPS y compara salarios contra benchmarks de mercado.

**Capacidades destacadas**:
- ATS con scoring CV por IA y screening calls automáticas pre-entrevista.
- Onboarding / offboarding con e-sign de contratos y checklists por rol.
- Payroll multi-país con compliance laboral (CO, MX, AR) y reportes legales.
- AI insights: retención predicha, eNPS con sentiment, salary benchmarks.

**Tecnologías**: Next.js · React · TypeScript · OpenAI · DocuSign-style flow · Express · Mongoose

**Backend**: `apps/backend/src/modules/hrms/`
**Demo**: [Ver código](./apps/web/src/app/demo/hrms/) · [https://www.koptup.com/demo/hrms](https://www.koptup.com/demo/hrms)

---

### Operaciones y Logística

#### 7. WMS y Logística
> **Gestión de bodegas, picking optimizado y last-mile con carriers integrados**

Warehouse Management System pensado para 3PL y operaciones omnicanal: multi-bodega con zonas / bins / slotting basado en ML, picking en modos wave / batch / zone / cluster, cycle counting ABC, ruteo VRP para distribución, y módulo de last-mile con app de driver y POD (proof-of-delivery). Integra carriers locales y globales para cotizar y despachar desde un solo dashboard.

**Capacidades destacadas**:
- Multi-warehouse con zonas, bins y slotting ML según rotación.
- Picking wave / batch / zone / cluster + cycle counting ABC automatizado.
- Route optimization VRP + last-mile con POD digital y firma del cliente.
- Carriers integrados: FedEx, DHL, Servientrega, Coordinadora, Inter Rapidísimo, TCC.

**Tecnologías**: Next.js · React · TypeScript · mapas Leaflet mock · algoritmos VRP simplificados · Express · Mongoose

**Backend**: `apps/backend/src/modules/wms/`
**Demo**: [Ver código](./apps/web/src/app/demo/wms-logistica/) · [https://www.koptup.com/demo/wms-logistica](https://www.koptup.com/demo/wms-logistica)

---

#### 8. App de Delivery
> **Plataforma multi-rol con tracking en vivo, routing ML y anti-fraude**

Marketplace de delivery on-demand con 4 vistas: customer (cliente final), driver (repartidor), merchant (comercio) y un dashboard de operaciones. Incluye tracking GPS en vivo con ETA basado en ML, pricing dinámico con surge, programas de loyalty / membership y detección de fraude (GPS spoofing, multi-account, KYC de drivers).

**Capacidades destacadas**:
- 4 apps integradas: customer, driver, merchant y ops dashboard.
- Routing ML multi-pickup con tracking en vivo y ETA por modelo.
- Pricing dinámico (surge), loyalty y suscripción membership-style.
- Anti-fraude: GPS spoofing detection, multi-account, KYC drivers.

**Tecnologías**: Next.js · React · TypeScript · mapas con tiles · WebSockets mock · Express · Mongoose

**Backend**: `apps/backend/src/modules/delivery/`
**Demo**: [Ver código](./apps/web/src/app/demo/delivery/) · [https://www.koptup.com/demo/delivery](https://www.koptup.com/demo/delivery)

---

#### 9. Sistema de Reservas
> **Plataforma de booking online con calendario, notificaciones y disponibilidad en vivo**

Sistema de reservas pensado para servicios profesionales y comercios con cita previa (peluquerías, consultorios, restaurantes, talleres, coworkings). Permite a los clientes elegir servicio, profesional, fecha y franja, recibir confirmación y recordatorios, y al negocio gestionar disponibilidad, bloqueos, recursos y reportes.

**Capacidades destacadas**:
- Calendario con vistas día / semana / mes y multi-recurso (sala, profesional, equipo).
- Notificaciones automáticas por email / SMS / WhatsApp con confirmación y recordatorios.
- Gestión de disponibilidad: horarios, bloqueos, vacaciones, capacidad por slot.
- Pagos anticipados, depósitos y políticas de cancelación configurables.

**Tecnologías**: Next.js · React · TypeScript · date-fns · TailwindCSS · Express mock REST

**Backend**: Sin backend dedicado (datos mock client-side)
**Demo**: [Ver código](./apps/web/src/app/demo/sistema-reservas/) · [https://www.koptup.com/demo/sistema-reservas](https://www.koptup.com/demo/sistema-reservas)

---

### Finanzas

#### 10. ERP Modular Multi-país
> **Suite empresarial con contabilidad, inventario, ventas, manufactura y facturación electrónica LATAM**

ERP completo y modular: contabilidad de doble entrada multi-currency y multi-company, finanzas con conciliación bancaria automática (Open Banking + AI matching), inventario con kardex, ventas, compras, RRHH y manufactura con MRP, BOM y work orders. Integra facturación electrónica nativa para 8 países de LatAm (DIAN, SAT, AFIP, SII, SUNAT, DGI, SET y SRI).

**Capacidades destacadas**:
- Contabilidad de doble entrada multi-currency y multi-company consolidable.
- Bank reconciliation con Open Banking + AI matching y reglas de auto-asignación.
- MRP, BOM, work orders y forecasting de demanda con ML.
- Facturación electrónica nativa para 8 países LatAm.

**Tecnologías**: Next.js · React · TypeScript · PostgreSQL para contabilidad estricta · Express · Recharts · OpenAI para matching

**Backend**: `apps/backend/src/modules/erp/`
**Demo**: [Ver código](./apps/web/src/app/demo/erp/) · [https://www.koptup.com/demo/erp](https://www.koptup.com/demo/erp)

---

#### 11. Facturación Electrónica Multi-país
> **Emite, recibe y valida facturas electrónicas en 8 países LATAM con SDK y white-label**

Plataforma fiscal unificada para emitir y recibir facturas electrónicas con cumplimiento normativo en Colombia (DIAN), México (SAT), Argentina (AFIP), Chile (SII), Perú (SUNAT), Uruguay (DGI), Paraguay (SET) y Ecuador (SRI). Soporta factura, nota crédito, nota débito y tickets POS, valida NIT/RUC/RFC en tiempo real, y recibe documentos de proveedores con OCR para auto-cargar al ERP.

**Capacidades destacadas**:
- 8 países LatAm: CO, MX, AR, CL, PE, UY, PY, EC con resoluciones y rangos.
- Documentos: factura, NC, ND, POS + validación NIT/RUC/RFC en tiempo real.
- Recepción de proveedores con OCR + validación automática contra DIAN/SAT.
- API + SDKs (JS, Python, PHP) + plugins ERP/POS + modo white-label.

**Tecnologías**: Next.js · React · TypeScript · firma XMLDSig mock · PDF417 / QR · pdf-parse para OCR · Express

**Backend**: `apps/backend/src/modules/e-invoicing/`
**Demo**: [Ver código](./apps/web/src/app/demo/facturacion-electronica/) · [https://www.koptup.com/demo/facturacion-electronica](https://www.koptup.com/demo/facturacion-electronica)

---

#### 12. Dashboard Ejecutivo
> **Panel gerencial con KPIs, métricas financieras y análisis interactivo**

Dashboard pensado para C-level y gerencia: consolida KPIs financieros, comerciales y operativos en una sola pantalla con drill-down. Incluye gráficas interactivas (área, barras, donut, sankey, funnel), comparativos year-over-year, alertas configurables sobre umbrales y exportación a PDF / Excel para los comités directivos.

**Capacidades destacadas**:
- KPIs financieros (ingresos, EBITDA, margen, runway) con drill-down por unidad.
- Análisis de ventas con cohortes, funnel y conversión por canal.
- Comparativos YoY / QoQ con tendencias y outliers señalados.
- Exportación a PDF (jspdf) y Excel (exceljs) con branding corporativo.

**Tecnologías**: Next.js · React · TypeScript · Recharts · jspdf · exceljs · TailwindCSS

**Backend**: Sin backend dedicado (datos mock client-side)
**Demo**: [Ver código](./apps/web/src/app/demo/dashboard-ejecutivo/) · [https://www.koptup.com/demo/dashboard-ejecutivo](https://www.koptup.com/demo/dashboard-ejecutivo)

---

### Comercio y Retail

#### 13. E-Commerce Completo
> **Tienda online con carrito, checkout, gestión de catálogo y dashboard de ventas**

E-commerce moderno listo para vender en LATAM: catálogo con variantes y stock, carrito persistido, checkout con múltiples pasarelas (Stripe, Wompi, Mercado Pago, PSE), gestión de pedidos y devoluciones, y un dashboard de admin con métricas de ventas en tiempo real. Optimizado para Core Web Vitals y SEO desde el día uno.

**Capacidades destacadas**:
- Catálogo con variantes, stock multi-bodega y precios por lista.
- Checkout con Stripe (mock), Wompi, Mercado Pago y PSE Colombia.
- Facturación electrónica DIAN integrada para Colombia.
- Dashboard de admin: ventas en tiempo real, top productos, conversión.

**Tecnologías**: Next.js · React · TypeScript · next/image · TailwindCSS · Recharts · Stripe SDK mock

**Backend**: Sin backend dedicado (datos mock client-side)
**Demo**: [Ver código](./apps/web/src/app/demo/ecommerce/) · [https://www.koptup.com/demo/ecommerce](https://www.koptup.com/demo/ecommerce)

---

#### 14. POS / Punto de Venta Omnicanal
> **POS offline-first con KDS, multi-payment y hardware integrado**

Suite POS pensada para restaurantes, retail, autoservicio y kioskos. Funciona offline-first con CRDT sync y conflict resolution (sigue vendiendo aunque se caiga internet, sincroniza después). Soporta efectivo, tarjeta, QR, wallets, BNPL y split entre formas de pago, con KDS para cocina, gestión de mesas, modificadores y combos. Integra hardware POS real: scanners Bluetooth, balanzas, impresoras térmicas y cajones monederos.

**Capacidades destacadas**:
- Offline-first con CRDT sync y conflict resolution sin pérdida de transacciones.
- Multi-payment: efectivo, tarjeta, QR, wallets, BNPL y split de cuenta.
- KDS para cocina, mesas, modificadores, combos y happy hour.
- Hardware integrado: scanners Bluetooth, balanzas, impresoras, cajones.

**Tecnologías**: Next.js · React · TypeScript · IndexedDB para offline · CRDT mock · Web Bluetooth · ESC/POS

**Backend**: `apps/backend/src/modules/pos/`
**Demo**: [Ver código](./apps/web/src/app/demo/pos/) · [https://www.koptup.com/demo/pos](https://www.koptup.com/demo/pos)

---

#### 15. Loyalty / Fidelización
> **Programas de puntos, tiers y misiones con coaliciones multi-marca**

Plataforma de fidelización con todos los mecanismos modernos: puntos por compra, tiers (Bronze / Silver / Gold / Platinum) con beneficios escalonados, misiones gamificadas, referrals con recompensa bilateral, cashback y sweepstakes (sorteos). Soporta coaliciones multi-marca donde varias empresas comparten un pool de puntos, con personalization basada en ML y emisión de Wallet pass (Apple / Google).

**Capacidades destacadas**:
- Mecánicas: points, tiers, missions, referrals, cashback, sweepstakes.
- Coalitions multi-marca con shared points pool y settlement entre socios.
- Gamification: badges, streaks, challenges y leaderboards públicos.
- Personalization ML + A/B testing de campañas + Wallet pass Apple/Google.

**Tecnologías**: Next.js · React · TypeScript · Recharts · pass.json builder · Express · Mongoose

**Backend**: `apps/backend/src/modules/loyalty/`
**Demo**: [Ver código](./apps/web/src/app/demo/loyalty/) · [https://www.koptup.com/demo/loyalty](https://www.koptup.com/demo/loyalty)

---

### Atención al Cliente y Soporte

#### 16. Help Desk IA Omnichannel
> **Ticketing inteligente con routing ML, sugerencias IA y SLA management**

Help Desk omnicanal que unifica email, WhatsApp, Instagram, Facebook, X, voz y chat web en una sola cola de tickets. El routing es por ML (mira skills del agente, sentiment del cliente e idioma) y un copilot de IA sugiere respuestas con confidence score sobre el knowledge base. Gestiona SLA con escalations automáticos, CSAT/NPS post-resolución y QA con IA sobre las conversaciones cerradas.

**Capacidades destacadas**:
- Omnichannel: email, WhatsApp, IG, FB, X, voz y chat web en una sola cola.
- Routing inteligente con ML (skills, sentiment, idioma, prioridad cliente).
- Sugerencias IA en vivo y auto-respuestas con confidence threshold.
- SLA con escalations, CSAT/NPS automáticos y QA con IA sobre tickets cerrados.

**Tecnologías**: Next.js · React · TypeScript · OpenAI · WhatsApp Business API mock · Express · Mongoose

**Backend**: `apps/backend/src/modules/helpdesk/`
**Demo**: [Ver código](./apps/web/src/app/demo/helpdesk-ia/) · [https://www.koptup.com/demo/helpdesk-ia](https://www.koptup.com/demo/helpdesk-ia)

---

#### 17. Sistema Experto Médico
> **Motor de reglas y árboles de decisión para auditoría médica explicable**

Sistema experto basado en reglas de negocio + árboles de decisión para automatizar tareas de auditoría médica que tradicionalmente requieren un humano experto. A diferencia de un modelo black-box, cada decisión incluye **trazabilidad**: qué regla disparó, qué inputs evaluó y por qué llegó al veredicto. Pensado para EPS, IPS y aseguradoras que necesitan defender cada glosa frente al ente regulador.

**Capacidades destacadas**:
- Motor de reglas declarativo con DSL legible por auditores no-técnicos.
- Árboles de decisión visualizables y editables sin tocar código.
- Explicabilidad completa: traza por regla, input, output y veredicto.
- Validación contra catálogos CIE-10 / CUPS y reglas POS / Plan Beneficios.

**Tecnologías**: Next.js · React · TypeScript · motor de reglas custom · Express con `expert-system.routes.ts`

**Backend**: `apps/backend/src/routes/expert-system.routes.ts`
**Demo**: [Ver código](./apps/web/src/app/demo/sistema-experto/) · [https://www.koptup.com/demo/sistema-experto](https://www.koptup.com/demo/sistema-experto)

---

### Salud

#### 18. Auditoría de Cuentas Médicas
> **Vertical médico para auditar facturación clínica con catálogos CIE-10 y CUPS**

Aplicación específica para la auditoría de cuentas médicas en Colombia: revisión de facturas de prestadores de salud, validación contra catálogos oficiales (CIE-10 para diagnósticos, CUPS para procedimientos), flujo de glosas con tipificación normativa, liquidación automática y trazabilidad de cada decisión para el ente regulador. Acceso protegido con código **2020** desde el catálogo de demos.

**Capacidades destacadas**:
- Catálogos oficiales precargados: CIE-10, CUPS, manual tarifario.
- Flujo de glosas con tipificación normativa (Resolución 3047 y sucesoras).
- Liquidación automática con cálculo de valor aceptado / glosado.
- Trazabilidad por auditor, fecha y motivo + reportes para entes de control.

**Tecnologías**: Next.js · React · TypeScript · Express con `cuentas.routes.ts`, `cups.routes.ts`, `liquidacion.routes.ts`

**Backend**: `apps/backend/src/routes/cuentas.routes.ts` + `cups.routes.ts` + `liquidacion.routes.ts` + `reglas-facturacion.routes.ts`
**Demo**: [Ver código](./apps/web/src/app/demo/cuentas-medicas/) · [https://www.koptup.com/demo/cuentas-medicas](https://www.koptup.com/demo/cuentas-medicas) (código de acceso: `2020`)

---

#### 19. Telemedicina HIPAA
> **Video consulta segura, EHR integrado, triage IA y receta electrónica**

Plataforma de telemedicina end-to-end pensada para cumplimiento HIPAA / BAA: sala de espera con triage IA por síntomas, video consulta WebRTC propia, ficha clínica (EHR/EMR) con historial unificado, receta electrónica con firma digital, integración con laboratorios vía HL7/FHIR y conexión con farmacias para dispensación. Incluye soporte para wearables (Apple Health, Fitbit, Google Fit).

**Capacidades destacadas**:
- Video call HIPAA-compliant con WebRTC propio (sin terceros).
- EHR/EMR + receta electrónica con firma digital del médico.
- Triage IA con clasificación de síntomas y derivación por especialidad.
- Integración wearables (Apple Health, Fitbit), laboratorios HL7/FHIR y farmacias.

**Tecnologías**: Next.js · React · TypeScript · WebRTC mock · HL7/FHIR types · OpenAI · Express con BAA references

**Backend**: `apps/backend/src/modules/telemedicine/`
**Demo**: [Ver código](./apps/web/src/app/demo/telemedicina/) · [https://www.koptup.com/demo/telemedicina](https://www.koptup.com/demo/telemedicina)

---

### Educación

#### 20. LMS / E-learning con IA
> **Plataforma educativa con AI tutor 1:1, adaptive learning y gamification completa**

Learning Management System con experiencia moderna estilo Coursera + Duolingo. Cada alumno tiene un AI tutor 1:1 conversacional que responde dudas en el contexto del curso, los quizzes se auto-generan a partir del material y el camino de aprendizaje se adapta al desempeño individual. Soporta clases en vivo con breakout rooms y subtítulos multi-idioma, gamification (XP, badges, leaderboards) y certificados verificables.

**Capacidades destacadas**:
- AI Tutor 1:1 conversacional contextualizado en el curso del alumno.
- Quizzes auto-generados desde el material + adaptive learning paths.
- Clases en vivo con breakout rooms y subtítulos multi-idioma en tiempo real.
- Gamification: XP, badges, leaderboards, streaks y certificados verificables.

**Tecnologías**: Next.js · React · TypeScript · OpenAI · WebRTC mock · video.js · Express · Mongoose

**Backend**: `apps/backend/src/modules/lms/`
**Demo**: [Ver código](./apps/web/src/app/demo/lms/) · [https://www.koptup.com/demo/lms](https://www.koptup.com/demo/lms)

---

### Contenido y Documentos

#### 21. CMS Avanzado / Gestor de Contenido
> **Editor visual con SEO, publicación programada y multi-sitio**

CMS pensado para equipos de marketing y editorial: editor WYSIWYG con bloques, gestión de páginas y posts de blog, SEO on-page (metadata, OG tags, sitemap), publicación programada y multi-sitio (un solo backoffice manejando varios dominios). Soporta roles (editor, revisor, publisher) con workflow de aprobación.

**Capacidades destacadas**:
- Editor de bloques tipo Notion / WordPress Gutenberg.
- SEO on-page con preview Google, OG tags y sitemap automático.
- Publicación programada y workflow de aprobación editor → revisor → publisher.
- Multi-sitio: un backoffice gestionando múltiples dominios.

**Tecnologías**: Next.js · React · TypeScript · TipTap editor · TailwindCSS · Express con `content-manager.routes.ts`

**Backend**: `apps/backend/src/routes/content-manager.routes.ts`
**Demo**: [Ver código](./apps/web/src/app/demo/gestor-contenido/) · [https://www.koptup.com/demo/gestor-contenido](https://www.koptup.com/demo/gestor-contenido)

---

#### 22. Gestor Documental
> **Organiza, busca y comparte documentos con búsqueda semántica y versionado**

DMS (Document Management System) para equipos que generan muchos archivos: subida masiva con drag-and-drop, etiquetado manual y automático, búsqueda full-text + semántica (embeddings), control de versiones con diff y permisos granulares por carpeta / documento / usuario. Pensado para áreas legales, contables y de proyecto que necesitan trazabilidad documental.

**Capacidades destacadas**:
- Subida masiva, etiquetado manual y auto-tagging por contenido.
- Búsqueda full-text + semántica con embeddings.
- Versionado con diff visual y restauración a versión anterior.
- Permisos granulares por carpeta / documento + audit log de accesos.

**Tecnologías**: Next.js · React · TypeScript · pdf-parse · mammoth · OpenAI embeddings · Express con `document.routes.ts`

**Backend**: `apps/backend/src/routes/document.routes.ts`
**Demo**: [Ver código](./apps/web/src/app/demo/gestor-documentos/) · [https://www.koptup.com/demo/gestor-documentos](https://www.koptup.com/demo/gestor-documentos)

---

### Productividad y Gestión

#### 23. Gestión de Proyectos
> **Sistema ágil con tableros Kanban, sprints, dependencias y colaboración**

Herramienta de project management estilo Jira / Linear: tableros Kanban con swimlanes, planning de sprints con story points y burndown, gestión de tareas con dependencias y subtareas, asignaciones por equipo y vista de roadmap. Soporta comentarios, menciones, adjuntos y notificaciones en tiempo real.

**Capacidades destacadas**:
- Tableros Kanban con swimlanes y columnas configurables por estado.
- Sprints con story points, burndown chart y velocity por equipo.
- Tareas con dependencias, subtareas, checklists, adjuntos y comentarios.
- Roadmap visual + reportes de cumplimiento y forecast de entrega.

**Tecnologías**: Next.js · React · TypeScript · drag-and-drop · Recharts · TailwindCSS · Express con `project.routes.ts`

**Backend**: `apps/backend/src/routes/project.routes.ts`
**Demo**: [Ver código](./apps/web/src/app/demo/control-proyectos/) · [https://www.koptup.com/demo/control-proyectos](https://www.koptup.com/demo/control-proyectos)

---

#### 24. SaaS Boilerplate Multi-tenant
> **Plantilla productiva con auth SSO, billing, multi-tenancy y observability**

Boilerplate para arrancar un SaaS B2B con todo lo importante resuelto desde el día uno: auth empresarial (SSO SAML/OIDC, MFA, passkeys, magic links), billing con Stripe + Paddle (trials, usage-based, dunning), multi-tenancy configurable (shared-DB con RLS, schema por tenant o DB por tenant), audit logs estilo Vanta, feature flags tipados, webhooks firmados, i18n y observability lista.

**Capacidades destacadas**:
- Multi-tenancy con 3 estrategias: shared-DB + RLS, schema o DB por tenant.
- Auth completo: SSO SAML/OIDC, MFA, passkeys, magic links.
- Billing dual Stripe + Paddle con trials, usage-based y dunning automático.
- Audit logs Vanta-style, feature flags tipados, webhooks firmados.

**Tecnologías**: Next.js · React · TypeScript · NextAuth · Stripe SDK · Paddle · Express · Postgres RLS

**Backend**: `apps/backend/src/modules/saas-platform/`
**Demo**: [Ver código](./apps/web/src/app/demo/saas-boilerplate/) · [https://www.koptup.com/demo/saas-boilerplate](https://www.koptup.com/demo/saas-boilerplate)

---

### Seguridad y Compliance

#### 25. Firma Electrónica
> **Simple, Avanzada y Cualificada eIDAS / Ley 527 CO con audit trail criptográfico**

Plataforma de firma electrónica con los tres niveles legales: simple (clic + IP), avanzada (KYC del firmante) y cualificada (eIDAS / Ley 527 Colombia con certificado y blockchain timestamp). Soporta múltiples firmantes con orden secuencial, condicional o paralelo, bulk send para masivos y auditoría criptográfica con hash chain RFC 3161.

**Capacidades destacadas**:
- 3 niveles legales: simple, avanzada y cualificada (eIDAS, Ley 527 CO).
- KYC del firmante: SMS OTP, email, ID + selfie, video, biometría.
- Audit trail criptográfico con hash chain y timestamp RFC 3161.
- Multi-firmante con orden secuencial / condicional / paralelo + bulk send.

**Tecnologías**: Next.js · React · TypeScript · PDF signing mock · pdf-lib · RFC 3161 timestamp · Express

**Backend**: `apps/backend/src/modules/e-signature/`
**Demo**: [Ver código](./apps/web/src/app/demo/firma-electronica/) · [https://www.koptup.com/demo/firma-electronica](https://www.koptup.com/demo/firma-electronica)

---

#### 26. Scraping y Data Extraction
> **Builder visual con AI extraction, proxy rotation, captcha solving y auto-fix de DOM**

Plataforma de extracción de datos a escala: builder visual point-and-click para definir selectores sin código, extracción asistida por IA con schemas tipo Pydantic (le decís qué campos querés y el modelo arma el JSON), rotación de proxies (datacenter, residencial, móvil), resolución de captchas y auto-fix con LLM cuando cambia el DOM del sitio objetivo.

**Capacidades destacadas**:
- Visual builder point-and-click + AI extraction con schemas tipados.
- Proxy rotation: datacenter, residential, mobile + captcha solving.
- Anti-bot evasion: fingerprinting, stealth headers, human-like delays.
- Auto-fix con LLM cuando cambia el DOM + diff detection entre runs.

**Tecnologías**: Next.js · React · TypeScript · Playwright/Puppeteer mock · OpenAI · cheerio · Express

**Backend**: `apps/backend/src/modules/scraping/`
**Demo**: [Ver código](./apps/web/src/app/demo/scraping/) · [https://www.koptup.com/demo/scraping](https://www.koptup.com/demo/scraping)

---

### DevTools y QA

#### 27. Code Review con IA
> **Revisión automatizada de PRs con SAST/DAST/SCA, test generation y refactoring**

Plataforma DevTools para equipos de ingeniería: revisión automatizada de Pull Requests con un agente de IA que comenta por archivo sobre style, bugs, security, performance y design. Integra escáner de seguridad (SAST + DAST + SCA + SBOM + license compliance), generación automática de tests para código sin cobertura y sugerencias de refactoring con LLM.

**Capacidades destacadas**:
- AI review por archivo: style, bugs, security, perf, design con severity.
- SAST + DAST + SCA + SBOM + license compliance en cada PR.
- Test generation automática y refactoring suggestions con LLM.
- Integraciones: GitHub, GitLab, Bitbucket, Azure DevOps con checks status.

**Tecnologías**: Next.js · React · TypeScript · OpenAI · diff parsers · Octokit · Express

**Backend**: `apps/backend/src/modules/code-review/`
**Demo**: [Ver código](./apps/web/src/app/demo/code-review-ia/) · [https://www.koptup.com/demo/code-review-ia](https://www.koptup.com/demo/code-review-ia)

---

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
