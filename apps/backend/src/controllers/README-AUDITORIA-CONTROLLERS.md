# Controladores de Auditoría

El sistema tiene 3 controladores de auditoría, cada uno con un enfoque diferente. **NO están duplicados** - son complementarios.

## 📋 Controladores Disponibles

### 1. `auditoria.controller.ts` - Controlador Base (CRUD + Auditoría)
**Tamaño:** ~24 KB
**Enfoque:** Operaciones CRUD completas + Auditoría con servicios tradicionales

#### Funcionalidades principales:
- ✅ **CRUD Completo:**
  - `crearFactura()` - Crear factura manualmente
  - `listarFacturas()` - Listar todas las facturas
  - `obtenerFactura()` - Obtener factura por ID
  - `actualizarFactura()` - Actualizar factura
  - `eliminarFactura()` - Eliminar factura

- ✅ **CRUD de Atenciones:**
  - `crearAtencion()`
  - `listarAtenciones()`
  - `obtenerAtencion()`
  - `actualizarAtencion()`
  - `eliminarAtencion()`

- ✅ **CRUD de Procedimientos:**
  - `crearProcedimiento()`
  - `listarProcedimientos()`
  - `obtenerProcedimiento()`
  - `actualizarProcedimiento()`
  - `eliminarProcedimiento()`

- ✅ **CRUD de Glosas:**
  - `crearGlosa()`
  - `listarGlosas()`
  - `obtenerGlosa()`
  - `actualizarGlosa()`
  - `eliminarGlosa()`

- ✅ **Auditoría:**
  - `auditarFacturaConArchivos()` - Auditar con archivos Excel/PDF subidos
  - `generarExcelAuditoria()` - Generar Excel de auditoría

#### Servicios que usa:
- `auditoria.service.ts`
- `auditoria-paso-a-paso.service.ts`
- `excel-auditoria.service.ts`
- `cups-lookup.service.ts`
- `sistema-aprendizaje.service.ts`

#### Casos de uso:
- ✅ Gestión manual de facturas, atenciones, procedimientos
- ✅ Auditoría tradicional con archivos Excel
- ✅ Operaciones CRUD desde panel de administración
- ✅ Integración con frontend para gestión de datos

---

### 2. `auditoria-medica.controller.ts` - Procesamiento PDF con IA Dual
**Tamaño:** ~24 KB
**Enfoque:** Extracción automática de PDFs con doble validación IA

#### Funcionalidades principales:
- 🤖 **Procesamiento Inteligente:**
  - `procesarFacturasPDF()` - Procesa PDFs con extracción dual IA
  - Separación automática de archivos (factura vs historia clínica)
  - Validación cruzada con dos motores de IA
  - Cálculo automático de glosas con tarifarios
  - Generación de Excel completo (8 pestañas)

#### Servicios que usa:
- `pdf-extractor.service.ts`
- `glosa-calculator.service.ts`
- `excel-factura-medica.service.ts`
- `validacion-dual.service.ts`
- `extraccion-dual.service.ts`
- `auditor-ia-final.service.ts`

#### Flujo del proceso:
1. 📄 Recibe archivos PDF
2. 🔍 Separa factura de historia clínica
3. 🤖 Extrae datos con IA (doble validación)
4. 💰 Calcula glosas automáticamente
5. 📊 Genera Excel de 8 pestañas
6. 💾 Guarda en base de datos

#### Casos de uso:
- ✅ Procesar facturas médicas escaneadas
- ✅ Auditoría automática de PDFs
- ✅ Validación con doble motor de IA
- ✅ Cálculo de glosas Nueva EPS

---

### 3. `auditoria-modular.controller.ts` - Sistema Modular de 7 Módulos
**Tamaño:** ~15 KB
**Enfoque:** Arquitectura modular con 7 componentes integrados

#### Arquitectura de Módulos:

