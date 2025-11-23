# Guía de Despliegue - KopTup Platform

Esta guía te ayudará a desplegar tu aplicación en **Vercel** (frontend) y **Railway** (backend).

## Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Parte 1: Desplegar Backend en Railway](#parte-1-desplegar-backend-en-railway)
- [Parte 2: Desplegar Frontend en Vercel](#parte-2-desplegar-frontend-en-vercel)
- [Parte 3: Configuración Final](#parte-3-configuración-final)
- [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

### Cuentas necesarias:
- ✅ Cuenta en GitHub (tu código debe estar en un repositorio)
- ✅ Cuenta en Railway.app (gratuita)
- ✅ Cuenta en Vercel.com (gratuita)
- ✅ MongoDB Atlas (opcional, Railway incluye MongoDB)
- ✅ API Key de OpenAI (REQUERIDO para Cuentas Médicas)

### APIs y Servicios:
- **OpenAI API Key** - https://platform.openai.com/api-keys
- **AWS S3** (opcional, para archivos)
- **Pinecone** (opcional, para RAG)

---

## Parte 1: Desplegar Backend en Railway

### Paso 1: Preparar el Repositorio

1. **Asegúrate de que tu código esté en GitHub:**
   ```bash
   git add .
   git commit -m "Preparar para despliegue en Railway"
   git push origin main
   ```

2. **Verifica que existan estos archivos en `apps/backend/`:**
   - ✅ `Procfile`
   - ✅ `railway.json`
   - ✅ `.env.example`
   - ✅ `package.json` con scripts `build` y `start`

### Paso 2: Crear Proyecto en Railway

1. Ve a https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tu GitHub
5. Selecciona tu repositorio `Soluciones Tecnologicas KopTup`
6. Railway detectará automáticamente tu app Node.js

### Paso 3: Configurar el Directorio Raíz

1. En Railway, ve a **Settings**
2. Encuentra **"Root Directory"**
3. Establece: `apps/backend`
4. Guarda los cambios

### Paso 4: Agregar MongoDB

**Opción A - MongoDB de Railway (Recomendado para empezar):**
1. Click en **"New"** → **"Database"** → **"Add MongoDB"**
2. Railway creará automáticamente una instancia
3. La variable `MONGO_URL` se agregará automáticamente

**Opción B - MongoDB Atlas (Recomendado para producción):**
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea un cluster gratuito
3. Obtén tu connection string
4. Agrégalo manualmente en Railway (ver siguiente paso)

### Paso 5: Agregar Redis (Opcional, para caché)

1. Click en **"New"** → **"Database"** → **"Add Redis"**
2. Railway creará la instancia
3. La variable `REDIS_URL` se agregará automáticamente

### Paso 6: Configurar Variables de Entorno

En Railway, ve a **"Variables"** y agrega:

```env
# ==============================================
# REQUERIDAS
# ==============================================
NODE_ENV=production
PORT=3001

# MongoDB - Railway lo provee automáticamente como MONGO_URL
# Si usas Atlas, agrégalo manualmente:
MONGODB_URI=${{MONGO_URL}}

# OpenAI (REQUERIDO SOLO si usas el módulo de Cuentas Médicas)
# Sin esta key, el servidor arrancará pero las funciones de IA no funcionarán
# Obtén tu key en: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL=gpt-4o-mini

# JWT
JWT_SECRET=tu-secreto-super-seguro-aqui-cambiar
JWT_EXPIRES_IN=7d

# CORS - Déjalo vacío por ahora, lo configuraremos después
CORS_ORIGIN=

# ==============================================
# OPCIONALES
# ==============================================

# AWS S3 (si usas almacenamiento de archivos)
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tu-bucket

# Redis - Railway lo provee automáticamente
REDIS_URL=${{REDIS_URL}}

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-secret
GOOGLE_CALLBACK_URL=https://tu-app.railway.app/api/auth/google/callback

# Pinecone (para RAG)
PINECONE_API_KEY=tu-pinecone-key
PINECONE_INDEX=tu-index
```

### Paso 7: Desplegar

1. Railway iniciará el despliegue automáticamente
2. Espera a que termine (2-5 minutos)
3. Verifica los logs en la sección **"Deployments"**
4. Busca mensajes como:
   - ✅ "MongoDB connected successfully"
   - ✅ "Servidor escuchando en..."

### Paso 8: Obtener la URL del Backend

1. En Railway, ve a **"Settings"**
2. Click en **"Generate Domain"**
3. Copia tu URL (ej: `https://tu-app.railway.app`)
4. **IMPORTANTE:** Guarda esta URL para el siguiente paso

### Paso 9: Verificar que funciona

```bash
curl https://tu-app.railway.app/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T...",
  "uptime": 123.456
}
```

---

## Parte 2: Desplegar Frontend en Vercel

### Paso 1: Preparar Vercel

1. Ve a https://vercel.com
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js

### Paso 2: Configurar el Proyecto

1. **Root Directory:** `apps/web`
2. **Framework Preset:** Next.js (detectado automáticamente)
3. **Build Command:** `npm run build` (por defecto)
4. **Output Directory:** `.next` (por defecto)

### Paso 3: Variables de Entorno

En Vercel, agrega estas variables:

```env
# URL del backend en Railway (del Paso 1.8)
NEXT_PUBLIC_API_URL=https://tu-app.railway.app
```

**IMPORTANTE:** Asegúrate de que NO tenga una `/` al final.

### Paso 4: Desplegar

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. Vercel te dará una URL (ej: `https://tu-app.vercel.app`)

### Paso 5: Verificar que funciona

1. Abre `https://tu-app.vercel.app` en tu navegador
2. Verifica que el frontend cargue correctamente
3. Intenta hacer login o cualquier llamada al backend

---

## Parte 3: Configuración Final

### Paso 1: Actualizar CORS en Railway

Ahora que tienes la URL de Vercel, actualiza el CORS:

1. Ve a Railway → Variables
2. Actualiza `CORS_ORIGIN`:
   ```
   https://tu-app.vercel.app
   ```
3. Si quieres permitir múltiples orígenes:
   ```
   https://tu-app.vercel.app,https://www.tu-dominio.com
   ```
4. Railway re-desplegará automáticamente

### Paso 2: Configurar Dominio Personalizado (Opcional)

**En Vercel:**
1. Ve a **"Settings"** → **"Domains"**
2. Agrega tu dominio (ej: `www.koptup.com`)
3. Configura los DNS según las instrucciones

**En Railway:**
1. Ve a **"Settings"** → **"Networking"**
2. Agrega tu dominio (ej: `api.koptup.com`)
3. Configura los DNS según las instrucciones

**Actualiza las variables:**
- Railway: `CORS_ORIGIN=https://www.koptup.com`
- Vercel: `NEXT_PUBLIC_API_URL=https://api.koptup.com`

### Paso 3: Habilitar HTTPS (Automático)

Railway y Vercel proveen SSL automáticamente:
- ✅ Vercel: Certificado SSL automático
- ✅ Railway: Certificado SSL automático

### Paso 4: Configurar CI/CD (Auto-Deploy)

**Railway:**
- Ya configurado: cada push a `main` despliega automáticamente

**Vercel:**
- Ya configurado: cada push a `main` despliega automáticamente

Para cambiar la rama:
1. Ve a **Settings** → **Git**
2. Cambia **Production Branch** según necesites

---

## Verificación Final

### Checklist de Despliegue:

Backend (Railway):
- [ ] MongoDB conectado
- [ ] Redis conectado (si lo usas)
- [ ] OpenAI API Key configurada
- [ ] `/health` responde correctamente
- [ ] Logs sin errores
- [ ] CORS configurado con URL de Vercel

Frontend (Vercel):
- [ ] Build exitoso
- [ ] `NEXT_PUBLIC_API_URL` configurada
- [ ] Sitio carga correctamente
- [ ] Login funciona
- [ ] Llamadas al backend funcionan

### URLs Importantes:

```
Frontend: https://tu-app.vercel.app
Backend:  https://tu-app.railway.app
Docs API: https://tu-app.railway.app/api-docs
Health:   https://tu-app.railway.app/health
```

---

## Troubleshooting

### Problema: "npm ci" falla en Railway con "cannot find package-lock.json"

**Causa:** Railway detectó un Dockerfile y lo está usando en lugar de Nixpacks

**Solución:**
1. El `Dockerfile` en `apps/backend/` ha sido renombrado a `Dockerfile.backup`
2. Asegúrate de hacer commit y push de los cambios:
   ```bash
   git add .
   git commit -m "Fix Railway deployment: use Nixpacks instead of Docker"
   git push origin main
   ```
3. Railway automáticamente re-desplegará usando Nixpacks
4. Verifica en Railway Settings que "Builder" esté en "NIXPACKS"

**Nota:** Si quieres usar Docker en el futuro, necesitas copiar `package-lock.json` a `apps/backend/` o ajustar el Dockerfile para trabajar con el monorepo.

### Problema: "Network Error" en el frontend

**Causa:** CORS no configurado correctamente

**Solución:**
1. Verifica `CORS_ORIGIN` en Railway incluye tu URL de Vercel
2. Asegúrate que NO tenga `/` al final
3. Verifica que `NEXT_PUBLIC_API_URL` en Vercel sea correcta

### Problema: "MongoDB connection failed"

**Causa:** Variable de entorno incorrecta

**Solución:**
1. En Railway, verifica que `MONGODB_URI` esté configurada
2. Si usas el MongoDB de Railway, usa: `MONGODB_URI=${{MONGO_URL}}`
3. Si usas Atlas, verifica tu connection string

### Problema: Build falla en Railway

**Causa:** TypeScript no compila

**Solución:**
1. Revisa los logs de build
2. Verifica que `tsconfig.json` exista
3. Ejecuta `npm run build` localmente para verificar errores

### Problema: "Cannot find module" en Railway

**Causa:** Dependencias no instaladas

**Solución:**
1. Verifica que todas las dependencias estén en `dependencies` (no en `devDependencies`)
2. TypeScript types deben estar en `dependencies` para producción:
   ```bash
   npm install --save @types/express @types/node
   ```

### Problema: "OPENAI_API_KEY environment variable is missing" al iniciar

**Causa:** El servidor intentaba instanciar OpenAI al arrancar, incluso si no se usaba

**Solución (ya implementada):**
El código ahora usa "lazy loading" - OpenAI solo se instancia cuando se usa.

**Para usar el módulo de Cuentas Médicas:**
1. Ve a Railway → Variables
2. Agrega `OPENAI_API_KEY=sk-proj-TU_KEY_AQUI`
3. Obtén tu key en: https://platform.openai.com/api-keys
4. Opcionalmente agrega `OPENAI_MODEL=gpt-4o-mini` (por defecto usa gpt-4o)

**Nota:** Sin OPENAI_API_KEY:
- ✅ El servidor arrancará correctamente
- ✅ Todas las demás funcionalidades funcionarán
- ❌ El módulo de procesamiento de cuentas médicas fallará cuando se use

### Problema: OpenAI API falla durante el procesamiento

**Causa:** API Key inválida o sin créditos

**Solución:**
1. Verifica que la key sea válida en https://platform.openai.com/api-keys
2. Asegúrate de tener créditos en tu cuenta OpenAI
3. Verifica el modelo configurado existe: `gpt-4o-mini` o `gpt-4o`

### Problema: Archivos no se suben

**Causa:** Almacenamiento efímero en Railway

**Solución:**
Railway usa almacenamiento efímero. Para persistencia:
1. Usa AWS S3 (recomendado)
2. Configura las variables `AWS_*` en Railway
3. O usa Railway Volumes (beta)

---

## Monitoreo y Logs

### Ver logs en Railway:
1. Ve a tu proyecto
2. Click en **"Deployments"**
3. Selecciona el deployment activo
4. Los logs aparecen en tiempo real

### Ver logs en Vercel:
1. Ve a tu proyecto
2. Click en **"Deployments"**
3. Selecciona el deployment
4. Click en **"View Function Logs"**

---

## Costos Estimados

### Tier Gratuito (Desarrollo/MVP):
- **Vercel:** Gratis (100 GB bandwidth, builds ilimitados)
- **Railway:** $5 de crédito gratis/mes, luego $5-10/mes
- **MongoDB Atlas:** Tier gratuito 512MB
- **Total:** $0-10/mes

### Producción (Tráfico medio):
- **Vercel:** $20/mes (Pro plan)
- **Railway:** $20-40/mes (dependiendo del uso)
- **MongoDB Atlas:** $9-25/mes (Shared cluster)
- **Total:** $49-85/mes

---

## Próximos Pasos

Después del despliegue:

1. **Configurar Monitoreo:**
   - Railway: Usa métricas integradas
   - Vercel: Usa Vercel Analytics
   - Considera Sentry para error tracking

2. **Backups de Base de Datos:**
   - MongoDB Atlas: Backups automáticos
   - Railway: Configura backups manuales

3. **Seguridad:**
   - Revisa rate limiting
   - Configura helmet.js correctamente
   - Usa secrets para keys sensibles

4. **Performance:**
   - Habilita Redis para caché
   - Optimiza queries de MongoDB
   - Usa CDN para assets estáticos

---

## Soporte

Si tienes problemas:
1. Revisa los logs en Railway/Vercel
2. Verifica las variables de entorno
3. Prueba localmente primero
4. Consulta la documentación:
   - Railway: https://docs.railway.app
   - Vercel: https://vercel.com/docs

---

**Última actualización:** 2025-11-01

**Desarrollado por:** KopTup - Soluciones Tecnológicas
