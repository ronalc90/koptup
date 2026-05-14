/**
 * Datos mock y tipos del Enterprise RAG Chatbot.
 * Todo es read-only e inmutable: mantenemos SRP separando el dataset de la UI.
 */

export type LayerKey =
  | 'ingestion'
  | 'chunking'
  | 'retrieval'
  | 'query'
  | 'ranking'
  | 'context'
  | 'agents'
  | 'tools'
  | 'memory'
  | 'multimodal'
  | 'models'
  | 'infra'
  | 'security'
  | 'observability'
  | 'eval'
  | 'optimization'
  | 'knowledge'
  | 'production'
  | 'nextLevel';

export interface LayerMeta {
  key: LayerKey;
  /** Etiqueta corta para Sidebar (texto plano, no i18n). El título traducido vive en messages. */
  glyph: string;
  /** Color de acento tailwind (compatible con dark mode). */
  accent: string;
}

export const LAYERS: readonly LayerMeta[] = [
  { key: 'ingestion',     glyph: '01', accent: 'emerald' },
  { key: 'chunking',      glyph: '02', accent: 'lime' },
  { key: 'retrieval',     glyph: '03', accent: 'cyan' },
  { key: 'query',         glyph: '04', accent: 'sky' },
  { key: 'ranking',       glyph: '05', accent: 'blue' },
  { key: 'context',       glyph: '06', accent: 'indigo' },
  { key: 'agents',        glyph: '07', accent: 'violet' },
  { key: 'tools',         glyph: '08', accent: 'purple' },
  { key: 'memory',        glyph: '09', accent: 'fuchsia' },
  { key: 'multimodal',    glyph: '10', accent: 'pink' },
  { key: 'models',        glyph: '11', accent: 'rose' },
  { key: 'infra',         glyph: '12', accent: 'red' },
  { key: 'security',      glyph: '13', accent: 'orange' },
  { key: 'observability', glyph: '14', accent: 'amber' },
  { key: 'eval',          glyph: '15', accent: 'yellow' },
  { key: 'optimization',  glyph: '16', accent: 'lime' },
  { key: 'knowledge',     glyph: '17', accent: 'teal' },
  { key: 'production',    glyph: '18', accent: 'cyan' },
  { key: 'nextLevel',     glyph: '19', accent: 'violet' },
] as const;

export type ScenarioKey = 'docs' | 'multiHop' | 'code' | 'sql' | 'graph';

export const SCENARIOS: readonly ScenarioKey[] = ['docs', 'multiHop', 'code', 'sql', 'graph'] as const;

export interface PipelineStepData {
  key: 'rewrite' | 'retrieve' | 'rerank' | 'context' | 'llm' | 'cite' | 'respond';
  durationMs: number;
  tokens: number;
  /** Etiquetas pequeñas (texto literal, no i18n para evitar inflar el namespace). */
  detail: string;
}

export interface SourceChunk {
  id: string;
  sourceKey: 'notion' | 'slack' | 'confluence' | 'github' | 'snowflake' | 'graph';
  page?: number;
  updated: string;
  score: number;
  rerankScore: number;
  /** Texto crudo del chunk para "source highlighting". */
  snippet: string;
}

export interface ScenarioPayload {
  /** Citas [n] referencian SourceChunk en este array (1-indexed). */
  sources: SourceChunk[];
  pipeline: PipelineStepData[];
  confidence: number;
  totalLatencyMs: number;
  totalTokens: number;
  costUsd: number;
}

