# Demo: Sistema de Gestión de Transporte de Carga (Perú)

## Descripción

Demo funcional de un **Sistema Integral de Gestión de Transporte de Carga** diseñado para empresas transportistas y logísticas en Perú. Implementa los estándares de la Administración Tributaria Peruana (SUNAT) para facturación electrónica, guías de remisión electrónica (GRE) y detracciones del SPOT (4%).

### Alcance funcional

- **Gestión de clientes**: Registro, búsqueda, validación de RUC/DNI
- **Gestión de conductores**: Datos personales, licencias, estado de operación
- **Gestión de vehículos**: Placas, características técnicas, documentación
- **Órdenes de servicio**: Creación, seguimiento de estados, cálculo de fletes
- **Guía de Remisión Electrónica (GRE)**: Generación con formato XML UBL 2.1
- **Facturación electrónica**: Emisión de facturas con cálculo de IGV y detracciones
- **Detracciones**: Cálculo automático del 4% para transportes (SPOT, código 027)
- **Reportes**: KPIs operativos, ingresos por mes, análisis de fletes
- **Flujo completo**: Orden → Guía de remisión → Factura → Detracción

---

## Stack de tecnologías

```
Frontend:
- React 19 (client-side rendering)
- TypeScript 5+
- Tailwind CSS 4 (estilos)
- React Hook Form + Zod (validación)
- Framer Motion (animaciones)
- React Hot Toast (notificaciones)
- jsPDF (generación de PDF para guías y facturas)
- Heroicons (iconografía)

Gestión de estado:
- React Context API (inmutable state management)
- React Hooks (useState, useReducer, useContext)

Validación:
- Zod (esquemas de datos)
- Expresiones regulares (SUNAT: RUC, DNI, UBIs)

Internacionalización:
- next-intl (i18n: español/inglés)
```

---

## Arquitectura y construcción

### Renderizado

- **100% Client-Side**: No requiere backend; toda la lógica corre en el navegador
- **Estado en memoria**: Los datos se almacenan en React Context (se pierden al refrescar)
- **Mock Data inicial**: La demo carga con clientes, conductores y vehículos de ejemplo

### Estructura de directorios

```
transporte-carga/
├── page.tsx                 # Página raíz de la demo
├── layout.tsx               # Layout con sidebar y topbar
├── README.md                # Esta documentación
├── components/
│   ├── Dashboard.tsx        # Panel principal con KPIs
│   ├── ClientesTab.tsx      # CRUD de clientes
│   ├── ConductoresTab.tsx   # CRUD de conductores
│   ├── VehiculosTab.tsx     # CRUD de vehículos
│   ├── OrdenesTab.tsx       # Órdenes y transiciones de estado
│   ├── GuiasTab.tsx         # Guías de remisión y generación PDF
│   ├── FacturasTab.tsx      # Facturas y cálculo de detracciones
│   ├── ReportesTab.tsx      # Gráficos y análisis
│   └── modals/
│       ├── ClienteModal.tsx
│       ├── ConductorModal.tsx
│       ├── VehiculoModal.tsx
│       ├── OrdenModal.tsx
│       └── ConfirmModal.tsx
├── api/
│   ├── index.ts             # Función transporteAPI() con endpoints simulados
│   └── types.ts             # Tipos TypeScript (Cliente, Orden, Guía, Factura, etc.)
├── store/
│   ├── TransporteStore.tsx  # Context provider
│   └── hooks.ts             # useTransporte hook
├── utils/
│   ├── sunat.ts             # Validación SUNAT, cálculo de IGV, detracciones
│   ├── pdf.ts               # Generación de PDF (jsPDF)
│   ├── mock-data.ts         # Datos iniciales
│   └── validators.ts        # Validadores Zod y expresiones regulares
└── __tests__/
    ├── integration.test.ts  # Test del flujo end-to-end
    └── sunat.test.ts        # Tests de validación SUNAT
```

