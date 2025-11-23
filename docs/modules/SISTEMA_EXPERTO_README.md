# 🏥 Sistema Experto de Auditoría de Cuentas Médicas

## 📋 Descripción General

El Sistema Experto es una solución automatizada e inteligente para la auditoría de cuentas médicas que:

- ✅ **Extrae** datos automáticamente de facturas médicas en PDF usando OpenAI
- ✅ **Valida** códigos CUPS y diagnósticos CIE-10 contra base de datos oficial
- ✅ **Detecta glosas** automáticamente mediante un motor de reglas experto
- ✅ **Calcula tarifas** según manuales tarifarios (ISS 2001, ISS 2004, SOAT)
- ✅ **Genera Excel** con 5 hojas estructuradas listo para auditoría

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA EXPERTO DE AUDITORÍA                  │
└─────────────────────────────────────────────────────────────────┘

1. ENTRADA: PDF de Factura Médica
   ↓
2. EXTRACCIÓN (OpenAI GPT-4o-mini):
   - Datos de radicación y factura
   - Datos del paciente
   - Diagnósticos CIE-10
   - Procedimientos CUPS
   - Valores y autorizaciones
   ↓
3. VALIDACIÓN EXPERTA (Motor de Reglas + BD):
   ├─→ Consulta CUPS en BD MongoDB
   ├─→ Valida diagnósticos CIE-10
   ├─→ Calcula tarifas por manual (ISS/SOAT)
   ├─→ Detecta glosas automáticamente
   └─→ Verifica coherencia clínica
   ↓
4. PROCESAMIENTO EXPERTO:
   ├─→ Aplica 8 reglas de negocio
   ├─→ Calcula diferencias de tarifa
   ├─→ Genera glosas con códigos oficiales
   └─→ Enriquece datos con información de BD
   ↓
5. SALIDA: Excel con 5 hojas
   ├─→ Hoja 1: Radicación / Factura General
   ├─→ Hoja 2: Detalle de la Factura
   ├─→ Hoja 3: Registro de Atenciones
   ├─→ Hoja 4: Procedimientos por Atención
   └─→ Hoja 5: Glosas (Consolidado)
   └─→ BONUS: Hoja 6: Resumen Ejecutivo
