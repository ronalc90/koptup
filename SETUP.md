# 🚀 Configuración del Sistema KopTup

Este documento explica cómo configurar y ejecutar el sistema completo de KopTup (Backend + Frontend).

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **MongoDB** v6 o superior (local o MongoDB Atlas)
- **npm** o **yarn**

## 🔧 Configuración del Backend

### 1. Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cd apps/backend
cp .env.example .env
```

### 2. Edita el archivo `.env`

```bash
# Configuración mínima para desarrollo local:

# Puerto del servidor
PORT=3001

# MongoDB (elige una opción):
# Opción 1: MongoDB local
MONGO_URI=mongodb://localhost:27017/koptup_db

# Opción 2: MongoDB Atlas (recomendado para producción)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/koptup_db

# JWT Secret (cambia esto en producción)
JWT_SECRET=tu-secreto-super-seguro-aqui

# CORS (ajusta según tu frontend)
CORS_ORIGIN=http://localhost:3000,http://localhost:3005

# API Keys (IMPORTANTES para funcionalidad completa)
OPENAI_API_KEY=sk-proj-tu-api-key-aqui
ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui
```

### 3. Instala Dependencias

```bash
npm install
```

### 4. Inicia el Servidor

```bash
# Desarrollo con hot-reload
npm run dev

# O compilar y ejecutar
npm run build
npm start
```

El backend estará disponible en `http://localhost:3001`

## 🎨 Configuración del Frontend

### 1. Variables de Entorno

Copia el archivo de ejemplo:

```bash
cd apps/web
cp .env.example .env.local
```

### 2. Edita el archivo `.env.local`

```bash
# URL del backend
# Desarrollo local:
NEXT_PUBLIC_API_URL=http://localhost:3001

# Producción (cambia por tu URL desplegada):
# NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

### 3. Instala Dependencias

```bash
npm install
```

### 4. Inicia el Servidor de Desarrollo

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 🐳 Opción: Usar MongoDB con Docker

Si no tienes MongoDB instalado localmente, puedes usar Docker:

```bash
docker run -d \
  --name mongodb-koptup \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6
```

Luego usa `MONGO_URI=mongodb://localhost:27017/koptup_db` en tu `.env`

## 🔑 Obtener API Keys

### OpenAI (Para módulo de Cuentas Médicas)
1. Ve a https://platform.openai.com/
2. Crea una cuenta o inicia sesión
3. Ve a API Keys y crea una nueva key
4. Copia la key y agrégala a `.env` como `OPENAI_API_KEY`

### Anthropic Claude (Para Liquidación Automatizada)
1. Ve a https://console.anthropic.com/
2. Crea una cuenta o inicia sesión
3. Ve a API Keys y crea una nueva key
4. Copia la key y agrégala a `.env` como `ANTHROPIC_API_KEY`

## ✅ Verificar que Todo Funciona

### 1. Backend
```bash
# Debe responder con información de la API
curl http://localhost:3001/api/health

# O abre en el navegador
http://localhost:3001/api/docs
```

### 2. Frontend
```bash
# Abre en el navegador
http://localhost:3000
```

### 3. Conexión Backend-Frontend
- El frontend debe poder cargar datos sin errores de `ERR_CONNECTION_REFUSED`
- Revisa la consola del navegador (F12) para verificar que no hay errores de red

## 🚨 Solución de Problemas Comunes

### Error: `ERR_CONNECTION_REFUSED`
- **Causa**: El backend no está corriendo o el frontend no puede conectarse
- **Solución**:
  1. Verifica que el backend esté corriendo en el puerto 3001
  2. Verifica que `NEXT_PUBLIC_API_URL` en `.env.local` apunte a la URL correcta
  3. Si estás en producción, asegúrate de usar la URL del backend desplegado

### Error: `MongoNetworkError`
- **Causa**: No se puede conectar a MongoDB
- **Solución**:
  1. Verifica que MongoDB esté corriendo: `mongod --version`
  2. Inicia MongoDB: `mongod` o usa el servicio del sistema
  3. O usa MongoDB Atlas en la nube

### Error: `Missing API Key`
- **Causa**: No están configuradas las API keys de OpenAI o Anthropic
- **Solución**: Agrega las keys en el archivo `.env` del backend

### Frontend en producción no se conecta al backend
- **Causa**: La variable de entorno no se configuró en Vercel/producción
- **Solución**:
  1. Ve a tu proyecto en Vercel
  2. Settings → Environment Variables
  3. Agrega `NEXT_PUBLIC_API_URL` con la URL de tu backend
  4. Redeploy el frontend

## 📚 Documentación Adicional

- [API Documentation](http://localhost:3001/api/docs) - Swagger UI con todos los endpoints
- [Sistema de Liquidación](apps/backend/src/services/liquidacion-automatizada.service.ts) - Documentación del módulo de liquidación
- [Reglas de Negocio con IA](apps/backend/src/services/reglas-ia.service.ts) - Documentación del motor de reglas

## 🎯 Próximos Pasos

1. **Desarrollo Local**: Configura ambos archivos `.env` con tus credenciales
2. **Despliegue Backend**: Usa Railway, Render o cualquier servicio Node.js
3. **Despliegue Frontend**: Usa Vercel (automático si conectas GitHub)
4. **Configurar Variables**: No olvides configurar las variables de entorno en producción
5. **Seguridad**: Cambia todos los secrets y passwords antes de producción

## 💡 Consejos

- Usa MongoDB Atlas para producción (más fácil que administrar tu propio servidor)
- Las API keys tienen costos asociados, monitorea tu uso en los dashboards de OpenAI/Anthropic
- El módulo de liquidación automatizada requiere ANTHROPIC_API_KEY para funcionar
- Habilita CORS correctamente en producción agregando tu dominio a `CORS_ORIGIN`
