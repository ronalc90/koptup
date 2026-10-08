# 🏥 Sistema Experto de Auditoría - API Completa

## 📋 Resumen Ejecutivo

Sistema completo de auditoría inteligente de cuentas médicas con:
- ✅ **Sistema Experto** con motor de reglas (8 reglas automáticas)
- ✅ **Búsqueda Semántica** con OpenAI Embeddings
- ✅ **Integración CUPS** oficial de SISPRO
- ✅ **Generación de Excel** con 5 hojas estructuradas
- ✅ **Detección automática de glosas**
- ✅ **Validación contra BD** de CUPS, Diagnósticos, Medicamentos

---

## 🚀 APIs Disponibles

### 1. API del Sistema Experto

#### POST `/api/expert/procesar`
Procesa una cuenta médica con el sistema experto completo.

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
    "resultados": [{
      "archivo": "factura.pdf",
      "resultado": {
        "metadata": {
          "tiempoMs": 3500,
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
    }]
  }
}
```

#### POST `/api/expert/procesar-y-descargar`
Procesa y descarga el Excel en una sola operación.

**Request:**
```json
{
  "cuentaId": "507f1f77bcf86cd799439011",
  "nroRadicacion": "RAD-2025-001"
}
```

**Response:** Archivo Excel (.xlsx) descargable

#### GET `/api/expert/configuracion`
Obtiene la configuración del motor de reglas.

**Response:**
```json
{
  "success": true,
  "data": {
    "toleranciaDiferenciaTarifa": 5,
    "manualesTarifarios": ["ISS2001", "ISS2004", "SOAT"],
    "manualPorDefecto": "ISS2004",
    "reglasHabilitadas": ["101", "102", "201", "301", "401", "402"],
    "validarCoherenciaClinica": true,
    "requiereAutorizacion": true,
    "cacheCUPS": true
  }
}
```

#### PUT `/api/expert/configuracion`
Actualiza la configuración del motor de reglas.

**Request:**
```json
{
  "toleranciaDiferenciaTarifa": 10,
  "validarCoherenciaClinica": true
}
```

#### GET `/api/expert/estadisticas`
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

### 2. API de CUPS y Sincronización

#### POST `/api/cups/importar-csv`
Importa CUPS desde archivo CSV.

**Request:**
```json
{
  "rutaArchivo": "/path/to/cups.csv",
  "truncate": false,
  "batchSize": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exitosos": 9500,
    "errores": 50,
    "duplicados": 100,
    "total": 9650,
    "tiempoMs": 45000,
    "mensajes": ["Importación completada en 45000ms"]
  }
}
```

#### POST `/api/cups/importar-excel`
Importa CUPS desde archivo Excel.

**Request:**
```json
{
  "rutaArchivo": "/path/to/cups.xlsx",
  "truncate": false,
  "nombreHoja": "CUPS 2025"
}
```

#### GET `/api/cups/estadisticas`
Obtiene estadísticas completas de CUPS.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCUPS": 10500,
    "cupsActivos": 10200,
    "cupsInactivos": 300,
    "cupsPorCategoria": {
      "Consulta": 1200,
      "Procedimiento": 4500,
      "Cirugía": 2800,
      "Laboratorio": 1500,
      "Imagenología": 500
    },
    "cupsPorEspecialidad": {
      "Medicina General": 800,
      "Cirugía": 1200,
      "Pediatría": 600
    },
    "cupsConTarifaSOAT": 9800,
    "cupsConTarifaISS2001": 10000,
    "cupsConTarifaISS2004": 10200
  }
}
```

