# Contribuir a Koptup

Gracias por tu interés en aportar a Koptup. Esta guía resume las convenciones y el flujo de trabajo del repositorio.

---

## Cómo correr el proyecto local

El [README](./README.md#7-quick-start) tiene la versión detallada. Resumen rápido:

```bash
git clone https://github.com/ronalc90/koptup.git
cd koptup
NODE_ENV=development npm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env
docker run -d --name koptup-mongo -p 27017:27017 mongo:7
npm run dev   # levanta web (:3000) + backend (:3001)
```

---

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) en español, scope opcional:

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat` | Feature nueva o capacidad visible al usuario |
| `fix` | Bug fix sin cambio de comportamiento deseado |
| `chore` | Mantenimiento, dependencias, configuración |
| `docs` | Cambios solo en documentación |
| `refactor` | Reorganización sin cambio funcional |
| `test` | Tests añadidos o ajustados |
| `perf` | Mejora de rendimiento |
| `style` | Formato, espacios, sin cambio de código |
| `ci` | Pipelines, GitHub Actions, hooks |

Ejemplos:

```
feat(chatbot): agregar streaming SSE en respuestas del agente
fix(services): corregir cálculo de precio anual en plan Profesional
docs(readme): badges y screenshots actualizados
refactor(about): extraer secciones a constantes
```

---

## Branch naming

```
feat/<area>-<descripcion-corta>
fix/<area>-<descripcion-corta>
chore/<area>-<descripcion-corta>
docs/<area>-<descripcion-corta>
```

Ejemplos:

- `feat/about-timeline`
- `fix/pricing-conversion-cop-usd`
- `chore/deps-bump-next-14`

---

## Pull Requests

1. Abrí PR contra `main`.
2. Describí **qué** cambia y **por qué**, no solo el diff.
3. Si es UI, adjuntá screenshot o video.
4. Marcá el checklist del template del PR:
   - [ ] Build local pasa (`npm run build`)
   - [ ] Tests pasan (`npm test`)
   - [ ] Lint limpio (`npm run lint`)
   - [ ] i18n ES + EN actualizado si aplica
   - [ ] Screenshots si es UI
5. Vercel genera preview automático — verificar el comentario del bot antes de pedir review.

---

## Style guide

- **TypeScript strict** en todo el repo.
- **Prettier** + **ESLint** corren antes de commitear (configurados en raíz).
- **Imports absolutos** con alias `@/...` en el frontend.
- Componentes funcionales + hooks. Sin clases.
- Inmutabilidad cuando sea posible (`const`, `readonly`, `as const`).
- Nombres descriptivos en español o inglés consistentes por archivo.

Comandos útiles:

```bash
npm run lint           # ESLint en todo el monorepo
npm run build          # Build de web + backend
npm test               # Jest en todos los workspaces
```

---

## Agregar una demo nueva

Las demos son el corazón comercial de Koptup. Para crear una nueva:

1. **Carpeta frontend** — `apps/web/src/app/demo/<slug>/`
   - `page.tsx` con `'use client'` y la UI principal.
   - `layout.tsx` con `generateMetadata` desde `@/lib/seo-config`.

2. **Mensajes i18n** — `apps/web/messages/demos/<slug>.es.json` y `<slug>.en.json`
   - El loader de `next-intl` los mergea automáticamente. Usá `useTranslations('demo<Slug>')`.

3. **Backend mock** (opcional) — `apps/backend/src/modules/<slug>/`
   - Rutas REST con datos mock realistas. Registrá el módulo en `apps/backend/src/app.ts`.

4. **Catálogo** — agregá la entrada en `apps/web/src/app/demo/page.tsx` (catálogo público) con título, categoría y descripción.

5. **SEO** — sumá la ruta a `apps/web/src/lib/seo-config.ts` y al sitemap.

6. **Smoke test** — `apps/web/tests/e2e/demo-<slug>.spec.ts` que verifique render sin error 500.

7. **README** — agregá la fila correspondiente a la tabla de demos.

---

## Reportar bugs y pedir features

Usá los templates de issues en [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE/).

- **Bug**: pasos para reproducir, comportamiento esperado, entorno, logs.
- **Feature**: problema que resuelve, propuesta, alternativas consideradas.

---

## Contacto

¿Dudas antes de abrir un PR grande? Escribí a **dirox7@gmail.com** o abrí un issue de tipo `discussion`.
