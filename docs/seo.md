# SEO de KopTup

Este documento reemplaza los cinco resúmenes SEO que había en la raíz del repositorio
(`SEO-DEMOS-COMPLETO.md`, `SEO-FINAL-RESUMEN.md`, `SEO-IMPLEMENTADO.md`,
`SEO-OPTIMIZATION-GUIDE.md` y `SEO-RESUMEN-EJECUTIVO.md`). Esos archivos repetían el
mismo contenido, citaban rutas que no existen y proyectaban tráfico y leads sin base
medible. Quedan en el historial de git.

La fuente de verdad son los archivos de código citados en cada sección. Si cambia un
título o una descripción, actualiza este documento en el mismo cambio.

## Objetivo

1. **Marca:** KopTup, estudio de software a medida en Bogotá, Colombia.
2. **Producto principal de búsqueda:** sistemas RAG para empresas en Colombia
   (`/rag` y sus variantes por sector).
3. **Servicios de apoyo:** software a medida, chatbots con IA, e-commerce y dashboards
   (`/services`, `/desarrollo-web-colombia`, `/chatbots-ia`).
4. **Demos:** son páginas de apoyo. Se enlazan desde la portada y desde las páginas RAG.
   No tienen campañas ni objetivos de tráfico propios.

## Páginas principales

Los títulos se muestran tal como salen en el navegador. El sufijo `| KopTup` lo agrega la
plantilla de títulos, salvo en la portada y en `/rag`, que usan título absoluto.

| Ruta | Título | Fuente |
|------|--------|--------|
| `/` | Sistemas RAG en Colombia: IA con tus documentos \| KopTup | `HOME_TITLE` en `apps/web/src/lib/site.ts` |
| `/rag` | Sistemas RAG para empresas en Colombia \| KopTup | `apps/web/src/app/[locale]/rag/page.tsx` |
| `/rag/salud` | RAG para salud: protocolos, normativa y auditoría \| KopTup | `rag-salud` en `apps/web/src/lib/seo-config.ts` |
| `/rag/legal` | Buscar en contratos con IA: RAG para áreas legales \| KopTup | `rag-legal` en `apps/web/src/lib/seo-config.ts` |
| `/rag/soporte` | Asistente IA para manuales internos y soporte \| KopTup | `rag-soporte` en `apps/web/src/lib/seo-config.ts` |
| `/services` | Precios de sistemas RAG y software a medida \| KopTup | `services` en `apps/web/src/lib/seo-config.ts` |
| `/about` | Nosotros: estudio de software a medida en Bogotá \| KopTup | `about` en `apps/web/src/lib/seo-config.ts` |
| `/contact` | Contacto: Solicita tu Cotización Gratis \| KopTup | `contact` en `apps/web/src/lib/seo-config.ts` |

Las versiones en inglés (`/en/...`) tienen sus propios títulos y descripciones en
`apps/web/src/lib/seo-config.en.ts`.

Hay 28 entradas de demo (`demo-*`) en `seo-config.ts`. Cada una tiene título y descripción
propios. No se publican palabras clave por demo.

## Implementado en el código

- **Canonical y hreflang** por idioma (`es`, `en`, `x-default`) en cada página pública.
  Código: `apps/web/src/lib/i18n-url.ts`.
- **Open Graph:** `og:url` y `og:locale` (`es_CO` en español, `en_US` en inglés).
- **Datos estructurados (JSON-LD):** Organization (`ORGANIZATION_DESCRIPTION`),
  LocalBusiness, Service y FAQPage en `/rag`, y BreadcrumbList en las páginas con
  migas de pan. Código: `apps/web/src/components/seo/StructuredData.tsx` y
  `apps/web/src/lib/rag-*-jsonld.ts`.
- **Sitemap:** 40 URL con sus alternates de idioma. Código: `apps/web/src/app/sitemap.ts`.
- **robots.txt:** bloquea las rutas privadas (administración, panel, inicio de sesión,
  registro, activación, propuestas y demos con acceso) en el grupo general y en Bingbot.
  Archivo: `apps/web/public/robots.txt`.
- **Páginas de cuenta:** `noindex` por cabecera `X-Robots-Tag` y por metaetiqueta.
- **Redirecciones permanentes (308):** `/pricing` a `/services#planes-rag`, `/soluciones-ia`
  a `/rag`, y `/demo/ecommerce/admin` a `/demo/ecommerce?view=admin`. Están en
  `apps/web/next.config.js`.
- **Verificación de Search Console:** la etiqueta de verificación de Google está en
  `apps/web/src/app/[locale]/layout.tsx`.
- **Archivo para modelos de lenguaje:** `apps/web/public/llms.txt`.

Estos puntos se comprobaron en la revisión del 27 de octubre de 2026 con un build de
producción local. Las cabeceras y la estructura de las páginas se leyeron con `curl`.

## Pendiente (depende del dueño o de una decisión)

1. **Dominio (resuelto):** `www.koptup.com` resuelve a Vercel y responde 200. El apex
   `koptup.com` redirige con 308. Comprobado el 3 de noviembre de 2026.
2. **Google Analytics 4:** falta el ID de medición (`NEXT_PUBLIC_GA_ID`). Sin ese ID no
   hay analítica ni banner de cookies. No se debe inventar el ID.
3. **Search Console:** confirmar que la propiedad está verificada y enviar
   `https://www.koptup.com/sitemap.xml`.
4. **Datos legales:** NIT, razón social y domicilio para las páginas de privacidad y
   términos. Hoy aparece una dirección que hay que confirmar.
5. **Afirmaciones a confirmar:** "Prueba la demo gratis" (descripción de la portada),
   "Respondemos en menos de 24 horas" y "Cotización gratis" (contacto). Si no son ciertas
   para el negocio, se cambian.
6. **Precios de productos que no son RAG:** `/services` no publica precio para e-commerce,
   chatbots ni dashboards, y el JSON-LD tampoco. Decidir si se publican o no.
7. **Slugs en inglés:** las rutas `/en` conservan slugs en español (`/en/solicitar-demo`,
   `/en/desarrollo-web-colombia`, `/en/rag/legal`). Decidir si se traducen.

## Lo que no hace este documento

No publica cifras de tráfico, posiciones ni leads proyectados. No hay datos medidos todavía.
Esas cifras se pueden documentar cuando haya un periodo de Search Console con datos reales.
