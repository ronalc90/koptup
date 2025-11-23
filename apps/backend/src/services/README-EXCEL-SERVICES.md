# Servicios de Generación de Excel

Este proyecto tiene 4 servicios diferentes para generación de Excel, cada uno con un propósito específico.

## 📊 Servicios Disponibles

### 1. `excel.service.ts` - Cuentas Médicas Generales
**Propósito:** Exportación consolidada de múltiples cuentas médicas
**Librería:** ExcelJS
**Hojas:** 5 hojas

- **Hoja 1:** Datos Generales (paciente, factura, IPS, aseguradora)
- **Hoja 2:** Diagnósticos
- **Hoja 3:** Procedimientos CUPS
- **Hoja 4:** Validaciones
- **Hoja 5:** Glosas

**Función principal:** `generateConsolidatedExcel(extractions, cuentasMap, validations, glosas)`

**Caso de uso:** Cuando se procesan múltiples PDFs y se necesita un reporte consolidado de todas las cuentas médicas.

---

### 2. `excel-expert.service.ts` - Sistema Experto
**Propósito:** Exportación de resultados del Sistema Experto
**Librería:** XLSX (SheetJS)
**Hojas:** 5 hojas

- **Hoja 1:** Radicación / Factura General
- **Hoja 2:** Detalle de la Factura
- **Hoja 3:** Registro de Atenciones
- **Hoja 4:** Procedimientos por Atención
- **Hoja 5:** Glosas

**Función principal:** `generarExcelCompleto(resultado: ResultadoSistemaExperto)`

**Caso de uso:** Cuando el Sistema Experto completa un análisis completo con reglas de negocio aplicadas.

---

### 3. `excel-auditoria.service.ts` - Auditoría de Facturas
**Propósito:** Reporte de auditoría completo de una factura específica
**Librería:** ExcelJS
**Hojas:** 5 hojas

- **Hoja 1:** Resumen de Factura
- **Hoja 2:** Atenciones
- **Hoja 3:** Procedimientos
- **Hoja 4:** Glosas
- **Hoja 5:** Estadísticas

**Función principal:** `generarExcelAuditoria(facturaId: string)`

**Caso de uso:** Auditoría detallada de una factura existente en la base de datos (lee de MongoDB).

---

### 4. `excel-factura-medica.service.ts` - Factura Médica Detallada
**Propósito:** Exportación exhaustiva de una factura médica individual
**Librería:** ExcelJS
**Hojas:** 8 pestañas

- **Pestaña 1:** FACTURACION (radicación, factura)
- **Pestaña 2:** PROCEDIMIENTOS
- **Pestaña 3:** GLOSAS
- **Pestaña 4:** AUTORIZACIONES
- **Pestaña 5:** PACIENTE
- **Pestaña 6:** DIAGNOSTICOS
- **Pestaña 7:** FECHAS
- **Pestaña 8:** RESUMEN

**Función principal:** `generarExcelCompleto(datosFactura, glosas, valorAPagar, valorGlosaTotal)`

**Caso de uso:** Exportación detallada de una factura procesada con extracción de PDF y cálculo de glosas.

---

## 🔄 Comparación Rápida

| Servicio | Hojas | Librería | Input | Output |
|----------|-------|----------|-------|--------|
| `excel.service.ts` | 5 | ExcelJS | Múltiples extracciones | Consolidado multi-cuenta |
| `excel-expert.service.ts` | 5 | XLSX | Resultado Sistema Experto | Excel con reglas aplicadas |
| `excel-auditoria.service.ts` | 5 | ExcelJS | ID de factura (MongoDB) | Reporte de auditoría |
| `excel-factura-medica.service.ts` | 8 | ExcelJS | Datos PDF + Glosas | Factura detallada |

---

## 🎯 ¿Cuándo usar cada uno?

### Usar `excel.service.ts` si:
- Tienes múltiples cuentas médicas a exportar
- Necesitas un reporte consolidado
- Procesas batch de PDFs

### Usar `excel-expert.service.ts` si:
- Usas el Sistema Experto
- Necesitas aplicar reglas de negocio complejas
- Requieres formato específico para radicación

### Usar `excel-auditoria.service.ts` si:
- Auditas una factura YA EXISTENTE en BD
- Necesitas estadísticas y análisis
- Trabajas con datos históricos

### Usar `excel-factura-medica.service.ts` si:
- Procesas UNA factura individual
- Necesitas máximo detalle (8 pestañas)
- Trabajas con datos recién extraídos de PDF

---

## 💡 Notas Técnicas

### Diferencias ExcelJS vs XLSX (SheetJS)

- **ExcelJS**: Más potente para estilos, formato avanzado, fórmulas
- **XLSX**: Más ligero, más rápido para operaciones simples

### Consolidación Futura

Estos servicios NO están duplicados. Cada uno tiene un propósito específico.

**Oportunidades de refactorización:**
1. Extraer estilos comunes a un módulo compartido
2. Crear clase base con utilidades de formato
3. Estandarizar nombres de columnas cuando sea posible

---

## 📝 Mantenimiento

Si necesitas modificar algún servicio:

1. **Identifica el caso de uso** usando la tabla de comparación
2. **Lee la documentación** inline en cada archivo
3. **Mantén la separación de responsabilidades** - no mezcles casos de uso

**Último actualizado:** 2025-11-23