```

---

## 📊 Estructura del Excel de Salida

### Hoja 1: Radicación / Factura General
Información general de la factura radicada.

| Campo | Descripción |
|-------|-------------|
| Nro Radicación | Número único de radicación |
| Fecha Radicación | Fecha de radicación |
| Tipo de Cuenta | Servicios / Medicamentos / Insumos |
| Auditoría/Enfermería | Tipo de revisión |
| Régimen | Contributivo / Subsidiado |
| Producto | POS / PBS / Complementario |
| Convenio | Tipo de convenio contractual |
| IPS | Nombre de la institución |
| No de Factura | Número de factura |
| Fecha Factura | Fecha de emisión |
| No. Atenciones | Cantidad de atenciones |
| Valor Bruto Factura | Valor total cobrado |
| Valor IVA | IVA si aplica |
| Valor Neto Factura | Valor después de ajustes |
| Observación Factura | Comentarios |
| Estado Factura | EST / LIQ / DEV / PAG |
| Regional | Regional responsable |
| Tipo Documento IPS | Tipo de documento |
| Radicación PIC | Si aplica a PIC |

### Hoja 2: Detalle de la Factura
Detalle por atención de paciente.

| Campo | Descripción |
|-------|-------------|
| Línea/Consecutivo | Número de línea |
| Autoriza | Número de autorización |
| Tipo Doc | CC / TI / RC |
| Identificación | Documento del paciente |
| Nombre | Nombre del paciente |
| Fecha Inicio | Fecha del servicio |
| Fecha Fin | Fecha final |
| Régimen | Régimen del afiliado |
| IPS Primaria | IPS primaria del usuario |
| Documento Soporte | Historia clínica, etc. |
| Valor IPS | Valor cobrado |
| Copago IPS | Copago del paciente |
| CMO IPS | Cuota moderadora |
| Descuento | Descuentos aplicados |
| Totales | Valor neto |
| Estado | LIQ / PAG / DEV |
| Usuario | Usuario que gestionó |
| Plan | POS / PBS |

### Hoja 3: Registro de Atenciones
Diagnósticos por atención.

| Campo | Descripción |
|-------|-------------|
| Nro Radicación | Radicación madre |
| Nro Atención | Número de atención |
| Autorización | Número de autorización |
| PAI | Código PAI si aplica |
| Forma de Pago | NORMAL / CAPITADO |
| Observación Autorización | Comentarios |
| Diagnóstico | Código CIE-10 |
| Dx Nombre | Nombre del diagnóstico |
| Dx Clase | Principal / Secundario |

### Hoja 4: Procedimientos por Atención
Detalle completo de cada procedimiento con valores y glosas.

| Campo | Descripción |
|-------|-------------|
| Nro Radicación | Radicación madre |
| Nro Atención | Número de atención |
| Código Manual | ISS2001 / ISS2004 / SOAT |
| Código Procedimiento | Código CUPS |
| Nombre Procedimiento | Descripción |
| MAPIISS | Código MAPIISS |
| Cantidad | Unidades cobradas |
| Valor IPS | Valor que cobra la IPS |
| Valor EPS | Valor contratado |
| Valor a Pagar | Valor final |
| Valor Nota Crédito | Ajustes |
| Gestión | Campo de auditoría |
| Glosas | SÍ / NO |
| Valor Glosa Admisiva | Glosa aceptada |
| Valor Glosa Auditoría | Glosa por auditoría |
| Estado | AUT / UNILA / GLOS |
| Tipo Liquidación | UNIL / BILA |
| Valor Contratado EPS | Tarifa EPS |
| Subservicio | Categoría |

### Hoja 5: Glosas
Consolidado de todas las glosas detectadas.

| Campo | Descripción |
|-------|-------------|
| Nro Radicación | Radicación madre |
| Nro Atención | Atención asociada |
| Código Procedimiento | CUPS glosado |
| Nombre Procedimiento | Descripción |
| Código Devolución | Código de glosa (101, 102, etc.) |
| Cantidad Glosada | Unidades glosadas |
| Vr Unit Glosado | Valor unitario |
| Valor Total Devolución | Total glosado |
| Observaciones Glosa | Motivo detallado |
| Origen | Facturación / Auditoría / Clínica |
| Valor Glosa Final | Monto final |

### Hoja 6: Resumen Ejecutivo (BONUS)
Dashboard con estadísticas y resumen del proceso.

---

## 🔧 Motor de Reglas de Glosas

El sistema implementa **8 reglas automáticas** para detectar glosas:

### Glosas de Facturación (100-199)

| Código | Regla | Severidad | Descripción |
|--------|-------|-----------|-------------|
| **101** | Falta Autorización | CRÍTICA | Verifica que servicios que requieren autorización la tengan |
| **102** | Diferencia de Tarifa | ALTA | Detecta cuando el valor cobrado difiere del contratado (>5%) |
| **103** | Servicio No Cubierto | CRÍTICA | Servicio no incluido en el convenio |
| **104** | Valor Superior Autorizado | ALTA | Valor cobrado superior al autorizado |

### Glosas Administrativas (200-299)

| Código | Regla | Severidad | Descripción |
|--------|-------|-----------|-------------|
| **201** | CUPS Inválido | CRÍTICA | Código CUPS no existe en catálogo oficial SISPRO |
| **202** | Autorización Incompleta | ALTA | Autorización con datos faltantes o incompletos |
| **203** | Documentación Incompleta | MEDIA | Falta documentación de soporte |
| **204** | Datos Paciente Incompletos | MEDIA | Datos del paciente faltantes |
| **205** | Autorización Vencida | ALTA | Autorización vencida al momento del servicio |

### Glosas de Auditoría Clínica (300-399)

| Código | Regla | Severidad | Descripción |
|--------|-------|-----------|-------------|
| **301** | Incoherencia Diagnóstico | MEDIA | Diagnóstico no coherente con procedimiento |
| **302** | Procedimiento No Justificado | MEDIA | Procedimiento sin justificación clínica |
| **303** | Duplicidad de Servicios | ALTA | Servicios duplicados en misma atención |
| **304** | Coherencia Clínica | MEDIA | Falta de coherencia clínica general |

### Glosas de Tarifas (400-499)

| Código | Regla | Severidad | Descripción |
|--------|-------|-----------|-------------|
| **401** | Valor Superior Contratado | CRÍTICA | Valor cobrado superior al contratado |
| **402** | Cantidad Excede Autorizado | ALTA | Cantidad facturada excede autorizada |
| **403** | Tarifa No Encontrada | MEDIA | No se encontró tarifa en manual tarifario |

---

## 🚀 API Endpoints

### POST `/api/expert/procesar`
Procesa una cuenta médica con el sistema experto.

**Request:**
```json
{
  "cuentaId": "507f1f77bcf86cd799439011",
  "nroRadicacion": "RAD-2025-001",
  "convenio": "GENERAL",
  "manualTarifario": "ISS2004"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cuentaId": "507f1f77bcf86cd799439011",
    "resultados": [
      {
        "archivo": "factura.pdf",
        "resultado": {
          "metadata": {
            "fechaProcesamiento": "2025-01-18T...",
            "tiempoMs": 3500,
            "version": "1.0.0",
            "itemsValidados": 12,
            "itemsConGlosas": 3
          },
          "resumen": {
            "totalFacturado": 450000,
            "totalGlosado": 85000,
            "totalAPagar": 365000,
            "cantidadGlosas": 5
          }
        }
      }
    ]
  }
}
```

### POST `/api/expert/procesar-y-descargar`
Procesa y descarga el Excel en una sola operación.

**Request:**
```json
{
  "cuentaId": "507f1f77bcf86cd799439011",
  "nroRadicacion": "RAD-2025-001",
  "convenio": "GENERAL",
  "manualTarifario": "ISS2004"
}
```

**Response:**
Archivo Excel (.xlsx) listo para descargar.

### GET `/api/expert/configuracion`
Obtiene la configuración actual del motor de reglas.

**Response:**
```json
{
  "success": true,
  "data": {
    "toleranciaDiferenciaTarifa": 5,
    "manualesTarifarios": ["ISS2001", "ISS2004", "SOAT"],
    "manualPorDefecto": "ISS2004",
    "reglasHabilitadas": ["101", "102", "201", ...],
    "validarCoherenciaClinica": true,
    "requiereAutorizacion": true,
    "cacheCUPS": true
  }
}
```

### PUT `/api/expert/configuracion`
Actualiza la configuración del motor de reglas.

**Request:**
```json
{
  "toleranciaDiferenciaTarifa": 10,
  "manualPorDefecto": "SOAT",
  "validarCoherenciaClinica": true
}
```

### GET `/api/expert/estadisticas`
Obtiene estadísticas del sistema experto.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCuentas": 1250,
    "cuentasProcesadas": 850,
    "porcentajeProcesado": 68
  }
}
```

