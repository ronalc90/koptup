import { NextRequest, NextResponse } from 'next/server';

/**
 * Genera contenido LinkedIn con OpenAI en un solo round-trip:
 *   - Post orgánico (hook, body, CTA, hashtags)
 *   - Ad copy LinkedIn Sponsored (headline, intro, description)
 *   - Carrusel 7 slides (title + bullets por slide)
 *
 * Single-call con response_format JSON Schema → garantiza la forma de la salida.
 * Si OpenAI falla o falta la key, devolvemos 503 y el frontend cae al
 * generador local (generador.ts) automáticamente.
 */

export const runtime = 'nodejs';
// El cliente usa este endpoint en vivo; no cacheamos respuestas.
export const dynamic = 'force-dynamic';

interface RequestBody {
  demo: {
    titulo: string;
    tagline: string;
    industria: string;
    path: string;
    emoji: string;
    problemaResuelve: string;
    beneficiosClave: string[];
    publicoObjetivo: string[];
    metricaImpactante: string;
    caracteristicasIA: string[];
    hashtagsEspecificos: string[];
  };
  angulo: string;
  tono: string;
  anguloLabel?: string;
  anguloDescripcion?: string;
  tonoLabel?: string;
  tonoDescripcion?: string;
}

interface OpenAiPayload {
  post: {
    hook: string;
    body: string;
    cta: string;
    hashtags: string[];
  };
  ad: {
    headline: string;
    introText: string;
    description: string;
    cta: 'Más información' | 'Visitar sitio web' | 'Registrarse' | 'Probar demo';
  };
  carrusel: Array<{
    numero: number;
    titulo: string;
    bullets: string[];
    notaVisual: string;
  }>;
  // Extra: insight de por qué esta combinación tono+ángulo le sirve a este demo.
  estrategia: string;
}

const SYSTEM_PROMPT = `Sos un copywriter senior de LinkedIn para B2B SaaS en LATAM. Tu trabajo es generar contenido orgánico, ad copy y carruseles que:
- Generen engagement real (no buzzword soup).
- Conecten con la audiencia objetivo del producto.
- Usen español rioplatense neutro (entiende LATAM entero).
- Empiecen con un hook fuerte: pregunta, dato sorprendente o promesa concreta.
- Respeten los límites de LinkedIn (post máx 3000 chars, ad headline 70, intro 150, description 70).
- Cierren con CTA clara al demo de Koptup.
- NUNCA inventen métricas o casos de clientes que no estén en el input. Si necesitás un caso, frasealo como hipótesis ("Imaginá una empresa de X que...").

Devolvé JSON estricto cumpliendo el schema. Nada de markdown.`;

