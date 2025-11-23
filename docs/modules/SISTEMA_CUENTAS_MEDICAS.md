# Sistema de Cuentas Médicas con IA

## 📋 Descripción General

Sistema completo de procesamiento inteligente de cuentas médicas con extracción automática de datos usando OpenAI y generación de reportes Excel multi-pestaña.

## 🎯 Funcionalidades Implementadas

### ✅ Módulo 1: Documentos Ley 100
- Carga de documentos normativos (PDF, DOCX, TXT)
- Gestión de base de conocimiento normativa
- Eliminación de documentos individuales

### ✅ Módulo 2: Gestión de Cuentas Médicas
- Creación de cuentas con modal
- Carga de PDFs asociados a cada cuenta
- Vista detallada de archivos por cuenta
- Eliminación de cuentas completas
- Eliminación de archivos individuales

### ✅ Módulo 3: Procesamiento con IA
- Extracción automática de datos usando GPT-4
- Caché inteligente de extracciones
- Procesamiento por lotes

### ✅ Generación de Excel con 10 Pestañas

El sistema genera un archivo Excel consolidado con las siguientes pestañas:

#### 1. Datos Factura
- Nro_Factura, Nro_Radicacion
- Fechas (Factura, Radicación, Vencimiento)
- IPS y NIT_IPS
- Aseguradora y NIT_Aseguradora
- Convenio, Estado, Observaciones

#### 2. Datos Paciente
- Tipo y Número de Documento
- Nombre Completo
- Fecha de Nacimiento, Edad
- Sexo, Dirección, Teléfono
- Tipo de Afiliado, Categoría
- Régimen, Episodio

#### 3. Atención Médica
- Fechas de Ingreso y Egreso
- Servicio de Atención
- Tipo de Atención (Ambulatoria/Hospitalaria)
- Causa Externa
- Finalidad y Motivo de Consulta
- Especialidad
- Profesional Tratante y Documento

#### 4. Diagnósticos
- Código CIE-10
- Descripción del Diagnóstico
- Tipo (Principal, Secundario, etc.)
- Confirmación
- Médico Responsable

#### 5. Procedimientos/Servicios
- Código CUPS
- Descripción del Servicio
- Fecha de Realización
- Cantidad
- Valores (Unitario y Total)
- Profesional que realizó

#### 6. Valores y Liquidación
- Valor Bruto
- Valor IVA
- Valor Descuentos
- Valor Neto
- Cuota Moderadora
- Valor a Cobrar EPS
- Valor Cargo Paciente
- Pagos de Otras Instituciones

#### 7. Autorizaciones
- Tipo de Autorización
- Número de Autorización
- Fecha
- PAC
- Forma de Pago
- Observaciones

#### 8. Órdenes Clínicas
- Código de Orden
- Descripción
- Fecha
- Profesional
- Prioridad (Normal/Prioritaria)
- Estado

#### 9. Validaciones y Glosas
- Validación de Código CUPS
- Verificación de Tarifas
- Validación de Diagnósticos CIE-10
- Coherencia Clínica
- Requerimientos de Autorización
- Vigencia de Autorizaciones
- Completitud Documental
- Detección de Glosas

#### 10. Antecedentes Clínicos
- Fecha del Antecedente
- Tipo (Patológicos, Traumáticos, etc.)
- Descripción
- Médico Responsable

## 🚀 Cómo Usar el Sistema

### 1. Preparar Documentos Normativos (Opcional)
```
1. Ir a la pestaña "Documentos Ley 100"
2. Subir archivos normativos (Ley 100, manuales, resoluciones)
3. Estos documentos se usarán para validaciones futuras (RAG)
```

### 2. Crear una Cuenta Médica
```
1. Ir a la pestaña "Cuentas Médicas"
2. Click en "Nueva Cuenta"
3. Ingresar nombre (ej: "Paciente Juan Pérez - Enero 2025")
4. (Opcional) Seleccionar PDFs para subir inmediatamente
5. Click en "Crear Cuenta"
```

### 3. Agregar Documentos a una Cuenta
```
Opción A - Durante la creación:
  - Seleccionar PDFs al crear la cuenta

Opción B - Después de crear:
  - Click en el botón "Subir" de la cuenta
  - O hacer click en la cuenta para ver detalles
  - Agregar PDFs desde el modal de detalles
```

### 4. Gestionar Archivos
```
Ver detalles de cuenta:
  - Click en cualquier cuenta
  - Ver lista de todos los PDFs
  - Eliminar archivos individuales (botón de basura)
  - Agregar más archivos
  - Eliminar cuenta completa
```

### 5. Procesar Cuentas
```
1. Ir a la pestaña "Procesamiento"
2. Seleccionar las cuentas a procesar (checkboxes)
3. Click en "Procesar X Cuenta(s) Seleccionada(s)"
4. Esperar el procesamiento (puede tomar varios minutos)
5. El Excel se descarga automáticamente
```

## 📊 Estructura de Datos Extraídos

### Extracción Automática con IA

El sistema usa GPT-4 para extraer automáticamente:

```javascript
{
  // Datos de Facturación
  nro_factura: "S9033866630",
  nro_radicacion: "304052647",
  fecha_factura: "15/07/2025",
  ips: "COLSUBSIDIO",
  aseguradora: "NUEVA EPS S.A.",

  // Datos del Paciente
  nombre_completo: "THIAGO GABRIEL SAPUYRES",
  numero_documento: "1072681696",
  fecha_nacimiento: "28/01/2024",
  sexo: "Masculino",
  regimen: "CONTRIBUTIVO",

  // Arrays de datos complejos
  diagnosticos: [...],
  procedimientos: [...],
  autorizaciones: [...],
  ordenes_clinicas: [...],
  antecedentes: [...]
}
```

### Caché Inteligente

- Primera vez: Procesa con OpenAI (30-40 segundos)
- Veces siguientes: Usa caché (instantáneo)
- El caché se almacena en MongoDB

## 🔧 Configuración Técnica

### Variables de Entorno Requeridas

```env
# MongoDB (REQUERIDO)
MONGODB_URI=mongodb+srv://...

# OpenAI (REQUERIDO para procesamiento)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Servidor
PORT=3001
```

### Endpoints API

```
POST   /api/cuentas                    # Crear cuenta
GET    /api/cuentas                    # Listar cuentas
GET    /api/cuentas/:id                # Obtener cuenta por ID
DELETE /api/cuentas/:id                # Eliminar cuenta
POST   /api/cuentas/:id/upload         # Subir PDFs a cuenta
DELETE /api/cuentas/:id/files/:filename # Eliminar archivo de cuenta

POST   /api/ley100/upload              # Subir documentos Ley100
GET    /api/ley100                     # Listar documentos Ley100
DELETE /api/ley100/:id                 # Eliminar documento Ley100

POST   /api/process                    # Procesar cuentas
GET    /api/export?file=...            # Descargar Excel
```

## 🎨 Características del Excel Generado

### Formato Profesional
- ✅ Headers con fondo azul y texto blanco
- ✅ Anchos de columna optimizados
- ✅ Formato de moneda en valores ($#,##0.00)
- ✅ 10 pestañas organizadas
- ✅ Datos relacionados por paciente

### Validaciones Incluidas
- ✅ Verificación de autorizaciones
- ⏳ Validación de códigos CUPS (pendiente RAG)
- ⏳ Validación de tarifas (pendiente RAG)
- ⏳ Validación CIE-10 (pendiente RAG)
- ⏳ Coherencia clínica (pendiente RAG)
- ⏳ Detección automática de glosas (pendiente RAG)

## 🔮 Funcionalidades Futuras (RAG)

### Fase 2: Sistema RAG Completo
```
1. Validar códigos CUPS contra catálogo actualizado
2. Verificar tarifas según convenio y manual ISS
3. Validar diagnósticos CIE-10 y coherencia clínica
4. Detectar glosas automáticamente según normativa
5. Verificar requisitos de autorización según procedimiento
6. Analizar completitud documental
7. Calcular diferencias de valores (glosas)
8. Sugerir acciones correctivas
```

### Implementación Planeada
```typescript
// Usar documentos Ley100 como base de conocimiento
const validaciones = await validarConRAG({
  codigosCUPS: extracciones.procedimientos,
  diagnosticos: extracciones.diagnosticos,
  valores: extracciones.valores,
  documentosLey100: ley100Docs // Base de conocimiento
});
```

## 📝 Logs y Debugging

### Logs del Servidor
```bash
# Ver logs en tiempo real
cd apps/backend
npm run dev

# Logs importantes:
- "MongoDB connected successfully" ✓
- "Rutas registradas" ✓
- "Processing X cuenta(s)..."
- "Extracting medical data from X PDF(s)..."
- "Excel file generated: ..."
```

### Troubleshooting

**Problema: "Endpoint not found" al descargar Excel**
- Solución: Ya corregido en `process.controller.ts` (línea 151)

**Problema: "Error al eliminar documento"**
- Causa: ID inválido o MongoDB no conectado
- Solución: Verificar conexión MongoDB

**Problema: Procesamiento lento**
- Normal: Extracción con IA toma 30-40 segundos por cuenta
- Mejora: Segunda vez usa caché (instantáneo)

## 🏗️ Arquitectura del Sistema

```
Frontend (Next.js)
  ↓ HTTP Requests
Backend (Express + TypeScript)
  ↓ PDF Processing
pdf-parse
  ↓ Text Extraction
OpenAI GPT-4
  ↓ Structured Data
MongoDB (Cache)
  ↓ Excel Generation
ExcelJS (10 sheets)
  ↓ Download
Usuario
```

## 📦 Dependencias Principales

### Backend
- `express` - Servidor web
- `mongoose` - MongoDB ODM
- `openai` - Cliente OpenAI
- `pdf-parse` - Extracción de texto PDF
- `exceljs` - Generación de Excel
- `multer` - Upload de archivos

### Frontend
- `next.js` - Framework React
- `tailwindcss` - Estilos
- `heroicons` - Iconos

## 👥 Soporte

Para problemas o preguntas:
1. Revisar logs del backend
2. Verificar variables de entorno
3. Asegurar MongoDB conectado
4. Verificar API Key de OpenAI válida

## 📄 Licencia

Sistema desarrollado para KopTup - Soluciones Tecnológicas