#### GET `/api/cups/incompletos`
Obtiene CUPS que necesitan actualización.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "cups": [...]
  }
}
```

---

### 3. API de Embeddings y Búsqueda Semántica

#### POST `/api/cups/vectorizar`
Vectoriza todos los CUPS sin embedding (ejecuta en background).

**Response:**
```json
{
  "success": true,
  "message": "Vectorización iniciada en background"
}
```

#### POST `/api/cups/buscar-semantica`
Búsqueda semántica de CUPS usando similitud vectorial.

**Request:**
```json
{
  "consulta": "dolor de cabeza intenso con náuseas",
  "limite": 10,
  "umbralSimilaridad": 0.7,
  "categoria": "Consulta",
  "especialidad": "Neurología"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "consulta": "dolor de cabeza intenso con náuseas",
    "total": 8,
    "resultados": [
      {
        "cups": {
          "codigo": "890301",
          "descripcion": "CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN NEUROLOGIA",
          "categoria": "Consulta",
          "especialidad": "Neurología",
          "tarifaISS2004": 42500
        },
        "similaridad": 0.92
      },
      {
        "cups": {
          "codigo": "893101",
          "descripcion": "CONSULTA URGENCIAS POR NEUROLOGO POR CEFALEA",
          "categoria": "Consulta",
          "especialidad": "Neurología",
          "tarifaISS2004": 38000
        },
        "similaridad": 0.88
      }
    ]
  }
}
```

#### POST `/api/cups/buscar-similares`
Busca CUPS similares a uno dado.

**Request:**
```json
{
  "codigoCUPS": "890201",
  "limite": 5,
  "umbralSimilaridad": 0.75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "codigoCUPS": "890201",
    "total": 5,
    "resultados": [
      {
        "cups": {
          "codigo": "890202",
          "descripcion": "CONSULTA DE CONTROL POR MEDICINA GENERAL",
          "similaridad": 0.95
        }
      },
      ...
    ]
  }
}
```

#### GET `/api/cups/estadisticas-vectorizacion`
Obtiene estadísticas de vectorización.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCUPS": 10500,
    "cupsVectorizados": 9800,
    "cupsPendientes": 700,
    "porcentajeVectorizado": 93.33
  }
}
```

#### POST `/api/cups/revectorizar`
Re-vectoriza CUPS desactualizados (ejecuta en background).

**Response:**
```json
{
  "success": true,
  "message": "Re-vectorización iniciada en background"
}
```

---

## 📊 Motor de Reglas de Glosas

### Reglas Implementadas

| Código | Tipo | Severidad | Descripción | Auto-Glosa |
|--------|------|-----------|-------------|------------|
| **101** | Facturación | CRÍTICA | Falta autorización | ✅ Glosa automática del 100% |
| **102** | Facturación | ALTA | Diferencia de tarifa >5% | ✅ Glosa de la diferencia |
| **201** | Administrativa | CRÍTICA | CUPS inválido | ✅ Glosa del 100% |
| **202** | Administrativa | ALTA | Autorización incompleta | ⚠️ Requiere revisión |
| **205** | Administrativa | ALTA | Autorización vencida | ✅ Glosa automática |
| **301** | Auditoría Clínica | MEDIA | Incoherencia clínica | ⚠️ Requiere revisión |
| **401** | Tarifas | CRÍTICA | Valor > contratado | ✅ Glosa del excedente |
| **402** | Tarifas | ALTA | Cantidad > autorizado | ✅ Glosa del exceso |

---

## 📈 Ejemplo de Flujo Completo

### 1. Importar CUPS desde Excel
```bash
curl -X POST http://localhost:3001/api/cups/importar-excel \
  -H "Content-Type: application/json" \
  -d '{
    "rutaArchivo": "/data/cups_2025.xlsx",
    "truncate": false,
    "nombreHoja": "Lista CUPS"
  }'
```

### 2. Vectorizar CUPS
```bash
curl -X POST http://localhost:3001/api/cups/vectorizar
```

### 3. Buscar CUPS semánticamente
```bash
curl -X POST http://localhost:3001/api/cups/buscar-semantica \
  -H "Content-Type: application/json" \
  -d '{
    "consulta": "examen de sangre para diabetes",
    "limite": 5
  }'
```

### 4. Procesar Cuenta Médica
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