export const SCENARIO_DATA: Record<ScenarioKey, ScenarioPayload> = {
  docs: {
    confidence: 92,
    totalLatencyMs: 1180,
    totalTokens: 1840,
    costUsd: 0.0162,
    sources: [
      {
        id: 'docs-1',
        sourceKey: 'confluence',
        page: 12,
        updated: '2026-03-14',
        score: 0.91,
        rerankScore: 0.97,
        snippet:
          'Enterprise customers retain transactional data for 7 years. Nightly purge jobs sweep records past TTL and append every deletion to the immutable audit trail (table audit.deletions).',
      },
      {
        id: 'docs-2',
        sourceKey: 'notion',
        updated: '2026-04-02',
        score: 0.88,
        rerankScore: 0.94,
        snippet:
          'Application logs are retained 3 years. PII fields are anonymized at 90 days when a deletion request is filed via /privacy/delete. The anonymization mask uses HMAC-SHA256.',
      },
    ],
    pipeline: [
      { key: 'rewrite',  durationMs: 78,  tokens: 64,  detail: 'HyDE + intent=policy_lookup' },
      { key: 'retrieve', durationMs: 156, tokens: 0,   detail: 'top-20 hybrid (0.6 dense / 0.4 sparse)' },
      { key: 'rerank',   durationMs: 142, tokens: 0,   detail: 'bge-reranker-large, top-6' },
      { key: 'context',  durationMs: 64,  tokens: 0,   detail: 'compressed 6 → 4 chunks' },
      { key: 'llm',      durationMs: 612, tokens: 1612, detail: 'claude-sonnet-4.7' },
      { key: 'cite',     durationMs: 48,  tokens: 164, detail: 'aligned 2 citations' },
      { key: 'respond',  durationMs: 80,  tokens: 0,   detail: 'streamed 412 tokens' },
    ],
  },
  multiHop: {
    confidence: 84,
    totalLatencyMs: 2210,
    totalTokens: 3140,
    costUsd: 0.0284,
    sources: [
      {
        id: 'mh-1',
        sourceKey: 'slack',
        updated: '2026-05-12',
        score: 0.86,
        rerankScore: 0.92,
        snippet:
          '#engineering · ronald: payments-svc had a P1 on Monday. We rolled back at 14:22 UTC. INC-2049 covers it. The cascading effect hit billing dashboards for ~40 min.',
      },
      {
        id: 'mh-2',
        sourceKey: 'confluence',
        page: 4,
        updated: '2026-05-13',
        score: 0.83,
        rerankScore: 0.90,
        snippet:
          'Tickets HD-9912 and HD-9914 report /charge timeouts. Spike correlated with deploy v4.18.0. Both customers were on the Enterprise tier and called support within 15 min of each other.',
      },
      {
        id: 'mh-3',
        sourceKey: 'github',
        updated: '2026-05-13',
        score: 0.81,
        rerankScore: 0.88,
        snippet:
          'RCA #INC-2049: retry loop missing idempotency-key triggers duplicated refunds on webhook timeout. Fix landed in PR #481 — payments-svc.',
      },
    ],
    pipeline: [
      { key: 'rewrite',  durationMs: 96,  tokens: 88,  detail: 'decomposed into 3 sub-queries' },
      { key: 'retrieve', durationMs: 312, tokens: 0,   detail: 'multi-hop, 3 indexes' },
      { key: 'rerank',   durationMs: 248, tokens: 0,   detail: 'cross-encoder + MMR' },
      { key: 'context',  durationMs: 108, tokens: 0,   detail: 'graph-walk join, 14 → 5 chunks' },
      { key: 'llm',      durationMs: 1182, tokens: 2780, detail: 'claude-sonnet-4.7' },
      { key: 'cite',     durationMs: 144, tokens: 272, detail: 'aligned 3 citations' },
      { key: 'respond',  durationMs: 120, tokens: 0,   detail: 'streamed 484 tokens' },
    ],
  },
  code: {
    confidence: 96,
    totalLatencyMs: 980,
    totalTokens: 1450,
    costUsd: 0.0128,
    sources: [
      {
        id: 'code-1',
        sourceKey: 'github',
        updated: '2026-05-09',
        score: 0.94,
        rerankScore: 0.98,
        snippet:
          'src/auth/refresh.service.ts\n\nasync rotate(token: string): Promise<TokenPair> {\n  const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] });\n  if (await this.denylist.has(payload.jti)) throw new RevokedTokenError();\n  await this.denylist.add(payload.jti, this.clock.now());\n  return this.issuePair(payload.uid);\n}',
      },
      {
        id: 'code-2',
        sourceKey: 'github',
        updated: '2026-05-09',
        score: 0.90,
        rerankScore: 0.95,
        snippet:
          'src/auth/refresh.controller.ts\n\nrouter.post("/refresh", validate(RefreshDto), async (req, res, next) => {\n  try { res.json(await refreshService.rotate(req.body.token)); }\n  catch (e) { if (e instanceof RevokedTokenError) return res.status(401).end(); next(e); }\n});',
      },
    ],
    pipeline: [
      { key: 'rewrite',  durationMs: 52,  tokens: 42,  detail: 'code-aware, lang=ts' },
      { key: 'retrieve', durationMs: 124, tokens: 0,   detail: 'code-index, AST-aware' },
      { key: 'rerank',   durationMs: 96,  tokens: 0,   detail: 'code-reranker fine-tuned' },
      { key: 'context',  durationMs: 48,  tokens: 0,   detail: 'kept structure intact' },
      { key: 'llm',      durationMs: 552, tokens: 1280, detail: 'claude-sonnet-4.7' },
      { key: 'cite',     durationMs: 40,  tokens: 128, detail: 'aligned 2 citations' },
      { key: 'respond',  durationMs: 68,  tokens: 0,   detail: 'streamed 326 tokens' },
    ],
  },
  sql: {
    confidence: 89,
    totalLatencyMs: 1640,
    totalTokens: 1980,
    costUsd: 0.0184,
    sources: [
      {
        id: 'sql-1',
        sourceKey: 'snowflake',
        updated: '2026-05-14',
        score: 0.92,
        rerankScore: 0.96,
        snippet:
          'SELECT country, SUM(revenue_usd) AS revenue\nFROM analytics.fct_revenue_country\nWHERE region = \'LATAM\' AND quarter = \'2026Q1\'\nGROUP BY country\nORDER BY revenue DESC;\n\n→ total 4,824,193.21 USD',
      },
      {
        id: 'sql-2',
        sourceKey: 'confluence',
        page: 22,
        updated: '2026-04-30',
        score: 0.84,
        rerankScore: 0.89,
        snippet:
          'Revenue glossary: revenue_usd is net of refunds and FX-normalized to USD at month-end rate. fct_revenue_country materializes hourly from raw.charges joined to dim.country.',
      },
    ],
    pipeline: [
      { key: 'rewrite',  durationMs: 84,  tokens: 72,  detail: 'NL→SQL, schema-aware' },
      { key: 'retrieve', durationMs: 196, tokens: 0,   detail: 'tool=sql_warehouse' },
      { key: 'rerank',   durationMs: 120, tokens: 0,   detail: 'no rerank for tool output' },
      { key: 'context',  durationMs: 72,  tokens: 0,   detail: 'attached row sample' },
      { key: 'llm',      durationMs: 928, tokens: 1740, detail: 'claude-sonnet-4.7' },
      { key: 'cite',     durationMs: 56,  tokens: 168, detail: 'aligned 2 citations' },
      { key: 'respond',  durationMs: 84,  tokens: 0,   detail: 'streamed 364 tokens' },
    ],
  },
  graph: {
    confidence: 90,
    totalLatencyMs: 1380,
    totalTokens: 1720,
    costUsd: 0.0156,
    sources: [
      {
        id: 'graph-1',
        sourceKey: 'graph',
        updated: '2026-05-13',
        score: 0.93,
        rerankScore: 0.97,
        snippet:
          'MATCH (s:Service {name:"auth-core"})<-[:DEPENDS_ON]-(c:Service)\nRETURN c.team, count(*) AS calls\n\n→ web-platform, mobile, payments-svc, billing, helpdesk, partners-api',
      },
      {
        id: 'graph-2',
        sourceKey: 'confluence',
        page: 8,
        updated: '2026-05-10',
        score: 0.85,
        rerankScore: 0.91,
        snippet:
          'Service catalog: auth-core is owned by platform-security. Mobile team has 2 deprecation tickets open in Q1 to migrate to auth-core v2.',
      },
    ],
    pipeline: [
      { key: 'rewrite',  durationMs: 74,  tokens: 58,  detail: 'entity-linked to Service:auth-core' },
      { key: 'retrieve', durationMs: 168, tokens: 0,   detail: 'graph 2-hop walk' },
      { key: 'rerank',   durationMs: 104, tokens: 0,   detail: 'GNN reranker' },
      { key: 'context',  durationMs: 60,  tokens: 0,   detail: 'attached subgraph' },
      { key: 'llm',      durationMs: 768, tokens: 1496, detail: 'claude-sonnet-4.7' },
      { key: 'cite',     durationMs: 48,  tokens: 166, detail: 'aligned 2 citations' },
      { key: 'respond',  durationMs: 76,  tokens: 0,   detail: 'streamed 308 tokens' },
    ],
  },
};

