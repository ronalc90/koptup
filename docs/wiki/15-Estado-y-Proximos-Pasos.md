# Estado del trabajo y próximos pasos

> Corte: 8 de octubre de 2026. El trabajo se pausó a pedido del dueño y continúa el martes. Esta página resume qué quedó integrado en `main`, qué falta y qué tiene que hacer el dueño.

## Qué quedó en `main`

| Bloque | Estado | Dónde verlo |
|---|---|---|
| Reposicionamiento en sistemas RAG (SEO, inicio, `/rag` y landings, planes, demo "Prueba con tu documento", medición) | ✅ En producción | [Reposicionamiento RAG](13-Reposicionamiento-RAG.md) |
| Wiki del plan de producto | ✅ | [Inicio](Home.md) |
| Imágenes de la tienda y de otras 13 demos (CSS) y catálogo de la tienda (fotos correctas, sin marcas, COP) | ✅ En producción | `/demo/ecommerce` |
| Pruebas: Jest en backend y web, Playwright de punta a punta y CI válido | ✅ | `README.md`, `.github/workflows/ci.yml` |
| Dependencias: Next 14.2.35 y paquetes con vulnerabilidades actualizados | ✅ | |
| Seguridad: autorización en el servidor, propiedad de bots del chatbot, topes de gasto de IA, secretos fuera del repo | ✅ | [Seguridad y calidad](10-Seguridad-y-Calidad.md) |
| Revisión de seguridad aplicada en las rutas heredadas (portal del cliente, documentos, chatbot, salud, inicio de sesión y correos) | ✅ | [Roles y permisos](Doc-10-Roles-y-Permisos.md), [API](Doc-08-API.md) |
| Sistema de solicitud y acceso a demos | ✅ | [Sistema de demos](04-Sistema-de-Demos.md) |
| 21 demos revisadas: funcionales, sin botones muertos y con promesas verificables | ✅ | ver lista abajo |

**Verificación del corte:** lint y tipos sin errores; Jest 190/190 en el backend (con Mongo) y 326/326 en la web; build de las dos apps; Playwright 148 pruebas en verde (1 omitida a propósito).

### Cómo se usa hoy el sistema de demos

**El cliente:**
1. En `/demo` cada tarjeta dice "Abierta", "Requiere acceso" o "Solo por invitación".
2. Para las que requieren acceso pulsa **Solicitar acceso** (o entra a `/solicitar-demo`), llena el formulario y autoriza el tratamiento de datos (Ley 1581).
3. Cuando lo aprueban recibe un enlace `/activar/<token>`, crea su contraseña y entra a **Mis demos** (`/dashboard/demos`).

**El administrador** (iniciar sesión con la cuenta admin):
1. **Solicitudes de demo** (`/admin/solicitudes`): aprobar (demos, días de acceso, nota) o rechazar con motivo. El enlace de activación siempre se muestra para copiarlo o enviarlo por WhatsApp, aunque no haya correo configurado.
2. **Accesos a demos** (`/admin/accesos`): extender, revocar o dar acceso directo por email.
3. **Catálogo de demos** (`/admin/catalogo-demos`): elegir para cada demo si es abierta, con solicitud o solo por invitación.

Valores iniciales: con solicitud → voice-ai, erp, delivery, hrms, lms, telemedicina, wms-logistica, linkedin-ads; solo por invitación → cuentas-medicas, sistema-experto; el resto abiertas. Se cambian desde el catálogo.

### Demos revisadas (21)

chatbot, cuentas-medicas, sistema-experto, crm-ia, linkedin-ads, erp, pos, code-review-ia, helpdesk-ia, voice-ai, ecommerce, facturacion-electronica, hrms, loyalty, telemedicina, control-proyectos, delivery, dashboard-ejecutivo, lms, scraping, gestor-contenido.

## Qué falta (martes)