---

## 💾 Estructura de Archivos

```
apps/backend/src/
├── types/
│   └── expert-system.types.ts        # Tipos TypeScript del sistema
├── services/
│   ├── expert-system.service.ts      # Servicio principal
│   ├── expert-rules.service.ts       # Motor de reglas
│   └── excel-expert.service.ts       # Generador de Excel
├── controllers/
│   └── expert-system.controller.ts   # Controladores de API
└── routes/
    └── expert-system.routes.ts       # Rutas de la API
```

---

## 📝 Ejemplo de Uso

### 1. Procesar una Cuenta Médica

```bash
curl -X POST http://localhost:3001/api/expert/procesar \
  -H "Content-Type: application/json" \
  -d '{
    "cuentaId": "507f1f77bcf86cd799439011",
    "nroRadicacion": "RAD-2025-001",
    "convenio": "GENERAL",
    "manualTarifario": "ISS2004"
  }'
```

### 2. Descargar Excel

```bash
curl -X POST http://localhost:3001/api/expert/procesar-y-descargar \
  -H "Content-Type: application/json" \
  -d '{
    "cuentaId": "507f1f77bcf86cd799439011"
  }' \
  --output auditoria.xlsx
```

### 3. Configurar Motor de Reglas

```bash
curl -X PUT http://localhost:3001/api/expert/configuracion \
  -H "Content-Type: application/json" \
  -d '{
    "toleranciaDiferenciaTarifa": 10,
    "validarCoherenciaClinica": true
  }'
```

---

## ⚡ Optimizaciones

El sistema está diseñado para ser **rápido y eficiente**:

1. **Cache de CUPS**: Los códigos consultados se almacenan en MongoDB para consultas futuras
2. **Procesamiento en Batch**: Valida múltiples procedimientos en una sola operación
3. **OpenAI Optimizado**: Usa GPT-4o-mini con temperatura baja (0.1) para máxima velocidad
4. **Extracción Directa**: Extrae sin cálculos complejos, la lógica está en las reglas
5. **Índices MongoDB**: Índices optimizados en CUPS, Diagnósticos, etc.

**Tiempo promedio de procesamiento:**
- Factura simple (1-5 procedimientos): **2-4 segundos**
- Factura mediana (5-20 procedimientos): **4-8 segundos**
- Factura compleja (20+ procedimientos): **8-15 segundos**

---

## 🔮 Próximas Mejoras

### 1. Integración con CUPS Oficial
- [ ] Servicio de sincronización con SISPRO
- [ ] Actualización automática de catálogos
- [ ] Scraper para CUPS 2025 (Resolución 2641/2024)

### 2. Embeddings para Búsqueda Rápida
- [ ] Vectorización de CUPS y descripciones
- [ ] Búsqueda semántica de procedimientos
- [ ] Recomendaciones de códigos similares

### 3. Machine Learning para Glosas
- [ ] Modelo entrenado con histórico de glosas
- [ ] Predicción de probabilidad de glosa
- [ ] Sugerencias automáticas de corrección

### 4. Dashboard de Auditoría
- [ ] Frontend con métricas en tiempo real
- [ ] Gráficos de glosas por tipo
- [ ] Alertas automáticas de anomalías

---

## 📄 Licencia

Copyright © 2025 KopTup - Soluciones Tecnológicas

---

## 👥 Equipo de Desarrollo

Desarrollado con ❤️ por el equipo de KopTup

- Sistema Experto: Motor de Reglas + OpenAI
- Arquitectura: Microservicios Node.js + MongoDB
- Generación de Reportes: ExcelJS
- API REST: Express.js + TypeScript
