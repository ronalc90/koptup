# 📊 Guía Completa: Datos a Cargar en la Base de Datos

## 🎯 Arquitectura Híbrida: BD + OpenAI

El sistema ahora usa una **arquitectura híbrida** para optimizar el procesamiento:

1. **Base de Datos (MongoDB)** → Búsquedas exactas y cálculos de tarifas (RÁPIDO)
2. **OpenAI** → Solo para extracción de códigos desde PDFs y validación de contexto

### ¿Por qué esta arquitectura?

- ❌ **Antes (RAG puro)**: Buscar 100 códigos CUPS en 900 páginas era LENTO
- ✅ **Ahora (Híbrido)**: Búsqueda en BD es instantánea, OpenAI solo extrae códigos

---

## 📋 Datos Requeridos

Debes cargar 4 tipos de datos en la base de datos:

### 1. 📘 Códigos CUPS (Procedimientos Médicos)

**Qué son:** Códigos únicos para procedimientos, consultas, cirugías, etc. en Colombia

**Formato requerido (CSV o Excel):**

```csv
codigo,descripcion,categoria,especialidad,tarifaSOAT,tarifaISS2001,tarifaISS2004,uvr
890201,Consulta de primera vez por medicina general,Consulta,Medicina General,45000,42000,40000,1.5
890301,Consulta de control por medicina general,Consulta,Medicina General,35000,33000,31000,1.2
912201,Hemograma completo,Laboratorio,Laboratorio Clínico,18000,17000,16000,0.8
```

**Columnas:**
- `codigo`: Código CUPS (obligatorio, único)
- `descripcion`: Descripción del procedimiento (obligatorio)
- `categoria`: Tipo (Consulta, Procedimiento, Cirugía, Laboratorio, Imagenología, Terapia)
- `especialidad`: Especialidad médica
- `tarifaSOAT`: Tarifa SOAT en COP
- `tarifaISS2001`: Tarifa ISS 2001 en COP
- `tarifaISS2004`: Tarifa ISS 2004 en COP
- `uvr`: Unidad de Valor Relativo

**¿Dónde conseguir estos datos?**
- Ministerio de Salud de Colombia
- Resoluciones del Ministerio (buscar "CUPS Colombia" + año)
- Bases de datos de EPS/IPS
- Asociaciones médicas colombianas

**Cantidad estimada:** ~10,000 - 50,000 códigos (dependiendo de cuán completa sea tu base)

---

### 2. 💊 Medicamentos (Código CUM)

**Qué son:** Medicamentos con su Código Único de Medicamentos (CUM) y precios

**Formato requerido (CSV o Excel):**

```csv
codigoATC,codigoCUM,principioActivo,nombreComercial,concentracion,formaFarmaceutica,viaAdministracion,presentacion,precioUnitario,laboratorio,pos
J01FA09,20123456,Claritromicina,CLARITROMICINA MK,500mg,Tableta,Oral,Caja x 10 tabletas,15000,MK,true
N02BE01,20234567,Acetaminofen,DOLEX,500mg,Tableta,Oral,Caja x 20 tabletas,8000,Tecnoquímicas,true
```

**Columnas:**
- `codigoATC`: Código Anatómico Terapéutico Químico
- `codigoCUM`: Código Único de Medicamentos (obligatorio, único)
- `principioActivo`: Nombre del principio activo (obligatorio)
- `nombreComercial`: Nombre comercial
- `concentracion`: Concentración (ej: 500mg) (obligatorio)
- `formaFarmaceutica`: Tableta, Cápsula, Jarabe, Inyectable, etc.
- `viaAdministracion`: Oral, Intravenosa, Intramuscular, etc.
- `presentacion`: Descripción de la presentación (obligatorio)
- `precioUnitario`: Precio por unidad en COP (obligatorio)
- `laboratorio`: Laboratorio fabricante
- `pos`: Si está en el POS (true/false)

**¿Dónde conseguir estos datos?**
- INVIMA (Instituto Nacional de Vigilancia de Medicamentos)
- Base de datos CUM oficial: https://consultaregistro.invima.gov.co/
- Sistema de Información de Precios de Medicamentos (SISMED)
- Ministerio de Salud - Listado de Medicamentos POS

**Cantidad estimada:** ~5,000 - 20,000 medicamentos

---

### 3. 🏥 Diagnósticos CIE-10

**Qué son:** Códigos de diagnósticos según la Clasificación Internacional de Enfermedades

**Formato requerido (CSV o Excel):**

```csv
codigoCIE10,descripcion,categoria,subcategoria
A00,Cólera,Ciertas enfermedades infecciosas y parasitarias,Infecciones intestinales
A09,Diarrea y gastroenteritis de presunto origen infeccioso,Ciertas enfermedades infecciosas y parasitarias,Infecciones intestinales
J00,Rinofaringitis aguda,Enfermedades del sistema respiratorio,Infecciones agudas de las vías respiratorias superiores
```

