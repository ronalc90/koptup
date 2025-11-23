# Módulo Cuentas Médicas - Documentación

## Descripción General

Sistema de procesamiento automático de cuentas médicas que utiliza OpenAI para extraer datos estructurados de PDFs médicos (facturas, historias clínicas, autorizaciones) y genera un Excel consolidado con información de prestaciones, glosas y facturación.

## Componentes Implementados

### Backend (TypeScript + Express)

**Ubicación:** `apps/backend/src/`

#### Modelos de Datos
- `models/CuentaMedica.ts` - Modelo de cuenta médica con archivos asociados
- `models/DocumentoLey100.ts` - Documentos normativos de referencia

#### Servicios
- `services/pdf.service.ts` - Extracción de texto de PDFs usando pdf-parse
- `services/openai.service.ts` - Procesamiento de texto médico con OpenAI
- `services/excel.service.ts` - Generación de Excel consolidado con exceljs

#### Controladores
- `controllers/cuentas.controller.ts` - CRUD de cuentas médicas
- `controllers/ley100.controller.ts` - Gestión de documentos Ley 100
- `controllers/process.controller.ts` - Procesamiento y generación de Excel

#### Rutas API

```
POST   /api/ley100/upload          - Subir documentos Ley 100
GET    /api/ley100                 - Listar documentos Ley 100
DELETE /api/ley100/:id             - Eliminar documento Ley 100

POST   /api/cuentas                - Crear nueva cuenta médica
GET    /api/cuentas                - Listar todas las cuentas
GET    /api/cuentas/:id            - Obtener cuenta por ID
DELETE /api/cuentas/:id            - Eliminar cuenta
POST   /api/cuentas/:id/upload     - Subir PDFs a una cuenta

POST   /api/process                - Procesar cuentas seleccionadas y generar Excel
GET    /api/export?file=filename   - Descargar archivo Excel generado
```

### Frontend (React/Next.js)

**Ubicación:** `apps/web/src/app/demo/cuentas-medicas/page.tsx`

Interfaz simplificada con dos módulos principales:

1. **Módulo A: Gestión Documental Ley 100**
   - Subir documentos normativos de referencia (PDFs, DOCX, TXT)
   - Visualizar lista de documentos subidos

2. **Módulo B: Cuentas Médicas**
   - Crear cuentas médicas con nombre descriptivo
   - Subir múltiples PDFs a cada cuenta
   - Seleccionar cuentas para procesar (checkbox)
   - Procesar con OpenAI y descargar Excel consolidado

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
# Instalar dependencias del proyecto completo
npm install

# O solo el backend
cd apps/backend
npm install exceljs  # Ya instalado
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en `apps/backend/` basado en `.env.example`:

```env
# REQUIRED para el módulo de Cuentas Médicas
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL=gpt-4o-mini

# Base de datos
MONGO_URI=mongodb://localhost:27017/koptup_db

# Puerto del servidor
PORT=3001

# CORS para el frontend
CORS_ORIGIN=http://localhost:3000,http://localhost:3005
```

### 3. Crear Directorios de Uploads

Los directorios ya fueron creados automáticamente:
- `uploads/cuentas-medicas/` - PDFs de cuentas médicas
- `uploads/ley100/` - Documentos normativos
- `uploads/exports/` - Archivos Excel generados

### 4. Iniciar el Proyecto

```bash
# Desde la raíz del proyecto
npm run dev

# El backend estará en: http://localhost:3001
# El frontend estará en: http://localhost:3000 (o 3005)
```

## Flujo de Uso

### Paso 1: Acceder al Demo
Navega a: `http://localhost:3000/demo/cuentas-medicas`
Código de acceso: `2020`

### Paso 2: (Opcional) Subir Documentos Ley 100
- Haz clic en "Subir Documentos Ley 100"
- Selecciona PDFs, DOCX o TXT de normativas
- Estos documentos sirven como contexto de referencia

### Paso 3: Crear Cuentas Médicas
- Haz clic en "Crear Nueva Cuenta"
- Ingresa un nombre descriptivo (ej: "Cuenta Hospital XYZ - Enero 2024")

### Paso 4: Subir PDFs a cada Cuenta
- Para cada cuenta, haz clic en "Subir PDFs"
- Selecciona uno o más archivos PDF médicos
- Los PDFs pueden ser: facturas, historias clínicas, autorizaciones, etc.

### Paso 5: Procesar Cuentas
- Marca las cuentas que deseas procesar usando los checkboxes
- O haz clic en "Seleccionar Todas"
- Haz clic en "Procesar Seleccionadas"
- Espera mientras OpenAI procesa los PDFs (puede tomar varios minutos)

### Paso 6: Descargar Excel
- Al finalizar, se descargará automáticamente un archivo:
  `CuentaMedicaConsolidada_YYYY-MM-DD_timestamp.xlsx`
- El Excel contiene:
  - Hoja "Cuentas Médicas": detalle de todas las prestaciones
  - Hoja "Resumen": totales por cuenta

## Estructura del Excel Generado

