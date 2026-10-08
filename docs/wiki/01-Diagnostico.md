# Diagnóstico del estado actual

> Cómo está KopTup hoy como negocio, como producto y como software, antes de ejecutar el plan. Es el punto de partida de la [Visión de producto](02-Vision-de-Producto.md) y del [Roadmap](12-Roadmap.md).
>
> **Base de la evidencia:** sitio en producción (`www.koptup.com`, rama `main`) y código del monorepo al **8 de octubre de 2026**, más lo que ya cambia la rama `rag-reposicionamiento` (hecho en la rama, pendiente de merge). Las capturas son de producción, en escritorio (1440 × 900) y móvil (390 × 844). Las mediciones de calidad (pruebas, lint, tipos, auditoría de dependencias y build local) están detalladas en [Seguridad y calidad](10-Seguridad-y-Calidad.md).
>
> **Sobre seguridad:** esta wiki es pública. Los hallazgos de seguridad se describen en términos genéricos, como tareas; el detalle se gestiona fuera de la wiki.

---

## En una mirada

- **El mensaje no dice qué vende KopTup.** Producción se presenta como agencia genérica ("Transformamos tus ideas en soluciones tecnológicas") y el producto con IA real, el **sistema RAG**, es una tarjeta más entre 27.
- **La prueba social no se puede defender.** Cifras sin respaldo ("100+ proyectos", "50+ clientes", "24/7", "5★"), reseñas en los datos estructurados sin reseñas reales y un año de fundación contradictorio.
- **No hay embudo.** No se puede **solicitar una demo** ni **dar acceso** desde el panel, "Agendar llamada" abre el correo, el formulario de contacto pierde el producto y no hay analítica.
- **El catálogo promete más de lo que se puede vender:** 27 productos con modalidad de suscripción mensual sin cobro recurrente detrás, precios contradictorios y la mayoría de las demos con datos simulados; varias rotas en producción.
- **La base técnica es amplia pero frágil:** hay autenticación, portal del cliente y panel de administración, pero el CI no corre, ninguna prueba se ejecuta, las dependencias están desactualizadas y parte del estado vive en disco que se borra en cada despliegue.
- **La seguridad necesita una fase propia** (Fase 0): autorización en servidor en toda la API, topes de costo de IA, credenciales rotadas y dependencias al día.
- **Ya hay trabajo en marcha:** la rama `rag-reposicionamiento` corrige el mensaje, el SEO técnico y los precios del producto principal ([Reposicionamiento RAG](13-Reposicionamiento-RAG.md)).

---

## Qué es KopTup hoy (en producción)

| Pieza | Estado actual |
|---|---|
| Sitio y aplicaciones | Monorepo con `apps/web` (Next.js 14, App Router, en Vercel: sitio comercial, `/demo`, portal `/dashboard` y panel `/admin`) y `apps/backend` (Express, TypeScript y MongoDB, en Railway) |
| Oferta publicada | Catálogo de **27 productos**, cada uno con 4 planes (básico, profesional, avanzado y enterprise) y 2 modalidades: compra (setup + mantenimiento) y suscripción mensual "hospedada por KopTup" |
| Demos | **28 rutas** de demo; el catálogo `/demo` lista **26 tarjetas**. La mayoría son maquetas con datos simulados. El chatbot RAG usa IA real; el generador de LinkedIn Ads (herramienta interna) también. Auditoría de cuentas médicas y sistema experto tienen backend real y no están en el catálogo |
| Cuentas y portal | Registro e inicio de sesión (correo y Google), portal del cliente (proyectos, pedidos, facturas, entregables, mensajes, notificaciones, perfil y configuración) y panel de administración (usuarios, contactos, conversaciones, entregables, facturas, pedidos y configuración) |
| Contacto | Formulario que guarda el mensaje y avisa al equipo por email y WhatsApp |
| Cliente real publicado | Un caso en `/about` ([VPN empresarial](Producto-vpn-empresarial.md)); publicar el nombre del cliente requiere su autorización escrita |
| Trabajo en curso | Rama `rag-reposicionamiento`: home, `/rag`, landings por sector, planes RAG, SEO técnico y coherencia de textos ([Reposicionamiento RAG](13-Reposicionamiento-RAG.md)) |

