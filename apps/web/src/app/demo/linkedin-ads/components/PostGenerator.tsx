'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  NewspaperIcon,
  RectangleStackIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  BookmarkIcon,
  TrashIcon,
  FolderOpenIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  AD_CTAS,
  AD_CTA_KEYS,
  ANGULOS,
  LIMITES,
  TONOS,
  type AdCta,
  type AnguloPost,
  type DiaCalendario,
  type KoptupDemo,
  type TonoPost,
} from './data';
import {
  aplicarUtm,
  consultaUtm,
  generarAdCopy,
  generarCarrusel,
  generarPost,
  urlDemo,
  type AdCopyGenerado,
  type CarruselSlide,
} from './generador';
import { revisarTexto } from './veracidad';
import { usePlantillas } from './useLinkedinData';
import { descargarCarruselPdf } from './carruselPdf';
import { aCsv, copiarTexto, descargarTexto, escribirLS, leerLS, LS_BORRADORES, LS_UTM } from './util';
import PostPreview from './PostPreview';

/** Instrucciones que viajan en los campos del contrato de la ruta de IA. */
const INSTRUCCION_SIN_METRICAS =
  'Sin métricas verificadas: no incluyas cifras de resultados, porcentajes, tiempos ahorrados ni testimonios; describe solo lo que se puede ver y probar en la demo.';
const INSTRUCCION_CAPACIDADES =
  'Usa solo las funciones listadas en los beneficios; no inventes capacidades ni integraciones.';

type Fuente = 'ai' | 'local' | 'edited';
type Vista = 'organico' | 'anuncio' | 'carrusel';
type MotivoIA = 'notConfigured' | 'limit' | 'access' | 'invalid' | 'network' | 'generic';

interface AiPack {
  id: number;
  textoPost: string;
  ad: AdCopyGenerado;
  carrusel: CarruselSlide[];
  estrategia: string;
  model: string;
}

interface Borrador {
  id: string;
  creado: string;
  demoId: string;
  angulo: AnguloPost;
  tono: TonoPost;
  variante: number;
  fuente: Fuente;
  texto: string;
}

interface RespuestaIA {
  data?: {
    post?: { hook?: unknown; body?: unknown; cta?: unknown; hashtags?: unknown };
    ad?: { headline?: unknown; introText?: unknown; description?: unknown; cta?: unknown };
    carrusel?: unknown;
    estrategia?: unknown;
  };
  model?: string;
  error?: string;
}

interface PostGeneratorProps {
  demos: KoptupDemo[];
  demoId: string;
  onDemoChange: (id: string) => void;
  angulo: AnguloPost;
  onAnguloChange: (a: AnguloPost) => void;
  planDia: DiaCalendario | null;
  imagen: string | null;
  onQuitarImagen: () => void;
}

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function adaptarRespuesta(json: RespuestaIA, id: number): AiPack | null {
  const d = json.data;
  if (!d?.post || !d.ad) return null;
  const { hook, body, cta, hashtags } = d.post;
  if (!esTexto(hook) || !esTexto(body) || !esTexto(cta)) return null;
  const tags = Array.isArray(hashtags)
    ? hashtags.filter(esTexto).map((h) => (h.startsWith('#') ? h : `#${h}`))
    : [];
  const adCta = AD_CTAS.includes(d.ad.cta as AdCta) ? (d.ad.cta as AdCta) : 'Más información';
  if (!esTexto(d.ad.headline) || !esTexto(d.ad.introText) || !esTexto(d.ad.description)) return null;
  const slides: CarruselSlide[] = Array.isArray(d.carrusel)
    ? (d.carrusel as Record<string, unknown>[])
        .filter((s) => esTexto(s?.titulo))
        .map((s, i) => ({
          // Se renumeran en orden: el modelo puede repetir o saltar números.
          numero: i + 1,
          titulo: s.titulo as string,
          bullets: Array.isArray(s.bullets) ? (s.bullets as unknown[]).filter(esTexto) : [],
          notaVisual: esTexto(s.notaVisual) ? s.notaVisual : '',
        }))
    : [];
  return {
    id,
    textoPost: [hook, body, cta, tags.join(' ')].filter(Boolean).join('\n\n'),
    ad: { headline: d.ad.headline, introText: d.ad.introText, description: d.ad.description, cta: adCta },
    carrusel: slides,
    estrategia: esTexto(d.estrategia) ? d.estrategia : '',
    model: json.model || 'OpenAI',
  };
}

