'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  MegaphoneIcon,
  RectangleStackIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  ANGULOS_LABELS,
  KOPTUP_DEMOS,
  TONOS_LABELS,
  type AnguloPost,
  type KoptupDemo,
  type TonoPost,
} from './data';
import {
  generarAdCopy,
  generarCarrusel,
  generarPost,
  type AdCopyGenerado,
  type CarruselSlide,
  type PostGenerado,
} from './generador';
import PostPreview from './PostPreview';

interface AiPack {
  post: PostGenerado;
  ad: AdCopyGenerado;
  carrusel: CarruselSlide[];
  estrategia: string;
  model: string;
}

interface OpenAiResponse {
  data?: {
    post: { hook: string; body: string; cta: string; hashtags: string[] };
    ad: {
      headline: string;
      introText: string;
      description: string;
      cta: AdCopyGenerado['cta'];
    };
    carrusel: Array<{
      numero: number;
      titulo: string;
      bullets: string[];
      notaVisual: string;
    }>;
    estrategia: string;
  };
  model?: string;
  error?: string;
  detail?: string;
}

interface PostGeneratorProps {
  demoIdInicial?: string | null;
  anguloInicial?: AnguloPost | null;
  imagenCapturada?: string | null;
}

type Vista = 'organico' | 'ad-pagado' | 'carrusel';

