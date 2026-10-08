# Catálogo de productos

> Índice de todo lo que vende KopTup y del estado real de cada demo. Arriba está el **producto principal (sistemas RAG)**; debajo, las **26 otras soluciones a medida** y las **3 demos que no están en el catálogo**. Cada fila enlaza a la página con el plan detallado del producto. Datos al 8 de octubre de 2026.
>
> Páginas relacionadas: [Reposicionamiento RAG](13-Reposicionamiento-RAG.md) · [Sistemas RAG](Producto-chatbot-rag-ia.md) · [Servicios y precios](Seccion-Servicios-y-Precios.md) · [Landing de producto](Seccion-Landing-de-Producto.md) · [Sistema de demos](04-Sistema-de-Demos.md) · [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md) · [Roadmap](12-Roadmap.md)

![Captura actual de /demo en producción: hero "Prueba Nuestras Soluciones", texto "prototipos navegables con datos simulados, dos de ellos (chatbot RAG y LinkedIn Ads) usan OpenAI real", "100% Interactivo - Sin registro" y las tarjetas Chatbot Inteligente y Tienda en Línea](images/actual/demo-hub.jpg)

*Captura actual de `/demo` (rama `main`, antes del reposicionamiento). El catálogo de demos no separa el producto principal del resto y la tarjeta del chatbot todavía dice "Chatbot Inteligente".*

![Captura actual de /services en producción: hero "Planes y servicios" con voseo, caja "Cómo escalamos", buscador, selector Comprar el software o Suscripción SaaS mensual, COP/USD con TRM en vivo, chips de 14 categorías y las tarjetas Chatbot RAG con IA, Tienda en línea y Dashboard ejecutivo con IA](images/actual/servicios.jpg)

*Captura actual de `/services` (rama `main`). Las 27 ofertas se ven iguales, todas con suscripción SaaS y con el chatbot como una tarjeta más. La rama `rag-reposicionamiento` ya separa los planes RAG del resto (ver abajo).*

---

## En una mirada

- **Un producto principal:** los **sistemas RAG**, es decir, IA que responde con los documentos de cada empresa y cita la fuente. Tiene planes publicados (Piloto, Esencial, Profesional y Empresarial), demo pública sin registro y es el primer producto que se convertirá en SaaS real (Fase 4).
- **26 otras soluciones a medida.** Se venden como **compra** (proyecto a medida). La suscripción queda en **lista de espera** hasta que exista el núcleo multi-tenant con cobro recurrente (DECISIÓN 7).
  - Estado de sus demos: 22 son **maquetas** con datos simulados, 2 son **parciales** (tienen IA real pero no muestran lo que promete la oferta) y 2 **no tienen demo propia**. Ninguna tiene todavía un producto listo para entregar detrás, aunque algunas reutilizan piezas reales (el gestor documental, el redactor del CMS y los proyectos del portal).
  - Prioridad: 5 son P1, 14 son P2 y 7 son P3. Ninguna es P0: lo bloqueante está en el producto principal y en el sistema de demos.
  - Modo de acceso recomendado: 16 `publico` y 10 `solicitud`.
  - **Vendibilidad media hoy: 2 sobre 5.** La mayoría se puede mostrar solo con guía y advertencias.
- **3 demos fuera del catálogo:** la auditoría de cuentas médicas (sistema real, entra al catálogo como vertical de salud en modo `privado`), su motor de reglas (pasa a ser un módulo de la anterior) y el motor de contenido para LinkedIn (herramienta interna).
- **15 errores de mapeo y de coherencia** entre demos y productos. Los dos que llevaban a una demo ajena ya están corregidos en la rama `rag-reposicionamiento`, pero esa rama aún no está fusionada.

---

## Producto principal: Sistemas RAG

> Plataforma IA · Demo: `/demo/chatbot` (pública, sin registro) · Modo de acceso: `publico`; el cupo ampliado y el asistente con los datos del prospecto van por `solicitud` · Prioridad: **P0** · Esfuerzo: **XL** · Vendibilidad hoy en producción: **2 / 5**; objetivo al terminar el kit de entrega (Fase 2): **4 / 5**
>
> Plan detallado y tareas: [Sistemas RAG](Producto-chatbot-rag-ia.md) · Estrategia y estado de la rama: [Reposicionamiento RAG](13-Reposicionamiento-RAG.md)

**Qué es.** Un asistente que responde **solo con lo que está en los documentos de la empresa** (manuales, contratos, políticas, protocolos), **cita la fuente** de cada respuesta y dice "no encontré esa información" cuando la respuesta no está. Se usa en la web y, desde el plan Profesional, en WhatsApp.

**Dónde se vende** (rama `rag-reposicionamiento`: implementado en rama, pendiente de merge):

| Pieza | Ruta | Papel |
|---|---|---|
| Página pilar | `/rag` | Qué es RAG, casos por sector, cómo funciona, seguridad, cómo se evitan respuestas inventadas, integraciones, planes, preguntas frecuentes |
| Landings por sector | `/rag/salud`, `/rag/legal`, `/rag/soporte` | Destino de la pauta por sector. `/rag/salud` enlaza la demo de auditoría de cuentas médicas |
| Canal | `/chatbots-ia` | "Chatbots RAG para WhatsApp y web" |
| Demo | `/demo/chatbot` | Demo pública con documento de ejemplo y "Prueba con tu documento" (pide solo email y autorización de la Ley 1581) |
| Precios | `/services#planes-rag` | La misma tabla de planes que `/rag`, arriba de todo |
| Landing de producto | `/productos/chatbot-rag-ia` | No existe como landing propia: redirige 301 a `/rag` para no competir con ella |