1. **Flujo de compra** (fases P7–P9): pipeline de leads, "Solicitar propuesta", propuestas con página pública para aceptarlas, anticipo (enlace de pago, transferencia o Wompi con claves) y conversión a proyecto y cliente. Hay avance sin revisar guardado en la rama `ccr-55ceecf7-dpc10i` (commit marcado `wip`); no está en `main`.
2. **7 demos por revisar:** saas-boilerplate, sistema-reservas y wms-logistica (con avance guardado en el mismo commit `wip`); firma-electronica, gestor-documentos, automatizacion y moderacion-contenido (sin empezar).
3. **Pendientes reportados por las fases:** permisos de la configuración del sistema experto para prospectos con acceso; achicar la lista de errores de hidratación conocidos. (Las cifras del README, el `docker-compose.yml` roto y el error de `/api/expert/generar-excel` sin procedimientos ya se corrigieron.)
4. **Repaso de honestidad en todo el sitio:** quedan los textos del catálogo de "Otras soluciones a medida" (modalidad SaaS solo donde haya base real). `/about`, `/bienvenido-producthunt`, `/desarrollo-web-colombia`, las landings, el pie, el JSON-LD y `llms.txt` ya solo dicen lo que se puede comprobar; los datos que debe aportar el dueño están en [Páginas públicas › Limitaciones conocidas](Doc-03-Paginas-Publicas.md#16-limitaciones-conocidas).
5. **Diseño y animaciones:** investigación de motion design, sistema de movimiento, animación protagonista que explique RAG, microinteracciones, easter eggs (paleta Ctrl+K, código Konami, mensaje en consola, 404 ingeniosa) y revisión adversarial con video y medición de fluidez.
6. **Correcciones pendientes:** al documentar el sitio y dibujar sus diagramas contra el código y al recorrer las 28 demos aparecieron más de 200 puntos. Sin repetir y sin contar los detalles de cada demo, los que quedan están ordenados de P0 a P3 en [Correcciones pendientes](16-Correcciones-Pendientes.md) (la página lleva el conteo al día). Los más urgentes, además de volver a levantar el backend, son estos:
   - no se pueden crear facturas, entregables ni conversaciones;
   - "Nuevo pedido" apunta a una dirección local.
7. Verificación final completa, actualización de la wiki, PR y merge.

## Acciones del dueño

- **🔴 Backend de producción caído:** la URL configurada (`koptupbackend-production.up.railway.app`) responde "Application not found" de Railway, es decir, no hay ningún servicio en ese dominio. La web funciona, pero todo lo que necesita el backend falla: formulario de contacto, inicio de sesión y panel admin, solicitudes de demo, respuestas reales del chatbot y "Prueba con tu documento". Hay que revisar en Railway si el servicio se borró, se pausó por facturación o cambió de dominio, volver a desplegarlo desde `main` con sus variables y, si cambia el dominio, actualizar `NEXT_PUBLIC_API_URL` en Vercel y redesplegar la web.
- **Urgente:** cambiar en Railway la contraseña de MongoDB de producción y los secretos `JWT_SECRET` y `JWT_REFRESH_SECRET`. Estuvieron en archivos del repositorio público; ya se quitaron, pero siguen en el historial.
- **Variables del backend (Railway):** `JWT_REFRESH_SECRET` (necesaria para iniciar sesión), `ADMIN_EMAIL` (destino de los avisos al equipo y primer admin si no hay ninguno), `FRONTEND_URL=https://www.koptup.com` (enlaces de los correos), `SMTP_USER`/`SMTP_PASS` (sin ellas no sale ningún correo; `SMTP_HOST`, `SMTP_PORT` y `EMAIL_FROM` si no usas Gmail), `REDIS_URL` (límites y topes de gasto), `OPENAI_API_KEY`, `INTERNAL_API_KEY` (igual en Vercel) y, para encender la demo con documento propio, `DEMO_UPLOAD_ENABLED=true`. Al arrancar, el log avisa cuáles faltan. Lista completa en [Operación y despliegue › 4](Doc-11-Operacion-y-Despliegue.md#4-variables-de-entorno).
- **Variables de la web (Vercel), opcionales:** `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` (redesplegar después de crearlas).
- **Wiki de GitHub:** ✅ activada. Cada cambio en `docs/wiki/` se publica solo con el workflow "Publicar wiki".
- **Plataformas (GitHub, Vercel, Railway):** proteger `main` con CI obligatorio y que Railway espere a CI; dejar un solo proyecto de Vercel (`koptup`, el que tiene el dominio); montar un volumen en Railway para los archivos subidos; crear la variable `BACKEND_HEALTH_URL` para que el monitoreo revise también la API; y revisar las alertas de dependencias antes del 31 de diciembre de 2026. Paso a paso en [Operación y despliegue › Acciones pendientes del dueño](Doc-11-Operacion-y-Despliegue.md#10-acciones-pendientes-del-dueño).
- **Privacidad (Ley 1581):** que un abogado revise `/privacy`, `/cookies` y `/terms` (hoy describen lo que hace el sistema, pero nadie los ha revisado legalmente); poner la razón social, el NIT y confirmar la dirección del responsable; confirmar en qué proveedor y país están MongoDB y Redis de producción para completar la sección de transferencias internacionales; validar el plazo de conservación de 24 meses (`DATA_RETENTION_MONTHS`) y cambiar `PRIVACY_POLICY_VERSION` cada vez que cambie la política. Detalle en [SEO, analítica y legal › 4](Doc-12-SEO-Analitica-y-Legal.md#4-legal).
- **Pagos:** decidir la pasarela (Wompi, PayU o Stripe) para el cobro del anticipo en línea.