### Flujo de datos

```
App (page.tsx)
  └── TransporteProvider (Context)
       ├── useTransporte() hook
       ├── transporteAPI (simulado en memoria)
       └── State: { clientes, conductores, vehículos, órdenes, guías, facturas }
            ├── Dashboard: Lee estado y muestra KPIs
            ├── Tabs (CRUD): Escriben a través de transporteAPI
            ├── Modales: Manejan formularios y validaciones
            └── PDFs: Generados on-the-fly desde guías/facturas
```

---

## Cómo construir y renderizar

### Build local

```bash
# En la carpeta del proyecto (apps/web)
npm run build
npm run dev

# Abrir en navegador:
http://localhost:3000/demo/transporte-carga
```

### Estado inicial (mock data)

Al cargar la demo por primera vez, el Context carga automáticamente:
- 3 clientes de ejemplo (RUC válidos)
- 2 conductores
- 2 vehículos
- 1 orden de ejemplo (estado: pendiente)

Estos datos residen en React Context y se pierden al refrescar. Para persistencia real, se requiere backend.

### Renderización en navegador

1. **Carga del HTML** → React hidrata la aplicación desde el JSX
2. **Carga del Context** → TransporteProvider carga mock data inicial
3. **Componentes montados** → Dashboard, Tabs, Modales
4. **Interacción del usuario** → Llamadas a transporteAPI (en memoria)
5. **Actualización de estado** → useTransporte actualiza Context
6. **Re-renderizado** → React actualiza el DOM

---

## Cómo extender la demo

### 1. Agregar un país adicional (ej. Colombia)

```typescript
// apps/web/src/app/demo/transporte-carga/api/types.ts
export type Pais = 'peru' | 'colombia';

export interface DemoConfig {
  pais: Pais;
  regimenes: {
    peru: { codigo: '027'; nombre: 'SPOT'; porcentaje: 4 },
    colombia: { codigo: '04'; nombre: 'Transporte'; porcentaje: 8 }
  }
}
```

Luego, en `utils/sunat.ts`, agregar lógica condicionada por país.

### 2. Integración con SUNAT real

Reemplazar `transporteAPI` en `api/index.ts`:

```typescript
export const transporteAPI = createTransporteAPI({
  backend: 'https://api-sunat.koptup.com',
  token: process.env.NEXT_PUBLIC_SUNAT_TOKEN,
});

// En lugar de:
const transporteAPI = createMockAPI();
```

Requiere:
- Backend Express con rutas `/api/guias/emitir`, `/api/facturas/emitir`, etc.
- Conexión real a SUNAT (certificado digital XAdES)
- Base de datos persistente

### 3. Firma digital XAdES real

Actualmente, el XML no es firmado (simulado). Para firma real:

```typescript
// utils/firma-digital.ts
import forge from 'node-forge';

export async function firmarXML(xml: string, certificado: ArrayBuffer, clave: string) {
  const signed = signature.signXml(xml, certificado, clave, {
    algoritmo: 'SHA256',
    formato: 'enveloped',
  });
  return signed;
}
```

Requiere:
- Certificado digital del contribuyente (.p12 o .pem)
- Backend con node-forge o librería similar

### 4. Persistencia con base de datos

Usar el paquete `database` existente en koptup:

```typescript
// api/index.ts con Prisma
import { db } from '@/lib/database';

export const transporteAPI = {
  clientes: {
    create: async (data) => {
      return db.cliente.create({ data });
    },
    list: async () => db.cliente.findMany(),
  },
  // ... resto de CRUD
};
```

---

## Reglas SUNAT implementadas

### Validación de RUC

```typescript
// Formato: 20 dígitos
// Primero: número de identificación (2 dígitos, ej: 20, 10)
// Segundo: número secuencial (11 dígitos)
// Tercero: dígito verificador (1 dígito)
const rucRegex = /^(20|10)\d{9}$/;
```

### Cálculo de IGV (18%)