export default function PostGenerator({
  demoIdInicial,
  anguloInicial,
  imagenCapturada = null,
}: PostGeneratorProps) {
  const [demoId, setDemoId] = useState<string>(demoIdInicial ?? KOPTUP_DEMOS[0].id);
  const [angulo, setAngulo] = useState<AnguloPost>(anguloInicial ?? 'lanzamiento');
  const [tono, setTono] = useState<TonoPost>('cercano');
  const [variante, setVariante] = useState<number>(0);
  const [vista, setVista] = useState<Vista>('organico');
  const [copiado, setCopiado] = useState<string | null>(null);
  const [aiPack, setAiPack] = useState<AiPack | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (demoIdInicial) setDemoId(demoIdInicial);
    if (anguloInicial) setAngulo(anguloInicial);
  }, [demoIdInicial, anguloInicial]);

  // Cuando cambia demo/ángulo/tono/variante el pack IA queda obsoleto.
  useEffect(() => {
    setAiPack(null);
    setAiError(null);
  }, [demoId, angulo, tono, variante]);

  const demo = useMemo(
    () => KOPTUP_DEMOS.find((d) => d.id === demoId) ?? KOPTUP_DEMOS[0],
    [demoId],
  );

  const localPost = useMemo(
    () => generarPost(demo, angulo, tono, variante),
    [demo, angulo, tono, variante],
  );
  const localAd = useMemo(() => generarAdCopy(demo, variante), [demo, variante]);
  const localCarrusel = useMemo(() => generarCarrusel(demo), [demo]);

  // Si hay output de IA, lo usamos; si no, fallback al generador determinístico local.
  const post = aiPack?.post ?? localPost;
  const ad = aiPack?.ad ?? localAd;
  const carrusel = aiPack?.carrusel ?? localCarrusel;

  const copiar = (key: string, texto: string) => {
    void navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado(null), 1500);
  };

  const generarConIA = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const anguloMeta = ANGULOS_LABELS[angulo];
      const tonoMeta = TONOS_LABELS[tono];
      const resp = await fetch('/api/linkedin-ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demo: {
            titulo: demo.titulo,
            tagline: demo.tagline,
            industria: demo.industria,
            path: demo.path,
            emoji: demo.emoji,
            problemaResuelve: demo.problemaResuelve,
            beneficiosClave: demo.beneficiosClave,
            publicoObjetivo: demo.publicoObjetivo,
            metricaImpactante: demo.metricaImpactante,
            caracteristicasIA: demo.caracteristicasIA,
            hashtagsEspecificos: demo.hashtagsEspecificos,
          },
          angulo,
          tono,
          anguloLabel: anguloMeta?.label,
          anguloDescripcion: anguloMeta?.descripcion,
          tonoLabel: tonoMeta?.label,
          tonoDescripcion: tonoMeta?.descripcion,
        }),
      });
      const json = (await resp.json()) as OpenAiResponse;
      if (!resp.ok || !json.data) {
        throw new Error(json.error || json.detail || `HTTP ${resp.status}`);
      }

      // Adaptar al shape interno (textoCompleto + caracteres derivados).
      const aiPost: PostGenerado = {
        hook: json.data.post.hook,
        cuerpo: json.data.post.body,
        cta: json.data.post.cta,
        hashtags: json.data.post.hashtags,
        textoCompleto: [
          json.data.post.hook,
          json.data.post.body,
          json.data.post.cta,
          json.data.post.hashtags.join(' '),
        ]
          .filter(Boolean)
          .join('\n\n'),
        caracteres: 0,
      };
      aiPost.caracteres = aiPost.textoCompleto.length;

      const aiCarrusel: CarruselSlide[] = json.data.carrusel.map((s) => ({
        numero: s.numero,
        titulo: s.titulo,
        bullets: s.bullets,
        notaVisual: s.notaVisual,
      }));

      setAiPack({
        post: aiPost,
        ad: {
          headline: json.data.ad.headline,
          introText: json.data.ad.introText,
          description: json.data.ad.description,
          cta: json.data.ad.cta,
        },
        carrusel: aiCarrusel,
        estrategia: json.data.estrategia,
        model: json.model || 'openai',
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'No se pudo conectar con OpenAI');
    } finally {
      setAiLoading(false);
    }
  }, [demo, angulo, tono]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px,1fr]">
      <aside className="space-y-4">
        {/* CTA destacado: generar el pack completo con OpenAI */}
        <div className="rounded-xl border border-violet-300 bg-gradient-to-br from-violet-50 via-white to-primary-50 p-4 shadow-md dark:border-violet-700/60 dark:from-violet-950/40 dark:via-secondary-900 dark:to-primary-950/40">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
            <SparklesIcon className="h-4 w-4" /> Generar todo con IA
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-secondary-700 dark:text-secondary-300">
            Un click. OpenAI redacta el post orgánico, el ad copy LinkedIn Sponsored y los 7 slides
            del carrusel — todo coherente con el demo, ángulo y tono elegidos.
          </p>
          <button
            type="button"
            onClick={generarConIA}
            disabled={aiLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-violet-700 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Generando con OpenAI…
              </>
            ) : aiPack ? (
              <>
                <BoltIcon className="h-4 w-4" />
                Regenerar con IA
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                Generar todo con IA (1 click)
              </>
            )}
          </button>
          {aiError ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] leading-snug text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {aiError}. Mostrando versión local mientras tanto — podés regenerar cuando quieras.
              </span>
            </p>
          ) : null}
          {aiPack ? (
            <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] leading-snug text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              ✨ Generado por <strong>{aiPack.model}</strong>.{' '}
              <span className="opacity-90">{aiPack.estrategia}</span>
            </p>
          ) : null}
        </div>

        <Bloque titulo="Demo a promocionar">
          <select
            value={demoId}
            onChange={(e) => setDemoId(e.target.value)}
            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100"
          >
            {KOPTUP_DEMOS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.titulo}
              </option>
            ))}
          </select>
          <p className="mt-2 rounded-md bg-secondary-50 px-2.5 py-2 text-xs text-secondary-600 dark:bg-secondary-800/60 dark:text-secondary-300">
            {demo.tagline}
          </p>
        </Bloque>

        <Bloque titulo="Ángulo del post">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(ANGULOS_LABELS) as AnguloPost[]).map((a) => {
              const meta = ANGULOS_LABELS[a];
              const activo = angulo === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngulo(a)}
                  className={`rounded-md border px-2 py-1.5 text-left text-xs transition ${
                    activo
                      ? 'border-primary-500 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'
                  }`}
                  title={meta.descripcion}
                >
                  <span className="block font-semibold">
                    {meta.emoji} {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Bloque>

        <Bloque titulo="Tono">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TONOS_LABELS) as TonoPost[]).map((t) => {
              const meta = TONOS_LABELS[t];
              const activo = tono === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTono(t)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    activo
                      ? 'border-primary-500 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'
                  }`}
                  title={meta.descripcion}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Bloque>

        <Bloque titulo="Variante">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVariante((v) => v + 1)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Generar otra versión
            </button>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              v{variante + 1}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">
            Cada variante cambia el hook y el cierre manteniendo la misma información.
          </p>
        </Bloque>
      </aside>

      <section className="space-y-4">
        <div className="flex items-center gap-1 rounded-lg bg-secondary-100 p-1 text-xs dark:bg-secondary-800">
          {(
            [
              { key: 'organico', label: 'Post orgánico', Icon: MegaphoneIcon },
              { key: 'ad-pagado', label: 'Ad copy (sponsored)', Icon: MegaphoneIcon },
              { key: 'carrusel', label: 'Carrusel 7 slides', Icon: RectangleStackIcon },
            ] as { key: Vista; label: string; Icon: typeof MegaphoneIcon }[]
          ).map(({ key, label, Icon }) => {
            const activo = vista === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setVista(key)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  activo
                    ? 'bg-white text-secondary-900 shadow-sm dark:bg-secondary-900 dark:text-white'
                    : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {vista === 'organico' ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                  Texto para LinkedIn
                </p>
                <p className="text-[11px] text-secondary-500">
                  {post.caracteres} chars · LinkedIn max 3000
                </p>
              </div>
              <textarea
                value={post.textoCompleto}
                readOnly
                rows={18}
                className="w-full resize-none rounded-lg border border-secondary-200 bg-secondary-50 p-3 font-mono text-xs leading-relaxed text-secondary-800 focus:outline-none dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200"
              />
              <button
                type="button"
                onClick={() => copiar('post', post.textoCompleto)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                {copiado === 'post' ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copiar texto completo
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                Vista previa LinkedIn
              </p>
              <PostPreview texto={post.textoCompleto} imagenUrl={imagenCapturada ?? undefined} />
            </div>
          </div>
        ) : null}

        {vista === 'ad-pagado' ? (
          <AdCopyView ad={ad} demo={demo} onCopy={(k, t) => copiar(k, t)} copiado={copiado} />
        ) : null}

        {vista === 'carrusel' ? (
          <CarruselView slides={carrusel} demo={demo} />
        ) : null}
      </section>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-3.5 shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function AdCopyView({
  ad,
  demo,
  onCopy,
  copiado,
}: {
  ad: ReturnType<typeof generarAdCopy>;
  demo: KoptupDemo;
  onCopy: (k: string, t: string) => void;
  copiado: string | null;
}) {
  const completo = `Headline: ${ad.headline}\n\nIntro: ${ad.introText}\n\nDescription: ${ad.description}\n\nCTA Button: ${ad.cta}\n\nDestino: https://koptup.com${demo.path}`;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="space-y-3">
        <Campo label="Headline" maxLen={70} value={ad.headline} />
        <Campo label="Intro text (descripción larga)" maxLen={150} value={ad.introText} />
        <Campo label="Description" maxLen={70} value={ad.description} />
        <Campo label="CTA Button" maxLen={20} value={ad.cta} />
        <Campo label="URL de destino" maxLen={500} value={`https://koptup.com${demo.path}`} />
        <button
          type="button"
          onClick={() => onCopy('ad', completo)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          {copiado === 'ad' ? (
            <>
              <CheckIcon className="h-4 w-4" />
              ¡Copiado!
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copiar todos los campos
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-secondary-200 bg-white p-4 shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
          Vista mockup ad sponsored
        </p>
        <div className="space-y-2 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
          <p className="text-[10px] uppercase tracking-wide text-secondary-400">Promocionado</p>
          <p className="text-sm leading-relaxed text-secondary-800 dark:text-secondary-200">
            {ad.introText}
          </p>
          <div className="rounded-md border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-700 dark:bg-secondary-800">
            <p className="text-[11px] text-secondary-500">koptup.com</p>
            <p className="mt-1 text-sm font-bold text-secondary-900 dark:text-white">
              {ad.headline}
            </p>
            <p className="mt-0.5 text-xs text-secondary-600 dark:text-secondary-400">
              {ad.description}
            </p>
            <button
              type="button"
              className="mt-2 rounded-full border border-primary-600 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-200"
            >
              {ad.cta}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">
          Costo estimado LinkedIn LATAM: <strong>$3–8 USD por click</strong> para audiencia de
          decisores. Pensá presupuesto mínimo $10/día y rotar 3 variantes para validar cuál convierte.
        </p>
      </div>
    </div>
  );
}

function Campo({ label, value, maxLen }: { label: string; value: string; maxLen: number }) {
  const exceso = value.length > maxLen;
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
          {label}
        </p>
        <p className={`text-[10px] ${exceso ? 'text-red-600' : 'text-secondary-400'}`}>
          {value.length}/{maxLen}
        </p>
      </div>
      <p className="mt-1 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100">
        {value}
      </p>
    </div>
  );
}

function CarruselView({ slides, demo }: { slides: CarruselSlide[]; demo: KoptupDemo }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
          {slides.length} slides · 1080×1080 cada uno
        </p>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
          Exportá las imágenes con Canva / Figma siguiendo estas notas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {slides.map((slide) => (
          <div
            key={slide.numero}
            className="aspect-square overflow-hidden rounded-xl border border-secondary-200 bg-gradient-to-br from-primary-50 to-violet-50 p-4 shadow-sm dark:border-secondary-700 dark:from-primary-950/40 dark:to-violet-950/40"
          >
            <div className="flex h-full flex-col">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-300">
                Slide {slide.numero}/{slides.length}
              </p>
              <p className="mt-1 text-base font-bold leading-tight text-secondary-900 dark:text-white">
                {slide.titulo}
              </p>
              <ul className="mt-2 space-y-1">
                {slide.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="text-xs leading-snug text-secondary-700 dark:text-secondary-200"
                  >
                    • {b}
                  </li>
                ))}
              </ul>
              <p className="mt-auto rounded bg-white/70 p-1.5 text-[9px] italic leading-tight text-secondary-500 dark:bg-secondary-900/60 dark:text-secondary-400">
                📸 {slide.notaVisual}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
        💡 <strong>Tip:</strong> En LinkedIn, los carruseles tienen 3× más alcance orgánico que los
        posts de texto. Subílos como documento PDF (1080×1080 por página). Combinalo con un texto
        introductorio corto (2-3 líneas) sobre <strong>{demo.titulo}</strong>.
      </div>
    </div>
  );
}