---

## Diagnóstico de negocio

| # | Hallazgo | Impacto | Se resuelve en |
|---|---|---|---|
| N1 | **Mensaje genérico.** El H1 de la home no dice qué se vende ni a quién; el RAG aparece como "chatbots con IA" en el subtítulo | Un anuncio no tiene una página de destino clara; el visitante no sabe qué comprar | [Reposicionamiento RAG](13-Reposicionamiento-RAG.md) (rama), [Home](Seccion-Home.md) |
| N2 | **Cifras sin respaldo** en la home (100+ proyectos, 50+ clientes, 24/7, 5★) y porcentajes de mejora sin fuente en landings | Riesgo de publicidad engañosa y pérdida de credibilidad ante un comprador B2B | Rama RAG (home y landings), [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md) |
| N3 | **Datos estructurados inventados:** calificaciones sin reseñas y año de fundación 2019 frente a 2026 en `/about` | Riesgo de acciones manuales de Google y contradicción visible | Rama RAG (quita las calificaciones), [Nosotros](Seccion-Nosotros.md) |
| N4 | **Sin casos de estudio ni testimonios** con autorización | No hay prueba social para vender | [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md), sección 9 |
| N5 | **Sin analítica ni UTM** | No se sabe qué canal trae clientes; no se puede pautar con criterio | Rama RAG, etapa E7 (GA4, Google Ads y LinkedIn con consentimiento) |
| N6 | **"Agendar llamada" abre un `mailto:`** | El CTA de mayor intención no tiene agenda detrás | [Contacto](Seccion-Contacto.md) |
| N7 | **El formulario de contacto pierde el servicio y el plan** que el visitante eligió | El comercial no sabe qué pidió el prospecto | [Contacto](Seccion-Contacto.md), [Sistema de demos](04-Sistema-de-Demos.md) |
| N8 | **CTA a `/pricing`, que solo redirige** a `/services` | Clics que no llevan a ningún precio concreto | Rama RAG (van a `/services#planes-rag`) |
| N9 | **Precios contradictorios del producto principal:** uno en `/services`, otro en el registro y el portal, otro en el panel y "desde $499 USD" en `/chatbots-ia` | Desconfianza y prospectos fuera de presupuesto | Rama RAG (`rag-plans.ts` como fuente única), [Servicios y precios](Seccion-Servicios-y-Precios.md) |
| N10 | **Suscripción mensual sin cobro recurrente ni pasarela;** el selector de `/services` arranca en "SaaS" | Se ofrece algo que no se puede cobrar ni operar | DECISIÓN 7: suscripción solo para el RAG; el resto en lista de espera ([Visión de producto](02-Vision-de-Producto.md)) |
| N11 | **Mantenimiento de la compra más caro que la compra** en el primer año, y más caro que la suscripción | Objeción segura en cualquier negociación | [Servicios y precios](Seccion-Servicios-y-Precios.md), decisión D2 |
| N12 | **Afirmaciones de cumplimiento sin certificación** ("alineado con HIPAA/SOC 2/ISO 27001") | Riesgo legal y de reputación | [Servicios y precios](Seccion-Servicios-y-Precios.md), [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md) |
| N13 | **Política de privacidad sin Ley 1581 de 2012,** formularios sin autorización y sin banner de cookies | Incumplimiento legal; bloquea la pauta y la captura de leads | [Legal](Seccion-Legal.md) |
| N14 | **Inglés solo por cookie,** sin rutas propias | El contenido en inglés no se indexa | Fase 5 — Escala ([Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md), sección 12) |
| N15 | **Voseo** ("Elegí", "querés", "comprá") mezclado con "tú" y "usted" | Para un comprador colombiano suena a proveedor extranjero | Rama RAG, etapa E5 (hecha en la rama, sin fusionar) |
| N16 | **Sin pipeline comercial:** los contactos llegan a un buzón sin etapa, responsable ni seguimiento, y las propuestas no tienen modelo | Leads que se pierden entre canales | [Sistema de demos](04-Sistema-de-Demos.md) (`Lead`), [Panel de administración](05-Panel-de-Administracion.md) |

