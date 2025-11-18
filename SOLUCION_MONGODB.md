# Solución: MongoDB NO Conectado en Railway

## Problema Detectado

El backend en Railway **NO tiene configurada** la variable `MONGODB_URI`, causando que todos los endpoints que usan MongoDB fallen con:

```
Error: Operation `chatbots.findOne()` buffering timed out after 10000ms
```

## Endpoints Afectados

- ❌ Chatbot (session, message)
- ❌ Cuentas Médicas (listar, búsquedas de CUPS/medicamentos/diagnósticos)
- ❌ Ley100 (listar documentos)
- ❌ Auth (register, login)
- ❌ Contact
- ✅ Health Check (funciona - no usa MongoDB)

## Solución Paso a Paso

### 1. Obtener una Base de Datos MongoDB

**Opción A: MongoDB Atlas (Gratis)**

1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea una cuenta o inicia sesión
3. Click en "Build a Database"
4. Selecciona "FREE" (M0)
5. Elige un proveedor (AWS, Google Cloud o Azure) y región
6. Click en "Create Cluster"
7. Espera 1-3 minutos a que se cree

**Configurar Acceso:**

1. En "Security" → "Database Access":
   - Click "Add New Database User"
   - Username: `koptup-backend`
   - Password: Genera una contraseña segura (guárdala)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. En "Security" → "Network Access":
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

3. En "Database" → "Connect":
   - Click "Connect your application"
   - Driver: Node.js
   - Version: 5.5 or later
   - Copia la connection string que se ve así:
     ```
     mongodb+srv://koptup-backend:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

4. **IMPORTANTE:** Reemplaza `<password>` con tu contraseña real
5. Agrega el nombre de la base de datos después de `.net/`:
   ```
   mongodb+srv://koptup-backend:TU_PASSWORD@cluster0.xxxxx.mongodb.net/koptup?retryWrites=true&w=majority
   ```

### 2. Configurar MONGODB_URI en Railway

1. Ve a https://railway.app
2. Inicia sesión
3. Selecciona tu proyecto backend
4. Ve a la pestaña "Variables"
5. Click en "New Variable"
6. Name: `MONGODB_URI`
7. Value: Pega tu connection string de MongoDB Atlas
   ```
   mongodb+srv://koptup-backend:TU_PASSWORD@cluster0.xxxxx.mongodb.net/koptup?retryWrites=true&w=majority
   ```
8. Click "Add"

### 3. Redeploy del Backend

Después de agregar la variable:

1. Railway debería redeployar automáticamente
2. Si no, ve a "Deployments" y click en "Redeploy"
3. Espera 2-3 minutos

### 4. Verificar que Funciona

1. Ve a `/test` en tu aplicación frontend
2. Click en "Probar" para "Health Check" - debe dar ✅
3. Click en "Probar" para "Chatbot - Create Session" - debe dar ✅
4. El diagnóstico automático debe mostrar "0 MongoDB Timeout"

## Verificación Rápida

**En los logs de Railway** deberías ver:

```
✅ MongoDB connected successfully
MongoDB connection established
```

**En lugar de:**

```
⚠️ MONGODB_URI not configured - MongoDB features disabled
```

## Variables de Entorno Necesarias en Railway

Asegúrate de tener TODAS estas variables configuradas:

```env
# Base de Datos
MONGODB_URI=mongodb+srv://...

# OpenAI (para chatbot)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# CORS
CORS_ORIGIN=https://koptup-web.vercel.app,http://localhost:3000

# JWT
JWT_SECRET=tu-secret-super-seguro-de-32-caracteres-minimo

# API URL
API_URL=https://koptupbackend-production.up.railway.app

# Puerto (Railway lo configura automáticamente)
PORT=3001
```

## Troubleshooting

### Error: "MongoServerError: Authentication failed"
- La contraseña es incorrecta
- Reemplaza `<password>` en el connection string con tu contraseña real
- **NO uses** caracteres especiales como `@`, `#`, `%` en la contraseña

### Error: "MongoServerError: IP address is not allowed"
- En MongoDB Atlas → Network Access → Add IP Address → Allow Access from Anywhere

### Error: "MongooseServerSelectionError: connection timed out"
- Verifica que el connection string esté correcto
- Verifica que Network Access permita 0.0.0.0/0
- Espera 1-2 minutos después de crear el cluster

### Los endpoints siguen fallando
1. Revisa los logs en Railway
2. Verifica que `MONGODB_URI` esté en las variables
3. Redeploya manualmente
4. Espera 2-3 minutos y vuelve a probar

## Contacto de Soporte

Si después de seguir estos pasos sigues teniendo problemas:

1. Revisa los logs completos de Railway
2. Copia el error exacto
3. Verifica que TODAS las variables de entorno estén configuradas
4. Contacta al equipo de desarrollo con:
   - Screenshot del error
   - Screenshot de las variables de entorno (oculta valores sensibles)
   - Logs de Railway
