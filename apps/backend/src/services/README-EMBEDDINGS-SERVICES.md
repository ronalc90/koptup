# Servicios de Embeddings

Existen 2 servicios de embeddings en el proyecto. **NO están duplicados** - tienen propósitos completamente diferentes.

## 📋 Servicios Disponibles

### 1. `embedding.service.ts` - Embeddings Genéricos de Documentos
**Tamaño:** 170 líneas
**Propósito:** Búsqueda semántica general de documentos subidos por usuarios

#### Características:
- 🗄️ **Storage:** Pinecone (vector database) + PostgreSQL
- 🤖 **Modelo:** `text-embedding-ada-002`
- 📄 **Datos:** Documentos generales (PDFs, textos, etc.)
- ✂️ **Chunking:** Sí (divide textos largos en chunks de 1000 caracteres)
- 🔍 **Búsqueda:** Similarity search entre documentos

#### Funciones principales:
```typescript
generateEmbeddings(texts: string[]): Promise<number[][]>
processDocumentEmbeddings(documentId: string, text: string): Promise<void>
searchSimilarDocuments(query: string, userId: string, topK?: number): Promise<any[]>
```

#### Flujo de trabajo:
1. Usuario sube un documento
2. Texto se divide en chunks
3. Cada chunk se vectoriza con OpenAI
4. Vectors se guardan en Pinecone + PostgreSQL
5. Búsqueda semántica usa cosine similarity

#### Casos de uso:
- ✅ Buscar documentos similares en la biblioteca del usuario
- ✅ RAG (Retrieval Augmented Generation) general
- ✅ Semantic search en documentación
- ✅ Chatbot con contexto de documentos

---

### 2. `embeddings.service.ts` - Embeddings Especializados para CUPS
**Tamaño:** 382 líneas
**Propósito:** Búsqueda semántica de códigos CUPS médicos (Clasificación Única de Procedimientos en Salud)

#### Características:
- 🗄️ **Storage:** MongoDB
- 🤖 **Modelo:** `text-embedding-3-small` (más moderno y eficiente)
- 🏥 **Datos:** Códigos CUPS médicos (procedimientos, diagnósticos)
- ✂️ **Chunking:** No (cada CUPS es una unidad)
- 🔍 **Búsqueda:** Búsqueda por similitud semántica + filtros por categoría/especialidad

#### Clase principal:
```typescript
class EmbeddingsService {
  generarEmbedding(texto: string): Promise<number[]>
  vectorizarTodosCUPS(): Promise<ResultadoVectorizacion>
  buscarSemantica(consulta: string, opciones): Promise<ResultadoBusquedaSemantica[]>
  buscarSimilares(codigoCUPS: string, opciones): Promise<ResultadoBusquedaSemantica[]>
  obtenerEstadisticasVectorizacion(): Promise<{...}>
  revectorizarDesactualizados(): Promise<ResultadoVectorizacion>
}
```

#### Flujo de trabajo:
1. Base de datos CUPS se vectoriza completa
2. Cada CUPS combina: código + descripción + categoría + especialidad
3. Embeddings se guardan en MongoDB
4. Búsqueda semántica permite encontrar CUPS por descripción natural
5. Re-vectorización automática cuando CUPS se actualiza

#### Casos de uso:
- ✅ Buscar procedimientos médicos por descripción natural
  - Ejemplo: "cirugía de vesícula" → encuentra códigos CUPS relevantes
- ✅ Encontrar procedimientos similares
- ✅ Validar pertinencia médica
- ✅ Auditoría automática de facturas médicas
- ✅ Sistema experto médico

---

## 🔄 Comparación Detallada

