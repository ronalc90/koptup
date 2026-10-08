# 🚀 Inicio Rápido - KopTup

## Opción 1: Con Docker (Recomendado)

### Prerrequisitos
- Docker Desktop instalado y ejecutándose
- Node.js 20.9+ (para desarrollo)

### Pasos:

1. **Asegúrate de que Docker Desktop esté corriendo**
   - En Windows: Abre Docker Desktop desde el menú inicio
   - Espera a que el icono de Docker en la bandeja del sistema esté verde

2. **Inicia todos los servicios:**
   ```bash
   docker-compose up -d
   ```

3. **Accede a:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs

4. **Ver logs:**
   ```bash
   docker-compose logs -f
   ```

---

## Opción 2: Sin Docker (Solo Frontend)

Si no quieres usar Docker ahora, puedes ejecutar solo el frontend:

### 1. Instalar dependencias:
```bash
npm install
```

### 2. Ir al directorio del frontend:
```bash
cd apps/web
```

### 3. Instalar dependencias del frontend:
```bash
npm install
```

### 4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

### 5. Abrir en el navegador:
```
http://localhost:3000
```

**Nota:** Sin el backend, algunas funcionalidades no estarán disponibles (login, upload, etc.), pero podrás ver el diseño y la UI.

---

## Opción 3: Backend Local (Requiere PostgreSQL y Redis instalados)

Si tienes PostgreSQL y Redis instalados localmente:

### 1. Crear base de datos:
```bash
psql -U postgres
CREATE DATABASE koptup_db;
CREATE USER koptup_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE koptup_db TO koptup_user;
\q
```

### 2. Ejecutar el schema:
```bash
psql -U koptup_user -d koptup_db < packages/database/init.sql
```

### 3. Iniciar Redis:
```bash
redis-server
```

### 4. Instalar dependencias del backend:
```bash
cd apps/backend
npm install
```

### 5. Crear directorio de uploads:
```bash
mkdir uploads
```

### 6. Ejecutar backend:
```bash
npm run dev
```

### 7. En otra terminal, ejecutar frontend:
```bash
cd apps/web
npm run dev
```

---

## 🎯 Primeros Pasos Después de Iniciar

### 1. Crear un usuario:
- Ve a http://localhost:3000
- Click en "Registrarse" o usa la API directamente

### 2. O usa el usuario admin:
```
Email: admin@koptup.com
Password: Admin123!
```

### 3. Explorar:
- **Home**: Servicios y presentación
- **/pricing**: Planes disponibles
- **/contact**: Formulario de contacto
- **/api-docs**: Documentación de API (backend)

---

## ⚙️ Configuración Mínima

El archivo `.env` ya está creado con valores de desarrollo. Para usar funcionalidades adicionales:

### Para Upload de Archivos a S3:
```env
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_S3_BUCKET=tu_bucket
```

### Para Chatbot con IA:
```env
OPENAI_API_KEY=sk-tu_openai_key
```

---

## 🔧 Troubleshooting

### Error: Docker no se puede conectar
**Solución:** Asegúrate de que Docker Desktop esté corriendo

### Error: Puerto 3000 o 3001 ya en uso
**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# O cambia el puerto en el archivo de configuración
```

### Error: Cannot find module
**Solución:**
```bash
rm -rf node_modules
npm install
```

### Error: Database connection failed
**Solución:** Verifica que PostgreSQL esté corriendo y las credenciales en `.env` sean correctas

---

## 📝 Comandos Útiles

```bash
# Ver logs de Docker
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener todo
docker-compose down

# Rebuild
docker-compose up -d --build

# Limpiar todo
docker-compose down -v
```

---

## 🎨 Siguiente: Personalización

1. **Cambiar colores:**
   - Edita `apps/web/tailwind.config.js`

2. **Modificar contenido:**
   - Edita `apps/web/messages/es.json` y `en.json`

3. **Agregar servicios:**
   - Edita `apps/web/src/app/page.tsx`

---

## 📞 ¿Necesitas Ayuda?

- Revisa el README.md completo
- Revisa DEPLOYMENT.md para producción
- Abre un issue en GitHub