---

## Diagnóstico de producto

| # | Hallazgo | Impacto | Se resuelve en |
|---|---|---|---|
| P1 | **El producto principal no destaca.** El chatbot RAG es una tarjeta más en `/services` y en `/demo`, con el mismo tamaño que demos secundarias | Lo más convincente del sitio queda escondido | Rama RAG, [Catálogo de demos](Seccion-Catalogo-de-Demos.md) |
| P2 | **No existe el flujo que pide el dueño:** el visitante no puede solicitar una demo y el panel no puede dar ni revocar accesos | No hay forma de acompañar ni medir a un prospecto | [Sistema de demos](04-Sistema-de-Demos.md), Fase 1 |
| P3 | **Acceso a la demo de salud con un código fijo,** igual para todos | No es personal, no se puede revocar ni medir, y no avisa al comercial | [Sistema de demos](04-Sistema-de-Demos.md), sección 10.5 (modo `privado`) |
| P4 | **Sin landing por producto.** El detalle vive en un modal sin URL propia | No se puede compartir, no se indexa y no es accesible | [Landing de producto](Seccion-Landing-de-Producto.md) |
| P5 | **Mapeos de demo equivocados:** "QA automatizado con IA" abre la demo del chatbot y "VPN empresarial" (el único producto con un cliente real) abre la del SaaS multi-tenant | El prospecto ve un producto que no es el que pidió | Rama RAG (quita esos botones), [QA automatizado](Producto-qa-automatizado-ia.md), [VPN empresarial](Producto-vpn-empresarial.md) |
| P6 | **Catálogo difícil de recorrer:** 14 categorías para 27 productos, clasificaciones raras (HRMS en Ventas) y un buscador que no encuentra palabras en español | El visitante no encuentra lo que busca | [Servicios y precios](Seccion-Servicios-y-Precios.md) (6 áreas de negocio) |
| P7 | **Demos rotas en producción:** el gestor documental, la auditoría de cuentas médicas y el sistema experto se ven vacíos o con error; al menos 10 demos tienen errores de hidratación en la consola | La primera impresión de la demo decide la venta | [Backend y API](09-Backend-y-API.md), [Seguridad y calidad](10-Seguridad-y-Calidad.md) |
| P8 | **Contenido de demos desactualizado o riesgoso:** fechas de 2024, viñetas en inglés o spanglish, una foto con logo de una marca de terceros, un nombre de marca mal escrito, promesas de evasión anti-bot | Riesgo de marca y legal | Página de cada producto, Fase 2 — Demos vendibles |
| P9 | **La demo del RAG no le habla al comprador colombiano:** empresas de ejemplo en inglés, métricas simuladas presentadas como reales y un widget embebible que no existe fuera de la demo | El producto principal pierde credibilidad justo en la demo | [Sistemas RAG](Producto-chatbot-rag-ia.md), Fase 2 |
| P10 | **El portal y el panel muestran datos simulados** (indicadores escritos en el código, planes y precios que no existen) | El cliente o el comercial ven información falsa | [Portal del cliente](06-Portal-del-Cliente.md), [Panel de administración](05-Panel-de-Administracion.md) |
| P11 | **Promesas de la demo que dejan de ser ciertas:** "100 % interactivo, sin registro" y "27 prototipos" (hay 26 tarjetas y 28 rutas) | Contradicción visible apenas existan demos con solicitud | [Catálogo de demos](Seccion-Catalogo-de-Demos.md); la rama calcula el número real (26) |

---

## Diagnóstico de ingeniería