**Planes** (resumen; el detalle y las reglas de cobro están en [Servicios y precios](Seccion-Servicios-y-Precios.md) y en [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md#13-precios-y-política-comercial-común)):

| Plan | Precio en COP (+ IVA si aplica) | USD (fijos) | Implementación | Qué incluye |
|---|---|---|---|---|
| **Piloto RAG** | 3.900.000, pago único | 1.200 | 2 semanas | Una fuente, hasta 100 documentos, interfaz web con citas e informe de precisión con 50 preguntas de prueba. Se descuenta el 100 % si contratas un plan en los 30 días siguientes |
| **Esencial** | Setup 9.900.000 + 1.490.000 al mes | 2.990 + 450 al mes | 3–4 semanas | Una fuente (Drive, SharePoint o carga manual), hasta 1.000 documentos, widget web y respuestas con cita. La mensualidad incluye hosting, IA hasta 3.000 preguntas al mes, actualización de documentos y soporte de lunes a viernes |
| **Profesional** | Setup 24.900.000 + 2.990.000 al mes | 7.490 + 890 al mes | 6–8 semanas | Hasta 3 fuentes y 10.000 documentos, web y WhatsApp, permisos por rol y panel de métricas. Incluye hasta 15.000 preguntas al mes, soporte prioritario y revisión mensual de calidad |
| **Empresarial** | Desde 59.900.000; mensualidad según el SLA | Desde 17.900 | 10–14 semanas | Fuentes ilimitadas, despliegue en la nube del cliente u on-premise, SSO, auditoría y código fuente incluido |

Cada pregunta adicional sobre el tope del plan cuesta COP 250 (USD 0,08). Los mensajes de WhatsApp se cobran aparte, a la tarifa de Meta.

Estos planes **reemplazan** la tarjeta "Chatbot RAG con IA" del catálogo y sus 4 niveles anteriores (compra desde COP 46.000.000 o suscripción desde COP 1.590.000 al mes), además del "desde $499 USD" de `/chatbots-ia`.

**Qué promete cada plan frente a lo que existe hoy en el código.** Es la brecha que hay que cerrar antes de vender cada plan:

| Promesa | Plan | Hoy | Queda lista en | Tareas de [Sistemas RAG](Producto-chatbot-rag-ia.md) |
|---|---|---|---|---|
| Chat web con citas sobre los documentos | Todos | Sí existe: búsqueda por palabras clave más un modelo de OpenAI, con el fragmento citado. El estado vive en memoria y en disco temporal | Paq. 2 del [Roadmap](12-Roadmap.md) (persistencia) | 1 (= [Backend y API](09-Backend-y-API.md) 10) |
| Espacio aislado por cliente para el Piloto, con set de 50 preguntas e informe de precisión | Piloto | No existe; hoy el Piloto se arma a mano sobre el builder de la demo | Paq. 3 (kit del Piloto) | 10 y [Comercial](11-Comercial-Marketing-y-Legal.md) 5 |
| Leer PDF y Word en la ingesta | Todos | La ruta de los bots no extrae el texto de PDF ni DOCX. La etapa 6 de la rama lo agrega solo para "Prueba con tu documento" | Paq. 6 (kit Esencial) | 11 (= Backend y API 16) |
| Citar la página exacta | Todos | Cita el fragmento; la página llega con el núcleo RAG compartido | Paq. 6 | 11 |
| Widget web para el sitio del cliente | Esencial en adelante | No existe. El generador de código de la demo muestra recursos que no están publicados | Paq. 6 | 12 |
| Fuente Drive o SharePoint | Esencial (una) y Profesional (hasta 3) | No hay conectores en el código; solo carga manual | Paq. 9 (kit Profesional) | 13 |
| Hosting por KopTup con datos separados por cliente | Esencial en adelante | Falta autorización por cuenta y persistencia | Paq. 2 (autorización y persistencia) y Paq. 15 (núcleo multi-tenant) | 1, 2 y 21 |
| Conteo de preguntas contra el tope del plan y cobro de la pregunta adicional | Esencial en adelante | No existe | Paq. 2 registra el uso de IA; la medición y el cobro automáticos llegan en el Paq. 15 | 22 (y Backend y API 5) |
| WhatsApp como canal del asistente | Profesional | No existe (hoy WhatsApp solo se usa para avisos internos) | Paq. 9 | 14 |
| Permisos por rol y panel de métricas | Profesional | No existen para el asistente | Paq. 9 | 19 |
| SSO, auditoría, despliegue en la nube del cliente y código fuente | Empresarial | No existen | Backlog (P2); por proyecto, con su propia propuesta | 23 |

**Recomendación comercial:** vender ya el **Piloto**; el **Esencial con carga manual** desde el Paq. 6; el **Profesional** desde el Paq. 9, o antes si el primer cliente financia su construcción dentro del proyecto. El **Empresarial** siempre es un proyecto a medida.

**Estado de la rama `rag-reposicionamiento`:** implementado en rama, pendiente de merge. Las 7 etapas están hechas en 13 commits y pasaron la auditoría final; el detalle está en [Reposicionamiento RAG](13-Reposicionamiento-RAG.md).

| Etapa de la especificación | Contenido | Estado al 8 de octubre de 2026 |
|---|---|---|
| E1. SEO técnico | Dominio con `www`, plantilla de títulos, sin meta keywords, botones a `/services#planes-rag` | Implementado en rama, pendiente de merge |
| E2. Inicio | H1 "IA que responde con los documentos de tu empresa", botones, cifras verificables, chatbot primero | Implementado en rama, pendiente de merge |
| E3. `/rag` y sectores | Página pilar, `/rag/salud`, `/rag/legal`, `/rag/soporte`, "RAG" en menú y footer | Implementado en rama, pendiente de merge |
| E4. Precios | Sección `#planes-rag` y `TRM_REFERENCIA = 3300` para el resto | Implementado en rama, pendiente de merge |
| E5. Coherencia | `/chatbots-ia`, `/soluciones-ia`, botones de demo de QA y VPN, `/demo/cuentas-medicas` como "Sistema experto para salud" y voseo a "tú" en todo el sitio | Implementado en rama, pendiente de merge |
| E6. "Prueba con tu documento" | Subida de PDF, DOCX o TXT con límites, borrado a la hora y tope de gasto (API `/api/demo-rag`) | Implementado en rama, pendiente de merge. Apagado hasta configurar Railway |
| E7. Medición | GA4, Google Ads y LinkedIn Insight con banner de consentimiento y 5 eventos | Implementado en rama, pendiente de merge. Sin IDs reales todavía |
| Fusión en `main` | Revisión, pruebas y despliegue | Pendiente de la aprobación del dueño (paquete 1 del [Roadmap](12-Roadmap.md)) |

---

## Otras soluciones a medida

Ordenadas por prioridad; dentro de cada prioridad, por vendibilidad (de mayor a menor) y luego por esfuerzo (de menor a mayor). El **esfuerzo** es el que indica la página del producto para dejar su landing y su demo vendibles; el producto real de cada cliente se estima en su propuesta.

| # | Solución | Categoría | Demo | Estado real | Modo de acceso recomendado | Vendibilidad hoy (1–5) | Prioridad | Esfuerzo | Fase objetivo |
|---|---|---|---|---|---|:-:|:-:|:-:|---|
| 1 | [CRM con IA](Producto-crm-ia.md) | Ventas | `/demo/crm-ia` | Maqueta, sin backend (6 pestañas y Customer 360) | `publico` (versión personalizada por `solicitud`) | 3 | P1 | XL | Fase 2 (textos y landing en Fase 1) |
| 2 | [Helpdesk con IA (mesa de ayuda)](Producto-helpdesk-ia.md) | Soporte | `/demo/helpdesk-ia` | Maqueta, sin backend; error al enviar una respuesta | `publico` (versión personalizada por `solicitud`) | 3 | P1 | XL | Fase 2 (textos y landing en Fase 1) |
| 3 | [Facturación electrónica](Producto-facturacion-electronica.md) | Finanzas | `/demo/facturacion-electronica` | Maqueta (simulador; nada se envía a la DIAN) | `publico` (versión personalizada por `solicitud`) | 2 | P1 | L | Fase 2; proveedor aliado en Fase 3 |
| 4 | [VPN empresarial](Producto-vpn-empresarial.md) | Seguridad | Sin demo propia (hoy enlaza a `saas-boilerplate`) | Servicio con un cliente real; sin demo interactiva | `solicitud` (demo guiada en laboratorio) | 1 | P1 | M | Fase 1 |
| 5 | [Gestor documental con IA](Producto-gestor-documental.md) | Datos | `/demo/gestor-documentos` | Parcial: backend con IA real; hoy muestra un error de carga en producción | `publico` en modo muestra (documentos propios por `solicitud`) | 1 | P1 | XL | Fase 2 (endurecimiento en Fase 0) |
| 6 | [POS retail](Producto-pos-retail.md) | Comercio | `/demo/pos` | Maqueta, sin backend (venta, cobro, recibo y cocina) | `publico` (versión personalizada por `solicitud`) | 3 | P2 | L | Fase 2 |
| 7 | [Plataforma de cursos virtuales (LMS)](Producto-lms-elearning.md) | Educación | `/demo/lms` | Maqueta, sin backend; tutor IA simulado | `solicitud` (evaluar `publico` para la vista de alumno) | 3 | P2 | XL | Fase 2 |
| 8 | [Gestión de proyectos (con portal de cliente)](Producto-gestion-proyectos.md) | Productividad | `/demo/control-proyectos` | Maqueta pulida; IA simulada y fechas de 2024 (base real en el portal de KopTup) | `publico` (versión personalizada por `solicitud`) | 3 | P2 | XL | Fase 2 (fechas en Fase 1) |
| 9 | [Code review con IA](Producto-code-review-ia.md) | DevTools | `/demo/code-review-ia` | Maqueta; 19 de 21 botones sin acción | `publico` (revisión de un diff propio por `solicitud`) | 2 | P2 | L | Fase 2 |
| 10 | [Dashboard ejecutivo con IA](Producto-bi-dashboard.md) | Plataforma IA (propuesta: Datos) | `/demo/dashboard-ejecutivo` | Maqueta; cifras que no cuadran y sin IA real | `publico` (datos del prospecto por `solicitud`) | 2 | P2 | L | Fase 2 |
| 11 | [Firma electrónica](Producto-firma-electronica.md) | Seguridad | `/demo/firma-electronica` | Maqueta; afirmaciones legales sin respaldo | `publico` (firma de prueba por `solicitud`) | 2 | P2 | L | Fase 2; módulo real con la firma de propuestas (Fase 3) |
| 12 | [Voice AI para call center (agente de voz con IA)](Producto-voice-ai-callcenter.md) | Voz IA | `/demo/voice-ai` | Maqueta sin audio | `solicitud` (audio y video públicos en la landing) | 2 | P2 | XL | Fase 2 |
| 13 | [ERP modular](Producto-erp-modular.md) | Finanzas | `/demo/erp` | Maqueta, sin backend; filtros sin efecto | `solicitud` (21 días) | 2 | P2 | XL | Fase 2 |
| 14 | [Tienda en línea (e-commerce)](Producto-ecommerce.md) | Comercio | `/demo/ecommerce` | Maqueta; carrito funcional, precios en USD | `publico` (versión personalizada por `solicitud`) | 2 | P2 | XL | Fase 2 |
| 15 | [Programa de fidelización](Producto-loyalty-fidelizacion.md) | Engagement | `/demo/loyalty` | Maqueta; el canje no descuenta puntos | `publico` (versión personalizada por `solicitud`) | 2 | P2 | XL | Fase 2 |
| 16 | [Plataforma de telemedicina para IPS](Producto-telemedicina.md) | HealthTech | `/demo/telemedicina` | Maqueta; sellos de cumplimiento sin respaldo | `solicitud` (sesión guiada obligatoria) | 2 | P2 | XL | Fase 2 |
| 17 | [Sistema de reservas y agendamiento](Producto-sistema-reservas.md) | Productividad | `/demo/sistema-reservas` | Maqueta; fechas de 2024 y la reserva no llega al panel | `publico` (versión personalizada por `solicitud`) | 2 | P2 | XL | Fase 2 (correcciones visibles en Fase 1) |
| 18 | [Automatización de procesos con IA](Producto-automatizacion-workflows.md) | Plataforma IA | `/demo/automatizacion` | Maqueta 100 % simulada | `publico` (flujo con tus sistemas por `solicitud`) | 2 | P2 | XL | Fase 2 |
| 19 | [QA automatizado con IA](Producto-qa-automatizado-ia.md) | DevTools | Sin demo propia (hoy enlaza a `/demo/chatbot`) | Sin demo ni backend | `solicitud` (demo guiada en vivo) | 1 | P2 | L | Fase 2 (en Fase 1 se vende con demo guiada) |
| 20 | [Plataforma SaaS multi-tenant](Producto-saas-multi-tenant.md) | Seguridad (propuesta: DevTools) | `/demo/saas-boilerplate` | Maqueta tipo folleto técnico (12 pestañas) | `publico` (sesión de arquitectura por `solicitud`) | 2 | P3 | L | Fase 2; credibilidad plena con el núcleo de la Fase 4 |
| 21 | [Gestión Humana y Nómina (HRMS)](Producto-hrms.md) | Ventas (error; propuesta: Operaciones) | `/demo/hrms` | Maqueta; sin nómina electrónica ni PILA | `solicitud` (14 días) | 2 | P3 | XL | Fase 2 |
| 22 | [WMS y logística de bodegas](Producto-wms-logistica.md) | Operaciones | `/demo/wms-logistica` | Maqueta sin flujo conectado; mapa de ubicaciones roto | `solicitud` (14 días) | 2 | P3 | XL | Fase 2 (landing en Fase 1) |
| 23 | [Moderación de contenido con IA](Producto-moderacion-contenido.md) | Seguridad | `/demo/moderacion-contenido` | Maqueta coherente, con afirmaciones no demostrables | `publico` (evaluación con datos propios por `solicitud`) | 2 | P3 | XL | Fase 2 (limpieza en Fase 1) |
| 24 | [CMS headless](Producto-cms-headless.md) | Engagement | `/demo/gestor-contenido` | Parcial: redactor de textos con IA real; no muestra un CMS | `publico` tras rehacerla (IA real solo por `solicitud`) | 1 | P3 | L | Fase 2 |
| 25 | [App de delivery (canal propio de domicilios)](Producto-app-delivery.md) | Operaciones | `/demo/delivery` | Maqueta ambientada en Ciudad de México y en USD | `solicitud` | 1 | P3 | XL | Fase 2 (corrección rápida en Fase 1) |
| 26 | [Extracción y monitoreo de datos](Producto-scraping-extraccion.md) | Datos | `/demo/scraping` | Maqueta que promueve evadir bloqueos de tiendas reales (limpieza urgente) | `solicitud` hasta la limpieza; luego `publico` | 1 | P3 | XL | Fase 2 (limpieza en Fase 1) |

**Cómo leer la tabla:**
- **Estado real:** *maqueta* = interfaz con datos simulados y sin backend; *parcial* = usa IA o un backend real, pero no muestra lo que promete la oferta; *sin demo propia* = no hay nada que mostrar todavía y se vende con una demo guiada.
- **Modo de acceso:** es la recomendación de la página del producto. Se cambia desde **Admin › Catálogo de demos** sin desplegar ([Sistema de demos](04-Sistema-de-Demos.md), sección 4).
- **Fase objetivo:** fase en la que la demo queda vendible. Casi todas tienen limpieza de textos y afirmaciones en la Fase 1 (son tareas S, baratas, en el Paq. 7 del [Roadmap](12-Roadmap.md)).

---

## Demos fuera del catálogo

Tres demos existen en `/demo/*`, pero no corresponden a ninguna de las 27 ofertas de `services-catalog.ts`.

| Demo | Área | Ruta | Estado real | Modo de acceso | Vendibilidad hoy (1–5) | Prioridad | Esfuerzo | Fase objetivo | Cómo se vende |
|---|---|---|---|---|:-:|:-:|:-:|---|---|
| [Auditoría de cuentas médicas con IA](Demo-cuentas-medicas.md) | Salud | `/demo/cuentas-medicas` | Real: extracción con IA + motor de reglas + catálogos (≈ 62 % del backend) | `privado` (invitación; primera sesión guiada) | 2 | P1 | XL | Fase 2 (demo privada con datos sintéticos); se vende desde la Fase 3 con el Piloto de auditoría | Entra al catálogo como vertical de salud (oferta propuesta `auditoria-cuentas-medicas`), enlazada desde `/rag/salud` con la etiqueta "Sistema experto para salud" |
| [Motor de reglas del auditor (antes "Sistema experto")](Demo-sistema-experto.md) | Salud | `/demo/sistema-experto` | Parcial: consola de reglas y búsqueda de códigos CUPS; en producción muestra ceros | `privado` | 1 | P2 | XL | Fase 2, como pestaña de `/demo/cuentas-medicas` (redirección 301) | No es un producto propio: es el módulo "Motor de reglas" de la auditoría de cuentas médicas |
| [Motor de contenido para LinkedIn](Demo-linkedin-ads.md) | Marketing interno | `/demo/linkedin-ads` | Real: genera textos con IA | `solicitud` (vitrina reducida); herramienta completa en Admin › Marketing | 1 | P2 | L | Control y limpieza en Fases 0 y 1; caso de estudio en la Fase 5 | Herramienta interna de KopTup; no entra al catálogo. Proyectos parecidos se venden como Automatización de procesos |

La auditoría de cuentas médicas es la demo con **más backend real** de KopTup. La rama `rag-reposicionamiento` la presenta como **"Sistema experto para salud"** (la especificación pedía revisar su código y elegir entre "Caso RAG" y "Sistema experto"; su núcleo es extracción con IA más un motor de reglas). Por eso no se vende dentro de los planes RAG: se ofrece junto al asistente en `/rag/salud`, como vertical propio, siempre en modo `privado` y con datos sintéticos.

---

## Matriz prioridad × esfuerzo

En **negrita**, el producto principal. En *cursiva*, las demos fuera del catálogo.

| Prioridad \ Esfuerzo | S (≤ 2 días) | M (3–5 días) | L (1–2 semanas) | XL (> 2 semanas) |
|---|---|---|---|---|
| **P0** | — | — | — | **Sistemas RAG** (producto principal) |
| **P1** | — | VPN empresarial | Facturación electrónica | CRM con IA, Helpdesk, Gestor documental, *Auditoría de cuentas médicas* |
| **P2** | — | — | POS, Code review, Dashboard ejecutivo, Firma electrónica, QA automatizado, *Motor de contenido para LinkedIn* | LMS, Gestión de proyectos, Voice AI, ERP, E-commerce, Fidelización, Telemedicina, Reservas, Automatización de procesos, *Motor de reglas del auditor* |
| **P3** | — | — | SaaS multi-tenant, CMS headless | HRMS, WMS, Moderación de contenido, App de delivery, Extracción de datos |

**Lectura rápida:**
- **Primero:** el RAG (P0) y las dos ganancias rápidas P1 de esfuerzo M y L: **VPN empresarial** (convertirla en servicio con caso de estudio) y **Facturación electrónica** (retirar "certificada DIAN" y reposicionarla).
- **Después:** las P1 de esfuerzo XL con mejor vendibilidad: **CRM** y **Helpdesk**, más el **gestor documental**, que comparte núcleo con el RAG. La auditoría de cuentas médicas es P1 por su backend real, pero depende del endurecimiento de la Fase 0 y de datos sintéticos revisados por un auditor médico.
- **Bajo demanda:** las P2 y P3 de esfuerzo XL solo se pulen cuando aparece un prospecto calificado de ese producto. Mientras tanto, basta con la limpieza de la Fase 1 y una demo guiada.

---

## Errores de mapeo demo ↔ producto detectados

| # | Error | Dónde | Efecto | Corrección | Estado |
|---|---|---|---|---|---|
| 1 | `qa-automatizado-ia` apunta a la demo `chatbot` | `apps/web/src/lib/services-catalog.ts` | "Ver demo" de QA abre un chatbot conversacional | `demoSlug: ''` y venta con demo guiada; maqueta propia en la Fase 2 ([QA automatizado](Producto-qa-automatizado-ia.md)) | Corregido en la rama, sin fusionar |
| 2 | `vpn-empresarial` apunta a la demo `saas-boilerplate` | `services-catalog.ts` | "Ver demo" de VPN muestra tenants y cobros de un SaaS | `demoSlug: ''`, "Ver caso" y "Solicitar diagnóstico" ([VPN empresarial](Producto-vpn-empresarial.md)) | Corregido en la rama (sin botón de demo); falta el caso y el diagnóstico |
| 3 | `hrms` tiene `category: 'sales'` | `services-catalog.ts` | Aparece en el filtro "Ventas" | `category: 'operations'` ([HRMS](Producto-hrms.md), tarea 1) | Pendiente |
| 4 | `saas-multi-tenant` tiene `category: 'security'` | `services-catalog.ts` | Aparece en "Seguridad" | `category: 'devTools'` ([SaaS multi-tenant](Producto-saas-multi-tenant.md), tarea 1) | Pendiente |
| 5 | `bi-dashboard` está en `aiPlatform` | `services-catalog.ts` | Compite con el RAG en "Plataforma IA" | Pasar a `data` ([Dashboard ejecutivo](Producto-bi-dashboard.md)) | Pendiente |
| 6 | `cms-headless` apunta a `/demo/gestor-contenido`, que es un redactor de correos y propuestas con IA, no un CMS | Demo y oferta | El prospecto no ve modelos de contenido, API ni publicación | Rehacer la demo como CMS o reempaquetar como "Sitio web + CMS" ([CMS headless](Producto-cms-headless.md)) | Pendiente (decisión D-C4) |
| 7 | La metadata y el breadcrumb de `/demo/chatbot` dicen "Chatbot Médico con IA" | `apps/web/src/lib/seo-config.ts` y `demo/chatbot/layout.tsx` | Google y las redes muestran un producto de salud que la demo no es | Título y descripción del asistente RAG ([Sistemas RAG](Producto-chatbot-rag-ia.md), tarea 7) | Revisar en la rama antes de fusionar |
| 8 | SEO del gestor documental: "Gestor Documental Médico" y "Cumple normatividad de archivo clínico"; SEO del CMS: "Emails y Documentos Médicos" | `seo-config.ts` | Promesas de salud y cumplimiento sin respaldo | Metadata neutra y sin afirmaciones ([Gestor documental](Producto-gestor-documental.md), [CMS headless](Producto-cms-headless.md)) | Pendiente |
| 9 | Un producto con varios nombres: Helpdesk (3), Gestión de proyectos (3, incluido "ProyectHub"), CMS (4), Gestor documental (3) | Catálogo, `/demo`, demo, SEO y breadcrumb | El prospecto no reconoce el mismo producto en cada página | Un solo nombre comercial por producto en todas las superficies | Pendiente |
| 10 | 14 ofertas usan un `demoSlug` distinto de su `slug` (por ejemplo, `bi-dashboard` → `dashboard-ejecutivo`, `gestion-proyectos` → `control-proyectos`) | `services-catalog.ts` y `app/demo/*` | No es un error, pero hoy la relación solo vive en el código | `DemoCatalogItem` con `offeringSlug` y `demoSlug` como fuente única ([Sistema de demos](04-Sistema-de-Demos.md)) | Fase 1 |
| 11 | Demos reales fuera del catálogo: cuentas médicas usa un código de acceso común en lugar de invitaciones personales; el sistema experto está en el sitemap sin enlace desde `/demo`; LinkedIn Ads se lista como demo pero es una herramienta interna | `/demo`, `sitemap.ts`, `seo-config.ts` | Acceso sin control real, páginas huérfanas indexadas y un producto que no se vende | Modo `privado` con invitación verificada en el servidor; `noindex`; LinkedIn a **Admin › Marketing** | Pendiente (Fase 1) |
| 12 | Tarjetas de `/demo` y textos del hub que prometen más que el plan: Code review ("SAST + DAST + SCA + SBOM"), Dashboard ("Proyecciones"), Reservas (SMS, pagos y "Prueba gratis"), POS (CRDT, BNPL), ERP (Open Banking, ML), Telemedicina ("HIPAA"), Moderación ("Custom models"), HRMS (nómina multipaís) | `messages/demos/_catalog.*.json`, `_demos.*.json` y `seo-config.ts` | Expectativas que la demo y el plan no cumplen | Generar las tarjetas desde la misma fuente que la landing y pasar la lista negra de afirmaciones en el CI | Pendiente (Paq. 7) |
| 13 | Funciones que se solapan entre productos: QA automatizado frente a la pestaña Tests de Code review; la pestaña RRHH del ERP frente a HRMS; el gestor documental frente al RAG | Demos | Dos productos prometen lo mismo | Una sola oferta por función y enlaces cruzados (la pestaña RRHH del ERP lleva a HRMS; el gestor documental comparte núcleo con el RAG) | Pendiente |
| 14 | El modo de acceso de HRMS y de LMS es `solicitud` en su página de producto y `publico` en la semilla de [Sistema de demos](04-Sistema-de-Demos.md) y en la tabla de olas de [Landing de producto](Seccion-Landing-de-Producto.md) | Wiki | Dos fuentes con valores distintos | Este catálogo adopta el de la página del producto (`solicitud`); hay que ajustar la semilla al cargarla | Por decidir al cargar la semilla |
| 15 | El caso real de VPN está en `/about` asociado a estándares de salud que el proyecto no incluía | `apps/web/src/app/about/page.tsx` | Afirmación sin respaldo sobre un cliente real | Caso con autorización escrita y sin estándares ajenos ([Nosotros](Seccion-Nosotros.md)) | Pendiente |

---

## Política comercial común

Las páginas de producto remiten aquí. Las reglas completas están en [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md#13-precios-y-política-comercial-común) (sección 13) y en [Servicios y precios](Seccion-Servicios-y-Precios.md) (sección 7).

| Tema | Regla |
|---|---|
| Modalidad | Planes RAG: suscripción hospedada por KopTup. Otras soluciones: **compra a medida**, con la insignia "Suscripción: lista de espera" hasta la Fase 4 (DECISIÓN 7) |
| Moneda | Precios en COP "+ IVA si aplica". USD fijos en los planes RAG y USD de referencia con `TRM_REFERENCIA = 3300` en el resto. Sin TRM en vivo en la página de precios |
| Fuente única | `lib/rag-plans.ts` y `lib/services-catalog.ts` (en la Fase 3, también `packages/catalog` para el backend). Ningún precio copiado en textos, JSON-LD ni FAQ |
| Precio de entrada | Las otras soluciones muestran "Desde" con el alcance del plan Básico y su ficha de límites |
| Mantenimiento de la compra | **Decisión pendiente (D2).** Recomendación: 18 % anual del setup, en cuotas mensuales, con las horas de ajustes del plan. Mientras tanto, las landings dicen "+ mantenimiento según plan (se detalla en tu propuesta)". En la mayoría de las ofertas revisadas, el mantenimiento de un año cuesta más que el setup y unas 2,7 veces la cuota SaaS |
| Costos de terceros | Nube, IA y mensajería en USD, con un rango igual al del catálogo (`costoNote` coherente en cada oferta) |
| Semanas de implementación | Realistas por producto (por ejemplo, ERP y WMS con más semanas que el valor general) mediante un ajuste por oferta |
| Ofertas de entrada | Piloto RAG; diagnósticos pagos (VPN, bodega, datos); piloto en 1 sede (POS); Piloto de auditoría (salud); Piloto de telemedicina |
| Pasarelas | Wompi para COP y PayU como respaldo; transferencia internacional para USD; Stripe solo si KopTup constituye una entidad en un país soportado |
| Textos | Español con "tú", sin jerga; sin viñetas duplicadas ("Reportes mensuales del tier"); sin "Más popular" mientras no haya ventas que lo respalden; sin cifras, clientes ni certificaciones que no se puedan demostrar (lista negra en el CI) |
| Nombres | Un solo nombre comercial por producto en catálogo, landing, demo, SEO y breadcrumb |

### Registro de decisiones del catálogo

Varias páginas de producto dejan aquí su decisión. Las toma el dueño; esta tabla registra la recomendación y el estado.

| # | Decisión | Recomendación | Página de origen | Estado |
|---|---|---|---|---|
| D-C1 | Modelo de mantenimiento de la compra (D2 de Comercial) | 18 % anual del setup con horas de ajustes incluidas | [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md) | Pendiente |
| D-C2 | Suscripción de las otras soluciones | "Suscripción: lista de espera" hasta la Fase 4 | DECISIÓN 7 | Firme |
| D-C3 | Gestor documental: ¿complemento del RAG o plan propio? | Complemento "Archivo documental" del RAG, con "Piloto documental" como entrada; comparte núcleo con el asistente | [Gestor documental](Producto-gestor-documental.md) | Pendiente |
| D-C4 | CMS headless: ¿se reempaqueta? | "Sitio web + CMS headless" sobre Payload o Strapi, con límites de sitios, idiomas y editores | [CMS headless](Producto-cms-headless.md) | Pendiente |
| D-C5 | VPN empresarial como servicio | Implementación más servicio administrado en paquetes (Esencial, Sedes y Corporativo), precios recalibrados con el caso real como referencia; nombre "Acceso remoto seguro (VPN empresarial)" | [VPN empresarial](Producto-vpn-empresarial.md) | Pendiente |
| D-C6 | Auditoría de cuentas médicas al catálogo | Oferta nueva `auditoria-cuentas-medicas` (vertical de salud), modo `privado`, Piloto de auditoría y planes por volumen de facturas | [Demo cuentas médicas](Demo-cuentas-medicas.md) | Pendiente (con un auditor médico) |
| D-C7 | Sistema experto | Módulo "Motor de reglas" de la auditoría de cuentas médicas; `/demo/sistema-experto` redirige 301 | [Demo sistema experto](Demo-sistema-experto.md) | Recomendada |
| D-C8 | Generador de LinkedIn | Herramienta interna en **Admin › Marketing**; vitrina reducida por `solicitud`; no entra al catálogo | [Demo LinkedIn Ads](Demo-linkedin-ads.md) | Recomendada |
| D-C9 | Renombres | Automatización de procesos con IA; Extracción y monitoreo de datos; Mesa de ayuda con IA (Helpdesk); Gestión Humana y Nómina; POS para retail y restaurantes; Plataforma de cursos virtuales (LMS); Gestión de proyectos con portal de cliente; Acceso remoto seguro (VPN empresarial) | Páginas de cada producto | Pendiente |
| D-C10 | Categorías | HRMS → `operations`; SaaS multi-tenant → `devTools`; Dashboard ejecutivo → `data` | Páginas de cada producto | Recomendada |
| D-C11 | Facturación electrónica | Posicionarla como "integrada a tu sistema", a través de un proveedor tecnológico aliado (se elige en la Fase 3); reemplazar el plan Básico por "Integración estándar" | [Facturación electrónica](Producto-facturacion-electronica.md) | Pendiente |
| D-C12 | POS | Planes por número de sedes, piloto en 1 sede y hardware aparte de la mensualidad | [POS retail](Producto-pos-retail.md) | Pendiente |

---

## Demos prioritarias

Son las 5 demos que se instrumentan primero (recorrido guiado con eventos `key_action`, ver [Portal del cliente](06-Portal-del-Cliente.md) y la tarea 33 de [Sistema de demos](04-Sistema-de-Demos.md)) y las que reciben capturas y video en la Fase 2:

| # | Demo | Por qué |
|---|---|---|
| 1 | `/demo/chatbot` (asistente RAG) | Producto principal y primera prueba de la pauta |
| 2 | `/demo/cuentas-medicas` | Vertical de salud con backend real, enlazada desde `/rag/salud` (modo `privado`) |
| 3 | `/demo/crm-ia` | P1 con la vendibilidad más alta de las otras soluciones |
| 4 | `/demo/helpdesk-ia` | P1, complemento natural del RAG para soporte |
| 5 | `/demo/facturacion-electronica` | P1 con esfuerzo L y demanda local |

El **gestor documental** entra como sexta demo cuando vuelva a funcionar en producción (Fase 0) y tenga su corpus de ejemplo (Fase 2).

**Olas de publicación de las landings** ([Landing de producto](Seccion-Landing-de-Producto.md), sección 9): las 26 landings existen desde el primer despliegue en estado `borrador` (sin indexar). La **ola 1** (Fase 1) publica los 3 productos P1 con demo pública y las 5 demos por `solicitud`; la **ola 2** (Fase 2) publica las 18 restantes.

---

## Criterios usados

**Vendibilidad hoy (1–5).** Qué tan listo está el producto para venderse **hoy**, mirando la demo en producción, la oferta y el precio:

| Nota | Significa |
|---|---|
| 1 | No se puede mostrar sin dañar la confianza: está rota, enlazada a otra demo o con afirmaciones riesgosas |
| 2 | Se puede mostrar solo con guía y advertencias: datos de otro país, cifras que no cuadran o botones sin acción |
| 3 | Se entiende sola y sirve para una primera conversación; le faltan localización, precio claro y landing |
| 4 | Lista para vender con demo guiada: datos locales, flujo completo, precio claro y landing |
| 5 | Se vende sola: prueba real en autoservicio, caso de estudio y producto real detrás |

**Prioridad** (DECISIÓN 9): P0 bloqueante · P1 alta · P2 media · P3 baja. Se asignó por:
1. peso en el reposicionamiento RAG (el RAG es P0 y lo que comparte núcleo con él sube);
2. riesgo de lo que hoy se publica (afirmaciones legales o de cumplimiento sin respaldo, enlaces a demos ajenas);
3. vendibilidad y demanda en Colombia;
4. costo de dejarlo vendible.

**Esfuerzo** (DECISIÓN 9, para 1 dev senior): S ≤ 2 días · M 3–5 días · L 1–2 semanas · XL más de 2 semanas. Es el esfuerzo total que indica la página de cada producto para dejar la landing y la demo vendibles. No incluye el producto real de cada cliente.

**Modo de acceso** (DECISIÓN 1):
- `publico` cuando la demo es honesta, no tiene costo de IA por uso y no muestra datos sensibles;
- `solicitud` cuando la demo necesita guía, tiene costo por uso o capta prospectos de alto valor;
- `privado` cuando trabaja con datos sensibles (salud) o es interna.

**Orden de las tablas:** prioridad; dentro de cada prioridad, vendibilidad de mayor a menor y luego esfuerzo de menor a mayor.

**Fuentes:** las páginas `Producto-*.md` y `Demo-*.md` de esta wiki (estado, problemas y tareas con rutas de archivo), `apps/web/src/lib/services-catalog.ts` y las capturas de producción tomadas en octubre de 2026. El estado de la rama `rag-reposicionamiento` se leyó de su historial de commits el 8 de octubre de 2026.

---

## Páginas relacionadas

- [Reposicionamiento RAG](13-Reposicionamiento-RAG.md) · [Sistemas RAG](Producto-chatbot-rag-ia.md) · [Plan por sección](07-Plan-por-Seccion.md) · [Roadmap](12-Roadmap.md)
- [Servicios y precios](Seccion-Servicios-y-Precios.md) · [Landing de producto](Seccion-Landing-de-Producto.md) · [Catálogo de demos](Seccion-Catalogo-de-Demos.md)
- [Sistema de demos](04-Sistema-de-Demos.md) · [Flujo del cliente](03-Flujo-del-Cliente.md) · [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md)
