/**
 * rag-pipeline.ts — piezas compartidas del pipeline RAG de las demos.
 *
 * Extraído tal cual de `routes/chatbot.routes.ts` (Builder + Playground del
 * chatbot) para que la demo "Prueba con tu documento" (`routes/demo-rag.routes.ts`)
 * use exactamente el mismo pipeline:
 *
 *   texto → chunking (párrafos / oraciones) → índice BM25-lite (tokens por
 *   chunk) → retrieval top-K → OpenAI Chat Completions con los fragmentos.
 *
 * No hay embeddings: el "índice" de cada documento son los tokens normalizados
 * de sus chunks. Cualquier cambio aquí afecta a ambas demos.
 */
import crypto from 'crypto';

// --- Tipos -------------------------------------------------------------------

export interface RagChunk {
  id: string;
  docId: string;
  docName: string;
  text: string;
  /** Tokens normalizados (lower-case, sin puntuación) para retrieval BM25-lite. */
  tokens: string[];
}

export interface RagChunkSource {
  docId: string;
  docName: string;
}

// --- Helpers de texto --------------------------------------------------------

const TOKEN_REGEX = /[a-záéíóúñüäöüß0-9]+/gi;

export function tokenize(input: string): string[] {
  if (!input) return [];
  const matches = input.toLowerCase().match(TOKEN_REGEX);
  if (!matches) return [];
  return matches.filter((t) => t.length > 2);
}

export function makeChunk(text: string, source: RagChunkSource): RagChunk {
  return {
    id: 'chk_' + crypto.randomBytes(6).toString('hex'),
    docId: source.docId,
    docName: source.docName,
    text,
    tokens: tokenize(text),
  };
}

/**
 * Chunking simple: prioriza párrafos (doble salto). Si un párrafo excede ~800
 * chars, lo subdivide por oraciones agrupando hasta ~500 chars con overlap por
 * oración. Mantiene SRP: una sola responsabilidad — partir texto en pedazos
 * con suficiente contexto para retrieval.
 */
export function chunkText(rawText: string, source: RagChunkSource): RagChunk[] {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);
  const out: RagChunk[] = [];
  for (const p of paragraphs) {
    if (p.length <= 800) {
      out.push(makeChunk(p, source));
      continue;
    }
    const sentences = p.split(/(?<=[.!?])\s+/);
    let buf = '';
    for (const s of sentences) {
      const candidate = buf ? buf + ' ' + s : s;
      if (candidate.length > 500 && buf.length > 0) {
        out.push(makeChunk(buf, source));
        buf = s;
      } else {
        buf = candidate;
      }
    }
    if (buf.trim().length > 0) out.push(makeChunk(buf, source));
  }
  // Si no había párrafos válidos (sin saltos dobles) pero hay texto, igual chunkamos.
  if (out.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length; i += 500) {
      const slice = text.slice(i, i + 500);
      if (slice.trim().length > 20) out.push(makeChunk(slice, source));
    }
  }
  return out;
}

/**
 * BM25-lite: TF saturado (tf / (tf + 1)) ponderado por IDF clásico.
 * Devuelve los topK chunks con score > 0, en orden descendente.
 */
export function retrieve<T extends { tokens: string[] }>(
  query: string,
  chunks: T[],
  topK = 3,
): Array<{ chunk: T; score: number }> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || chunks.length === 0) return [];

  const docFreq: Record<string, number> = {};
  for (const c of chunks) {
    const seen = new Set(c.tokens);
    for (const t of seen) docFreq[t] = (docFreq[t] ?? 0) + 1;
  }
  const N = chunks.length;

  return chunks
    .map((c) => {
      let score = 0;
      for (const qt of queryTokens) {
        let tf = 0;
        for (const t of c.tokens) if (t === qt) tf += 1;
        if (tf === 0) continue;
        const df = docFreq[qt] ?? 1;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        score += idf * (tf / (tf + 1));
      }
      return { chunk: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ---------------------------------------------------------------------------
//   Catálogo de modelos LLM soportados
// ---------------------------------------------------------------------------
//
// SRP: este objeto es la única fuente de verdad para los modelos disponibles
// y sus precios. El endpoint /api/chatbot/models lo expone tal cual, el chat
// del chatbot lo usa para validar/whitelisting + estimar el costo del request
// y la demo "Prueba con tu documento" lo usa para su tope de gasto mensual.
//
// Sólo modelos GPT de OpenAI: el cliente confirmó que no tiene API key de
// Claude/Gemini. Si en el futuro se agregan otros providers, agregar la
// entrada acá y exponer el flag `enabled` en función de su env var.
export interface ModelMeta {
  id: string;
  name: string;
  provider: 'openai';
  /** USD por 1M tokens de input. */
  costInputUSDper1M: number;
  /** USD por 1M tokens de output. */
  costOutputUSDper1M: number;
  recommended?: boolean;
}

export const OPENAI_MODELS: ReadonlyArray<ModelMeta> = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'openai',
    costInputUSDper1M: 0.15,
    costOutputUSDper1M: 0.6,
    recommended: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    costInputUSDper1M: 2.5,
    costOutputUSDper1M: 10,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    costInputUSDper1M: 10,
    costOutputUSDper1M: 30,
  },
];

export const DEFAULT_MODEL_ID = 'gpt-4o-mini';
export const ALLOWED_MODEL_IDS = new Set(OPENAI_MODELS.map((m) => m.id));

export function estimateCostUSD(modelId: string, promptTokens: number, completionTokens: number): number {
  const meta = OPENAI_MODELS.find((m) => m.id === modelId) ?? OPENAI_MODELS[0];
  const cost =
    (promptTokens / 1e6) * meta.costInputUSDper1M +
    (completionTokens / 1e6) * meta.costOutputUSDper1M;
  return Number(cost.toFixed(6));
}

/**
 * Llama a OpenAI Chat Completions. Aislado en un helper para mantener los
 * handlers livianos y testeables. Devuelve el texto generado más metadatos
 * (usage, latencia).
 *
 * Reintentos y backoff los maneja el caller; acá hacemos un único request
 * con timeout de 30s (suficiente para gpt-4o sin streaming).
 */
export async function callOpenAI(args: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  context: string;
  history: Array<{ role: string; content: string }>;
  userMessage: string;
}): Promise<{
  reply: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}> {
  const t0 = Date.now();
  const messages = [
    { role: 'system', content: args.systemPrompt },
    ...args.history
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: `Fragmentos disponibles:\n${args.context}\n\nPregunta del usuario: ${args.userMessage}`,
    },
  ];

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const latencyMs = Date.now() - t0;

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`OpenAI HTTP ${resp.status}: ${text.slice(0, 300)}`) as Error & {
      status?: number;
      latencyMs?: number;
    };
    err.status = resp.status;
    err.latencyMs = latencyMs;
    throw err;
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const reply = data.choices?.[0]?.message?.content?.trim() || '(Sin respuesta del modelo)';
  return {
    reply,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    totalTokens: data.usage?.total_tokens ?? 0,
    latencyMs,
  };
}