| # | Hallazgo | Impacto | Se resuelve en |
|---|---|---|---|
| I1 | **El CI es inválido y no corre ningún job.** El único workflow que funciona publica esta wiki | Cada cambio llega a producción sin verificación | [Seguridad y calidad](10-Seguridad-y-Calidad.md), Fase 0 |
| I2 | **33 archivos de prueba que no se ejecutan** (falta la configuración para TypeScript); no hay pruebas de extremo a extremo | Las demos se rompen sin que nadie se entere | [Seguridad y calidad](10-Seguridad-y-Calidad.md) |
| I3 | **Dependencias desactualizadas:** Next 14.0.3, Node 18 sin soporte y más de 100 avisos de auditoría de dependencias (4 críticos y 65 altos) | Riesgo de seguridad y bloqueo de mejoras | [Seguridad y calidad](10-Seguridad-y-Calidad.md) |
| I4 | **Estado en disco efímero:** archivos subidos, estado del chatbot y logs se pierden en cada despliegue | Pérdida de datos del producto principal | [Backend y API](09-Backend-y-API.md) (MongoDB y almacenamiento de objetos) |
| I5 | **La sesión depende de Redis** (una sola sesión por usuario) | Si Redis falla, nadie entra | [Autenticación](Seccion-Autenticacion.md), [Backend y API](09-Backend-y-API.md) |
| I6 | **Código muerto:** 18 módulos del backend en memoria que no se montan, restos de SQL de otra base de datos, integraciones sin uso y copias `.bak` (≈ 5.300 líneas) | Confunde y aumenta la superficie de errores | [Backend y API](09-Backend-y-API.md), sección 15 |
| I7 | **Backend concentrado en un vertical:** un solo proceso con cerca de 180 endpoints, y cerca de dos tercios del código es del vertical de salud | Mezcla el producto principal con un vertical que se vende aparte | [Backend y API](09-Backend-y-API.md) (módulos y servicio aparte) |
| I8 | **Todo se renderiza en el cliente y en cada visita:** 70 de 72 páginas son client components; ninguna página se sirve desde el CDN | Sitio más lento y landings que no pueden ser estáticas | [Seguridad y calidad](10-Seguridad-y-Calidad.md), rendimiento |
| I9 | **≈ 440 KB de textos de i18n en cada página,** incluida la política de privacidad | HTML pesado en todas las páginas | [Seguridad y calidad](10-Seguridad-y-Calidad.md), [Home](Seccion-Home.md) |
| I10 | **Sin límites de error** (`error.tsx`, `global-error.tsx`, `loading.tsx`) | Un error muestra la pantalla genérica de Next | [Seguridad y calidad](10-Seguridad-y-Calidad.md) |
| I11 | **Sin observabilidad ni continuidad:** sin reporte de errores, monitores, alertas de costo ni copias de la base probadas; solo dos entornos (local y producción) | KopTup se entera de los fallos por los clientes | [Seguridad y calidad](10-Seguridad-y-Calidad.md) |
| I12 | **Configuración e IA sin control:** variables leídas en muchos archivos con valores por defecto, modelos de IA escritos en el código y sin medición de costo | Errores de configuración silenciosos y gasto de IA sin tope | [Backend y API](09-Backend-y-API.md) (configuración validada y pasarela de IA) |

**Lo que sí funciona:** `next lint`, el ESLint del backend y `tsc` pasan sin errores en los dos workspaces. La base compila; el arreglo del CI y de las pruebas es sobre todo de configuración.

---

## Diagnóstico de seguridad (resumen genérico)

| Área | Situación, en términos generales | Tarea | Fase |
|---|---|---|---|
| Autenticación y autorización | No está garantizada de forma uniforme en el servidor; parte de la protección de las pantallas privadas se apoya en el navegador | Auditar y exigir autenticación y autorización en servidor en todas las rutas de la API; verificar el acceso a las demos en el servidor | Fase 0 |
| Sesión | Los datos de sesión se pueden leer desde JavaScript | Sesión en cookies httpOnly | Fase 0 y Fase 1 |
| Costo de IA y abuso | Los endpoints de IA no tienen tope de gasto y el rate-limit no funciona bien con varias instancias | Límites de costo y rate-limit en endpoints de IA, con un almacén compartido | Fase 0 |
| Credenciales | El repositorio es público: toda credencial que haya estado alguna vez en el código o en el historial se trata como expuesta | Rotar credenciales, validar la configuración al arrancar y guardar los secretos solo en las plataformas | Fase 0 |
| Dependencias | Versiones con avisos críticos y altos publicados | Actualizar dependencias y activar actualizaciones automáticas | Fase 0 |
| Rutas internas | Existen rutas de prueba y documentación interactiva en web y backend | Proteger webhooks y retirar o restringir las rutas de prueba en producción | Fase 0 |
| Cabeceras y CSP | Las cabeceras de seguridad principales están bien; la política de contenido es permisiva | Endurecer la CSP | Fase 0 |
| Datos personales | Sin autorización Ley 1581 en los formularios y registros con más datos de los necesarios | Autorización previa, minimización y registro de consentimiento | Fase 0 y Fase 1 |