### Hoja "Cuentas Médicas"
| Columna | Descripción |
|---------|-------------|
| RADICADO | Número de radicado del documento |
| PACIENTE | Nombre del paciente |
| DOCUMENTO | Documento de identidad |
| EDAD | Edad del paciente |
| FECHA INGRESO | Fecha de ingreso (DD/MM/YYYY) |
| FECHA EGRESO | Fecha de egreso (DD/MM/YYYY) |
| EPS | Entidad Promotora de Salud |
| IPS | Institución Prestadora de Servicios |
| CÓDIGO CUPS | Código del procedimiento |
| DESCRIPCIÓN SERVICIO | Descripción de la prestación |
| VALOR FACTURADO | Monto facturado |
| VALOR CONTRATADO | Monto contratado |
| DIFERENCIA | Diferencia (facturado - contratado) |
| CÓDIGO GLOSA | Código de glosa si aplica |
| DESCRIPCIÓN GLOSA | Descripción de la glosa |
| DIAGNÓSTICO (CIE10) | Código CIE-10 del diagnóstico |
| MÉDICO RESPONSABLE | Nombre del médico |
| CUENTA_ID | ID de la cuenta |
| CUENTA_NOMBRE | Nombre de la cuenta |

### Hoja "Resumen"
Totales consolidados por cuenta:
- Total de prestaciones
- Total facturado
- Total contratado
- Total diferencias

## Prompt de OpenAI

El sistema utiliza el siguiente prompt para extraer datos:

```
Eres un extractor de datos médicos. Recibirás el texto plano de un PDF
(factura, historia clínica, autorización). Devuelve únicamente JSON válido.
Por cada prestación detectada extrae: [campos del esquema]

Reglas:
1. Normaliza fechas a DD/MM/YYYY
2. Si detectas varias prestaciones, devuélvelas en una lista
3. Si diferencia > 0 sin justificación, asigna código de glosa "202"
4. Devuelve solo JSON, sin explicaciones
```

## Características Técnicas

### Procesamiento con IA
- **Batching**: Procesa hasta 5 PDFs simultáneamente para optimizar tiempos
- **Cache**: Almacena resultados extraídos para evitar reprocesar
- **Reintentos**: 3 intentos con backoff exponencial en caso de errores
- **Rate Limiting**: Espera 2 segundos entre batches para evitar límites de OpenAI

### Seguridad
- Validación de tipos de archivo (solo PDFs para cuentas)
- Límites de tamaño (50MB por archivo)
- Prevención de directory traversal en descargas
- Validación de datos de entrada

### Manejo de Errores
- Logs detallados con Winston
- Respuestas JSON estandarizadas
- Mensajes de error descriptivos en UI
- Reintentos automáticos en servicios críticos

## Dependencias Nuevas

```json
{
  "exceljs": "^4.x" // Generación de Excel
}
```

Dependencias ya existentes utilizadas:
- `pdf-parse`: Extracción de texto de PDFs
- `openai`: SDK oficial de OpenAI
- `multer`: Upload de archivos
- `mongoose`: MongoDB ODM

## API Endpoints - Ejemplos de Uso

### Crear Cuenta
```bash
curl -X POST http://localhost:3001/api/cuentas \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Cuenta Hospital ABC"}'
```

### Subir PDFs a Cuenta
```bash
curl -X POST http://localhost:3001/api/cuentas/{id}/upload \
  -F "files=@factura1.pdf" \
  -F "files=@factura2.pdf"
```

### Procesar Cuentas
```bash
curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d '{"cuentaIds": ["cuenta_id_1", "cuenta_id_2"]}'
```

## Troubleshooting

### Error: "OPENAI_API_KEY not defined"
- Asegúrate de que `.env` tenga la clave configurada
- Reinicia el servidor backend

### Procesamiento muy lento
- OpenAI puede tardar 10-30 segundos por PDF
- Para 20 PDFs, espera 5-10 minutos total
- El batching ayuda a optimizar tiempos

### Excel no se descarga
- Verifica que el directorio `uploads/exports` exista
- Revisa logs del backend para errores de generación
- Verifica permisos de escritura

### PDFs sin texto extraído
- Asegúrate de que los PDFs no sean imágenes escaneadas
- PDFs con texto seleccionable funcionan mejor
- Para PDFs escaneados, se necesitaría OCR adicional

## Próximos Pasos / Mejoras Futuras

1. **OCR para PDFs escaneados**: Integrar Tesseract u OCR de AWS/Azure
2. **Vista previa de resultados**: Tabla en UI antes de descargar Excel
3. **Edición manual**: Permitir corregir datos extraídos antes de exportar
4. **Procesamiento asíncrono**: Jobs en background con Redis + Bull
5. **Múltiples formatos**: Exportar a CSV, JSON además de Excel
6. **Autenticación**: Proteger endpoints con JWT
7. **Validación contra Ley 100**: Comparar automáticamente con documentos normativos
8. **Dashboard analytics**: Gráficos de glosas, diferencias, etc.

## Soporte

Para problemas o preguntas:
- Revisa los logs del backend en consola
- Verifica la documentación de OpenAI: https://platform.openai.com/docs
- Contacta al equipo de desarrollo

---

**Versión:** 1.0.0
**Fecha:** Octubre 2025
**Autor:** KopTup Tech Solutions