```typescript
const igv = total * 0.18;
```

### Guía de Remisión Electrónica (GRE)

- Formato: `[LETRA]-[3DÍGITOS]-[5DÍGITOS]`
- Ej: `A001-00001`
- Estructura XML: UBL 2.1 (validación contra XSD SUNAT)

### Detracciones (SPOT, código 027)

```typescript
// Código: 027 (Transporte de Mercancías)
// Se aplica si:
// - Monto total >= S/ 700
// - Porcentaje: 4% del subtotal
const detracccion = {
  aplica: total >= 700,
  codigo: '027',
  descripcion: 'Transporte de mercancías',
  porcentaje: 4,
  monto: total * 0.04,
};
```

### UBL 2.1

- Estándar internacional para facturación electrónica
- XML con estructura específica
- Validación contra XSD de SUNAT
- Incluye: encabezado, ítems, montos, referencias

---

## Endpoints simulados (transporteAPI)

### Clientes

```typescript
transporteAPI.clientes.create(data)   // POST /clientes
transporteAPI.clientes.list()         // GET /clientes
transporteAPI.clientes.get(id)        // GET /clientes/:id
transporteAPI.clientes.update(id, data) // PUT /clientes/:id
transporteAPI.clientes.delete(id)     // DELETE /clientes/:id
```

### Conductores, Vehículos (CRUD similar)

```typescript
transporteAPI.conductores.*
transporteAPI.vehiculos.*
```

### Órdenes de servicio

```typescript
transporteAPI.ordenes.create(data)
transporteAPI.ordenes.list()
transporteAPI.ordenes.get(id)
transporteAPI.ordenes.transitar(id, nuevoEstado)  // Cambiar estado
// Estados: pendiente → confirmada → en_ruta → entregada
```

### Guías de remisión

```typescript
transporteAPI.guias.create(data)
transporteAPI.guias.emitir(id)        // Genera XML y marca como emitida
transporteAPI.guias.get(id)
transporteAPI.guias.generarPDF(id)
```

### Facturas

```typescript
transporteAPI.facturas.create(data)
transporteAPI.facturas.emitir(id)     // Calcula detracción y XML
transporteAPI.facturas.get(id)
transporteAPI.facturas.generarPDF(id)
```

### Reportes

```typescript
transporteAPI.reportes.kpis()         // KPIs del mes actual
transporteAPI.reportes.fletesPorMes() // Gráfico de ingresos
transporteAPI.reportes.clienteTop()   // Clientes top por volumen
```

---

## Diagrama de flujo: Orden → Guía → Factura

```
┌─────────────────┐
│ ORDEN CREADA    │  (estado: "pendiente")
│ OS-2024-00001   │  Cliente, conductor, vehículo, flete
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ CONFIRMADA          │  Usuario confirma operación
│                     │  Verifica datos de transporte
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ EN RUTA             │  Se inicia transporte físico
│ (tracking)          │  Ubigeo origen → destino
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ ENTREGADA           │  Mercancía llega a destino
│ (confirmación)      │  Se genera documento de entrega
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│ GUÍA DE REMISIÓN (GRE)   │  Automática al estado "entregada"
│ GRE-A001-00001 (XML)     │  Genera XML UBL 2.1
│ - Origen, destino        │  Incluye: peso, bultos, descripción
│ - Transportista datos    │  Conductor y vehículo
│ - Trazabilidad           │  Marcas de producto
└────────┬─────────────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
    ┌──────────┐        ┌──────────────┐
    │ PDF GRE  │        │ FACTURA      │
    │ (imprime)│        │ FACV0000001  │
    └──────────┘        │ - Subtotal   │
                        │ - IGV 18%    │
                        │ - DETRACCIÓN │
                        │   (si aplica)│
                        │ - TOTAL      │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ XML FACTURA  │
                        │ (UBL 2.1)    │
                        │              │
                        │ DETRACCIÓN:  │
                        │ Código 027   │
                        │ 4% (≥ S/ 700)│
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ PDF FACTURA  │
                        │ (descargable)│
                        └──────────────┘
```

