# Configuración de Variables de Entorno para Vercel

Este documento explica cómo configurar las variables de entorno en Vercel para que el frontend se conecte correctamente al backend en Railway.

## 📋 Variables Requeridas

### 1. NEXT_PUBLIC_API_URL
**Descripción:** URL del backend en Railway (sin `/api` al final)
**Valor:** Obtén tu URL de Railway siguiendo estos pasos:
1. Ve a https://railway.app y abre tu proyecto
2. Selecciona el servicio del backend
3. En "Settings" → "Public Networking" → Copia la URL
4. Usa esa URL **SIN** agregar `/api` al final

**Ejemplo:**
```
NEXT_PUBLIC_API_URL=https://koptup-backend-production.up.railway.app
```

❌ **Incorrecto:** `https://koptup-backend-production.up.railway.app/api`
✅ **Correcto:** `https://koptup-backend-production.up.railway.app`

### 2. NEXT_PUBLIC_APP_NAME
**Descripción:** Nombre de la aplicación
**Valor:** `KopTup`

### 3. NEXT_PUBLIC_APP_URL
**Descripción:** URL de tu frontend en Vercel
**Valor:** `https://tu-dominio.vercel.app`

### 4. NEXT_PUBLIC_GOOGLE_CLIENT_ID (Opcional)
**Descripción:** Google OAuth Client ID
**Valor:** Obtén esto desde Google Cloud Console si usas OAuth

---

## 🔧 Cómo Configurar en Vercel

### Paso 1: Accede a tu proyecto en Vercel
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto KopTup

### Paso 2: Agrega las Variables de Entorno
1. Click en "Settings" en el menú superior
2. Click en "Environment Variables" en el menú lateral
3. Agrega cada variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tu-backend.up.railway.app`
   - **Environments:** Marca "Production", "Preview" y "Development"
   - Click "Save"

4. Repite para las demás variables

### Paso 3: Redeploy
1. Ve a la pestaña "Deployments"
2. Click en los tres puntos (...) del deployment más reciente
3. Click "Redeploy"
4. Selecciona "Use existing Build Cache" (más rápido)
5. Click "Redeploy"

---

## 🔐 Configuración de CORS en Railway

Para que el frontend pueda comunicarse con el backend, necesitas configurar CORS:

### En Railway:
1. Ve a tu proyecto backend en Railway
2. Click en "Variables"
3. Agrega o actualiza:
   ```
   CORS_ORIGIN=https://tu-dominio.vercel.app
   ```
   Si quieres permitir múltiples dominios:
   ```
   CORS_ORIGIN=https://tu-dominio.vercel.app,https://tu-dominio-preview.vercel.app,http://localhost:3000
   ```

4. El backend se redeployará automáticamente

---

## ✅ Verificación

### 1. Verifica que el backend esté accesible:
Abre en tu navegador:
```
https://tu-backend.up.railway.app/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T...",
  "uptime": 123.45
}
```

### 2. Verifica la conexión desde el frontend:
1. Abre tu sitio en Vercel
2. Abre las DevTools (F12)
3. Ve a la pestaña "Network"
4. Intenta hacer login
5. Verifica que las peticiones vayan a tu backend de Railway
6. Verifica que no haya errores de CORS

---

## 🐛 Solución de Problemas

### Error: "Endpoint not found"
**Causa:** La variable `NEXT_PUBLIC_API_URL` tiene `/api` al final
**Solución:** Quita el `/api` del final de la URL

### Error: CORS
**Causa:** El dominio de Vercel no está en `CORS_ORIGIN` del backend
**Solución:** Agrega tu dominio de Vercel a la variable `CORS_ORIGIN` en Railway

### Error: "Network Error"
**Causa:** El backend no está accesible o la URL es incorrecta
**Solución:**
1. Verifica que el backend esté corriendo en Railway
2. Verifica que la URL sea correcta (prueba abriendo `/health`)
3. Verifica que no tenga el puerto en la URL (Railway usa HTTPS por defecto)

### El cambio no se refleja
**Causa:** Vercel usa cache del build anterior
**Solución:** Fuerza un redeploy sin cache:
1. Deployments → ... → Redeploy
2. Desmarca "Use existing Build Cache"
3. Redeploy

---

## 📚 Recursos

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Public Networking](https://docs.railway.app/deploy/exposing-your-app)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
