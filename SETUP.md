# Configuración local de KopTup

Cómo levantar el backend (Express) y la web (Next.js) en tu computador. La versión con diagramas, la lista completa de variables y los procedimientos ante fallas están en la wiki: [Operación y despliegue](docs/wiki/Doc-11-Operacion-y-Despliegue.md).

## Requisitos

- **Node.js 20.9 o superior** y npm 9 o superior.
- **MongoDB 7** y **Redis 7**, instalados o con Docker (paso 2).
- Opcional: una clave de OpenAI. Sin ella el chatbot responde en modo extractivo y las demás funciones con IA se apagan; para no gastar, usa el mock de OpenAI del repositorio (paso 3).

## 1. Instala las dependencias

Desde la raíz (instala la web y el backend juntos, npm workspaces):

```bash
NODE_ENV=development npm install
```

## 2. MongoDB y Redis

Con Docker, `docker-compose.dev.yml` levanta los dos, solo accesibles desde tu computador:

```bash
npm run docker:up      # MongoDB 7 en 127.0.0.1:27017 y Redis 7 en 127.0.0.1:6379
npm run docker:down    # los detiene (los datos quedan en volúmenes de Docker)
```

Sin Docker, instala MongoDB y Redis y déjalos en esos mismos puertos.

## 3. (Opcional) Mock de OpenAI

```bash
node apps/web/e2e/support/openai-mock.js        # http://127.0.0.1:3999/v1
```

Responde «Respuesta simulada (mock de OpenAI)…» y cita el primer fragmento que recibe: el recorrido es real, la respuesta no.

## 4. Backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

En `apps/backend/.env`, lo mínimo:

| Variable | Valor local |
|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/koptup_db` |
| `REDIS_URL` | `redis://localhost:6379` |
| `JWT_SECRET` y `JWT_REFRESH_SECRET` | Dos valores largos, aleatorios y **distintos**. Sin `JWT_REFRESH_SECRET` el backend arranca, pero nadie puede iniciar sesión |
| `OPENAI_API_KEY` | Tu clave, o con el mock: `OPENAI_BASE_URL=http://127.0.0.1:3999/v1` y cualquier clave de prueba |
| `DEMO_UPLOAD_ENABLED` | `true` si quieres probar «Prueba con tu documento» (necesita Redis y la clave de OpenAI) |

Arranca:

```bash
cd apps/backend && npm run dev                  # http://localhost:3001
```

Comprueba `http://localhost:3001/health`: debe responder `{"status":"healthy","mongo":"connected",…}`. Los avisos `[env] …` del arranque dicen qué función quedó apagada por falta de una variable. La documentación interactiva de la API está en `http://localhost:3001/api-docs` (solo fuera de producción).

## 5. Web

```bash
cp apps/web/.env.example apps/web/.env.local    # NEXT_PUBLIC_API_URL=http://localhost:3001
cd apps/web && npm run dev                       # http://localhost:3000
```

En desarrollo la web **siempre** apunta al backend local (`http://localhost:3001` si no defines nada). No pongas la URL de producción en `.env.local`: lo que pruebes crearía cuentas, solicitudes y leads reales.

## 6. Tu cuenta admin

1. Regístrate en `http://localhost:3000/register`.
2. Desde `apps/backend`, dale el rol (el script lee `apps/backend/.env`):

   ```bash
   npx ts-node --transpile-only src/scripts/set-admin.ts tu-correo@ejemplo.co
   ```

3. Cierra sesión y vuelve a entrar: el panel queda en `http://localhost:3000/admin`.

También sirve `ADMIN_EMAIL=tu-correo@ejemplo.co` en `apps/backend/.env`: al reiniciar el backend, esa cuenta recibe el rol solo si **no hay ningún otro admin** en la base. Los dos caminos quedan en la bitácora.

## 7. Pruebas

```bash
npm test               # Jest de backend y web
npm run lint           # ESLint de los dos
npm run typecheck      # TypeScript de los dos
```

Las pruebas de integración del backend necesitan una base y un Redis **solo de pruebas** (se borran):

```bash
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/koptup_test REDIS_URL_TEST=redis://127.0.0.1:6379/15 npm test --workspace=apps/backend
```

La suite de punta a punta (Playwright) está explicada en el [README](README.md#pruebas-y-ci).

## Problemas comunes

| Síntoma | Qué revisar |
|---|---|
| La web muestra errores de red o «No se pudo verificar» | Que el backend esté arriba en el puerto de `NEXT_PUBLIC_API_URL` y que `CORS_ORIGIN` incluya la URL de la web si no usas el puerto 3000 |
| `/health` responde 503 | MongoDB no está conectado: revisa `MONGODB_URI` y que el servicio esté corriendo |
| El inicio de sesión falla con un error del servidor | Falta `JWT_REFRESH_SECRET` (el log del arranque lo avisa) |
| La sesión dura solo 15 minutos | Redis no está conectado (`REDIS_URL`): sin él la sesión no se renueva |
| «Prueba con tu documento» no está disponible | `GET http://localhost:3001/api/demo-rag/status` dice el motivo (`disabled`, `unavailable` o `budget_exhausted`) |
| No llega ningún correo | Faltan `SMTP_USER` y `SMTP_PASS`; el panel muestra igual los enlaces de activación para copiarlos |
