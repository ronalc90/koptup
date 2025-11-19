# Configuración: Módulo Cuentas Médicas

Este documento explica cómo resolver el error 404 en los endpoints de Auditoría del módulo de Cuentas Médicas.

## Problema

Los endpoints `/api/auditoria/estadisticas` y `/api/auditoria/procesar-archivos` devuelven error 404 porque:

1. El servidor backend no está corriendo
2. MongoDB no está disponible

## Solución Paso a Paso

### 1. Verificar que tienes Docker instalado

```bash
docker --version
docker-compose --version
```

Si no tienes Docker instalado, descárgalo desde: https://www.docker.com/products/docker-desktop

### 2. Iniciar MongoDB con Docker Compose

Desde el directorio raíz del proyecto:

```bash
docker-compose -f docker-compose.dev.yml up -d mongo
```

Esto iniciará MongoDB en el puerto 27017 con las siguientes credenciales:
- Usuario: `mongo`
- Contraseña: `QTaKycIfxXPWhlXWuRkzTzHxtCFBreSM`
- Base de datos: `koptup`

### 3. Crear archivo .env en apps/backend

Si no existe, crea el archivo `apps/backend/.env` con el siguiente contenido:

```env
# SERVER CONFIGURATION
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001

# DATABASE
MONGODB_URI=mongodb://mongo:QTaKycIfxXPWhlXWuRkzTzHxtCFBreSM@localhost:27017/koptup?authSource=admin

# CORS CONFIGURATION
CORS_ORIGIN=http://localhost:3000,http://localhost:3005

# JWT
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,docx,txt,csv,xlsx,xls

# OpenAI Configuration (opcional para desarrollo)
OPENAI_API_KEY=sk-proj-placeholder
OPENAI_MODEL=gpt-4o-mini
```

### 4. Instalar dependencias del backend

```bash
cd apps/backend
npm install
```

### 5. Iniciar el servidor backend

```bash
npm run dev
```

El servidor debería iniciar en `http://localhost:3001` y verás algo como:

```
Servidor escuchando en http://localhost:3001
Docs: http://localhost:3001/api-docs
Health: http://localhost:3001/health
```

### 6. Verificar que todo funciona

Abre otra terminal y ejecuta:

```bash
# Verificar salud del servidor
curl http://localhost:3001/health

# Verificar endpoint de estadísticas
curl http://localhost:3001/api/auditoria/estadisticas
```

### 7. Iniciar el frontend (si aún no está corriendo)

En otra terminal:

```bash
cd apps/web
npm install
npm run dev
```

El frontend debería iniciar en `http://localhost:3000` o `http://localhost:3005`

## Verificación

Una vez que todo esté corriendo, visita:
- http://localhost:3000/demo/cuentas-medicas (o el puerto donde corre tu frontend)

Los endpoints de auditoria deberían funcionar correctamente y no deberías ver más errores 404.

## Troubleshooting

### MongoDB no se conecta

Si ves errores de conexión a MongoDB:

1. Verifica que el contenedor esté corriendo:
   ```bash
   docker ps | grep mongo
   ```

2. Si no está corriendo, inícialo:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d mongo
   ```

3. Verifica los logs:
   ```bash
   docker logs koptup-mongo
   ```

### El servidor backend no inicia

1. Verifica que el puerto 3001 no esté ocupado:
   ```bash
   lsof -i :3001
   # O en Windows:
   netstat -ano | findstr :3001
   ```

2. Verifica que el archivo .env existe y tiene el formato correcto

3. Revisa los logs del servidor para identificar errores específicos

### Los endpoints aún dan 404

1. Verifica que el frontend esté apuntando a la URL correcta del backend
2. Revisa que `NEXT_PUBLIC_API_URL` en el frontend apunte a `http://localhost:3001`
3. Asegúrate de que el servidor backend esté corriendo en el puerto correcto

## Endpoints Disponibles

Una vez configurado, estos endpoints estarán disponibles:

- `GET /api/auditoria/estadisticas` - Obtener estadísticas del dashboard
- `POST /api/auditoria/procesar-archivos` - Procesar archivos y crear factura
- `GET /api/auditoria/facturas` - Listar facturas
- `GET /api/auditoria/facturas/:id` - Obtener factura por ID
- `POST /api/auditoria/facturas/:id/auditar` - Ejecutar auditoría
- `GET /api/auditoria/facturas/:id/excel` - Generar reporte Excel

Ver documentación completa en: http://localhost:3001/api-docs

## Ubicación del Código

- **Rutas backend**: `apps/backend/src/routes/auditoria.routes.ts`
- **Controlador**: `apps/backend/src/controllers/auditoria.controller.ts`
- **API frontend**: `apps/web/src/app/demo/cuentas-medicas/api.ts`
- **Página**: `apps/web/src/app/demo/cuentas-medicas/page.tsx`