---

## Capturas de pantalla (a tomar después de levantar)

Después de ejecutar `npm run dev` y navegar a `http://localhost:3000/demo/transporte-carga`, captura:

- [ ] Dashboard con KPIs iniciales (ingresos, órdenes, clientes activos)
- [ ] Pestaña "Clientes": Lista con opciones de crear, editar, eliminar
- [ ] Modal crear cliente: Formulario con validación RUC/DNI
- [ ] Pestaña "Órdenes": Tabla con estados visuales (colores)
- [ ] Modal crear orden: Selección de cliente, conductor, vehículo
- [ ] Transición de estado: botones para cambiar "pendiente" → "confirmada" → "en_ruta" → "entregada"
- [ ] Pestaña "Guías": Guía generada con botón "Descargar PDF"
- [ ] PDF de guía: Vista previa o descarga del documento
- [ ] Pestaña "Facturas": Factura con detracción calculada
- [ ] PDF de factura: Muestra IGV, detracción, total
- [ ] Pestaña "Reportes": Gráficos de ingresos por mes
- [ ] Modo oscuro: Dark mode aplicado a todos los componentes
- [ ] Responsive: Vista en móvil (drawer sidebar)

---

## Roles soportados

### Admin
- Acceso total: CRUD de todos los recursos
- Emisión de guías y facturas
- Generación de reportes
- Configuración de empresas

### Operador
- CRUD de órdenes (crear, editar, cambiar estado)
- Visualización de guías y facturas
- Acceso de lectura a reportes
- No puede eliminar datos críticos

### Conductor
- Visualización de órdenes asignadas
- Cambio de estado ("en_ruta", "entregada")
- Acceso limitado (solo sus órdenes)
- No accede a gestión financiera

**Nota**: La demo actual no implementa roles; todos los usuarios tienen permisos de admin. Para roles reales, agregar middleware de autorización.

---

## Limitaciones actuales

- ✋ **Sin persistencia**: Los datos se pierden al refrescar (en memoria)
- ✋ **Sin firma digital real**: XML no es firmado con certificado XAdES
- ✋ **Sin integración SUNAT**: La guía y factura no se envían realmente a SUNAT
- ✋ **Sin roles implementados**: Todos los usuarios son admin
- ✋ **Sin notificaciones reales**: Toast simulado, sin email/SMS
- ✋ **PDF generado localmente**: No se guarda en servidor

---

## Próximos pasos (roadmap)

1. **Backend Express + Persistencia**
   - Crear API REST en `apps/backend`
   - Conectar a base de datos (Postgres con Prisma)
   - Reemplazar transporteAPI simulado

2. **Firma digital XAdES real**
   - Integrar librería node-forge
   - Cargar certificado del usuario
   - Firmar XML y enviar a SUNAT

3. **Conexión real a SUNAT**
   - Integrar API de SUNAT (UBL 2.1 validation)
   - Enviar guías y facturas reales
   - Recibir tickets de aceptación

4. **Detracciones automáticas**
   - Integración con SPOT (Sistema de Pago de Obligaciones Tributarias)
   - Cálculo automático y notificación de pago

5. **Múltiples países**
   - Estructura parametrizada por país
   - Validaciones y formatos específicos (Colombia, Chile, etc.)

6. **Roles y permisos granulares**
   - Implementar modelo RBAC
   - Permisos por recurso y acción

7. **Mobile App**
   - React Native con Expo
   - Sincronización offline-first con backend

---

## Créditos

Desarrollado para **KopTup** como demo educativa de gestión de transporte de carga en Perú, siguiendo estándares SUNAT y buenas prácticas de software empresarial.

**Versión**: 1.0.0  
**Fecha**: 2024  
**Licencia**: Propietaria KopTup