| Característica | embedding.service.ts | embeddings.service.ts |
|----------------|---------------------|----------------------|
| **Dominio** | Documentos generales | CUPS médicos |
| **Storage** | Pinecone + PostgreSQL | MongoDB |
| **Modelo OpenAI** | text-embedding-ada-002 | text-embedding-3-small |
| **Dimensiones** | 1536 | 1536 |
| **Chunking** | ✅ Sí (overlap 200) | ❌ No |
| **Filtros** | Por userId | Por categoría/especialidad |
| **Batch Processing** | ❌ No | ✅ Sí (100 items) |
| **Re-vectorización** | ❌ No | ✅ Sí (detecta desactualizados) |
| **Estadísticas** | ❌ No | ✅ Sí |
| **Rate Limiting** | ❌ No | ✅ Sí (100ms entre llamadas) |
| **Uso** | Chatbot, RAG general | Auditoría médica, Sistema Experto |

---

## 🎯 ¿Cuándo usar cada uno?

### Usar `embedding.service.ts` si:
- Trabajas con documentos PDF/texto subidos por usuarios
- Necesitas buscar documentos similares
- Implementas RAG general
- Quieres chatbot con contexto de documentos
- Usas Pinecone como vector database

### Usar `embeddings.service.ts` si:
- Trabajas con códigos CUPS médicos
- Necesitas búsqueda semántica de procedimientos
- Implementas auditoría médica automática
- Validas pertinencia de procedimientos
- Usas MongoDB como base de datos

---

## 💡 Ejemplos de Uso

### embedding.service.ts - Documentos Generales
```typescript
import { processDocumentEmbeddings, searchSimilarDocuments } from './embedding.service';

// Procesar un nuevo documento
await processDocumentEmbeddings('doc-123', 'Contenido del documento...');

// Buscar documentos similares
const similares = await searchSimilarDocuments(
  'busco información sobre facturas médicas',
  'user-456',
  5
);
```

### embeddings.service.ts - CUPS Médicos
```typescript
import { embeddingsService } from './embeddings.service';

// Vectorizar todos los CUPS
await embeddingsService.vectorizarTodosCUPS();

// Buscar CUPS por descripción natural
const resultados = await embeddingsService.buscarSemantica(
  'cirugía de apéndice',
  {
    limite: 10,
    umbralSimilaridad: 0.7,
    especialidad: 'Cirugía General'
  }
);

// Buscar procedimientos similares
const similares = await embeddingsService.buscarSimilares('890201', {
  limite: 5,
  umbralSimilaridad: 0.75
});

// Estadísticas
const stats = await embeddingsService.obtenerEstadisticasVectorizacion();
console.log(`${stats.cupsVectorizados}/${stats.totalCUPS} CUPS vectorizados`);
```

---

## 🔧 Configuración Requerida

### embedding.service.ts
```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=koptup-documents
```

### embeddings.service.ts
```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://...
```

---

## 🚫 NO Consolidar Estos Servicios

### Razones para mantenerlos separados:

1. ✅ **Dominios diferentes:** Documentos generales vs CUPS médicos
2. ✅ **Storage diferentes:** Pinecone+PostgreSQL vs MongoDB
3. ✅ **Modelos diferentes:** Optimizados para cada caso
4. ✅ **Funcionalidades diferentes:** Chunking vs Batch processing
5. ✅ **Casos de uso diferentes:** RAG general vs Auditoría médica

### Posibles mejoras futuras:
1. 🔄 Extraer función de cosine similarity a utilidad compartida
2. 📝 Crear interfaz base `IEmbeddingService`
3. 🏗️ Factory pattern para crear instancias según tipo
4. 📊 Métricas de performance unificadas
5. 🧪 Testing unitario compartido

---

## 📊 Performance

### embedding.service.ts
- **Velocidad:** Rápido (usa Pinecone, optimizado para vectores)
- **Escalabilidad:** Excelente (Pinecone maneja millones de vectores)
- **Costo:** Medio (Pinecone + OpenAI)

### embeddings.service.ts
- **Velocidad:** Medio (MongoDB no está optimizado para vectores)
- **Escalabilidad:** Buena (hasta ~100k CUPS)
- **Costo:** Bajo (solo OpenAI + MongoDB existente)
- **Optimización:** Batch processing + rate limiting

---

**Último actualizado:** 2025-11-23
**Autor:** Sistema KopTup
**Versión:** 1.0