Plan completo, criterios de salida de la Fase 0 y tareas en [Seguridad y calidad](10-Seguridad-y-Calidad.md) y [Backend y API](09-Backend-y-API.md), sección 16.

---

## Fortalezas y brechas

| Área | Fortaleza (lo que ya sirve) | Brecha (lo que falta) | Se cierra en |
|---|---|---|---|
| Posicionamiento | La decisión del dueño es clara (RAG primero) y la rama ya tiene el mensaje, `/rag` y las landings por sector | Terminar "Prueba con tu documento" y la medición, y fusionar la rama | Fase 1 ([Reposicionamiento RAG](13-Reposicionamiento-RAG.md)) |
| Producto principal | Chatbot RAG con IA real, backend propio y reglas para responder solo con los documentos y citar (en la rama) | Persistencia, lectura de PDF y DOCX con página, widget, conectores y WhatsApp | Fase 0 a Fase 2 ([Sistemas RAG](Producto-chatbot-rag-ia.md)) |
| Catálogo y demos | 26 demos navegables que muestran capacidad en muchos sectores | Landing por producto, demos sin errores, datos en español colombiano, modos de acceso | Fase 1 y Fase 2 ([Catálogo de productos](08-Catalogo-de-Productos.md)) |
| Vertical salud | El mayor activo técnico: auditoría de cuentas médicas con backend real | Hoy falla en producción; necesita datos sintéticos, acceso privado y un Piloto propio | Fase 1 y Fase 2 ([Auditoría de cuentas médicas](Demo-cuentas-medicas.md)) |
| Embudo y demos | Ya existen formulario de contacto con avisos, modelos de proyectos, pedidos y facturas | Solicitud de demo, aprobación, enlace mágico, Mis demos, Leads y métricas | Fase 1 ([Sistema de demos](04-Sistema-de-Demos.md)) |
| Panel de administración | Existe y gestiona usuarios, contactos, pedidos, facturas y entregables | Solicitudes, accesos, leads, catálogo de demos y métricas; sin datos simulados | Fase 1 ([Panel de administración](05-Panel-de-Administracion.md)) |
| Portal del cliente | Proyectos, pedidos, facturas, entregables y mensajes ya existen | "Mis demos", propuestas, estados honestos y precios reales | Fase 1 y Fase 3 ([Portal del cliente](06-Portal-del-Cliente.md)) |
| Precios | Precios publicados en COP: transparencia de base | Fuente única, IVA explícito, USD claros, mantenimiento entendible, suscripción solo donde se puede cobrar | Fase 1 ([Servicios y precios](Seccion-Servicios-y-Precios.md)) |
| Cobro | Facturación del portal y avisos al equipo | Facturación electrónica, pasarela de pagos y cobro recurrente | Fase 3 y Fase 4 ([Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md)) |
| Prueba social | Un cliente real y demos que se pueden probar | Casos con autorización escrita e informe público de precisión | Fase 1 a Fase 5 |
| Medición | La especificación de eventos y consentimiento ya está definida | Implementarla y conectar el embudo de punta a punta | Fase 1 |
| Legal | La página de cookies ya guarda preferencias | Política Ley 1581, autorizaciones, banner, términos del Piloto y contratos | Fase 1 ([Legal](Seccion-Legal.md)) |
| Calidad | Lint y tipos pasan; hay pruebas escritas | CI que corra, pruebas que se ejecuten, pruebas de humo de las demos | Fase 0 |
| Seguridad | Cabeceras de seguridad principales bien configuradas | Autorización en servidor, topes de IA, credenciales rotadas, dependencias al día | Fase 0 |
| Rendimiento | JavaScript moderado en la mayoría de páginas | Páginas estáticas y textos por sección | Fase 0 y Fase 1 |
| Equipo y operación | Equipo en Colombia con horario publicado (Lun–Vie 8:00–17:00) | Agenda real, WhatsApp Business, correo autenticado y rutina comercial | Fase 1 ([Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md)) |