export interface SourceMeta {
  key: SourceChunk['sourceKey'];
  count: number;
  unitKey: 'docs' | 'messages' | 'pages';
  lastSync: string;
}

export const CONNECTED_SOURCES: readonly SourceMeta[] = [
  { key: 'notion',     count: 1230, unitKey: 'docs',     lastSync: '2 min' },
  { key: 'slack',      count: 45120, unitKey: 'messages', lastSync: '14 s' },
  { key: 'confluence', count: 854,  unitKey: 'pages',    lastSync: '5 min' },
] as const;

export const MODELS: readonly { id: string; label: string; cost: string }[] = [
  { id: 'claude-sonnet-4.7',  label: 'Claude Sonnet 4.7', cost: '$3 / $15 per Mtok' },
  { id: 'claude-opus-4.7',    label: 'Claude Opus 4.7',   cost: '$15 / $75 per Mtok' },
  { id: 'claude-haiku-4',     label: 'Claude Haiku 4',    cost: '$0.8 / $4 per Mtok' },
  { id: 'gpt-4o',             label: 'GPT-4o',            cost: '$2.5 / $10 per Mtok' },
  { id: 'gpt-4o-mini',        label: 'GPT-4o mini',       cost: '$0.15 / $0.6 per Mtok' },
  { id: 'llama-3.1-70b',      label: 'Llama 3.1 70B',     cost: 'self-hosted' },
] as const;

export const TENANTS: readonly { id: 'acme' | 'globex' | 'umbrella' }[] = [
  { id: 'acme' },
  { id: 'globex' },
  { id: 'umbrella' },
] as const;
