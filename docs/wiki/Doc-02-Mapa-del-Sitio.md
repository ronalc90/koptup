# Mapa del sitio

> **Resumen.** Todas las rutas que existen hoy en `www.koptup.com` (rama `main`), sacadas de la carpeta `apps/web/src/app`: **18 rutas públicas** (más la página 404), el **hub y las 28 demos**, **6 páginas de cuenta**, **12 del portal** del prospecto y cliente, **13 del panel** de administración, **4 rutas internas**, **6 rutas API de Next** y los **archivos especiales** (sitemap, robots, imagen para redes). De cada una verás para qué sirve, quién puede entrar, su título SEO real, si Google la puede indexar y una miniatura.
>
> **Para quién:** el dueño (qué páginas tiene el sitio y quién ve cada una) y un desarrollador (archivo, layout y reglas de acceso). Haz clic en cualquier miniatura para verla en grande.

## Índice

1. [El sitio en una imagen](#1-el-sitio-en-una-imagen)
2. [Cómo leer las tablas](#2-cómo-leer-las-tablas)
3. [Páginas públicas](#3-páginas-públicas)
4. [Demos](#4-demos)
5. [Cuenta: entrar, registrarse y activar](#5-cuenta-entrar-registrarse-y-activar)
6. [Portal del prospecto y del cliente (`/dashboard`)](#6-portal-del-prospecto-y-del-cliente-dashboard)
7. [Panel de administración (`/admin`)](#7-panel-de-administración-admin)
8. [Herramientas internas](#8-herramientas-internas)
9. [Rutas API de Next](#9-rutas-api-de-next)
10. [Archivos especiales: sitemap, robots, imagen para redes](#10-archivos-especiales-sitemap-robots-imagen-para-redes)
11. [Layouts: qué envuelve a cada ruta](#11-layouts-qué-envuelve-a-cada-ruta)
12. [Para desarrolladores](#12-para-desarrolladores)
13. [Limitaciones conocidas](#13-limitaciones-conocidas)
14. [Páginas relacionadas](#14-páginas-relacionadas)

---

## 1. El sitio en una imagen

```mermaid
flowchart LR
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef sesion fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef admin fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef sistema fill:#e0e7ff,stroke:#4f46e5,color:#312e81
    classDef externo fill:#f1f5f9,stroke:#64748b,color:#334155

    ROOT["www.koptup.com"]:::sistema

    subgraph PUB["Públicas"]
        HOME["/ Inicio"]:::visitante
        RAG["/rag y /rag/salud, /rag/legal, /rag/soporte"]:::visitante
        SERV["/services y /pricing que redirige"]:::visitante
        SEO["/chatbots-ia, /soluciones-ia, /desarrollo-web-colombia"]:::visitante
        CONV["/contact y /solicitar-demo"]:::visitante
        INFO["/about, /bienvenido-producthunt"]:::visitante
        LEGAL["/privacy, /terms, /cookies"]:::visitante
    end

    subgraph DEM["Demos"]
        HUB["/demo hub"]:::visitante
        D1["18 demos Abiertas: /demo/slug"]:::visitante
        D2["8 demos Con solicitud"]:::admin
        D3["2 demos Solo por invitación"]:::admin
        GATE["/demo-acceso/slug pantalla de acceso"]:::sistema
        EMB["/embed/chatbot/botId chat para otros sitios"]:::visitante
    end

    subgraph CTA["Cuenta"]
        LOGIN["/login, /register, /auth/callback"]:::visitante
        PASS["/forgot-password, /reset-password"]:::visitante
        ACT["/activar/token"]:::visitante
    end

    subgraph POR["Portal: requiere sesión"]
        DASH["/dashboard y sus secciones"]:::sesion
        MIS["/dashboard/demos Mis demos"]:::sesion
    end

    subgraph PAN["Panel: requiere rol del equipo"]
        COM["/admin/solicitudes, /accesos, /catalogo-demos"]:::admin
        OPE["/admin, /orders, /invoices, /deliverables, /conversations, /users, /contacts, /settings"]:::admin
    end

    subgraph INT["Internas"]
        LIQ["/liquidacion: equipo"]:::admin
        TEST["/test: solo admin, 404 en producción"]:::admin
    end

    subgraph ARCH["Archivos y API de Next"]
        FILES["/sitemap.xml, /robots.txt, /opengraph-image, /icon, /manifest.json, /llms.txt, /widget.js"]:::externo
        NAPI["/api/linkedin-ads/generate y /api/chatbot/*"]:::externo
    end

    ROOT --> PUB
    ROOT --> DEM
    ROOT --> CTA
    ROOT --> POR
    ROOT --> PAN
    ROOT --> INT
    ROOT --> ARCH
    HUB --> D1
    HUB --> D2
    HUB --> D3
    D2 -.->|"sin acceso"| GATE
    D3 -.->|"sin invitación"| GATE
```

*Azul: cualquiera entra. Verde: con sesión. Ámbar: depende del rol o del acceso a la demo. Gris: archivos y rutas técnicas. La línea punteada muestra que una demo restringida, sin acceso, enseña la pantalla de acceso sin cambiar la URL.*

---

## 2. Cómo leer las tablas

| Columna | Valores |
|---|---|
| **Quién entra** | **Público** (cualquiera) · **Sesión** (cualquier cuenta con sesión) · **Rol** (los roles indicados; ver [Roles y permisos](Doc-10-Roles-y-Permisos.md)) · **Acceso a demo** (según el modo de la demo) |
| **Título SEO** | El `<title>` real que entrega el servidor (el `\|` separa el sufijo de marca) |
| **Indexable** | **Sí**: Google puede indexarla y está en `sitemap.xml`. **No**: tiene `noindex` (en la etiqueta `robots` o en la cabecera `X-Robots-Tag`), está bloqueada en `robots.txt` o ambas |
| **Miniatura** | Captura real; haz clic para verla completa. "—" cuando la ruta no tiene pantalla propia |

---

## 3. Páginas públicas

Todas llevan el menú y el pie de página comunes. Detalle de cada una, con capturas grandes, en [Páginas públicas](Doc-03-Paginas-Publicas.md).

| Ruta | Para qué sirve | Quién entra | Título SEO | Indexable | Miniatura |
|---|---|---|---|---|---|
| `/` | Inicio con el mensaje RAG y las demos destacadas | Público | KopTup \| IA que responde con los documentos de tu empresa | Sí | <a href="images/doc/publicas/inicio-escritorio.jpg"><img src="images/doc/publicas/inicio-escritorio.jpg" width="120" alt="Inicio"></a> |
| `/rag` | Página principal de sistemas RAG | Público | Sistemas RAG para empresas en Colombia \| KopTup | Sí | <a href="images/doc/publicas/rag-escritorio.jpg"><img src="images/doc/publicas/rag-escritorio.jpg" width="120" alt="RAG"></a> |
| `/rag/salud` | Landing RAG para salud | Público | RAG para salud: protocolos, normativa y auditoría \| KopTup | Sí | <a href="images/doc/publicas/rag-salud-mapa.jpg"><img src="images/doc/publicas/rag-salud-mapa.jpg" width="120" alt="RAG salud"></a> |
| `/rag/legal` | Landing RAG para áreas legales | Público | Buscar en contratos con IA: RAG para áreas legales \| KopTup | Sí | <a href="images/doc/publicas/rag-legal-escritorio.jpg"><img src="images/doc/publicas/rag-legal-escritorio.jpg" width="120" alt="RAG legal"></a> |
| `/rag/soporte` | Landing RAG para soporte y manuales | Público | Asistente IA para manuales internos y soporte \| KopTup | Sí | <a href="images/doc/publicas/rag-soporte-escritorio.jpg"><img src="images/doc/publicas/rag-soporte-escritorio.jpg" width="120" alt="RAG soporte"></a> |
| `/services` | Planes RAG y "Otras soluciones a medida" | Público | Precios de sistemas RAG y software a medida \| KopTup | Sí | <a href="images/doc/publicas/services-planes-anotado.jpg"><img src="images/doc/publicas/services-planes-anotado.jpg" width="120" alt="Servicios"></a> |
| `/pricing` | Antigua página de precios: redirige (307) a `/services#planes-rag` | Público | — | No (no está en el sitemap) | — |
| `/demo` | Hub con las 28 demos y su modo de acceso | Público | Prototipos Interactivos: Prueba Antes de Contratar \| KopTup | Sí | <a href="images/doc/publicas/demo-hub-escritorio.jpg"><img src="images/doc/publicas/demo-hub-escritorio.jpg" width="120" alt="Hub de demos"></a> |
| `/solicitar-demo` | Formulario para pedir demos | Público | Solicitar una demo guiada \| KopTup | Sí | <a href="images/doc/publicas/solicitar-demo-escritorio.jpg"><img src="images/doc/publicas/solicitar-demo-escritorio.jpg" width="120" alt="Solicitar demo"></a> |
| `/contact` | Formulario de contacto y cotización | Público | Contacto: Solicita tu Cotización Gratis \| KopTup | Sí | <a href="images/doc/publicas/contacto-escritorio.jpg"><img src="images/doc/publicas/contacto-escritorio.jpg" width="120" alt="Contacto"></a> |
| `/about` | Quiénes somos | Público | Sobre Nosotros: Empresa de Software en Bogotá \| KopTup | Sí | <a href="images/doc/publicas/nosotros-escritorio.jpg"><img src="images/doc/publicas/nosotros-escritorio.jpg" width="120" alt="Nosotros"></a> |
| `/chatbots-ia` | Landing SEO de chatbots RAG | Público | Chatbots RAG para WhatsApp y web \| KopTup | Sí | <a href="images/doc/publicas/chatbots-ia-escritorio.jpg"><img src="images/doc/publicas/chatbots-ia-escritorio.jpg" width="120" alt="Chatbots IA"></a> |
| `/soluciones-ia` | Landing SEO de soluciones de IA | Público | Soluciones de Inteligencia Artificial para Empresas \| KopTup | Sí | <a href="images/doc/publicas/soluciones-ia-escritorio.jpg"><img src="images/doc/publicas/soluciones-ia-escritorio.jpg" width="120" alt="Soluciones IA"></a> |
| `/desarrollo-web-colombia` | Landing SEO de software a medida | Público | Desarrollo Web y Software a Medida en Colombia \| KopTup | Sí | <a href="images/doc/publicas/desarrollo-web-colombia-escritorio.jpg"><img src="images/doc/publicas/desarrollo-web-colombia-escritorio.jpg" width="120" alt="Desarrollo web Colombia"></a> |
| `/bienvenido-producthunt` | Bienvenida a quien llega desde Product Hunt | Público | Product Hunt: Software a Medida con Demos \| KopTup | No (`noindex, follow`) | <a href="images/doc/publicas/producthunt-escritorio.jpg"><img src="images/doc/publicas/producthunt-escritorio.jpg" width="120" alt="Product Hunt"></a> |
| `/privacy` | Política de privacidad (Ley 1581) | Público | Política de Privacidad \| KopTup | Sí | <a href="images/doc/publicas/privacidad-escritorio.jpg"><img src="images/doc/publicas/privacidad-escritorio.jpg" width="120" alt="Privacidad"></a> |
| `/terms` | Términos y condiciones | Público | Términos y Condiciones \| KopTup | Sí | <a href="images/doc/publicas/terminos-escritorio.jpg"><img src="images/doc/publicas/terminos-escritorio.jpg" width="120" alt="Términos"></a> |
| `/cookies` | Política de cookies y preferencias | Público | Política de Cookies \| KopTup | Sí | <a href="images/doc/publicas/cookies-escritorio.jpg"><img src="images/doc/publicas/cookies-escritorio.jpg" width="120" alt="Cookies"></a> |
| *(ruta inexistente)* | Página 404 con enlaces de regreso | Público | IA que responde con los documentos de tu empresa \| KopTup | No (`noindex`) | <a href="images/doc/publicas/error-404.jpg"><img src="images/doc/publicas/error-404.jpg" width="120" alt="404"></a> |

---

## 4. Demos

### 4.1 Hub, pantallas de acceso y chat incrustable

| Ruta | Para qué sirve | Quién entra | Título SEO | Indexable | Miniatura |
|---|---|---|---|---|---|
| `/demo/<slug>` | Cada una de las 28 demos (tabla 4.2) | Acceso a demo | El de cada demo | Solo las Abiertas | ver 4.2 |
| `/demo-acceso/<slug>` | Pantalla "Solicita acceso", "Inicia sesión", "Venció", "En mantenimiento"… El middleware la muestra en lugar de la demo **sin cambiar la URL**; también se puede abrir directo | Público | *Nombre de la demo*: acceso \| KopTup | No (`noindex` y bloqueada en `robots.txt`) | <a href="images/doc/prospecto-cliente/demo-sin-sesion.jpg"><img src="images/doc/prospecto-cliente/demo-sin-sesion.jpg" width="120" alt="Pantalla de acceso"></a> |
| `/demo/ecommerce/admin` | Atajo: redirige (307) a `/demo/ecommerce?view=admin` | Público | — | No | — |
| `/demo/lms/verificar` | Verificación pública de certificados de la demo LMS (con el código del QR) | Acceso a demo (LMS: Con solicitud) | Verificar certificado \| KopTup | No | <a href="images/doc/mapa/demo-lms-verificar.jpg"><img src="images/doc/mapa/demo-lms-verificar.jpg" width="120" alt="Verificar certificado"></a> |
| `/embed/chatbot/<botId>` | Chat público de un bot creado en "Configura el tuyo"; lo cargan el iframe y `/widget.js` en el sitio de un cliente. Es la única ruta que se puede incrustar en otros dominios | Público | Chat del asistente \| KopTup | No (`noindex`) | <a href="images/doc/demos/chatbot/10-configura-el-tuyo.jpg"><img src="images/doc/demos/chatbot/10-configura-el-tuyo.jpg" width="120" alt="Widget del chatbot"></a> |

### 4.2 Las 28 demos

El modo es el **por defecto**; el administrador lo cambia en **Admin › Catálogo de demos** ([Manual del administrador](Doc-06-Manual-del-Administrador.md)). Las demos **Con solicitud** y **Solo por invitación** muestran a quien no tiene acceso el título "*Nombre*: acceso \| KopTup"; el título de la tabla es el que ve quien sí entra. Cómo se decide el acceso: [Roles y permisos §4](Doc-10-Roles-y-Permisos.md#4-cómo-se-decide-el-acceso-a-una-demo).

| Ruta | Demo | Modo | Título SEO | Indexable | Miniatura | Guía |
|---|---|---|---|---|---|---|
| `/demo/chatbot` | Chatbot RAG con tus documentos | Abierta (siempre) | Demo RAG: prueba con tu documento \| KopTup | Sí | <a href="images/doc/demos/chatbot/00-general.jpg"><img src="images/doc/demos/chatbot/00-general.jpg" width="120" alt="chatbot"></a> | [Guía](Guia-Demo-chatbot.md) |
| `/demo/code-review-ia` | Revisión de código con IA | Abierta | Demo de code review con IA: revisión de pull requests \| KopTup | Sí | <a href="images/doc/demos/code-review-ia/00-general.jpg"><img src="images/doc/demos/code-review-ia/00-general.jpg" width="120" alt="code-review-ia"></a> | [Guía](Guia-Demo-code-review-ia.md) |
| `/demo/crm-ia` | CRM con IA | Abierta | CRM con IA: demo de embudo de ventas y pronóstico \| KopTup | Sí | <a href="images/doc/demos/crm-ia/00-general.jpg"><img src="images/doc/demos/crm-ia/00-general.jpg" width="120" alt="crm-ia"></a> | [Guía](Guia-Demo-crm-ia.md) |
| `/demo/helpdesk-ia` | Mesa de ayuda con IA | Abierta | Helpdesk con IA: demo de mesa de ayuda omnicanal \| KopTup | Sí | <a href="images/doc/demos/helpdesk-ia/00-general.jpg"><img src="images/doc/demos/helpdesk-ia/00-general.jpg" width="120" alt="helpdesk-ia"></a> | [Guía](Guia-Demo-helpdesk-ia.md) |
| `/demo/facturacion-electronica` | Facturación electrónica | Abierta | Facturación electrónica DIAN: simulador \| KopTup | Sí | <a href="images/doc/demos/facturacion-electronica/00-general.jpg"><img src="images/doc/demos/facturacion-electronica/00-general.jpg" width="120" alt="facturacion-electronica"></a> | [Guía](Guia-Demo-facturacion-electronica.md) |
| `/demo/pos` | Punto de venta (POS) | Abierta | POS para retail y restaurantes: demo interactiva \| KopTup | Sí | <a href="images/doc/demos/pos/00-general.jpg"><img src="images/doc/demos/pos/00-general.jpg" width="120" alt="pos"></a> | [Guía](Guia-Demo-pos.md) |
| `/demo/ecommerce` | Tienda en línea | Abierta | Demo de tienda en línea: catálogo, carrito, pago simulado y reportes \| KopTup | Sí | <a href="images/doc/demos/ecommerce/00-general.jpg"><img src="images/doc/demos/ecommerce/00-general.jpg" width="120" alt="ecommerce"></a> | [Guía](Guia-Demo-ecommerce.md) |
| `/demo/loyalty` | Programa de fidelización | Abierta | Programa de fidelización: demo interactiva \| KopTup | Sí | <a href="images/doc/demos/loyalty/00-general.jpg"><img src="images/doc/demos/loyalty/00-general.jpg" width="120" alt="loyalty"></a> | [Guía](Guia-Demo-loyalty.md) |
| `/demo/control-proyectos` | Gestión de proyectos | Abierta | Demo de gestión de proyectos con portal de cliente \| KopTup | Sí | <a href="images/doc/demos/control-proyectos/00-general.jpg"><img src="images/doc/demos/control-proyectos/00-general.jpg" width="120" alt="control-proyectos"></a> | [Guía](Guia-Demo-control-proyectos.md) |
| `/demo/sistema-reservas` | Sistema de reservas | Abierta | Sistema de Reservas Online y Agendamiento de Citas \| KopTup | Sí | <a href="images/doc/demos/sistema-reservas/00-general.jpg"><img src="images/doc/demos/sistema-reservas/00-general.jpg" width="120" alt="sistema-reservas"></a> | [Guía](Guia-Demo-sistema-reservas.md) |
| `/demo/dashboard-ejecutivo` | Dashboard ejecutivo | Abierta | Demo de tablero ejecutivo: ventas, finanzas y cartera \| KopTup | Sí | <a href="images/doc/demos/dashboard-ejecutivo/00-general.jpg"><img src="images/doc/demos/dashboard-ejecutivo/00-general.jpg" width="120" alt="dashboard-ejecutivo"></a> | [Guía](Guia-Demo-dashboard-ejecutivo.md) |
| `/demo/gestor-documentos` | Gestor documental | Abierta | Gestor Documental Médico para Archivos Clínicos \| KopTup | Sí | <a href="images/doc/demos/gestor-documentos/00-general.jpg"><img src="images/doc/demos/gestor-documentos/00-general.jpg" width="120" alt="gestor-documentos"></a> | [Guía](Guia-Demo-gestor-documentos.md) |
| `/demo/gestor-contenido` | Gestor de contenido | Abierta | Demo de CMS headless: modelos, editor visual y API \| KopTup | Sí | <a href="images/doc/demos/gestor-contenido/00-general.jpg"><img src="images/doc/demos/gestor-contenido/00-general.jpg" width="120" alt="gestor-contenido"></a> | [Guía](Guia-Demo-gestor-contenido.md) |
| `/demo/automatizacion` | Automatización de procesos | Abierta | Automatización de Workflows y Procesos \| KopTup | Sí | <a href="images/doc/demos/automatizacion/00-general.jpg"><img src="images/doc/demos/automatizacion/00-general.jpg" width="120" alt="automatizacion"></a> | [Guía](Guia-Demo-automatizacion.md) |
| `/demo/scraping` | Extracción de datos web | Abierta | Demo: extracción y monitoreo de datos de la web y de documentos \| KopTup | Sí | <a href="images/doc/demos/scraping/00-general.jpg"><img src="images/doc/demos/scraping/00-general.jpg" width="120" alt="scraping"></a> | [Guía](Guia-Demo-scraping.md) |
| `/demo/moderacion-contenido` | Moderación de contenido con IA | Abierta | Moderación de Contenido con IA: Trust & Safety \| KopTup | Sí | <a href="images/doc/demos/moderacion-contenido/00-general.jpg"><img src="images/doc/demos/moderacion-contenido/00-general.jpg" width="120" alt="moderacion-contenido"></a> | [Guía](Guia-Demo-moderacion-contenido.md) |
| `/demo/saas-boilerplate` | Plataforma SaaS multiempresa | Abierta | SaaS Multi-tenant: Auth y Billing con Stripe \| KopTup | Sí | <a href="images/doc/demos/saas-boilerplate/00-general.jpg"><img src="images/doc/demos/saas-boilerplate/00-general.jpg" width="120" alt="saas-boilerplate"></a> | [Guía](Guia-Demo-saas-boilerplate.md) |
| `/demo/firma-electronica` | Firma electrónica | Abierta | Firma Electrónica de Documentos con Validez Legal \| KopTup | Sí | <a href="images/doc/demos/firma-electronica/00-general.jpg"><img src="images/doc/demos/firma-electronica/00-general.jpg" width="120" alt="firma-electronica"></a> | [Guía](Guia-Demo-firma-electronica.md) |
| `/demo/voice-ai` | Voz con IA para call center | Con solicitud | Demo de agente de voz con IA para call center \| KopTup | No | <a href="images/doc/demos/voice-ai/00-general.jpg"><img src="images/doc/demos/voice-ai/00-general.jpg" width="120" alt="voice-ai"></a> | [Guía](Guia-Demo-voice-ai.md) |
| `/demo/erp` | ERP modular | Con solicitud | Demo ERP: ventas, inventario, compras y contabilidad \| KopTup | No | <a href="images/doc/demos/erp/00-general.jpg"><img src="images/doc/demos/erp/00-general.jpg" width="120" alt="erp"></a> | [Guía](Guia-Demo-erp.md) |
| `/demo/delivery` | App de domicilios | Con solicitud | App de domicilios: cliente, sede, operaciones y repartidor \| KopTup | No | <a href="images/doc/demos/delivery/00-general.jpg"><img src="images/doc/demos/delivery/00-general.jpg" width="120" alt="delivery"></a> | [Guía](Guia-Demo-delivery.md) |
| `/demo/hrms` | Gestión de talento humano (HRMS) | Con solicitud | Demo de gestión humana y nómina colombiana \| KopTup | No | <a href="images/doc/demos/hrms/00-general.jpg"><img src="images/doc/demos/hrms/00-general.jpg" width="120" alt="hrms"></a> | [Guía](Guia-Demo-hrms.md) |
| `/demo/lms` | Plataforma de aprendizaje (LMS) | Con solicitud | Demo LMS: plataforma de cursos virtuales con tutor IA \| KopTup | No | <a href="images/doc/demos/lms/00-general.jpg"><img src="images/doc/demos/lms/00-general.jpg" width="120" alt="lms"></a> | [Guía](Guia-Demo-lms.md) |
| `/demo/telemedicina` | Telemedicina | Con solicitud | Demo de telemedicina para IPS \| KopTup | No | <a href="images/doc/demos/telemedicina/00-general.jpg"><img src="images/doc/demos/telemedicina/00-general.jpg" width="120" alt="telemedicina"></a> | [Guía](Guia-Demo-telemedicina.md) |
| `/demo/wms-logistica` | Logística y bodegas (WMS) | Con solicitud | WMS: Logística de Bodegas, Picking e Inventario \| KopTup | No | <a href="images/doc/demos/wms-logistica/00-general.jpg"><img src="images/doc/demos/wms-logistica/00-general.jpg" width="120" alt="wms-logistica"></a> | [Guía](Guia-Demo-wms-logistica.md) |
| `/demo/linkedin-ads` | Generador de contenido para LinkedIn con IA | Con solicitud | Generador de Contenido para LinkedIn con IA \| KopTup | No | <a href="images/doc/demos/linkedin-ads/00-general.jpg"><img src="images/doc/demos/linkedin-ads/00-general.jpg" width="120" alt="linkedin-ads"></a> | [Guía](Guia-Demo-linkedin-ads.md) |
| `/demo/cuentas-medicas` | Sistema experto para salud (cuentas médicas) | Solo por invitación | Sistema experto para salud: auditar cuentas médicas \| KopTup | No | <a href="images/doc/demos/cuentas-medicas/00-general.jpg"><img src="images/doc/demos/cuentas-medicas/00-general.jpg" width="120" alt="cuentas-medicas"></a> | [Guía](Guia-Demo-cuentas-medicas.md) |
| `/demo/sistema-experto` | Sistema experto de auditoría médica | Solo por invitación | Motor de reglas para auditoría de cuentas médicas \| KopTup | No | <a href="images/doc/demos/sistema-experto/00-general.jpg"><img src="images/doc/demos/sistema-experto/00-general.jpg" width="120" alt="sistema-experto"></a> | [Guía](Guia-Demo-sistema-experto.md) |

*Todas las demos usan datos de ejemplo. Cada demo tiene su propio `layout.tsx` con sus metadatos y comparte el layout de `/demo`, que agrega el bloque final "¿Te gustaría algo así para tu negocio?".*

---

## 5. Cuenta: entrar, registrarse y activar

Todas están bloqueadas en `robots.txt`. Recorridos con capturas en [Flujos del prospecto y cliente](Doc-05-Flujos-del-Prospecto-y-Cliente.md).

| Ruta | Para qué sirve | Quién entra | Título SEO | Indexable | Miniatura |
|---|---|---|---|---|---|
| `/login` | Iniciar sesión con email y contraseña o con Google; vuelve a la ruta de `?redirect=` | Público | IA que responde con los documentos de tu empresa \| KopTup (genérico) | No (`robots.txt`) | <a href="images/doc/prospecto-cliente/login-anotado.jpg"><img src="images/doc/prospecto-cliente/login-anotado.jpg" width="120" alt="Login"></a> |
| `/register` | Crear una cuenta (rol `user`) con email o Google | Público | Genérico | No (`robots.txt`) | <a href="images/doc/mapa/register.jpg"><img src="images/doc/mapa/register.jpg" width="120" alt="Registro"></a> |
| `/auth/callback` | Recibe la sesión de Google y lleva a la página de inicio del rol | Público | Genérico | No (`robots.txt`) | — |
| `/forgot-password` | Pedir el enlace para restablecer la contraseña | Público | Genérico | No (`robots.txt`) | <a href="images/doc/prospecto-cliente/olvide-contrasena.jpg"><img src="images/doc/prospecto-cliente/olvide-contrasena.jpg" width="120" alt="Olvidé mi contraseña"></a> |
| `/reset-password` | Poner una contraseña nueva con el enlace (1 hora) | Público con enlace | Genérico | No (`robots.txt`) | <a href="images/doc/prospecto-cliente/restablecer-contrasena.jpg"><img src="images/doc/prospecto-cliente/restablecer-contrasena.jpg" width="120" alt="Restablecer contraseña"></a> |
| `/activar/<token>` | Activar la cuenta de un prospecto con el enlace de un solo uso (72 h) | Público con enlace | Activa tu acceso \| KopTup | No (`noindex` y `robots.txt`) | <a href="images/doc/prospecto-cliente/activar-formulario.jpg"><img src="images/doc/prospecto-cliente/activar-formulario.jpg" width="120" alt="Activar cuenta"></a> |

---

## 6. Portal del prospecto y del cliente (`/dashboard`)

Requiere sesión. Un **prospecto** solo entra a Mis demos y Mi perfil; cualquier otra ruta del portal lo lleva a Mis demos. Todas son `noindex` y están bloqueadas en `robots.txt`, y usan el título genérico del sitio. Detalle en [Flujos del prospecto y cliente §9](Doc-05-Flujos-del-Prospecto-y-Cliente.md#9-el-portal-del-cliente-sección-por-sección).

| Ruta | Para qué sirve | Quién entra | Miniatura |
|---|---|---|---|
| `/dashboard` | Panel de inicio (vista de ejemplo con tres modos) | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/portal-cliente-panel.jpg"><img src="images/doc/prospecto-cliente/portal-cliente-panel.jpg" width="120" alt="Panel"></a> |
| `/dashboard/demos` | **Mis demos**: accesos, vencimiento y botón para abrir cada demo | Sesión (incluido prospecto) | <a href="images/doc/prospecto-cliente/mis-demos-estados.jpg"><img src="images/doc/prospecto-cliente/mis-demos-estados.jpg" width="120" alt="Mis demos"></a> |
| `/dashboard/orders` | Mis pedidos | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/pedidos-lista.jpg"><img src="images/doc/prospecto-cliente/pedidos-lista.jpg" width="120" alt="Pedidos"></a> |
| `/dashboard/orders/new` | Crear un pedido | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/pedido-nuevo-error.jpg"><img src="images/doc/prospecto-cliente/pedido-nuevo-error.jpg" width="120" alt="Nuevo pedido"></a> |
| `/dashboard/orders/<id>` | Detalle de un pedido propio | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/pedido-detalle.jpg"><img src="images/doc/prospecto-cliente/pedido-detalle.jpg" width="120" alt="Detalle de pedido"></a> |
| `/dashboard/projects` | Proyectos donde es miembro | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/proyectos-vacio.jpg"><img src="images/doc/prospecto-cliente/proyectos-vacio.jpg" width="120" alt="Proyectos"></a> |
| `/dashboard/deliverables` | Entregables para aprobar o rechazar | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/entregables-vacio.jpg"><img src="images/doc/prospecto-cliente/entregables-vacio.jpg" width="120" alt="Entregables"></a> |
| `/dashboard/billing` | Facturación | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/facturacion-vacia.jpg"><img src="images/doc/prospecto-cliente/facturacion-vacia.jpg" width="120" alt="Facturación"></a> |
| `/dashboard/messages` | Mensajes con el equipo | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/mensajes-vacio.jpg"><img src="images/doc/prospecto-cliente/mensajes-vacio.jpg" width="120" alt="Mensajes"></a> |
| `/dashboard/notifications` | Notificaciones | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/notificaciones-vacio.jpg"><img src="images/doc/prospecto-cliente/notificaciones-vacio.jpg" width="120" alt="Notificaciones"></a> |
| `/dashboard/profile` | Mi perfil: datos y contraseña | Sesión (incluido prospecto) | <a href="images/doc/prospecto-cliente/perfil.jpg"><img src="images/doc/prospecto-cliente/perfil.jpg" width="120" alt="Perfil"></a> |
| `/dashboard/settings` | Configuración: idioma, tema y preferencias | Sesión, salvo prospecto | <a href="images/doc/prospecto-cliente/configuracion.jpg"><img src="images/doc/prospecto-cliente/configuracion.jpg" width="120" alt="Configuración"></a> |

---

## 7. Panel de administración (`/admin`)

Requiere un rol del equipo. Todas son `noindex`, están bloqueadas en `robots.txt` y usan el título genérico del sitio. Paso a paso en el [Manual del administrador](Doc-06-Manual-del-Administrador.md).

| Ruta | Para qué sirve | Quién entra | Miniatura |
|---|---|---|---|
| `/admin` | Inicio del panel: indicadores y accesos rápidos | `admin`, `manager` | <a href="images/doc/admin/inicio-panel-anotado.jpg"><img src="images/doc/admin/inicio-panel-anotado.jpg" width="120" alt="Inicio del panel"></a> |
| `/admin/solicitudes` | Solicitudes de demo por estado | `admin`, `sales` (gestionan); `manager` (consulta) | <a href="images/doc/admin/solicitudes-lista-anotada.jpg"><img src="images/doc/admin/solicitudes-lista-anotada.jpg" width="120" alt="Solicitudes"></a> |
| `/admin/solicitudes/<id>` | Detalle: aprobar, rechazar, notas e historial | `admin`, `sales` (gestionan); `manager` (consulta) | <a href="images/doc/admin/solicitud-detalle-anotada.jpg"><img src="images/doc/admin/solicitud-detalle-anotada.jpg" width="120" alt="Detalle de solicitud"></a> |
| `/admin/accesos` | Accesos a demos: conceder, extender, retirar, nuevo enlace | `admin`, `sales` (gestionan); `manager` (consulta) | <a href="images/doc/admin/accesos-lista-anotada.jpg"><img src="images/doc/admin/accesos-lista-anotada.jpg" width="120" alt="Accesos"></a> |
| `/admin/catalogo-demos` | Modo de acceso, activa y vigencia de las 28 demos | `admin` (edita); `manager`, `sales` (consulta) | <a href="images/doc/admin/catalogo-anotado.jpg"><img src="images/doc/admin/catalogo-anotado.jpg" width="120" alt="Catálogo de demos"></a> |
| `/admin/orders` | Pedidos: aprobar, rechazar, cambiar estado, facturar | `admin`, `manager` | <a href="images/doc/admin/pedidos-anotado.jpg"><img src="images/doc/admin/pedidos-anotado.jpg" width="120" alt="Pedidos"></a> |
| `/admin/invoices` | Facturas | `admin`, `manager` | <a href="images/doc/admin/facturas-vacio.jpg"><img src="images/doc/admin/facturas-vacio.jpg" width="120" alt="Facturas"></a> |
| `/admin/deliverables` | Entregables | `admin`, `manager` | <a href="images/doc/admin/entregables-vacio.jpg"><img src="images/doc/admin/entregables-vacio.jpg" width="120" alt="Entregables"></a> |
| `/admin/conversations` | Conversaciones con clientes | `admin`, `manager` | <a href="images/doc/admin/conversaciones-vacio.jpg"><img src="images/doc/admin/conversaciones-vacio.jpg" width="120" alt="Conversaciones"></a> |
| `/admin/conversations/<id>` | Detalle de una conversación | `admin`, `manager` | — |
| `/admin/users` | Usuarios y cambio de rol (solo `admin` cambia roles) | `admin`, `manager` | <a href="images/doc/admin/usuarios-anotado.jpg"><img src="images/doc/admin/usuarios-anotado.jpg" width="120" alt="Usuarios"></a> |
| `/admin/contacts` | Contactos y leads (formulario, demo RAG, solicitudes) | `admin`, `manager` | <a href="images/doc/admin/contactos-anotado.jpg"><img src="images/doc/admin/contactos-anotado.jpg" width="120" alt="Contactos"></a> |
| `/admin/settings` | Configuración de la cuenta: notificaciones, idioma y tema | `admin`, `manager` | <a href="images/doc/admin/configuracion-anotada.jpg"><img src="images/doc/admin/configuracion-anotada.jpg" width="120" alt="Configuración"></a> |

Un `sales` que escribe `/admin` llega a `/admin/solicitudes`; cualquier otro rol sin permiso vuelve a su página de inicio.

---

## 8. Herramientas internas

| Ruta | Para qué sirve | Quién entra | Indexable | Miniatura |
|---|---|---|---|---|
| `/liquidacion` | Liquidación de cuentas médicas: radicados, carga de archivos y resultados (herramienta del equipo, no es la demo) | `admin`, `manager`, `sales` | No (`X-Robots-Tag: noindex` y `robots.txt`) | <a href="images/doc/mapa/liquidacion.jpg"><img src="images/doc/mapa/liquidacion.jpg" width="120" alt="Liquidación"></a> |
| `/liquidacion/<id>` | Detalle de un radicado | `admin`, `manager`, `sales` | No | — |
| `/liquidacion/reglas` | Reglas de facturación de la herramienta | `admin`, `manager`, `sales` | No | — |
| `/test` | Página para probar endpoints de la API a mano | `admin`, y solo fuera de producción (en producción responde 404) | No | — |

---

## 9. Rutas API de Next

Viven en `apps/web/src/app/api/` y corren en Vercel. La API principal está en Railway ([API](Doc-08-API.md)).

| Ruta | Método | Para qué sirve | Quién la usa |
|---|---|---|---|
| `/api/linkedin-ads/generate` | POST | Proxy hacia `POST /api/linkedin-ads/generate` del backend: reenvía el cuerpo, la sesión (cookie → `Authorization`) y la IP del visitante. Si el backend no responde, devuelve 503 | Demo LinkedIn Ads |
| `/api/chatbot/message` | POST | Proxy heredado de la API "por sesión" del chatbot | Solo `/test` |
| `/api/chatbot/upload` | POST | Proxy heredado (subida de archivos por sesión) | Solo `/test` |
| `/api/chatbot/config` | PUT | Proxy heredado (configuración por sesión) | Solo `/test` |
| `/api/chatbot/info/<sessionId>` | GET | Proxy heredado (información de la sesión) | Solo `/test` |
| `/api/chatbot/messages/<sessionId>` | DELETE | Proxy heredado (borrar mensajes) | Solo `/test` |

`/api/` está bloqueada en `robots.txt` y el middleware no la intercepta.

---

## 10. Archivos especiales: sitemap, robots, imagen para redes

| Ruta | Qué es | Origen |
|---|---|---|
| `/sitemap.xml` | 34 URLs: 16 páginas fijas (inicio, `/rag` y sus 3 sectores, landings, `/services`, `/demo`, formularios, `/about` y legales) y las **18 demos Abiertas** según la semilla. Fecha de modificación fija para no simular cambios en cada despliegue | `src/app/sitemap.ts` (se genera al compilar) |
| `/robots.txt` | Permite todo menos `/dashboard`, `/admin`, `/api/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/`, `/test`, `/liquidacion`, `/activar/`, `/demo-acceso/` y URLs con `sessionId=` o `token=`. Bloquea por completo a AhrefsBot, SemrushBot, DotBot, MJ12bot, GPTBot y CCBot. Bingbot con `Crawl-delay: 5` | `public/robots.txt` |
| `/opengraph-image` | Imagen de 1200 × 630 que se ve al compartir el sitio en redes y chats | `src/app/opengraph-image.tsx` (se genera en el servidor) |
| `/icon` | Ícono del sitio (32 × 32) | `src/app/icon.tsx` (se genera al compilar) |
| `/manifest.json` | Manifiesto de la app web (nombre, colores, íconos) | `public/manifest.json` |
| `/llms.txt` | Resumen del negocio en texto para asistentes de IA | `public/llms.txt` |
| `/widget.js` | Script del widget del chatbot para pegar en el sitio de un cliente; abre `/embed/chatbot/<botId>` | `public/widget.js` |
| `/favicon.ico`, `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`, `/logo.svg`, `/og-image.png` | Íconos e imágenes estáticas | `public/` |

![Imagen para redes sociales generada por el sitio](images/doc/mapa/opengraph-image.jpg)

*La imagen que genera `/opengraph-image` (reducida). Es la que aparece al compartir `www.koptup.com` en WhatsApp, LinkedIn o X.*

---

## 11. Layouts: qué envuelve a cada ruta

```mermaid
flowchart TD
    classDef sistema fill:#e0e7ff,stroke:#4f46e5,color:#312e81
    classDef visitante fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef admin fill:#fef3c7,stroke:#d97706,color:#78350f

    ROOT["app/layout.tsx: idioma, mensajes, tema, analítica con consentimiento, aviso de cookies, notificaciones"]:::sistema
    COND["ConditionalLayout: menú y pie de página"]:::sistema
    OWN["Sin menú del sitio: /dashboard y /admin traen su propio encabezado"]:::sistema
    META["layout.tsx de metadatos: about, contact, services, solicitar-demo, legales, landings SEO, producthunt"]:::visitante
    DEMO["demo/layout.tsx: metadatos del hub y bloque final de contacto"]:::visitante
    DSLUG["demo/slug/layout.tsx: título, descripción y canonical de cada demo"]:::visitante
    ADM["admin/layout.tsx: noindex"]:::admin
    DSH["dashboard/layout.tsx: noindex"]:::admin
    EMB["embed/layout.tsx: noindex, chat a pantalla completa"]:::visitante
    TST["test/layout.tsx: noindex y 404 en producción"]:::admin

    ROOT --> COND
    ROOT --> OWN
    COND --> META
    COND --> DEMO --> DSLUG
    COND --> EMB
    COND --> TST
    OWN --> ADM
    OWN --> DSH
```

*Todas las páginas se renderizan en el servidor en cada visita porque el layout raíz lee la cookie de idioma. El middleware actúa antes que cualquier layout en `/admin`, `/dashboard`, `/liquidacion`, `/test` y `/demo/<slug>` (ver [Arquitectura §4.2](Doc-01-Arquitectura.md#42-abrir-una-demo-con-acceso-controlado)).*

---

## 12. Para desarrolladores

Para agregar una página:

1. Crea `apps/web/src/app/<ruta>/page.tsx` (y `layout.tsx` si necesita metadatos propios desde un componente de cliente).
2. Define el título con la plantilla `%s | KopTup` y verifica que no pase de 60 caracteres: `npm run check-titles --workspace=apps/web` (el CI lo corre).
3. Si es pública e indexable, agrégala a `src/app/sitemap.ts`. Si es privada, agrégala a `public/robots.txt`, pon `robots: { index: false }` y súmala al `matcher` de `src/middleware.ts` y a `lib/auth-roles.ts`.
4. Si es una **demo**, agrega su slug a `lib/demo-access-defaults.ts` y a la semilla del backend (`data/demo-catalog.seed.ts` y `DEFAULT_DEMO_ACCESS_MODES`); una prueba verifica que coincidan con las carpetas de `app/demo/`.
5. Agrega sus textos a `messages/es.json` y `messages/en.json` (o a `messages/demos/<slug>.<idioma>.json`).

---

## 13. Limitaciones conocidas

- **Títulos genéricos en las páginas privadas y de cuenta.** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`, todo `/dashboard`, todo `/admin` y `/liquidacion` muestran el título por defecto del sitio en la pestaña del navegador.
- **Señales mezcladas en las páginas de cuenta.** `/login`, `/register`, `/forgot-password` y `/reset-password` están bloqueadas en `robots.txt`, pero su etiqueta `robots` dice `index, follow` y su canonical apunta al inicio. `/liquidacion` y las demos restringidas abiertas por alguien con acceso tienen la etiqueta `index, follow`, aunque la cabecera `X-Robots-Tag: noindex` las protege.
- **El sitemap usa los modos por defecto.** Si el administrador abre una demo Con solicitud, no aparece en el sitemap hasta que se cambie la semilla; si cierra una Abierta, sigue listada (pero ya responde con `noindex`).
- **`/pricing` redirige con 307** (temporal) en lugar de una redirección permanente.
- **Rutas heredadas:** los proxies `/api/chatbot/*` solo los usa `/test`; `public/IMAGES-NEEDED.md` (nota interna) se sirve como archivo público.
- **El botón "GitHub"** de `/login` y `/register` no hace nada (solo Google está implementado).

---

## 14. Páginas relacionadas

- [Páginas públicas](Doc-03-Paginas-Publicas.md): cada página pública en detalle.
- [Guía de demos](Doc-07-Guia-de-Demos.md): índice de las 28 demos.
- [Roles y permisos](Doc-10-Roles-y-Permisos.md): quién entra a cada área.
- [SEO, analítica y legal](Doc-12-SEO-Analitica-y-Legal.md): metadatos, sitemap y consentimiento.
- [Arquitectura](Doc-01-Arquitectura.md): cómo se sirve cada ruta.
- Plan relacionado: [Plan por sección](07-Plan-por-Seccion.md).