---

## Capturas actuales

Capturas de producción (rama `main`) del 8 de octubre de 2026, antes del reposicionamiento RAG. Lo que cambia la rama se ve en [Reposicionamiento RAG](13-Reposicionamiento-RAG.md), sección "Después".

### Home en escritorio

![Home actual en escritorio: menú con Inicio, Planes y servicios, Demos, Nosotros y Contacto; badge "Innovación tecnológica a la medida"; H1 "Transformamos tus ideas en soluciones tecnológicas"; botones "Ver Planes" y "Hablar con nosotros"; cifras 100+ proyectos completados, 50+ clientes satisfechos, 24/7 soporte y 5 estrellas de calificación promedio](images/actual/home.jpg)

**Qué se observa:**

- **El mensaje es de agencia genérica.** Badge "Innovación tecnológica a la medida", H1 "Transformamos tus ideas en soluciones tecnológicas" y subtítulo "Software a medida, e-commerce, chatbots con IA y más para impulsar tu negocio". El RAG no se nombra.
- **Cuatro cifras sin respaldo** en la primera pantalla: "100+ Proyectos completados", "50+ Clientes satisfechos", "24/7 Soporte" y "5★ Calificación promedio". "24/7" contradice el horario Lun–Vie de `/services`.
- **Los botones no llevan a un siguiente paso concreto:** "Ver Planes" y el botón "Quiero esto" del menú van a `/pricing`, que solo redirige; "Hablar con nosotros" va al formulario general de contacto.
- **No existe "Solicitar demo" ni "RAG" en el menú.** Sí hay un acceso "Probar demos" y un selector de idioma.
- **Lo que está bien:** diseño limpio, jerarquía clara, menú corto y modo oscuro.

### Home en móvil

![Home actual en móvil (390 × 844): menú hamburguesa, badge, H1 en cuatro líneas, subtítulo, botones "Ver Planes" y "Hablar con nosotros" a ancho completo y las cifras 100+ y 50+ en dos columnas; 24/7 y 5 estrellas quedan cortadas al final de la pantalla](images/actual/home-movil.jpg)

**Qué se observa:**

- **La maqueta responde bien:** menú hamburguesa, botones a ancho completo y cifras en dos columnas, sin desborde horizontal.
- **El H1 ocupa cuatro líneas y casi media pantalla** para un mensaje que no dice qué se vende; el visitante de un anuncio necesita desplazarse para entender algo.
- **Las cifras sin respaldo son lo primero que aparece al desplazarse.**
- **No hay un CTA de demo** en la primera pantalla.

### Servicios y precios

![/services actual: H1 "Planes y servicios" con subtítulo en voseo, caja "Cómo escalamos" con horario Lun–Vie y la afirmación HIPAA/SOC 2/ISO 27001, buscador, selector Comprar el software o Suscripción SaaS mensual con SaaS activo, COP o USD con "TRM en vivo", 14 chips de categoría más "Todos" y las tarjetas Chatbot RAG con IA, Tienda en línea y Dashboard ejecutivo con IA](images/actual/servicios.jpg)

**Qué se observa:**

