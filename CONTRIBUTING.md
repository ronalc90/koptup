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

1. Abre el PR contra `main`.
2. Describe **qué** cambia y **por qué**, no solo el diff.
3. Si es UI, adjunta screenshot o video.
4. Marca el checklist del template del PR ([`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)):
   - [ ] Build local pasa (`npm run build`)
   - [ ] Tests pasan (`npm test`)
   - [ ] Lint limpio (`npm run lint`)
   - [ ] Tipos sin errores (`npm run typecheck`)
   - [ ] i18n ES + EN actualizado si aplica
   - [ ] Screenshots si es UI
5. Vercel genera preview automático — revisa el comentario del bot antes de pedir review. El workflow de CI debe quedar en verde.

---

## Style guide

- **TypeScript**: modo `strict` en la web; el backend todavía compila sin `strict`.
- **ESLint** (`npm run lint`) y **TypeScript** (`npm run typecheck`) deben quedar sin errores antes de abrir el PR. No hay hooks de pre-commit: los corres tú y el CI los vuelve a verificar. Prettier está instalado en la raíz con su configuración por defecto (`npx prettier --write <archivo>`).
- **Imports absolutos** con alias `@/...` en el frontend.
- Componentes funcionales + hooks. Sin clases.
- Inmutabilidad cuando sea posible (`const`, `readonly`, `as const`).
- Nombres descriptivos en español o inglés consistentes por archivo.

Comandos útiles:

```bash
npm run lint           # ESLint en todo el monorepo
npm run typecheck      # tsc --noEmit en web y backend (incluye las pruebas)
npm run build          # Build de web + backend
npm test               # Jest en todos los workspaces
npm run test:e2e       # Playwright contra un sitio ya levantado en E2E_BASE_URL (por defecto http://localhost:3300;
                       # con `npm run dev` usa E2E_BASE_URL=http://localhost:3000). Con E2E_API_URL y
                       # E2E_MONGODB_URI corren también las pruebas de la plataforma (panel, portal, permisos)
```

Cómo levantar todo para el e2e en local, las pruebas de integración del backend (`MONGODB_URI_TEST`, `REDIS_URL_TEST`) y las variables de cada suite: [README › Pruebas y CI](README.md#pruebas-y-ci). El workflow [`ci.yml`](.github/workflows/ci.yml) corre todo esto en cada pull request (más el e2e con MongoDB, Redis y el mock de OpenAI versionado).

---

## Agregar una demo nueva

Las demos son el corazón comercial de Koptup. Para crear una nueva:

1. **Carpeta frontend** — `apps/web/src/app/demo/<slug>/`
   - `page.tsx` con `'use client'` y la UI principal.
   - `layout.tsx` con `generateMetadata` desde `@/lib/seo-config`.

2. **Mensajes i18n** — `apps/web/messages/demos/<slug>.es.json` y `<slug>.en.json`
   - `scripts/merge-messages.mjs` los combina en `messages/_demos.<idioma>.json` (se ejecuta automáticamente antes de `dev`, `build` y `test`; esos archivos se versionan). Usa `useTranslations('demo<Slug>')`.

3. **Backend** (opcional) — las rutas viven en `apps/backend/src/routes/` y se registran en `apps/backend/src/index.ts`.
   - Ojo: `apps/backend/src/modules/` **no** está montado en el servidor; hoy solo lo usan sus pruebas.

4. **Catálogo** — agrega la tarjeta en `apps/web/src/app/demo/page.tsx` (catálogo público) con título, categoría y descripción, y el slug en `DEMO_CATALOG_SLUGS` de `apps/web/src/lib/demos.ts` (de ahí salen los conteos de demos del sitio).

5. **SEO** — agrega la ruta a `apps/web/src/lib/seo-config.ts` y revisa que aparezca en el sitemap (`apps/web/src/app/sitemap.ts`).

6. **Pruebas** — la prueba de humo de Jest (`apps/web/src/__tests__/demos-smoke.test.tsx`) y la de Playwright (`apps/web/e2e/demos.spec.ts`) toman la demo nueva sola, desde su carpeta. Si la demo tiene flujos propios, agrega `apps/web/src/app/demo/<slug>/__tests__/page.test.tsx` (con `smokeRenderPage` de `@/test-utils/smoke` o Testing Library) y, si dependen del backend, una prueba en `apps/web/e2e/`.

7. **README** — si cambia lo que el README dice de las demos (aplicaciones reales o prototipos), actualízalo.

---

## Reportar bugs y pedir features

Usa los templates de issues en [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE/).

- **Bug**: pasos para reproducir, comportamiento esperado, entorno, logs.
- **Feature**: problema que resuelve, propuesta, alternativas consideradas.

---

## Contacto

¿Dudas antes de abrir un PR grande? Escribe a **dirox7@gmail.com** o abre un issue.
