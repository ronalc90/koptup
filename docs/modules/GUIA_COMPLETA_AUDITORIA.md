# 🏥 GUÍA COMPLETA - Sistema de Auditoría Médica Automatizada

**Versión**: 1.0.0
**Fecha**: 2024
**Estado**: ✅ 100% Funcional

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Poblar la Base de Datos](#poblar-la-base-de-datos)
5. [Uso del Sistema](#uso-del-sistema)
6. [Modelos de Datos](#modelos-de-datos)
7. [APIs Disponibles](#apis-disponibles)
8. [Scrapers de Datos](#scrapers-de-datos)
9. [Motor de Auditoría](#motor-de-auditoría)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen Ejecutivo

### ¿Qué es este sistema?

Un sistema completo de **auditoría médica automatizada** con inteligencia artificial que:

✅ Extrae datos de facturas médicas usando OpenAI GPT-4
✅ Valida autorizaciones y tarifas automáticamente
✅ Detecta glosas y diferencias de facturación
✅ Genera reportes en Excel profesionales
✅ Maneja convenios entre EPS e IPS
✅ Procesa RIPS y documentos médicos

### Estado Actual

| Componente | Estado | Notas |
|------------|--------|-------|
| **Modelos de Datos** | ✅ 100% | 16 modelos implementados |
| **APIs REST** | ✅ 100% | 45+ endpoints |
| **Scrapers** | ✅ 100% | 4 scrapers funcionales |
| **Seeds** | ✅ 100% | 9 seeds con datos de ejemplo |
| **Frontend** | ✅ 100% | Interfaz completa en React/Next.js |
| **Motor de Auditoría** | ✅ 100% | 9 reglas automáticas |
| **Generación Excel** | ✅ 100% | 5 hojas profesionales |

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│  /demo/cuentas-medicas - Dashboard - Listado - Detalle         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                  │
├─────────────────────────────────────────────────────────────────┤
│  APIs REST:                                                      │
│  • /api/auditoria/* (10 endpoints)                             │
│  • /api/cuentas/* (20 endpoints)                               │
│  • /api/cups/* (9 endpoints)                                   │
│  • /api/expert/* (6 endpoints)                                 │
├─────────────────────────────────────────────────────────────────┤
│  Servicios:                                                      │
│  • auditoria.service.ts (motor principal)                      │
│  • openai.service.ts (extracción IA)                          │
│  • excel-auditoria.service.ts (reportes)                       │
│  • cups-lookup.service.ts (búsqueda CUPS)                     │
├─────────────────────────────────────────────────────────────────┤
│  Motor de Reglas:                                               │
│  • expert-rules.service.ts (9 reglas automáticas)             │
│  • validation.service.ts (validaciones)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BASE DE DATOS (MongoDB)                      │
├─────────────────────────────────────────────────────────────────┤
│  Colecciones Principales:                                        │
│  • facturas (facturas médicas)                                 │
│  • atenciones (atenciones por paciente)                        │
│  • procedimientos (códigos CUPS facturados)                    │
│  • glosas (glosas generadas)                                   │
│  • cups (catálogo de procedimientos)                           │
│  • diagnosticos (CIE-10)                                       │
│  • medicamentos (INVIMA)                                       │
│  • tarifarios (ISS, SOAT)                                      │
│  • convenios_tarifas (EPS-IPS)                                 │
│  • eps_maestro, ips_maestro (catálogos)                        │
│  • autorizaciones (autorizaciones vigentes)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalación y Configuración

### 1. Prerrequisitos

```bash
- Node.js 18+
- MongoDB 6.0+
- npm o yarn
- OpenAI API Key (opcional para extracción de PDFs)
```

### 2. Instalar Dependencias

```bash
cd /home/user/koptup
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en `/apps/backend`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/koptup

# OpenAI (opcional)
OPENAI_API_KEY=sk-...

# Servidor
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Iniciar MongoDB

```bash
# Ubuntu/Linux
sudo systemctl start mongod

# macOS (Homebrew)
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Iniciar el Sistema

**Backend**:
```bash
cd apps/backend
npm run dev
```

**Frontend**:
```bash
cd apps/web
npm run dev
```

**Acceder a la aplicación**:
- Frontend: http://localhost:3000/demo/cuentas-medicas
- Backend API: http://localhost:3001/api

---

## 💾 Poblar la Base de Datos

### Opción 1: Seeds de Ejemplo (Rápido - 2 minutos)

Popula la BD con datos de ejemplo (recomendado para pruebas):

```bash
cd apps/backend

# Ejecutar todos los seeds
npx ts-node src/db/seeds/index.ts
```

**Datos insertados**:
- 16 códigos CUPS
- 24 diagnósticos CIE-10
- 5 tarifarios (ISS 2001, ISS 2004, SOAT 2024, contratos EPS)
- 9 reglas de auditoría
- 6 EPS principales
- 3 IPS de ejemplo
- 6 convenios EPS-IPS
- 18 cuotas moderadoras
- 5 autorizaciones de ejemplo

---

### Opción 2: Scrapers con Datos Reales (Completo - 10-30 minutos)

Descarga datos reales de fuentes oficiales:

```bash
cd apps/backend

# Ejecutar todos los scrapers
npx ts-node src/scripts/run-all-scrapers.ts

# O ejecutar scrapers individuales:
npx ts-node src/scripts/scrapers/cups-scraper.ts      # 5,000-50,000 CUPS
npx ts-node src/scripts/scrapers/cie10-scraper.ts     # 100-14,000 CIE-10
npx ts-node src/scripts/scrapers/invima-scraper.ts    # 3,000-20,000 medicamentos
npx ts-node src/scripts/scrapers/tarifas-scraper.ts   # Actualiza tarifas
```

**Fuentes de datos oficiales**:
- **CUPS**: Datos Abiertos Colombia (https://www.datos.gov.co/)
- **CIE-10**: GitHub OPS en español
- **Medicamentos**: Datos Abiertos Colombia (INVIMA)
- **Tarifas**: Generadas sintéticamente basadas en UVR

---

### Opción 3: Combinado (Recomendado)

```bash
# 1. Ejecutar seeds para estructura base
npx ts-node src/db/seeds/index.ts

# 2. Ejecutar scrapers para completar datos
npx ts-node src/scripts/run-all-scrapers.ts
```

---

## 📱 Uso del Sistema

### 1. Crear una Cuenta de Auditoría

1. Ir a: http://localhost:3000/demo/cuentas-medicas
2. Click en "Nueva Factura"
3. Ingresar nombre de la cuenta
4. Subir archivos:
   - Excel/CSV con RIPS o facturas
   - PDFs con soportes (autorizaciones, historias clínicas)
5. Click en "Crear y Procesar"

El sistema automáticamente:
- Extrae datos de los archivos con OpenAI
- Crea la factura en MongoDB
- Genera atenciones y procedimientos
- Está lista para auditar

---

### 2. Ejecutar Auditoría Automática

**Desde la interfaz**:
1. En el listado de facturas, click en "Ver Detalle"
2. Click en "Ejecutar Auditoría"
3. Esperar 2-15 segundos
4. Ver resultados: glosas, diferencias, valores

**Desde la API**:
```bash
curl -X POST http://localhost:3001/api/auditoria/facturas/{facturaId}/auditar
```

---

### 3. Descargar Reporte en Excel

**Desde la interfaz**:
- Click en "Descargar Excel"

**Desde la API**:
```bash
curl -X GET http://localhost:3001/api/auditoria/facturas/{facturaId}/excel \
  --output factura.xlsx
```

**Contenido del Excel** (5 hojas):
1. **Resumen**: Información general de la factura
2. **Atenciones**: Detalle de atenciones por paciente
3. **Procedimientos**: CUPS facturados con valores
4. **Glosas**: Listado completo de glosas generadas
5. **Estadísticas**: Métricas y análisis

---

## 📊 Modelos de Datos

### Modelos Principales

#### 1. **Factura** (apps/backend/src/models/Factura.ts)

Factura médica principal.

```typescript
{
  numeroFactura: "S9033866630",
  fechaEmision: Date,
  ips: { nit, nombre },
  eps: { nit, nombre },
  regimen: "Contributivo" | "Subsidiado",
  valorBruto: 1500000,
  totalGlosas: 250000,
  valorAceptado: 1250000,
  estado: "Radicada" | "En Auditoría" | "Auditada" | "Glosada",
  auditoriaCompletada: false
}
```

#### 2. **Atencion** (apps/backend/src/models/Atencion.ts)

Atención médica de un paciente.

```typescript
{
  facturaId: ObjectId,
  numeroAtencion: "001",
  paciente: {
    tipoDocumento: "RC",
    numeroDocumento: "1072681696",
    edad: 3,
    sexo: "M"
  },
  diagnosticoPrincipal: { codigoCIE10: "Q659", descripcion: "..." },
  copago: 4700,
  tieneAutorizacion: true,
  autorizacionValida: true
}
```

#### 3. **Procedimiento** (apps/backend/src/models/Procedimiento.ts)

Procedimiento médico facturado.

```typescript
{
  atencionId: ObjectId,
  codigoCUPS: "890201",
  descripcion: "Consulta medicina general",
  cantidad: 1,
  valorUnitarioIPS: 45000,      // Lo que cobra la IPS
  valorUnitarioContrato: 38586,  // Lo que paga la EPS según contrato
  diferenciaTarifa: 6414,        // Diferencia = Glosa
  glosas: [ObjectId],
  totalGlosas: 6414,
  duplicado: false
}
```

#### 4. **Glosa** (apps/backend/src/models/Glosa.ts)

Glosa generada automática o manualmente.

```typescript
{
  procedimientoId: ObjectId,
  codigo: "G001",
  tipo: "Tarifa" | "Autorización" | "Duplicidad" | "Pertinencia",
  descripcion: "Diferencia de tarifa",
  valorGlosado: 6414,
  estado: "Pendiente" | "Aceptada" | "Rechazada",
  generadaAutomaticamente: true
}
```

### Modelos de Catálogo

#### 5. **CUPS** - Códigos de Procedimientos

```typescript
{
  codigo: "890201",
  descripcion: "Consulta de primera vez por medicina general",
  categoria: "Consulta",
  especialidad: "Medicina General",
  tarifaSOAT: 38586,
  tarifaISS2001: 35000,
  tarifaISS2004: 40000,
  uvr: 0.857,
  embedding: [1536 números],  // Para búsqueda semántica con OpenAI
  metadata: {
    requiereAutorizacion: true,
    duracionPromedio: 20,
    nivelComplejidad: "bajo"
  }
}
```

#### 6. **Diagnostico** - CIE-10

```typescript
{
  codigoCIE10: "I10",
  descripcion: "Hipertensión esencial (primaria)",
  categoria: "Enfermedades del sistema circulatorio",
  gravedad: "moderada",
  cronico: true,
  requiereHospitalizacion: false
}
```

#### 7. **Medicamento** - INVIMA/CUM

```typescript
{
  codigoCUM: "19982456",
  codigoATC: "N02BE01",
  principioActivo: "Acetaminofén",
  nombreComercial: "Acetaminofén",
  concentracion: "500 mg",
  formaFarmaceutica: "Tableta",
  viaAdministracion: ["Oral"],
  pos: true,
  precioUnitario: 150
}
```

### Modelos de Negocio

#### 8. **ConvenioTarifa** - Convenios EPS-IPS

```typescript
{
  nombre: "Convenio NUEVA EPS - POS 2024",
  epsNit: "800249604",
  epsNombre: "NUEVA EPS",
  tipoConvenio: "POS",
  tipoTarifario: "ISS_2004",
  factorGlobal: 1.15,  // ISS 2004 + 15%
  vigenciaInicio: Date,
  tarifasPorCUPS: [
    { codigoCUPS: "890201", valorPactado: 45000 }
  ],
  reglasEspeciales: [
    { categoria: "Cirugía", factorMultiplicador: 1.20 }
  ]
}
```

#### 9. **Autorizacion** - Autorizaciones Vigentes

```typescript
{
  numeroAutorizacion: "AUT20240001",
  epsNit: "800249604",
  ipsNit: "899999001",
  paciente: { tipoDocumento, numeroDocumento, nombres },
  diagnosticoPrincipal: { codigoCIE10, descripcion },
  serviciosAutorizados: [
    { codigoCUPS: "890201", cantidad: 3, cantidadUtilizada: 1 }
  ],
  estado: "ACTIVA" | "VENCIDA" | "UTILIZADA",
  fechaVencimiento: Date
}
```

---

## 🔌 APIs Disponibles

### API de Auditoría

**Base URL**: `http://localhost:3001/api/auditoria`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/estadisticas` | Dashboard de estadísticas |
| GET | `/facturas` | Listar facturas con filtros |
| GET | `/facturas/:id` | Obtener factura completa |
| POST | `/facturas/:id/auditar` | Ejecutar auditoría automática |
| GET | `/facturas/:id/excel` | Descargar Excel de factura |
| POST | `/procesar-archivos` | Crear factura desde archivos |
| GET | `/tarifarios` | Listar tarifarios disponibles |
| PATCH | `/glosas/:id` | Actualizar glosa manualmente |

**Ejemplo - Ejecutar Auditoría**:

```bash
curl -X POST http://localhost:3001/api/auditoria/facturas/673d9f6a123456789abcdef/auditar
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "facturaId": "673d9f6a123456789abcdef",
    "totalGlosas": 125000,
    "valorAceptado": 1375000,
    "glosas": [
      {
        "codigo": "G001",
        "tipo": "Tarifa",
        "descripcion": "Diferencia de tarifa en procedimiento 890201",
        "valorGlosado": 6414
      }
    ],
    "auditoriaCompletada": true
  }
}
```

---

### API de CUPS

**Base URL**: `http://localhost:3001/api/cups`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/buscar-semantica` | Búsqueda con OpenAI embeddings |
| POST | `/buscar-similares` | Encontrar CUPS similares |
| GET | `/estadisticas` | Estadísticas de CUPS |
| POST | `/vectorizar` | Generar embeddings para todos |

**Ejemplo - Búsqueda Semántica**:

```bash
curl -X POST http://localhost:3001/api/cups/buscar-semantica \
  -H "Content-Type: application/json" \
  -d '{"query": "resonancia magnética de rodilla", "limite": 5}'
```

---

## 🔍 Scrapers de Datos

Los scrapers están ubicados en: `apps/backend/src/scripts/scrapers/`

### 1. CUPS Scraper

**Archivo**: `cups-scraper.ts`
**Fuente**: Datos Abiertos Colombia
**URL**: https://www.datos.gov.co/resource/9zcz-bjue.json

**Ejecutar**:
```bash
npx ts-node src/scripts/scrapers/cups-scraper.ts
```

**Resultado**: 5,000-50,000 códigos CUPS

---

### 2. CIE-10 Scraper

**Archivo**: `cie10-scraper.ts`
**Fuente**: GitHub OPS (español)
**Fallback**: 40+ diagnósticos comunes hardcodeados

**Ejecutar**:
```bash
npx ts-node src/scripts/scrapers/cie10-scraper.ts
```

**Resultado**: 100-14,000 diagnósticos

---

### 3. INVIMA Scraper

**Archivo**: `invima-scraper.ts`
**Fuente**: Datos Abiertos Colombia (CUM)
**Fallback**: 20 medicamentos esenciales

**Ejecutar**:
```bash
npx ts-node src/scripts/scrapers/invima-scraper.ts
```

**Resultado**: 3,000-20,000 medicamentos

---

### 4. Tarifas Scraper

**Archivo**: `tarifas-scraper.ts`
**Método**: Generación sintética basada en UVR
**Tarifarios**: ISS 2001, ISS 2004, SOAT 2024

**Ejecutar**:
```bash
npx ts-node src/scripts/scrapers/tarifas-scraper.ts
```

**Resultado**: Actualiza tarifas en todos los CUPS

---

## ⚙️ Motor de Auditoría

### Reglas Automáticas Implementadas

El sistema aplica 9 reglas de auditoría automáticamente:

| # | Regla | Descripción | Acción |
|---|-------|-------------|--------|
| 1 | **Falta Autorización** | Servicio requiere autorización pero no tiene | Glosa total |
| 2 | **Diferencia de Tarifa** | Valor IPS > Valor contrato + 5% | Glosa diferencia |
| 3 | **Código CUPS Inválido** | Código no existe en BD | Glosa total |
| 4 | **Procedimiento Duplicado** | Mismo código + fecha en la misma atención | Glosa duplicado |
| 5 | **Falta Soporte** | Procedimiento requiere soporte documental | Glosa parcial |
| 6 | **Diagnóstico No Pertinente** | Diagnóstico no corresponde con procedimiento | Glosa 20% |
| 7 | **Autorización Vencida** | Autorización existe pero está vencida | Glosa total |
| 8 | **Medicamento No POS** | Medicamento no está en POS y no tiene autorización | Glosa total |
| 9 | **Excede Cantidad Autorizada** | Cantidad facturada > cantidad autorizada | Glosa excedente |

### Flujo de Auditoría

```
1. Obtener Factura
   ↓
2. Buscar Tarifario Vigente (por EPS o default ISS 2004)
   ↓
3. Actualizar Valores de Contrato en Procedimientos
   ↓
4. Detectar Duplicidades
   ↓
5. Validar Autorizaciones
   ↓
6. Validar Pertinencia Médica
   ↓
7. Aplicar Reglas de Auditoría (9 reglas)
   ↓
8. Calcular Totales:
   - Valor Bruto Facturado
   - Total Glosas
   - Valor Aceptado
   - Cuota Moderadora
   - Valor Neto EPS
   ↓
9. Actualizar Estado de Factura
   ↓
10. Generar Reporte Excel
```

---

## 🛠️ Troubleshooting

### Problema: MongoDB no se conecta

**Solución**:
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Si no está corriendo, iniciarlo
sudo systemctl start mongod

# Verificar puerto
netstat -an | grep 27017
```

---

### Problema: Error al ejecutar scrapers

**Error común**: `Module 'cheerio' not found`

**Solución**:
```bash
cd apps/backend
npm install cheerio csv-parser
```

---

### Problema: OpenAI API Key inválida

**Solución**:
- El sistema funciona sin OpenAI para la mayoría de funciones
- OpenAI solo es necesario para:
  1. Extracción de datos de PDFs
  2. Búsqueda semántica de CUPS

Para desactivar estas funciones, comentar en `.env`:
```env
# OPENAI_API_KEY=sk-...
```

---

### Problema: No aparecen datos en el frontend

**Solución**:
1. Verificar que backend esté corriendo en puerto 3001
2. Verificar que MongoDB tenga datos:
   ```bash
   mongosh koptup
   db.cups.countDocuments()
   db.diagnosticos.countDocuments()
   ```
3. Si no hay datos, ejecutar seeds:
   ```bash
   npx ts-node src/db/seeds/index.ts
   ```

---

## 📞 Soporte

Para más información, revisar:
- `SISTEMA_AUDITORIA_README.md` - Documentación del sistema de auditoría
- `apps/backend/src/scripts/scrapers/README.md` - Guía de scrapers
- `DEPLOYMENT.md` - Guía de despliegue
- `QUICKSTART.md` - Inicio rápido

---

**Sistema de Auditoría Médica KopTup**
**© 2024 - Todos los derechos reservados**