**Columnas:**
- `codigoCIE10`: Código CIE-10 (obligatorio, único)
- `descripcion`: Descripción del diagnóstico (obligatorio)
- `categoria`: Capítulo CIE-10 (obligatorio)
- `subcategoria`: Subcategoría

**¿Dónde conseguir estos datos?**
- OMS (Organización Mundial de la Salud) - CIE-10 oficial
- Ministerio de Salud de Colombia
- Bases de datos médicas abiertas
- Link directo: https://icd.who.int/browse10/2019/en

**Cantidad estimada:** ~14,000 códigos CIE-10

---

### 4. 🔧 Materiales e Insumos Médicos

**Qué son:** Materiales quirúrgicos, insumos, prótesis, etc.

**Formato requerido (CSV o Excel):**

```csv
codigo,nombre,descripcion,categoria,unidadMedida,precioUnitario,proveedor
MAT001,Guantes quirúrgicos talla M,Guantes de látex estériles,Material quirúrgico,Par,2500,Proveedor A
MAT002,Gasa estéril 10x10 cm,Gasa estéril para curación,Material de curación,Paquete,1500,Proveedor B
INS001,Jeringa 10ml con aguja,Jeringa desechable,Insumo médico,Unidad,800,Proveedor C
```

**Columnas:**
- `codigo`: Código interno (obligatorio, único)
- `nombre`: Nombre del material (obligatorio)
- `descripcion`: Descripción (obligatorio)
- `categoria`: Material quirúrgico, Material de curación, Insumo médico, Prótesis, Órtesis, etc.
- `unidadMedida`: Unidad, Caja, Paquete, Frasco, etc. (obligatorio)
- `precioUnitario`: Precio por unidad en COP (obligatorio)
- `proveedor`: Proveedor

**¿Dónde conseguir estos datos?**
- Catálogos de proveedores médicos
- IPS/EPS - Listados de materiales autorizados
- Sistema de compras de tu institución
- Debes crear esta lista según tus proveedores

**Cantidad estimada:** ~500 - 5,000 items (según tu institución)

---

## 🚀 Cómo Importar los Datos

### Paso 1: Prepara tus archivos

Crea 4 archivos CSV o Excel con los formatos descritos arriba:
- `cups.csv` o `cups.xlsx`
- `medicamentos.csv` o `medicamentos.xlsx`
- `diagnosticos.csv` o `cie10.csv`
- `materiales.csv` o `materiales.xlsx`

### Paso 2: Coloca los archivos en una carpeta

```bash
# Crea la carpeta data en el backend
mkdir -p apps/backend/data

# Mueve tus archivos ahí
mv cups.csv apps/backend/data/
mv medicamentos.xlsx apps/backend/data/
mv diagnosticos.csv apps/backend/data/
mv materiales.csv apps/backend/data/
```

### Paso 3: Ejecuta los scripts de importación

```bash
cd apps/backend

# Importar CUPS (usar --truncate para limpiar datos previos)
npx ts-node src/scripts/import-medical-data.ts cups data/cups.csv --truncate

# Importar medicamentos
npx ts-node src/scripts/import-medical-data.ts medicamentos data/medicamentos.xlsx --truncate

# Importar diagnósticos
npx ts-node src/scripts/import-medical-data.ts diagnosticos data/diagnosticos.csv --truncate

# Importar materiales
npx ts-node src/scripts/import-medical-data.ts materiales data/materiales.csv --truncate
```

**Opciones del script:**
- `--truncate`: Borra los datos previos antes de importar
- Sin `--truncate`: Agrega los nuevos datos a los existentes (ignora duplicados)

### Paso 4: Verifica la importación

```bash
# Conéctate a MongoDB y verifica
mongo
> use koptup_db
> db.cups.countDocuments()         // Debe mostrar el número de códigos CUPS
> db.medicamentos.countDocuments() // Debe mostrar el número de medicamentos
> db.diagnosticos.countDocuments() // Debe mostrar el número de diagnósticos
> db.materiales_insumos.countDocuments() // Debe mostrar el número de materiales
```

---

## 📝 Plantillas de Ejemplo

### Plantilla CUPS Mínima

```csv
codigo,descripcion,categoria,tarifaSOAT
890201,Consulta de primera vez por medicina general,Consulta,45000
890301,Consulta de control por medicina general,Consulta,35000
890203,Consulta de primera vez por medicina especializada,Consulta,65000
```

### Plantilla Medicamentos Mínima

```csv
codigoCUM,principioActivo,concentracion,presentacion,precioUnitario
20123456,Acetaminofen,500mg,Caja x 20 tabletas,8000
20234567,Ibuprofeno,400mg,Caja x 10 tabletas,12000
20345678,Amoxicilina,500mg,Caja x 21 cápsulas,25000
```

### Plantilla Diagnósticos Mínima

```csv
codigoCIE10,descripcion,categoria
A09,Diarrea y gastroenteritis de presunto origen infeccioso,Infecciones
J00,Rinofaringitis aguda,Respiratorio
M54,Dorsalgia,Musculoesquelético
```

