# Guía de Despliegue - KopTup

## 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:

- [ ] Cuenta de AWS con S3 configurado
- [ ] Cuenta de OpenAI con API key
- [ ] Cuenta de Vercel (para frontend)
- [ ] Servidor o VPS (para backend) o uso de Vercel Serverless
- [ ] Base de datos PostgreSQL en producción (AWS RDS, Neon, Supabase, etc.)
- [ ] Redis en producción (Redis Labs, AWS ElastiCache, Upstash, etc.)

## 🚀 Despliegue Frontend en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Conectar Repositorio:**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Importa tu repositorio de GitHub
   - Selecciona el directorio raíz: `apps/web`

2. **Configurar Variables de Entorno:**
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.com
   NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

3. **Configurar Build:**
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build` (o dejar default)
   - Output Directory: `.next` (default)

4. **Deploy:**
   - Click en "Deploy"
   - Espera a que termine el build

### Opción 2: CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy desde el directorio web
cd apps/web
vercel --prod
```

## 🖥️ Despliegue Backend

### Opción 1: VPS/Cloud Server (Recomendado)

#### En DigitalOcean, AWS EC2, o cualquier VPS:

1. **Conectar al servidor:**
   ```bash
   ssh root@tu-servidor-ip
   ```

2. **Instalar Docker y Docker Compose:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Clonar repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/koptup.git
   cd koptup
   ```

4. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   nano .env
   # Editar con tus credenciales de producción
   ```

5. **Iniciar servicios:**
   ```bash
   docker-compose up -d
   ```

6. **Verificar logs:**
   ```bash
   docker-compose logs -f
   ```

7. **Configurar Nginx como reverse proxy:**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/koptup
   ```

   Contenido del archivo:
   ```nginx
   server {
       listen 80;
       server_name api.tudominio.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/koptup /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Configurar SSL con Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.tudominio.com
   ```

### Opción 2: Railway.app (Más Fácil)

1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. Configura las variables de entorno
6. Railway detectará automáticamente Docker y lo desplegará

### Opción 3: Render.com

1. Ve a [render.com](https://render.com)
2. New → Web Service
3. Conecta tu repositorio
4. Configura:
   - Environment: Docker
   - Docker Command: (dejar vacío)
   - Variables de entorno
5. Deploy

## 🗄️ Base de Datos en Producción

### Opción 1: Neon (Recomendado para proyectos pequeños/medianos)

1. Ve a [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Copia la connection string
4. Ejecuta el schema:
   ```bash
   psql "tu-connection-string" < packages/database/init.sql
   ```

### Opción 2: Supabase

1. Ve a [supabase.com](https://supabase.com)
2. New project
3. Copia la connection string (usar modo "Transaction")
4. Ejecuta el schema en el SQL Editor

### Opción 3: AWS RDS

1. Crear instancia PostgreSQL en AWS RDS
2. Configurar security groups
3. Conectar y ejecutar schema

## 💾 Redis en Producción

### Opción 1: Upstash (Recomendado)

1. Ve a [upstash.com](https://upstash.com)
2. Create Database
3. Copia la Redis URL
4. Actualiza REDIS_URL en tu .env

### Opción 2: Redis Labs

1. Ve a [redis.com](https://redis.com)
2. Create free database
3. Copia la connection string

## 📦 Almacenamiento S3

1. **Crear bucket en AWS S3:**
   - Bucket name: `koptup-uploads-prod`
   - Region: us-east-1 (o tu preferencia)
   - Block all public access: OFF (para archivos públicos)

2. **Crear IAM user:**
   - Permisos: `AmazonS3FullAccess`
   - Copiar Access Key ID y Secret Access Key

3. **Configurar CORS:**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://tu-dominio.com"],
       "ExposeHeaders": []
     }
   ]
   ```

## 🔐 Variables de Entorno en Producción

Asegúrate de configurar todas estas variables:

```env
# Backend
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=tu_jwt_secret_muy_seguro_minimo_32_caracteres
JWT_REFRESH_SECRET=otro_secret_diferente_32_caracteres
AWS_ACCESS_KEY_ID=tu_aws_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret
AWS_S3_BUCKET=koptup-uploads-prod
OPENAI_API_KEY=sk-tu_openai_key
CORS_ORIGIN=https://tu-dominio.vercel.app,https://www.tu-dominio.com

# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://api.tu-dominio.com
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

## 🔄 Actualizaciones Continuas

### Con GitHub Actions (ya configurado):

Cada push a `main` disparará:
1. Tests automáticos
2. Build de frontend y backend
3. Deploy a Vercel (frontend)
4. Build de Docker images
5. Push a Docker Hub

### Deploy manual:

```bash
# Pull últimos cambios
git pull origin main

# Rebuild y restart
docker-compose down
docker-compose build
docker-compose up -d
```

## 📊 Monitoreo

### Configurar Sentry (Errores):

```bash
npm install @sentry/nextjs @sentry/node
```

### Logs:

- Backend: `docker-compose logs -f backend`
- Frontend: Vercel Dashboard

## ✅ Checklist Pre-Deploy

- [ ] Todas las variables de entorno configuradas
- [ ] Base de datos migrada y seedeada
- [ ] S3 bucket creado y configurado
- [ ] Redis funcionando
- [ ] SSL/TLS configurado
- [ ] CORS correctamente configurado
- [ ] Rate limiting apropiado para producción
- [ ] Backups de base de datos configurados
- [ ] Monitoreo configurado
- [ ] DNS apuntando correctamente
- [ ] Emails de notificación configurados

## 🚨 Troubleshooting

### Error de CORS:
- Verificar CORS_ORIGIN en backend
- Verificar que el frontend use HTTPS

### Error de conexión a DB:
- Verificar firewall y security groups
- Verificar connection string

### Errores 502:
- Verificar que el backend esté corriendo
- Verificar configuración de Nginx
- Revisar logs del backend

## 📞 Soporte

Si tienes problemas durante el despliegue:
- Revisar logs: `docker-compose logs -f`
- GitHub Issues
- Documentación de cada servicio usado