- **Voseo en el subtítulo:** "Elegí cómo querés trabajar con nosotros: comprá el software (te entregamos el código) o suscribite al SaaS mensual (lo hospedamos nosotros)". También en las tarjetas ("Lo podés comprar", "Vendé en línea", "Comprala", "Visualizá").
- **Caja "Cómo escalamos":** publica el horario Lun–Vie 8AM–5PM (que contradice el "24/7" de la home) y dice "Construimos software alineado con HIPAA/SOC 2/ISO 27001", una afirmación sin certificación.
- **El selector arranca en "Suscripción SaaS mensual"** aunque ningún producto tiene hoy cobro recurrente.
- **"TRM en vivo $ 3.273 (datos.gov.co)":** el precio en USD cambia entre cargas.
- **Catorce categorías más "Todos"** para 27 productos.
- **El producto principal es una tarjeta más:** "Chatbot RAG con IA" aparece primero, pero con el mismo tamaño y formato que "Tienda en línea" y "Dashboard ejecutivo con IA", bajo la categoría "Plataforma IA" y con el texto "Bot conversacional entrenado con tu base de conocimiento" (en un RAG no se entrena un modelo: se consultan los documentos).

### Catálogo de demos

![/demo actual: badge "Prototipos Interactivos", H1 "Prueba Nuestras Soluciones", subtítulo "Explora prototipos navegables con datos simulados, dos de ellos (chatbot RAG y LinkedIn Ads) usan OpenAI real", promesa "100% Interactivo - Sin registro" y las primeras tarjetas Chatbot Inteligente (Con IA) y Tienda en Línea (Completo)](images/actual/demo-hub.jpg)

**Qué se observa:**

- **Lo que está bien:** el subtítulo es honesto ("prototipos navegables con datos simulados", "dos de ellos usan OpenAI real") y el chatbot aparece primero.
- **El chatbot no se presenta como RAG:** "Chatbot Inteligente — Crea y personaliza tu asistente virtual con IA", sin mencionar documentos ni citas, y con el mismo peso que "Tienda en Línea".
- **"100% Interactivo - Sin registro"** deja de ser cierto cuando existan demos con solicitud o privadas.
- **Tarjetas muy grandes a dos columnas,** sin capturas, sin filtros ni búsqueda, y sin enlace al precio o a la landing del producto. Una de las primeras tarjetas lleva a una demo que hoy falla en producción ([Catálogo de demos](Seccion-Catalogo-de-Demos.md)).
- **La herramienta interna de LinkedIn Ads** se presenta como una demo más del catálogo.

---

## Qué sale de este diagnóstico

Las prioridades, en el orden en que se atacan:

1. **Endurecer la base (Fase 0, P0):** CI, pruebas, dependencias, autorización en servidor, topes de costo de IA, credenciales rotadas y persistencia del chatbot. Sin esto no se envía tráfico pagado a una demo que recibe documentos.
2. **Fusionar el reposicionamiento RAG (Fase 1):** mensaje, `/rag`, landings por sector, planes, "Prueba con tu documento" y medición con consentimiento.
3. **Construir el embudo de demos (Fase 1):** solicitud, aprobación en el panel, enlace mágico, Mis demos, Leads y métricas, más agenda real y formulario que conserve el producto.
4. **Limpiar la honestidad del sitio (Fase 1):** cero cifras sin respaldo, datos de la empresa en una sola fuente, política Ley 1581 y términos del Piloto.
5. **Hacer vendibles las demos prioritarias (Fase 2):** primero la del RAG por sector; luego las soluciones P1.
6. **Cerrar con propuestas y cobro (Fase 3)** y **convertir el RAG en SaaS real (Fase 4).**

Detalle y calendario en [Roadmap](12-Roadmap.md). Criterios de "vendible" en [Visión de producto](02-Vision-de-Producto.md).

---

## Páginas relacionadas

- [Visión de producto](02-Vision-de-Producto.md) · [Reposicionamiento RAG](13-Reposicionamiento-RAG.md) · [Roadmap](12-Roadmap.md)
- [Plan por sección](07-Plan-por-Seccion.md) · [Catálogo de productos](08-Catalogo-de-Productos.md)
- [Backend y API](09-Backend-y-API.md) · [Seguridad y calidad](10-Seguridad-y-Calidad.md) · [Comercial, marketing y legal](11-Comercial-Marketing-y-Legal.md)