---

## 🔍 Verificación de Datos Cargados

Puedes verificar los datos usando los endpoints de búsqueda:

### Buscar CUPS:
```bash
curl "http://localhost:3001/api/cuentas/search/cups?codigo=890201"
curl "http://localhost:3001/api/cuentas/search/cups?descripcion=consulta"
```

### Buscar Medicamentos:
```bash
curl "http://localhost:3001/api/cuentas/search/medicamentos?principioActivo=acetaminofen"
curl "http://localhost:3001/api/cuentas/search/medicamentos?codigoCUM=20123456"
```

### Buscar Diagnósticos:
```bash
curl "http://localhost:3001/api/cuentas/search/diagnosticos?codigoCIE10=A09"
```

### Calcular Tarifa:
```bash
curl -X POST http://localhost:3001/api/cuentas/calcular-tarifa \
  -H "Content-Type: application/json" \
  -d '{"codigosCUPS": ["890201", "890301"], "tipoTarifa": "SOAT"}'
```

---

## ⚡ Optimización del Proceso

Una vez cargados los datos, el procesamiento de cuentas médicas será:

1. **OpenAI extrae códigos del PDF** (~30 segundos)
2. **Sistema busca códigos en BD** (~2 segundos) ⚡ RÁPIDO
3. **Sistema calcula tarifas desde BD** (~1 segundo) ⚡ RÁPIDO
4. **Total: ~33 segundos** vs ~5 minutos con RAG puro 🎉

---

## 📊 Estructura de Respuesta del Procesamiento Híbrido

Cuando procesas una cuenta médica, obtienes:

```json
{
  "success": true,
  "data": {
    "paciente": {
      "nombre": "Juan Pérez",
      "identificacion": "123456789",
      "edad": "45 años",
      "genero": "Masculino"
    },
    "diagnosticos": [
      {
        "codigoCIE10": "A09",
        "descripcion": "Diarrea y gastroenteritis...",
        "validado": true
      }
    ],
    "prestaciones": [
      {
        "codigoCUPS": "890201",
        "descripcion": "Consulta de primera vez...",
        "cantidad": 1,
        "tarifa": 45000,
        "tipoTarifa": "SOAT",
        "validado": true,
        "observaciones": null
      }
    ],
    "medicamentos": [
      {
        "codigoCUM": "20123456",
        "principioActivo": "Acetaminofen",
        "cantidad": 20,
        "precioUnitario": 8000,
        "subtotal": 160000,
        "validado": true
      }
    ],
    "resumen": {
      "totalProcedimientos": 45000,
      "totalMedicamentos": 160000,
      "totalMateriales": 0,
      "totalGeneral": 205000,
      "tipoTarifa": "SOAT"
    },
    "metadata": {
      "fechaExtraccion": "2025-11-02T...",
      "origen": "uploads/cuenta.pdf",
      "itemsValidados": 2,
      "itemsNoValidados": 0,
      "advertencias": []
    }
  }
}
```

---

## 🎓 Recomendaciones Finales

1. **Empieza con datos mínimos**: No necesitas TODOS los códigos CUPS, empieza con los 100-200 más usados
2. **Valida la calidad**: Asegúrate que los precios sean actuales
3. **Actualiza periódicamente**: Las tarifas cambian anualmente
4. **Usa Excel inicialmente**: Más fácil de editar que CSV
5. **Verifica cada importación**: Usa los endpoints de búsqueda para confirmar

---

## 📞 Endpoints Disponibles

### Procesamiento:
- `POST /api/cuentas/procesar-hibrido` - Procesar cuenta médica

### Búsqueda:
- `GET /api/cuentas/search/cups` - Buscar códigos CUPS
- `GET /api/cuentas/search/medicamentos` - Buscar medicamentos
- `GET /api/cuentas/search/diagnosticos` - Buscar diagnósticos CIE-10
- `GET /api/cuentas/search/materiales` - Buscar materiales e insumos

### Cálculos:
- `POST /api/cuentas/calcular-tarifa` - Calcular tarifas de procedimientos
- `POST /api/cuentas/calcular-costo-medicamentos` - Calcular costo de medicamentos

---

## ✅ Checklist de Implementación

- [ ] Conseguir base de datos de códigos CUPS
- [ ] Conseguir base de datos de medicamentos (CUM)
- [ ] Conseguir base de datos CIE-10
- [ ] Crear listado de materiales e insumos propios
- [ ] Formatear datos en CSV/Excel según plantillas
- [ ] Importar CUPS a MongoDB
- [ ] Importar medicamentos a MongoDB
- [ ] Importar diagnósticos a MongoDB
- [ ] Importar materiales a MongoDB
- [ ] Verificar importación con endpoints de búsqueda
- [ ] Probar procesamiento híbrido con PDF real
- [ ] Validar resultados y tarifas

---

**¡Listo!** Con estos datos cargados, tu sistema procesará cuentas médicas de forma óptima y rápida. 🚀
