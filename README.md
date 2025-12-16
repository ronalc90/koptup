# KopTup - Soluciones Tecnológicas a Medida
[![CI/CD](https://github.com/ronalc90/koptup/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ronalc90/koptup/actions/workflows/ci.yml)

![KopTup Logo](https://via.placeholder.com/800x200/2563eb/ffffff?text=KopTup+Tech+Solutions)

Plataforma web profesional, moderna y responsiva para una empresa que vende soluciones tecnológicas personalizadas. Incluye e-commerce, chatbots inteligentes, integración con APIs, aplicaciones móviles y más.

## 🚀 Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con SSR y App Router
- **TypeScript** - Tipado estático
- **TailwindCSS** - Framework CSS utility-first
- **next-intl** - Internacionalización (ES/EN)
- **next-themes** - Modo oscuro/claro
- **Framer Motion** - Animaciones
- **React Hook Form + Zod** - Gestión de formularios y validación
- **SWR** - Fetching y caché de datos
- **Axios** - Cliente HTTP

### Backend
- **Node.js 18+** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **PostgreSQL 15** - Base de datos relacional
- **Redis** - Caché y sesiones
- **JWT** - Autenticación con tokens
- **Multer** - Subida de archivos
- **pdf-parse & mammoth** - Procesamiento de documentos
- **OpenAI API** - IA conversacional y embeddings
- **Pinecone** - Base de datos vectorial (opcional)
- **AWS S3** - Almacenamiento de archivos
- **Swagger** - Documentación de API

### DevOps
- **Docker & Docker Compose** - Contenerización
- **Turborepo** - Monorepo management
- **GitHub Actions** - CI/CD
- **Vercel** - Deployment frontend
- **Helmet** - Seguridad HTTP
- **Winston** - Logging
- **Express Rate Limit** - Rate limiting

## 📁 Estructura del Proyecto

```
koptup-tech-solutions/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # Componentes React
│   │   │   │   ├── ui/        # Componentes reutilizables
│   │   │   │   └── layout/    # Layout components
│   │   │   ├── lib/           # Utilidades y helpers
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── styles/        # Estilos globales
│   │   ├── messages/          # Archivos i18n
│   │   ├── public/            # Archivos estáticos
│   │   ├── Dockerfile         # Docker para frontend
│   │   ├── next.config.js     # Configuración Next.js
│   │   └── package.json
│   │
│   └── backend/               # Backend Node.js + Express
│       ├── src/
│       │   ├── config/        # Configuración (DB, Redis)
│       │   ├── controllers/   # Controladores de rutas
│       │   ├── middleware/    # Middlewares (auth, error, upload)
│       │   ├── models/        # Modelos de datos
│       │   ├── routes/        # Definición de rutas
│       │   ├── services/      # Lógica de negocio
│       │   ├── utils/         # Utilidades
│       │   └── index.ts       # Punto de entrada
│       ├── Dockerfile         # Docker para backend
│       └── package.json
│
├── packages/
│   └── database/
│       └── init.sql           # Schema PostgreSQL
│
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline CI/CD
│
├── docker-compose.yml         # Orquestación de contenedores
├── turbo.json                 # Configuración Turborepo
├── package.json               # Root package.json
├── .env.example               # Variables de entorno ejemplo
├── .gitignore
└── README.md
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+ y npm 9+
- Docker y Docker Compose
- Git
- Cuenta de AWS (para S3)
- Cuenta de OpenAI (para chatbot)
- Cuenta de Vercel (para deployment)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/koptup-tech-solutions.git
cd koptup-tech-solutions
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Base de datos
DATABASE_URL=postgresql://koptup_user:tu_password@localhost:5432/koptup_db
POSTGRES_PASSWORD=tu_password_seguro

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret_minimo_32_caracteres

# AWS S3
AWS_ACCESS_KEY_ID=tu_aws_access_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=koptup-uploads

# OpenAI (para chatbot)
OPENAI_API_KEY=sk-tu_openai_key

# Pinecone (opcional, para búsqueda semántica)
PINECONE_API_KEY=tu_pinecone_key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=koptup-docs

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar con Docker Compose (Recomendado)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

Esto iniciará:
- PostgreSQL en puerto 5432
- Redis en puerto 6379
- Backend API en puerto 3001
- Frontend en puerto 3000

### 5. Iniciar en Modo Desarrollo (Sin Docker)

#### Iniciar Base de Datos y Redis

```bash
docker-compose up -d postgres redis
```

#### Iniciar Backend

```bash
cd apps/backend
npm install
npm run dev
```

El backend estará disponible en `http://localhost:3001`

#### Iniciar Frontend

```bash
cd apps/web
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

### 6. Inicializar Base de Datos

La base de datos se inicializa automáticamente con Docker Compose usando el archivo `packages/database/init.sql`.

**Usuario admin por defecto:**
- Email: `admin@koptup.com`
- Password: `Admin123!`

## 📚 Documentación de API

Una vez que el backend esté ejecutándose, accede a la documentación Swagger en:

**http://localhost:3001/api-docs**

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil

#### Documentos
- `POST /api/documents/upload` - Subir documento
- `GET /api/documents` - Listar documentos
- `DELETE /api/documents/:id` - Eliminar documento

#### Chat
- `POST /api/chat/session` - Crear sesión de chat
- `POST /api/chat/message` - Enviar mensaje
- `GET /api/chat/history/:sessionId` - Obtener historial

#### Contacto y Cotizaciones
- `POST /api/contact` - Enviar formulario de contacto
- `POST /api/quotes` - Solicitar cotización

#### Blog
- `GET /api/blog/posts` - Listar posts
- `GET /api/blog/posts/:slug` - Obtener post

## 🔒 Seguridad

### Medidas Implementadas

1. **Autenticación JWT** con refresh tokens
2. **Rate limiting** por IP
3. **Validación de inputs** con express-validator y Zod
4. **Helmet** para headers de seguridad
5. **CORS** configurado
6. **Encriptación de contraseñas** con bcrypt
7. **Validación de tipos de archivo** en uploads
8. **SQL injection protection** con consultas parametrizadas
9. **XSS protection** con sanitización
10. **HTTPS/TLS** en producción

### Checklist de Seguridad para Uploads

- ✅ Validación de extensiones de archivo
- ✅ Validación de MIME types
- ✅ Límite de tamaño de archivo (10MB)
- ✅ Nombres de archivo únicos (UUID)
- ✅ Almacenamiento seguro (S3 o filesystem aislado)
- ✅ Rate limiting en endpoints de upload
- ✅ Autenticación requerida
- ✅ Escaneo de virus (recomendado en producción con ClamAV)

## 🚀 Deployment

### Frontend en Vercel

1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SITE_URL`
3. Vercel detectará automáticamente Next.js y lo desplegará

**O usando Vercel CLI:**

```bash
cd apps/web
npm install -g vercel
vercel --prod
```

### Backend

#### Opción 1: Contenedor Docker

```bash
# Build
docker build -t koptup-backend -f apps/backend/Dockerfile .

# Run
docker run -p 3001:3001 --env-file .env koptup-backend
```

#### Opción 2: Serverless (Vercel Functions)

Puedes adaptar el backend para funciones serverless de Vercel moviendo los endpoints a `/api`.

#### Opción 3: VPS/Cloud (AWS, DigitalOcean, etc.)

```bash
# En el servidor
git clone tu-repo
cd koptup-tech-solutions
cp .env.example .env
# Editar .env con credenciales de producción
docker-compose -f docker-compose.yml up -d
```

### Base de Datos en Producción

**Opciones recomendadas:**
- AWS RDS (PostgreSQL)
- DigitalOcean Managed Databases
- Supabase
- Neon
- Railway

### Redis en Producción

**Opciones recomendadas:**
- Redis Labs
- AWS ElastiCache
- DigitalOcean Managed Redis
- Upstash

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests (requiere Playwright)
npm run test:e2e

# Coverage
npm run test -- --coverage
```

## 📊 Monitoreo y Logs

### Logs

Los logs se almacenan en:
- `apps/backend/logs/combined.log` - Todos los logs
- `apps/backend/logs/error.log` - Solo errores
- `apps/backend/logs/exceptions.log` - Excepciones no capturadas

### Métricas Recomendadas

- **New Relic** - APM y monitoreo
- **Datadog** - Observabilidad completa
- **Sentry** - Tracking de errores
- **Google Analytics** - Analytics del sitio

## 🌐 Internacionalización

El sitio soporta múltiples idiomas (español e inglés por defecto).

### Agregar un Nuevo Idioma

1. Crear archivo de traducción:
```bash
cp apps/web/messages/es.json apps/web/messages/fr.json
```

2. Traducir el contenido

3. Actualizar `next.config.js`:
```javascript
i18n: {
  locales: ['es', 'en', 'fr'],
  defaultLocale: 'es',
}
```

## 🎨 Personalización

### Colores y Temas

Edita `apps/web/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* tus colores */ },
      secondary: { /* tus colores */ },
    }
  }
}
```

### Componentes UI

Todos los componentes reutilizables están en `apps/web/src/components/ui/`.

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia todos los servicios en dev
npm run dev:web          # Solo frontend
npm run dev:backend      # Solo backend

# Build
npm run build            # Build de todo el proyecto
npm run build:web        # Build frontend
npm run build:backend    # Build backend

# Docker
npm run docker:up        # Iniciar contenedores
npm run docker:down      # Detener contenedores
npm run docker:build     # Rebuild contenedores

# Linting y formato
npm run lint             # Ejecutar linters
npm run lint:fix         # Fix automático

# Base de datos
npm run migrate          # Ejecutar migraciones
npm run seed             # Seed de datos de prueba
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte técnico:
- Email: support@koptup.com
- Website: https://koptup.com
- GitHub Issues: https://github.com/tu-usuario/koptup-tech-solutions/issues

## 🎯 Roadmap

- [ ] Panel de administración completo
- [ ] Integración con más pasarelas de pago
- [ ] App móvil nativa (React Native)
- [ ] Sistema de notificaciones en tiempo real
- [ ] Marketplace de plugins
- [ ] Analytics dashboard avanzado
- [ ] A/B testing integrado
- [ ] Chatbot multilenguaje mejorado
- [ ] Integración con más CRMs

## ⚡ Performance

### Lighthouse Score Target

- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

### Optimizaciones Implementadas

- ✅ Code splitting automático
- ✅ Image optimization con Next.js
- ✅ Lazy loading de componentes
- ✅ Caché con Redis
- ✅ Compresión Gzip
- ✅ CDN para assets estáticos
- ✅ Database query optimization
- ✅ Bundle size optimization

---

**Desarrollado con ❤️ por KopTup**