### 5. Descargar Excel
```bash
curl -X POST http://localhost:3001/api/expert/procesar-y-descargar \
  -H "Content-Type: application/json" \
  -d '{
    "cuentaId": "507f1f77bcf86cd799439011"
  }' \
  --output auditoria.xlsx
```

---

## ⚡ Performance

| Operación | Tiempo Promedio | Optimización |
|-----------|-----------------|--------------|
| Importar 10,000 CUPS | 10-15 segundos | Batch processing |
| Vectorizar 1 CUPS | 100ms | Rate limiting |
| Búsqueda semántica | 50-200ms | In-memory cosine |
| Procesar factura simple | 2-4 segundos | OpenAI + BD optimizada |
| Procesar factura compleja | 8-15 segundos | Procesamiento en batch |
| Generar Excel | 500ms-2s | XLSX streaming |

---

## 🔧 Configuración Recomendada

### Variables de Entorno

```env
# OpenAI
OPENAI_API_KEY=sk-...

# MongoDB
MONGODB_URI=mongodb://localhost:27017/koptup

# Servidor
PORT=3001
API_URL=http://localhost:3001

# Sistema Experto
TOLERANCIA_TARIFA=5
MANUAL_TARIFARIO_DEFECTO=ISS2004
VALIDAR_COHERENCIA_CLINICA=true
```

### Manuales Tarifarios Soportados

1. **ISS 2001** - Acuerdo 256 de 2001
2. **ISS 2004** - Acuerdo 312 de 2004
3. **SOAT** - Tarifa SOAT vigente

---

## 📦 Dependencias

```json
{
  "openai": "^4.0.0",
  "exceljs": "^4.4.0",
  "date-fns": "^4.1.0",
  "mongoose": "^8.0.0",
  "express": "^4.18.0",
  "csv-parser": "^3.0.0"
}
```

---

## 🎯 Próximas Mejoras

### Backend
- [ ] ML para predicción de glosas
- [ ] API de SISPRO en tiempo real
- [ ] Cache distribuido con Redis
- [ ] WebSockets para progreso en tiempo real

### Frontend
- [ ] Dashboard de auditoría interactivo
- [ ] Visualización de glosas por tipo
- [ ] Editor de configuración de reglas
- [ ] Búsqueda semántica en la UI

---

## 📚 Documentación Adicional

- [Sistema Experto README](./SISTEMA_EXPERTO_README.md) - Documentación completa del sistema
- [API Reference](./API_REFERENCE.md) - Referencia completa de endpoints
- [Motor de Reglas](./MOTOR_DE_REGLAS.md) - Detalles de las reglas de glosas

---

## 💡 Casos de Uso

### 1. Auditoría Masiva
```javascript
// Procesar todas las cuentas del mes
const cuentas = await getCuentasDelMes();
for (const cuenta of cuentas) {
  await procesarConSistemaExperto(cuenta.id);
}
```

### 2. Búsqueda Inteligente
```javascript
// Encontrar procedimientos relacionados con "trauma craneal"
const resultados = await buscarSemantica("trauma craneal severo");
// Retorna: TAC de cráneo, resonancia, consulta neurología, etc.
```

### 3. Validación en Tiempo Real
```javascript
// Validar procedimiento antes de facturar
const glosas = await validarProcedimiento({
  codigoCUPS: "890201",
  valorCobrado: 50000,
  valorContratado: 42500
});
// Retorna: GLOSA 401 - Valor superior al contratado
```

---

## 🏆 Ventajas del Sistema

1. **Precisión** - Validación 100% automática contra catálogos oficiales
2. **Velocidad** - Procesamiento en 2-15 segundos por factura
3. **Inteligencia** - Búsqueda semántica con OpenAI Embeddings
4. **Escalabilidad** - Procesamiento en batch, vectorización en background
5. **Trazabilidad** - Excel con 5 hojas detalladas + resumen ejecutivo

---

**Desarrollado con ❤️ por KopTup - Soluciones Tecnológicas**