```
┌─────────────────────────────────────────────────┐
│  MÓDULO A: Ingesta de Documentos               │
│  - Clasificación inteligente                    │
│  - Detección de tipo de documento              │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  MÓDULO B: AI Vision Extractor                 │
│  - GPT-4 Vision para extracción                │
│  - OCR inteligente                              │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  MÓDULO C: Motor de Reglas Médicas             │
│  - Validación de pertinencia CUPS              │
│  - Verificación diagnóstico-procedimiento      │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  MÓDULO D: Motor de Auditoría con Doble IA     │
│  - Comparación tarifarios                       │
│  - Validación cruzada                           │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  MÓDULO E: Motor de Glosas Automáticas         │
│  - Generación automática de glosas             │
│  - Clasificación según normativa               │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  MÓDULO F: Generador de Reporte Final          │
│  - Excel con 5-8 hojas                          │
│  - PDF de auditoría                             │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│  MÓDULO G: Panel/API/Integración                │
│  - Endpoints REST                               │
│  - WebSockets para actualizaciones              │
└─────────────────────────────────────────────────┘
```

#### Funcionalidades principales:
- 🏗️ `procesarDocumentoCompleto()` - Flujo completo de 7 módulos
- 📊 Integración total con sistema de aprendizaje
- 🔄 Procesamiento progresivo con updates en tiempo real

#### Servicios que usa:
- `modules/document-ingestion.service.ts`
- `modules/ai-vision-extractor.service.ts`
- `sistema-aprendizaje.service.ts`
- Modelos: Factura, Atencion, Procedimiento, Glosa

#### Casos de uso:
- ✅ Auditoría de nueva generación
- ✅ Procesamiento end-to-end automatizado
- ✅ Sistema de aprendizaje continuo
- ✅ Máxima precisión con 7 capas de validación

---

## 🔄 Comparación Rápida

| Característica | auditoria.controller | auditoria-medica.controller | auditoria-modular.controller |
|----------------|---------------------|----------------------------|------------------------------|
| **CRUD Manual** | ✅ Completo | ❌ No | ⚠️ Limitado |
| **Procesamiento PDF** | ⚠️ Básico | ✅ Avanzado (IA Dual) | ✅ Avanzado (7 módulos) |
| **Validación IA** | ❌ No | ✅ Doble validación | ✅ Múltiples capas |
| **Cálculo Glosas** | ⚠️ Manual | ✅ Automático | ✅ Automático + Reglas |
| **Excel** | ✅ 5 hojas | ✅ 8 hojas | ✅ 5-8 hojas |
| **Complejidad** | Baja | Media | Alta |
| **Velocidad** | Rápido | Medio | Medio-Lento |
| **Precisión** | Media | Alta | Muy Alta |
| **Sistema Aprendizaje** | ✅ Sí | ❌ No | ✅ Sí |

---

## 🎯 ¿Cuándo usar cada uno?

### Usar `auditoria.controller.ts` si:
- Necesitas operaciones CRUD tradicionales
- Trabajas con datos ya en la base de datos
- Quieres gestión manual de facturas/atenciones
- Necesitas integración simple con frontend

### Usar `auditoria-medica.controller.ts` si:
- Procesas PDFs de facturas médicas
- Necesitas extracción automática con IA
- Requieres doble validación para precisión
- Trabajas con facturas de Nueva EPS
- Necesitas Excel detallado de 8 pestañas

### Usar `auditoria-modular.controller.ts` si:
- Necesitas máxima precisión (7 capas)
- Implementas sistema de aprendizaje continuo
- Requieres arquitectura escalable y modular
- Trabajas en auditoría de siguiente generación
- Necesitas procesamiento end-to-end completo

---

## 📝 Rutas Registradas

En `/apps/backend/src/index.ts`:

```typescript
if (auditoriaRoutes.default)
  app.use('/api/auditoria', auditoriaRoutes.default);
```

Las rutas específicas están definidas en:
- `/apps/backend/src/routes/auditoria.routes.ts`

---

## 💡 Recomendaciones de Arquitectura

### NO consolidar estos controladores porque:
1. ✅ Cada uno tiene responsabilidades claras y distintas
2. ✅ Sirven casos de uso diferentes
3. ✅ Mantienen separación de concerns
4. ✅ Facilitan testing independiente
5. ✅ Permiten escalar cada módulo por separado

### Posibles mejoras futuras:
1. 🔄 Extraer lógica común a servicios compartidos
2. 📝 Crear interfaces TypeScript para contratos
3. 🧪 Implementar testing unitario para cada uno
4. 📊 Métricas de performance comparativas
5. 🔌 Event-driven architecture para comunicación entre módulos

---

**Último actualizado:** 2025-11-23
**Autor:** Sistema KopTup
**Versión:** 1.0
