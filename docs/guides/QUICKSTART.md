# Inicio rápido - KopTup

La guía de instalación vigente está en [`SETUP.md`](../../SETUP.md) (paso a paso, con problemas comunes) y en la wiki: [Operación y despliegue › Levantar todo en local](../wiki/Doc-11-Operacion-y-Despliegue.md#5-levantar-todo-en-local-paso-a-paso).

Resumen:

```bash
NODE_ENV=development npm install                  # Node.js 22.11 o superior
npm run docker:up                                  # MongoDB 7 y Redis 7 locales (docker-compose.dev.yml)
cp apps/backend/.env.example apps/backend/.env     # cambia JWT_SECRET y JWT_REFRESH_SECRET
cp apps/web/.env.example apps/web/.env.local       # apunta a http://localhost:3001
npm run dev                                        # web en :3000 y backend en :3001
```

La aplicación usa **MongoDB** (no PostgreSQL) y no se despliega con Docker: la web va en Vercel y la API en Railway. Docker solo se usa, si quieres, para levantar MongoDB y Redis en tu computador.