export default function PostGenerator({
  demos,
  demoId,
  onDemoChange,
  angulo,
  onAnguloChange,
  planDia,
  imagen,
  onQuitarImagen,
}: PostGeneratorProps) {
  const t = useTranslations('demoLinkedinAds.generator');
  const tAng = useTranslations('demoLinkedinAds.angles');
  const tTon = useTranslations('demoLinkedinAds.tones');
  const tCal = useTranslations('demoLinkedinAds.calendar');
  const locale = useLocale();
  const plantillas = usePlantillas();

  const [tono, setTono] = useState<TonoPost>('cercano');
  const [variante, setVariante] = useState(0);
  const [vista, setVista] = useState<Vista>('organico');
  const [aiPack, setAiPack] = useState<AiPack | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<MotivoIA | null>(null);
  const [override, setOverride] = useState<{ key: string; texto: string } | null>(null);
  const [utm, setUtm] = useState(true);
  const [borradores, setBorradores] = useState<Borrador[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [pdfCargando, setPdfCargando] = useState(false);
  const aiSeq = useRef(0);
  const solicitudVigente = useRef('');

  // Preferencias y borradores guardados en este navegador (después de montar).
  useEffect(() => {
    setUtm(leerLS<boolean>(LS_UTM, true) !== false);
    const guardados = leerLS<unknown>(LS_BORRADORES, []);
    if (Array.isArray(guardados)) {
      setBorradores(
        guardados.filter(
          (b): b is Borrador =>
            !!b && typeof b === 'object' && typeof (b as Borrador).texto === 'string' && typeof (b as Borrador).id === 'string',
        ),
      );
    }
  }, []);

  // Cambiar demo, ángulo, tono o variante deja obsoleto el resultado de la IA.
  useEffect(() => {
    setAiPack(null);
    setAiError(null);
    setAiLoading(false);
    solicitudVigente.current = '';
  }, [demoId, angulo, tono, variante]);

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), 2600);
    return () => clearTimeout(id);
  }, [aviso]);

  const demo = useMemo(() => demos.find((d) => d.id === demoId) ?? demos[0], [demos, demoId]);
  const url = urlDemo(demo);
  const qPost = consultaUtm(demo, angulo, 'organic');
  const qAd = consultaUtm(demo, angulo, 'paid');

  const localPost = useMemo(
    () => generarPost(demo, angulo, tono, variante, plantillas),
    [demo, angulo, tono, variante, plantillas],
  );
  const localAd = useMemo(() => generarAdCopy(demo, variante, plantillas), [demo, variante, plantillas]);
  const localCarrusel = useMemo(() => generarCarrusel(demo, plantillas), [demo, plantillas]);

  const claveActual = `${demoId}|${angulo}|${tono}|${variante}|${aiPack ? aiPack.id : 'local'}`;
  const editado = override !== null && override.key === claveActual;
  const textoBase = aiPack ? aiPack.textoPost : localPost.textoCompleto;
  const textoPost = aplicarUtm(editado ? override.texto : textoBase, url, qPost, utm);
  const fuente: Fuente = editado ? 'edited' : aiPack ? 'ai' : 'local';
  const revision = useMemo(() => revisarTexto(textoPost, demo.path), [textoPost, demo.path]);

  const ad = aiPack?.ad ?? localAd;
  const adIntro = aplicarUtm(ad.introText, url, qAd, utm);
  const adUrl = utm ? `${url}?${qAd}` : url;
  const adCtaLabel = t(`ad.ctaLabels.${AD_CTA_KEYS[ad.cta]}`);
  const carrusel = aiPack && aiPack.carrusel.length >= 3 ? aiPack.carrusel : localCarrusel;

  const notificar = (tipo: 'ok' | 'error', texto: string) => setAviso({ tipo, texto });

  const copiar = async (clave: string, texto: string) => {
    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(clave);
      setTimeout(() => setCopiado((c) => (c === clave ? null : c)), 1500);
    } else {
      notificar('error', t('post.copyError'));
    }
  };

  const cambiarUtm = (valor: boolean) => {
    setUtm(valor);
    escribirLS(LS_UTM, valor);
  };

  const generarConIA = useCallback(async () => {
    const solicitud = `${demoId}|${angulo}|${tono}|${variante}|${Date.now()}`;
    solicitudVigente.current = solicitud;
    setAiLoading(true);
    setAiError(null);
    let motivo: MotivoIA | null = null;
    try {
      let resp: Response;
      try {
        resp = await fetch('/api/linkedin-ads/generate', {
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
              beneficiosClave: demo.funciones,
              publicoObjetivo: demo.publicoObjetivo,
              metricaImpactante: INSTRUCCION_SIN_METRICAS,
              caracteristicasIA: [INSTRUCCION_CAPACIDADES],
              hashtagsEspecificos: demo.hashtagsEspecificos,
            },
            angulo,
            tono,
            anguloLabel: tAng(`${angulo}.label`),
            anguloDescripcion: tAng(`${angulo}.desc`),
            tonoLabel: tTon(`${tono}.label`),
            tonoDescripcion: tTon(`${tono}.desc`),
          }),
        });
      } catch {
        motivo = 'network';
        return;
      }
      let json: RespuestaIA | null = null;
      try {
        json = (await resp.json()) as RespuestaIA;
      } catch {
        json = null;
      }
      if (solicitudVigente.current !== solicitud) return; // el usuario cambió la configuración
      if (!resp.ok) {
        const err = json?.error ?? '';
        motivo =
          resp.status === 429 || resp.status === 402
            ? 'limit'
            : resp.status === 401 || resp.status === 403
              ? 'access'
              : resp.status === 503 && /OPENAI_API_KEY|configur/i.test(err)
                ? 'notConfigured'
                : 'generic';
        return;
      }
      const pack = json ? adaptarRespuesta(json, ++aiSeq.current) : null;
      if (!pack) {
        motivo = 'invalid';
        return;
      }
      setAiPack(pack);
    } finally {
      if (solicitudVigente.current === solicitud) {
        setAiLoading(false);
        if (motivo) setAiError(motivo);
      }
    }
  }, [demo, demoId, angulo, tono, variante, tAng, tTon]);

  const guardarBorrador = () => {
    const nuevo: Borrador = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      creado: new Date().toISOString(),
      demoId,
      angulo,
      tono,
      variante,
      fuente,
      texto: textoPost,
    };
    const lista = [nuevo, ...borradores].slice(0, 50);
    setBorradores(lista);
    escribirLS(LS_BORRADORES, lista);
    notificar('ok', t('post.saved'));
  };

  const abrirBorrador = (b: Borrador) => {
    onDemoChange(b.demoId);
    onAnguloChange(b.angulo);
    setTono(b.tono);
    setVariante(b.variante);
    setAiPack(null);
    setOverride({ key: `${b.demoId}|${b.angulo}|${b.tono}|${b.variante}|local`, texto: b.texto });
    setVista('organico');
    notificar('ok', t('drafts.loaded'));
  };

  const eliminarBorrador = (id: string) => {
    const lista = borradores.filter((b) => b.id !== id);
    setBorradores(lista);
    escribirLS(LS_BORRADORES, lista);
    notificar('ok', t('drafts.deleted'));
  };

  const fmtFecha = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }),
    [locale],
  );
  const tituloDe = (id: string) => demos.find((d) => d.id === id)?.titulo ?? id;

  const exportarBorradores = () => {
    const filas: (string | number)[][] = [
      [t('drafts.csv.date'), t('drafts.csv.demo'), t('drafts.csv.angle'), t('drafts.csv.tone'), t('drafts.csv.source'), t('drafts.csv.chars'), t('drafts.csv.text')],
      ...borradores.map((b) => [
        fmtFecha.format(new Date(b.creado)),
        tituloDe(b.demoId),
        tAng(`${b.angulo}.label`),
        tTon(`${b.tono}.label`),
        t(`drafts.sources.${b.fuente}`),
        b.texto.length,
        b.texto,
      ]),
    ];
    descargarTexto(aCsv(filas), 'koptup-borradores-linkedin.csv', 'text/csv;charset=utf-8');
  };

  const descargarPdf = async () => {
    setPdfCargando(true);
    try {
      await descargarCarruselPdf(carrusel, {
        nombreArchivo: `koptup-${demo.slug}-carrusel.pdf`,
        etiqueta: (n, total) => t('carousel.slideN', { n, total }),
        pie: url.replace(/^https?:\/\//, ''),
      });
      notificar('ok', t('carousel.downloaded'));
    } catch (e) {
      notificar('error', t('carousel.pdfError', { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setPdfCargando(false);
    }
  };

  const textosCarrusel = carrusel
    .map((s) => `${t('carousel.slideN', { n: s.numero, total: carrusel.length })}\n${s.titulo}\n${s.bullets.map((b) => `- ${b}`).join('\n')}`)
    .join('\n\n');

  const planVisible = planDia && planDia.demoId === demoId && planDia.angulo === angulo ? planDia : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px,minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4">
        <div className="rounded-xl border border-violet-300 bg-gradient-to-br from-violet-50 via-white to-primary-50 p-4 shadow-md dark:border-violet-700/60 dark:from-violet-950/40 dark:via-secondary-900 dark:to-primary-950/40">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
            <SparklesIcon className="h-4 w-4" /> {t('ai.title')}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-secondary-700 dark:text-secondary-300">{t('ai.desc')}</p>
          <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ai.langNote')}</p>
          <button
            type="button"
            onClick={generarConIA}
            disabled={aiLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-violet-700 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                {t('ai.loading')}
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                {aiPack ? t('ai.regenerate') : t('ai.button')}
              </>
            )}
          </button>
          {aiError ? (
            <p
              role="status"
              className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {t('ai.unavailable', { reason: t(`ai.reasons.${aiError}`) })}{' '}
                {fuente === 'edited' ? t('ai.fallbackEdited') : t('ai.fallbackLocal')}
              </span>
            </p>
          ) : null}
          {aiPack ? (
            <div
              role="status"
              className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] leading-snug text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <p className="font-semibold">{t('ai.success', { model: aiPack.model })}</p>
              {aiPack.estrategia ? (
                <p className="mt-0.5 opacity-90">
                  {t('ai.strategy')} {aiPack.estrategia}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <Bloque titulo={t('demoLabel')}>
          <select
            value={demoId}
            onChange={(e) => onDemoChange(e.target.value)}
            aria-label={t('demoLabel')}
            className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100"
          >
            {demos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.titulo}
              </option>
            ))}
          </select>
          <p className="mt-2 rounded-md bg-secondary-50 px-2.5 py-2 text-xs text-secondary-600 dark:bg-secondary-800/60 dark:text-secondary-300">
            {demo.tagline}
          </p>
        </Bloque>

        <Bloque titulo={t('angleLabel')}>
          <div className="grid grid-cols-2 gap-1.5">
            {ANGULOS.map(({ key, emoji }) => {
              const activo = angulo === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAnguloChange(key)}
                  aria-pressed={activo}
                  title={tAng(`${key}.desc`)}
                  className={`rounded-md border px-2 py-1.5 text-left text-xs font-semibold transition ${
                    activo
                      ? 'border-primary-500 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'
                  }`}
                >
                  {emoji} {tAng(`${key}.label`)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{tAng(`${angulo}.desc`)}</p>
        </Bloque>

        <Bloque titulo={t('toneLabel')}>
          <div className="flex flex-wrap gap-1.5">
            {TONOS.map((tn) => {
              const activo = tono === tn;
              return (
                <button
                  key={tn}
                  type="button"
                  onClick={() => setTono(tn)}
                  aria-pressed={activo}
                  title={tTon(`${tn}.desc`)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    activo
                      ? 'border-primary-500 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'
                  }`}
                >
                  {tTon(`${tn}.label`)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{tTon(`${tono}.desc`)}</p>
        </Bloque>

        <Bloque titulo={t('variantLabel')}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVariante((v) => v + 1)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              {t('variantButton')}
            </button>
            <span className="text-xs text-secondary-500 dark:text-secondary-400" data-testid="variant-number">
              {t('variantN', { n: variante + 1 })}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('variantHelp')}</p>
        </Bloque>

        <Bloque titulo="UTM">
          <label className="flex cursor-pointer items-start gap-2 text-xs text-secondary-700 dark:text-secondary-300">
            <input
              type="checkbox"
              checked={utm}
              onChange={(e) => cambiarUtm(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span>
              <span className="font-semibold">{t('utmLabel')}</span>
              <span className="mt-0.5 block text-[11px] text-secondary-500 dark:text-secondary-400">{t('utmHelp')}</span>
            </span>
          </label>
        </Bloque>
      </aside>

      <section className="min-w-0 space-y-4">
        {planVisible ? (
          <p className="flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-900 dark:border-primary-800/60 dark:bg-primary-950/40 dark:text-primary-100">
            <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t('plan', {
                n: planVisible.dia,
                type: tCal(`types.${planVisible.tipoContenido}`),
                note: tCal(`notes.${planVisible.dia}`),
              })}
            </span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-secondary-100 p-1 text-xs dark:bg-secondary-800" role="tablist">
          {(
            [
              { key: 'organico', label: t('views.organic'), Icon: NewspaperIcon },
              { key: 'anuncio', label: t('views.ad'), Icon: MegaphoneIcon },
              { key: 'carrusel', label: t('views.carousel', { count: carrusel.length }), Icon: RectangleStackIcon },
            ] as { key: Vista; label: string; Icon: typeof MegaphoneIcon }[]
          ).map(({ key, label, Icon }) => {
            const activo = vista === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setVista(key)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 transition ${
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

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            data-testid="post-source"
            className={`rounded-full px-2 py-0.5 font-semibold ${
              fuente === 'ai'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : fuente === 'edited'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
                  : 'bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200'
            }`}
          >
            {fuente === 'ai'
              ? t('source.ai', { model: aiPack?.model ?? '' })
              : fuente === 'edited'
                ? t('source.edited')
                : t('source.local')}
          </span>
          {aviso ? (
            <span
              role="status"
              className={`rounded-full px-2 py-0.5 font-semibold ${
                aviso.tipo === 'ok'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
              }`}
            >
              {aviso.texto}
            </span>
          ) : null}
        </div>

        {vista === 'organico' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="linkedin-post-text"
                    className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400"
                  >
                    {t('post.textLabel')}
                  </label>
                  <p
                    className={`text-[11px] ${revision.caracteres > LIMITES.post ? 'font-semibold text-red-600' : 'text-secondary-500'}`}
                    data-testid="post-chars"
                  >
                    {t('post.chars', { count: revision.caracteres })}
                  </p>
                </div>
                <textarea
                  id="linkedin-post-text"
                  value={textoPost}
                  onChange={(e) => setOverride({ key: claveActual, texto: e.target.value })}
                  rows={18}
                  className="w-full resize-y rounded-lg border border-secondary-200 bg-secondary-50 p-3 font-mono text-xs leading-relaxed text-secondary-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copiar('post', textoPost)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    {copiado === 'post' ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                    {copiado === 'post' ? t('post.copied') : t('post.copy')}
                  </button>
                  <button
                    type="button"
                    onClick={guardarBorrador}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-primary-400 dark:text-primary-200 dark:hover:bg-primary-950/60"
                  >
                    <BookmarkIcon className="h-4 w-4" />
                    {t('post.saveDraft')}
                  </button>
                  {editado ? (
                    <button
                      type="button"
                      onClick={() => setOverride(null)}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-secondary-300 px-3 py-2 text-sm font-semibold text-secondary-700 transition hover:bg-secondary-100 dark:border-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-800"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      {t('post.reset')}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                    {t('post.previewLabel')}
                  </p>
                  {imagen ? (
                    <button
                      type="button"
                      onClick={onQuitarImagen}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary-600 hover:text-red-600 dark:text-secondary-300"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                      {t('post.removeImage')}
                    </button>
                  ) : null}
                </div>
                <PostPreview texto={textoPost} imagenUrl={imagen} />
                {!imagen ? (
                  <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('post.imageHint')}</p>
                ) : null}
              </div>
            </div>

            <Revision revision={revision} />

            <Borradores
              borradores={borradores}
              fmtFecha={(iso) => fmtFecha.format(new Date(iso))}
              tituloDe={tituloDe}
              etiquetaAngulo={(a) => tAng(`${a}.label`)}
              etiquetaTono={(x) => tTon(`${x}.label`)}
              copiado={copiado}
              onAbrir={abrirBorrador}
              onCopiar={(b) => copiar(`draft-${b.id}`, b.texto)}
              onEliminar={eliminarBorrador}
              onExportar={exportarBorradores}
            />
          </div>
        ) : null}

        {vista === 'anuncio' ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-w-0 space-y-3">
              <Campo label={t('ad.headline')} maxLen={LIMITES.adHeadline} value={ad.headline} over={t('ad.over')} />
              <Campo label={t('ad.intro')} maxLen={LIMITES.adIntro} value={adIntro} over={t('ad.over')} />
              <Campo label={t('ad.description')} maxLen={LIMITES.adDescription} value={ad.description} over={t('ad.over')} />
              <Campo label={t('ad.cta')} value={adCtaLabel} />
              <Campo label={t('ad.url')} value={adUrl} />
              <button
                type="button"
                onClick={() =>
                  copiar(
                    'ad',
                    t('ad.copyTemplate', {
                      headline: ad.headline,
                      intro: adIntro,
                      description: ad.description,
                      cta: adCtaLabel,
                      url: adUrl,
                    }),
                  )
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                {copiado === 'ad' ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                {copiado === 'ad' ? t('post.copied') : t('ad.copyAll')}
              </button>
            </div>

            <div className="min-w-0 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                {t('ad.mockTitle')}
              </p>
              <div className="space-y-2 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
                <p className="text-[10px] uppercase tracking-wide text-secondary-400">{t('ad.sponsored')}</p>
                <p className="break-words text-sm leading-relaxed text-secondary-800 dark:text-secondary-200">{adIntro}</p>
                <div className="rounded-md border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-700 dark:bg-secondary-800">
                  <p className="text-[11px] text-secondary-500">koptup.com</p>
                  <p className="mt-1 text-sm font-bold text-secondary-900 dark:text-white">{ad.headline}</p>
                  <p className="mt-0.5 text-xs text-secondary-600 dark:text-secondary-400">{ad.description}</p>
                  <span
                    aria-hidden="true"
                    className="mt-2 inline-block cursor-default select-none rounded-full border border-primary-600 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-400 dark:text-primary-200"
                  >
                    {adCtaLabel}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-secondary-500 dark:text-secondary-400">{t('ad.note')}</p>
            </div>
          </div>
        ) : null}

        {vista === 'carrusel' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                  {t('carousel.count', { count: carrusel.length })}
                </p>
                <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('carousel.hint')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={descargarPdf}
                  disabled={pdfCargando}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  {pdfCargando ? t('carousel.generating') : t('carousel.downloadPdf')}
                </button>
                <button
                  type="button"
                  onClick={() => copiar('carrusel', textosCarrusel)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-200 dark:hover:bg-primary-950/60"
                >
                  {copiado === 'carrusel' ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                  {copiado === 'carrusel' ? t('post.copied') : t('carousel.copyTexts')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {carrusel.map((slide, idx) => (
                <div
                  key={`${idx}-${slide.titulo}`}
                  style={{ aspectRatio: '1 / 1' }}
                  className="flex min-w-0 flex-col rounded-xl border border-secondary-200 bg-gradient-to-br from-primary-50 to-violet-50 p-4 shadow-sm dark:border-secondary-700 dark:from-primary-950/40 dark:to-violet-950/40"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-300">
                    {t('carousel.slideN', { n: slide.numero, total: carrusel.length })}
                  </p>
                  <p className="mt-1 text-base font-bold leading-tight text-secondary-900 dark:text-white">{slide.titulo}</p>
                  <ul className="mt-2 space-y-1">
                    {slide.bullets.map((b, i) => (
                      <li key={i} className="break-words text-xs leading-snug text-secondary-700 dark:text-secondary-200">
                        • {b}
                      </li>
                    ))}
                  </ul>
                  {slide.notaVisual ? (
                    <p className="mt-auto rounded bg-white/70 p-1.5 text-[10px] italic leading-tight text-secondary-500 dark:bg-secondary-900/60 dark:text-secondary-400">
                      {t('carousel.visualNote')}: {slide.notaVisual}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
              {t('carousel.tip', { titulo: demo.titulo })}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-3.5 shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">{titulo}</p>
      {children}
    </div>
  );
}

function Campo({ label, value, maxLen, over }: { label: string; value: string; maxLen?: number; over?: string }) {
  const exceso = maxLen !== undefined && value.length > maxLen;
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
        {maxLen !== undefined ? (
          <p className={`text-[10px] ${exceso ? 'font-semibold text-red-600' : 'text-secondary-400'}`}>
            {value.length}/{maxLen}
            {exceso && over ? ` · ${over}` : ''}
          </p>
        ) : null}
      </div>
      <p className="mt-1 break-words rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100">
        {value}
      </p>
    </div>
  );
}

function Revision({ revision }: { revision: ReturnType<typeof revisarTexto> }) {
  const t = useTranslations('demoLinkedinAds.generator.checks');
  const items: { ok: boolean; texto: string }[] = [
    revision.cifras.length
      ? { ok: false, texto: t('numbers', { list: revision.cifras.join(', ') }) }
      : { ok: true, texto: t('noNumbers') },
    revision.testimonio ? { ok: false, texto: t('testimonial') } : { ok: true, texto: t('noTestimonial') },
    revision.enlace ? { ok: true, texto: t('link') } : { ok: false, texto: t('noLink') },
    revision.utm ? { ok: true, texto: t('utm') } : { ok: false, texto: t('noUtm') },
    revision.caracteres <= LIMITES.post ? { ok: true, texto: t('length') } : { ok: false, texto: t('tooLong') },
  ];
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900" data-testid="veracity-check">
      <p className="text-sm font-bold text-secondary-900 dark:text-white">{t('title')}</p>
      <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('desc')}</p>
      <ul className="mt-2 grid grid-cols-1 gap-1.5 md:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={i}
            className={`flex items-start gap-1.5 text-xs ${it.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'}`}
          >
            {it.ok ? (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 break-words">{it.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Borradores({
  borradores,
  fmtFecha,
  tituloDe,
  etiquetaAngulo,
  etiquetaTono,
  copiado,
  onAbrir,
  onCopiar,
  onEliminar,
  onExportar,
}: {
  borradores: Borrador[];
  fmtFecha: (iso: string) => string;
  tituloDe: (id: string) => string;
  etiquetaAngulo: (a: AnguloPost) => string;
  etiquetaTono: (t: TonoPost) => string;
  copiado: string | null;
  onAbrir: (b: Borrador) => void;
  onCopiar: (b: Borrador) => void;
  onEliminar: (id: string) => void;
  onExportar: () => void;
}) {
  const t = useTranslations('demoLinkedinAds.generator');
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900" data-testid="drafts">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-secondary-900 dark:text-white">{t('drafts.title', { count: borradores.length })}</p>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('drafts.stored')}</p>
        </div>
        {borradores.length > 0 ? (
          <button
            type="button"
            onClick={onExportar}
            className="inline-flex items-center gap-1.5 rounded-md border border-secondary-300 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:border-primary-400 hover:text-primary-700 dark:border-secondary-600 dark:text-secondary-200"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            {t('drafts.exportCsv')}
          </button>
        ) : null}
      </div>
      {borradores.length === 0 ? (
        <p className="mt-3 text-xs text-secondary-500 dark:text-secondary-400">{t('drafts.empty')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-secondary-100 dark:divide-secondary-800">
          {borradores.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-secondary-900 dark:text-white">
                  {tituloDe(b.demoId)} · {etiquetaAngulo(b.angulo)} · {etiquetaTono(b.tono)}
                </p>
                <p className="truncate text-[11px] text-secondary-500 dark:text-secondary-400">
                  {fmtFecha(b.creado)} · {t(`drafts.sources.${b.fuente}`)} · {t('drafts.chars', { count: b.texto.length })} ·{' '}
                  {b.texto.split('\n')[0]}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => onAbrir(b)}
                  className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-700"
                >
                  <FolderOpenIcon className="h-3.5 w-3.5" />
                  {t('drafts.open')}
                </button>
                <button
                  type="button"
                  onClick={() => onCopiar(b)}
                  className="inline-flex items-center gap-1 rounded-md border border-secondary-300 px-2.5 py-1 text-[11px] font-semibold text-secondary-700 hover:border-primary-400 dark:border-secondary-600 dark:text-secondary-200"
                >
                  {copiado === `draft-${b.id}` ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                  {copiado === `draft-${b.id}` ? t('post.copied') : t('drafts.copy')}
                </button>
                <button
                  type="button"
                  onClick={() => onEliminar(b.id)}
                  aria-label={`${t('drafts.delete')}: ${tituloDe(b.demoId)}`}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-800/60 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {t('drafts.delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
