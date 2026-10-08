# Servicios de embeddings

Hoy el backend genera embeddings en dos lugares. Los dos llaman a la API de embeddings de OpenAI (`OPENAI_API_KEY`) y guardan los vectores en MongoDB.

| Servicio | Qué vectoriza | Modelo | Dónde guarda | Quién lo usa |
|---|---|---|---|---|
| `embeddings.service.ts` | Códigos CUPS (código + descripción + categoría + especialidad) | `text-embedding-3-small` | Colección `CUPS` (campo de embedding) | `controllers/cups.controller.ts` (búsqueda semántica, similares, estadísticas y vectorización) |
| `document-ai.service.ts` → `generateDocumentEmbedding()` | Texto de los documentos que sube el usuario (primeros 8000 caracteres) y la consulta de búsqueda | `text-embedding-ada-002` | Campo `embedding` del modelo `Document` | `controllers/document.controller.ts` (subida y búsqueda semántica con similitud de coseno) |

La demo RAG del chatbot (`services/rag-pipeline.ts` y `services/demo-rag.service.ts`) tiene su propio flujo de fragmentos y recuperación; no usa estos servicios.

## Historial

- **Retirado:** `embedding.service.ts` (Pinecone + PostgreSQL). Nadie lo importaba, su almacenamiento en PostgreSQL ya no existía (`config/database.ts` exportaba `null`) y la dependencia `@pinecone-database/pinecone` solo existía para él. Se eliminaron el archivo, `config/database.ts`, la dependencia y las variables `PINECONE_*` de los ejemplos de entorno.

## Ejemplo: CUPS

```typescript
import { embeddingsService } from './embeddings.service';

// Vectorizar todos los CUPS
await embeddingsService.vectorizarTodosCUPS();

// Buscar CUPS por descripción natural
const resultados = await embeddingsService.buscarSemantica('cirugía de apéndice', {
  limite: 10,
  umbralSimilaridad: 0.7,
  especialidad: 'Cirugía General',
});

// Estadísticas
const stats = await embeddingsService.obtenerEstadisticasVectorizacion();
console.log(`${stats.cupsVectorizados}/${stats.totalCUPS} CUPS vectorizados`);
```

## Configuración

```env
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb://...
```