function buildUserPrompt(req: RequestBody): string {
  const d = req.demo;
  return `Generá contenido LinkedIn para promocionar este producto de Koptup:

PRODUCTO
- Título: ${d.titulo}
- Tagline: ${d.tagline}
- Industria: ${d.industria}
- Problema que resuelve: ${d.problemaResuelve}
- Beneficios clave: ${d.beneficiosClave.map((b, i) => `${i + 1}) ${b}`).join('; ')}
- Capacidades IA: ${d.caracteristicasIA.join(', ')}
- Público objetivo: ${d.publicoObjetivo.join(', ')}
- Métrica impactante: ${d.metricaImpactante}
- URL del demo: https://koptup.com${d.path}
- Emoji del producto: ${d.emoji}
- Hashtags específicos: ${d.hashtagsEspecificos.join(' ')}

ÁNGULO: ${req.anguloLabel || req.angulo}${req.anguloDescripcion ? ` — ${req.anguloDescripcion}` : ''}
TONO: ${req.tonoLabel || req.tono}${req.tonoDescripcion ? ` — ${req.tonoDescripcion}` : ''}

ENTREGABLES (todos a la vez, en un único JSON):

1. post.hook: 1 línea. Gancho fuerte que pare el scroll.
2. post.body: 5-10 líneas. Bullets con emojis. Mencioná métrica y caso de uso.
3. post.cta: 1-2 líneas con la URL https://koptup.com${d.path}.
4. post.hashtags: 6-9 hashtags relevantes (incluí #Koptup obligatorio).

5. ad.headline: máx 70 chars, vendedor.
6. ad.introText: máx 150 chars, gancho + URL.
7. ad.description: máx 70 chars, subtítulo.
8. ad.cta: una de ['Más información','Visitar sitio web','Registrarse','Probar demo'].

9. carrusel: array de 7 slides. Slide 1 = portada con título + emoji. Slide 2 = problema. Slide 3 = solución (bullets). Slide 4 = capacidades IA. Slide 5 = métrica. Slide 6 = para quién. Slide 7 = CTA a la URL.
   Cada slide tiene: numero (1-7), titulo (corto), bullets (1-4 líneas concisas), notaVisual (instrucción para el diseñador).

10. estrategia: 1-2 líneas explicando por qué este ángulo + tono va a funcionar para esta combinación demo/audiencia.`;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['post', 'ad', 'carrusel', 'estrategia'],
  properties: {
    post: {
      type: 'object',
      additionalProperties: false,
      required: ['hook', 'body', 'cta', 'hashtags'],
      properties: {
        hook: { type: 'string' },
        body: { type: 'string' },
        cta: { type: 'string' },
        hashtags: {
          type: 'array',
          items: { type: 'string' },
          minItems: 4,
          maxItems: 12,
        },
      },
    },
    ad: {
      type: 'object',
      additionalProperties: false,
      required: ['headline', 'introText', 'description', 'cta'],
      properties: {
        headline: { type: 'string', maxLength: 90 },
        introText: { type: 'string', maxLength: 200 },
        description: { type: 'string', maxLength: 90 },
        cta: {
          type: 'string',
          enum: ['Más información', 'Visitar sitio web', 'Registrarse', 'Probar demo'],
        },
      },
    },
    carrusel: {
      type: 'array',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['numero', 'titulo', 'bullets', 'notaVisual'],
        properties: {
          numero: { type: 'integer', minimum: 1, maximum: 8 },
          titulo: { type: 'string' },
          bullets: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 6,
          },
          notaVisual: { type: 'string' },
        },
      },
    },
    estrategia: { type: 'string' },
  },
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY no configurada en el servidor.' },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body?.demo?.titulo || !body?.angulo || !body?.tono) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: demo, angulo, tono.' },
      { status: 400 },
    );
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const oaResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(body) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'linkedin_content_pack',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });

    if (!oaResp.ok) {
      const errText = await oaResp.text();
      // Si el modelo no soporta json_schema, reintentamos con json_object (compat).
      if (oaResp.status === 400 && /response_format|json_schema/i.test(errText)) {
        const fallback = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.85,
            messages: [
              {
                role: 'system',
                content:
                  SYSTEM_PROMPT +
                  '\n\nDevolvé EXCLUSIVAMENTE un objeto JSON con la forma {post:{hook,body,cta,hashtags[]},ad:{headline,introText,description,cta},carrusel:[{numero,titulo,bullets[],notaVisual}],estrategia}.',
              },
              { role: 'user', content: buildUserPrompt(body) },
            ],
            response_format: { type: 'json_object' },
          }),
        });
        if (!fallback.ok) {
          const t = await fallback.text();
          return NextResponse.json(
            { error: 'OpenAI rechazó la solicitud', detail: t.slice(0, 400) },
            { status: 502 },
          );
        }
        const j = await fallback.json();
        const content = j.choices?.[0]?.message?.content;
        if (!content) {
          return NextResponse.json({ error: 'Respuesta vacía de OpenAI' }, { status: 502 });
        }
        const parsed = JSON.parse(content) as OpenAiPayload;
        return NextResponse.json({ data: parsed, model, usage: j.usage });
      }

      return NextResponse.json(
        { error: 'OpenAI rechazó la solicitud', detail: errText.slice(0, 400) },
        { status: 502 },
      );
    }

    const json = await oaResp.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Respuesta vacía de OpenAI' }, { status: 502 });
    }
    const parsed = JSON.parse(content) as OpenAiPayload;
    return NextResponse.json({ data: parsed, model, usage: json.usage });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
