'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CameraIcon,
  VideoCameraIcon,
  StopCircleIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { KoptupDemo } from './data';
import { descargarUrl } from './util';

interface DemoCaptureProps {
  demos: KoptupDemo[];
  demoId: string;
  onDemoChange: (id: string) => void;
  onImageCaptured: (dataUrl: string) => void;
  onIrAlGenerador: () => void;
}

type ModoCaptura = 'auto' | 'visual';

/**
 * Visuales para el post:
 * - Automática: carga la demo (mismo sitio) en un iframe y captura lo visible
 *   con html-to-image (foto PNG o video WebM a partir de cuadros).
 * - Plantilla: SVG 1200×627 exportado a PNG.
 */
export default function DemoCapture({ demos, demoId, onDemoChange, onImageCaptured, onIrAlGenerador }: DemoCaptureProps) {
  const t = useTranslations('demoLinkedinAds.capture');
  const demo = demos.find((d) => d.id === demoId) ?? demos[0];
  // La plantilla va primero: no carga otra demo hasta que eliges la captura automática.
  const [modo, setModo] = useState<ModoCaptura>('visual');
  const [usada, setUsada] = useState(false);

  useEffect(() => {
    if (!usada) return;
    const id = setTimeout(() => setUsada(false), 12000);
    return () => clearTimeout(id);
  }, [usada]);

  const usarEnPost = (dataUrl: string) => {
    onImageCaptured(dataUrl);
    setUsada(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <label className="flex min-w-0 max-w-full flex-col gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
          {t('demoLabel')}
          <select
            value={demoId}
            onChange={(e) => onDemoChange(e.target.value)}
            className="max-w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100"
          >
            {demos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.titulo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-secondary-100 p-1 text-xs dark:bg-secondary-800" role="tablist">
        {(
          [
            { key: 'visual', label: t('modes.visual'), Icon: PhotoIcon },
            { key: 'auto', label: t('modes.auto'), Icon: CameraIcon },
          ] as { key: ModoCaptura; label: string; Icon: typeof PhotoIcon }[]
        ).map(({ key, label, Icon }) => {
          const activo = modo === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setModo(key)}
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

      {usada ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <CheckCircleIcon className="h-4 w-4" />
          <span>{t('usedInPost')}</span>
          <button
            type="button"
            onClick={onIrAlGenerador}
            className="rounded-md bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-700"
          >
            {t('goToGenerator')}
          </button>
        </div>
      ) : null}

      {modo === 'auto' ? <AutoCapture demo={demo} onUsar={usarEnPost} /> : <VisualGenerator demo={demo} onUsar={usarEnPost} />}
    </div>
  );
}

/* ────────────────────────────── helpers comunes ───────────────────────────── */

function MarcoDemo({
  demo,
  iframeRef,
  onLoad,
}: {
  demo: KoptupDemo;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  onLoad?: () => void;
}) {
  const t = useTranslations('demoLinkedinAds.capture');
  return (
    <div className="overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
      <div className="flex items-center justify-between gap-2 border-b border-secondary-200 bg-secondary-50 px-3 py-2 dark:border-secondary-700 dark:bg-secondary-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="ml-2 truncate text-xs text-secondary-600 dark:text-secondary-300">koptup.com{demo.path}</span>
        </div>
        <a
          href={demo.path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {t('openTab')}
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe
        key={demo.path}
        ref={iframeRef}
        src={demo.path}
        onLoad={onLoad}
        title={t('iframeTitle', { titulo: demo.titulo })}
        className="block w-full bg-white"
        // El plugin @tailwindcss/aspect-ratio desactiva `aspect-video`; se usa CSS directo.
        style={{ aspectRatio: '16 / 9', minHeight: 280 }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

function ResultadoFoto({
  titulo,
  url,
  nombre,
  onUsar,
}: {
  titulo: string;
  url: string;
  nombre: string;
  onUsar: () => void;
}) {
  const t = useTranslations('demoLinkedinAds.capture');
  return (
    <div className="space-y-2" data-testid="capture-photo">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{titulo}</p>
      <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={titulo} className="w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          download={nombre}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {t('downloadPng')}
        </a>
        <button
          type="button"
          onClick={onUsar}
          className="inline-flex items-center gap-2 rounded-md border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-primary-400 dark:text-primary-200 dark:hover:bg-primary-950/60"
        >
          {t('useInPost')}
        </button>
      </div>
    </div>
  );
}

function ResultadoVideo({ titulo, url, nombre, detalle }: { titulo: string; url: string; nombre: string; detalle?: string }) {
  const t = useTranslations('demoLinkedinAds.capture');
  return (
    <div className="space-y-2" data-testid="capture-video">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{titulo}</p>
      <video src={url} controls className="w-full rounded-lg border border-secondary-200 dark:border-secondary-700" />
      {detalle ? <p className="text-[11px] text-secondary-600 dark:text-secondary-300">{detalle}</p> : null}
      <a
        href={url}
        download={nombre}
        className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        {t('downloadWebm')}
      </a>
      <p className="break-words text-[11px] text-secondary-500 dark:text-secondary-400">
        {t('webmNote')} <code className="break-all">ffmpeg -i {nombre} -c:v libx264 -pix_fmt yuv420p video.mp4</code>
      </p>
    </div>
  );
}

function AvisoError({ texto }: { texto: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{texto}</span>
    </div>
  );
}

const filtroNodos = (node: HTMLElement) =>
  !(node instanceof HTMLElement && (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT'));

function mimeVideo(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  return '';
}

/* ───────────────────── Modo 1: captura automática (iframe) ───────────────────── */

function AutoCapture({ demo, onUsar }: { demo: KoptupDemo; onUsar: (dataUrl: string) => void }) {
  const t = useTranslations('demoLinkedinAds.capture');
  const locale = useLocale();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [cargada, setCargada] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<{ url: string; segundos: number; cuadros: number } | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [duracion, setDuracion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const grabandoRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detener = useCallback(() => {
    grabandoRef.current = false;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Al cambiar de demo se recarga el iframe y se detiene cualquier grabación.
  useEffect(() => {
    setCargada(false);
    setError(null);
    detener();
  }, [demo.path, detener]);

  useEffect(() => () => detener(), [detener]);

  /** Documento del iframe y su área visible. */
  const vistaIframe = () => {
    const el = iframeRef.current;
    const doc = el?.contentDocument;
    const win = el?.contentWindow;
    if (!el || !doc?.body || !win || !cargada) return null;
    return {
      doc,
      ancho: doc.documentElement.clientWidth || el.clientWidth,
      alto: doc.documentElement.clientHeight || el.clientHeight,
      scrollY: Math.round(win.scrollY),
    };
  };

  const renderVisible = async (pixelRatio: number, rapido: boolean) => {
    const v = vistaIframe();
    if (!v) throw new Error('not-ready');
    const { toCanvas } = await import('html-to-image');
    const completo = await toCanvas(v.doc.body, {
      backgroundColor: '#ffffff',
      width: v.ancho,
      height: v.scrollY + v.alto,
      pixelRatio,
      cacheBust: !rapido,
      skipFonts: rapido,
      filter: filtroNodos,
    });
    return { completo, ...v };
  };

  const tomarFoto = async () => {
    setError(null);
    if (!vistaIframe()) {
      setError(t('auto.errors.notReady'));
      return;
    }
    setCapturando(true);
    try {
      const pr = 2;
      const { completo, ancho, alto, scrollY } = await renderVisible(pr, false);
      const out = document.createElement('canvas');
      out.width = Math.round(ancho * pr);
      out.height = Math.round(alto * pr);
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(completo, 0, Math.round(scrollY * pr), out.width, out.height, 0, 0, out.width, out.height);
      setPhotoUrl(out.toDataURL('image/png'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg === 'not-ready' ? t('auto.errors.notReady') : t('auto.errors.capture', { msg }));
    } finally {
      setCapturando(false);
    }
  };

  const iniciarVideo = async () => {
    setError(null);
    if (!vistaIframe()) {
      setError(t('auto.errors.notReady'));
      return;
    }
    const mime = mimeVideo();
    const W = 1280;
    const H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const conStream = canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream };
    if (!mime || !ctx || typeof conStream.captureStream !== 'function') {
      setError(t('auto.errors.noRecorder'));
      return;
    }
    try {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      let cuadros = 0;
      const pintar = async () => {
        const { completo, ancho, alto, scrollY } = await renderVisible(1, true);
        const escala = Math.min(W / ancho, H / alto);
        const dw = ancho * escala;
        const dh = alto * escala;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(completo, 0, scrollY, ancho, alto, (W - dw) / 2, (H - dh) / 2, dw, dh);
        cuadros += 1;
      };
      await pintar(); // primer cuadro antes de empezar a grabar

      const stream = conStream.captureStream(15);
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      const inicio = performance.now();
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const segundos = (performance.now() - inicio) / 1000;
        setVideo((anterior) => {
          if (anterior) URL.revokeObjectURL(anterior.url);
          return { url: URL.createObjectURL(new Blob(chunks, { type: mime })), segundos, cuadros };
        });
        setGrabando(false);
      };
      recorder.start(250);
      recorderRef.current = recorder;
      grabandoRef.current = true;
      setGrabando(true);
      setDuracion(0);
      timerRef.current = setInterval(() => setDuracion((d) => d + 1), 1000);

      // Captura cuadros tan rápido como el equipo lo permita (html-to-image es lento).
      const bucle = async () => {
        while (grabandoRef.current) {
          try {
            await pintar();
          } catch {
            // un cuadro fallido no detiene la grabación
          }
          await new Promise((r) => setTimeout(r, 30));
        }
      };
      void bucle();
    } catch (e) {
      detener();
      setGrabando(false);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg === 'not-ready' ? t('auto.errors.notReady') : t('auto.errors.record', { msg }));
    }
  };

  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
        <CameraIcon className="mr-1 inline h-4 w-4" />
        {t('auto.info')}
      </p>

      <MarcoDemo demo={demo} iframeRef={iframeRef} onLoad={() => setTimeout(() => setCargada(true), 400)} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={tomarFoto}
          disabled={capturando || grabando}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          <CameraIcon className="h-4 w-4" />
          {capturando ? t('auto.capturing') : t('auto.photo')}
        </button>
        {!grabando ? (
          <button
            type="button"
            onClick={iniciarVideo}
            disabled={capturando}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
          >
            <VideoCameraIcon className="h-4 w-4" />
            {t('auto.record')}
          </button>
        ) : (
          <button
            type="button"
            onClick={detener}
            className="inline-flex items-center gap-2 rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition"
          >
            <StopCircleIcon className="h-4 w-4 animate-pulse" />
            {t('stop', { s: duracion })}
          </button>
        )}
      </div>

      {error ? <AvisoError texto={error} /> : null}

      {photoUrl ? (
        <ResultadoFoto
          titulo={t('auto.photoTitle')}
          url={photoUrl}
          nombre={`koptup-${demo.slug}-captura.png`}
          onUsar={() => onUsar(photoUrl)}
        />
      ) : null}

      {video ? (
        <ResultadoVideo
          titulo={t('auto.videoTitle')}
          url={video.url}
          nombre={`koptup-${demo.slug}-video.webm`}
          detalle={t('auto.videoStats', {
            seconds: fmt.format(video.segundos),
            frames: video.cuadros,
            fps: fmt.format(video.segundos > 0 ? video.cuadros / video.segundos : 0),
          })}
        />
      ) : null}
    </div>
  );
}

/* ───────────────────── Modo 2: plantilla diseñada (SVG → PNG) ───────────────────── */

type Estilo = 'browser' | 'headline' | 'features';

/** Parte un texto en líneas de `max` caracteres; recorta con "…" si sobran. */
function lineas(texto: string, max: number, maxLineas: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (prueba.length > max && actual) {
      out.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) out.push(actual);
  if (out.length > maxLineas) {
    const recortadas = out.slice(0, maxLineas);
    const ultima = recortadas[maxLineas - 1];
    recortadas[maxLineas - 1] = (ultima.length > max - 1 ? ultima.slice(0, max - 1) : ultima).trimEnd() + '…';
    return recortadas;
  }
  return out;
}

function TextoMultilinea({
  x,
  y,
  texto,
  max,
  maxLineas,
  alto,
  ...props
}: {
  x: number;
  y: number;
  texto: string;
  max: number;
  maxLineas: number;
  alto: number;
} & React.SVGProps<SVGTextElement>) {
  return (
    <text x={x} y={y} {...props}>
      {lineas(texto, max, maxLineas).map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : alto}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

const FUENTE = 'Inter, Arial, Helvetica, sans-serif';

function VisualGenerator({ demo, onUsar }: { demo: KoptupDemo; onUsar: (dataUrl: string) => void }) {
  const t = useTranslations('demoLinkedinAds.capture');
  const [estilo, setEstilo] = useState<Estilo>('browser');
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const exportar = async (accion: 'descargar' | 'usar') => {
    if (!svgRef.current) return;
    setError(null);
    setGenerando(true);
    try {
      const dataUrl = await svgToPng(svgRef.current, 1200, 627);
      if (accion === 'descargar') descargarUrl(dataUrl, `koptup-${demo.slug}-${estilo}.png`);
      else onUsar(dataUrl);
    } catch (e) {
      setError(t('visual.error', { msg: e instanceof Error ? e.message : String(e) }));
    } finally {
      setGenerando(false);
    }
  };

  const textosSvg = {
    includes: t('visual.svg.includes'),
    para: t('visual.svg.for'),
    seeDemo: t('visual.svg.seeDemo'),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {(['browser', 'headline', 'features'] as Estilo[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={estilo === key}
            onClick={() => setEstilo(key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              estilo === key
                ? 'border-primary-500 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'
            }`}
          >
            {t(`visual.styles.${key}`)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary-200 bg-secondary-100 p-3 shadow-inner dark:border-secondary-700 dark:bg-secondary-900">
        <div className="overflow-hidden rounded-lg">
          <svg
            ref={svgRef}
            viewBox="0 0 1200 627"
            xmlns="http://www.w3.org/2000/svg"
            className="block h-auto w-full"
            role="img"
            aria-label={`${demo.titulo} · ${t(`visual.styles.${estilo}`)}`}
          >
            {estilo === 'browser' ? (
              <PlantillaNavegador demo={demo} textos={textosSvg} />
            ) : estilo === 'headline' ? (
              <PlantillaTitular demo={demo} textos={textosSvg} />
            ) : (
              <PlantillaFunciones demo={demo} textos={textosSvg} />
            )}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportar('descargar')}
          disabled={generando}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {generando ? t('visual.generating') : t('visual.download')}
        </button>
        <button
          type="button"
          onClick={() => exportar('usar')}
          disabled={generando}
          className="inline-flex items-center gap-2 rounded-md border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 disabled:opacity-60 dark:border-primary-400 dark:text-primary-200 dark:hover:bg-primary-950/60"
        >
          {t('useInPost')}
        </button>
      </div>
      {error ? <AvisoError texto={error} /> : null}
      <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('visual.sizeNote')}</p>
    </div>
  );
}

interface TextosSvg {
  includes: string;
  para: string;
  seeDemo: string;
}

function Logo({ x, y, claro = true }: { x: number; y: number; claro?: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width="44" height="44" rx="10" fill={claro ? 'white' : '#2563eb'} opacity={claro ? 0.2 : 1} />
      <text x="22" y="30" fontFamily={FUENTE} fontSize="22" fontWeight="800" fill="white" textAnchor="middle">
        K
      </text>
      <text x="58" y="29" fontFamily={FUENTE} fontSize="18" fontWeight="700" fill={claro ? 'white' : '#0f172a'} letterSpacing="2">
        KOPTUP
      </text>
    </g>
  );
}

function PlantillaNavegador({ demo, textos }: { demo: KoptupDemo; textos: TextosSvg }) {
  const titulo = lineas(`${demo.emoji} ${demo.titulo}`, 40, 2);
  const yTagline = 92 + titulo.length * 46;
  return (
    <>
      <defs>
        <linearGradient id="la-bg-nav" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="1200" height="627" fill="url(#la-bg-nav)" />
      <Logo x={50} y={30} />
      <g transform="translate(80,92)">
        <rect width="1040" height="480" rx="18" fill="#ffffff" />
        <rect width="1040" height="40" rx="18" fill="#e2e8f0" />
        <rect y="20" width="1040" height="20" fill="#e2e8f0" />
        <circle cx="22" cy="20" r="6" fill="#ef4444" />
        <circle cx="44" cy="20" r="6" fill="#f59e0b" />
        <circle cx="66" cy="20" r="6" fill="#22c55e" />
        <rect x="190" y="11" width="660" height="18" rx="9" fill="#f8fafc" />
        <text x="210" y="24" fontFamily={FUENTE} fontSize="11" fill="#64748b">
          koptup.com{demo.path}
        </text>
        <text x="40" y="92" fontFamily={FUENTE} fontSize="40" fontWeight="800" fill="#0f172a">
          {titulo.map((l, i) => (
            <tspan key={i} x="40" dy={i === 0 ? 0 : 46}>
              {l}
            </tspan>
          ))}
        </text>
        <TextoMultilinea x={40} y={yTagline} texto={demo.tagline} max={86} maxLineas={2} alto={26} fontFamily={FUENTE} fontSize="20" fill="#475569" />
        {demo.funciones.slice(0, 4).map((f, i) => (
          <g key={i} transform={`translate(${40 + (i % 2) * 490},${250 + Math.floor(i / 2) * 106})`}>
            <rect width="470" height="90" rx="12" fill="#eff6ff" />
            <circle cx="32" cy="45" r="15" fill="#2563eb" />
            <text x="32" y="50" fontFamily={FUENTE} fontSize="14" fontWeight="800" fill="white" textAnchor="middle">
              {i + 1}
            </text>
            <TextoMultilinea x={62} y={lineas(f, 44, 2).length > 1 ? 40 : 51} texto={f} max={44} maxLineas={2} alto={21} fontFamily={FUENTE} fontSize="16" fontWeight="600" fill="#0f172a" />
          </g>
        ))}
      </g>
      <text x="80" y="606" fontFamily={FUENTE} fontSize="15" fontWeight="600" fill="white">
        {textos.seeDemo} · koptup.com{demo.path}
      </text>
    </>
  );
}

function PlantillaTitular({ demo, textos }: { demo: KoptupDemo; textos: TextosSvg }) {
  const titulo = lineas(demo.titulo, 24, 2);
  const yTagline = 226 + titulo.length * 74 + 6;
  return (
    <>
      <defs>
        <linearGradient id="la-bg-tit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect width="1200" height="627" fill="url(#la-bg-tit)" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="627" stroke="#ffffff" strokeOpacity="0.05" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 90} x2="1200" y2={i * 90} stroke="#ffffff" strokeOpacity="0.05" />
      ))}
      <text x="80" y="96" fontFamily={FUENTE} fontSize="16" fontWeight="700" fill="#60a5fa" letterSpacing="3">
        KOPTUP · {demo.industria.toUpperCase()}
      </text>
      <text x="80" y="150" fontFamily={FUENTE} fontSize="44">
        {demo.emoji}
      </text>
      <text x="80" y="226" fontFamily={FUENTE} fontSize="64" fontWeight="900" fill="white">
        {titulo.map((l, i) => (
          <tspan key={i} x="80" dy={i === 0 ? 0 : 74}>
            {l}
          </tspan>
        ))}
      </text>
      <TextoMultilinea x={80} y={yTagline} texto={demo.tagline} max={70} maxLineas={2} alto={32} fontFamily={FUENTE} fontSize="24" fill="#cbd5e1" />
      <TextoMultilinea
        x={80}
        y={500}
        texto={`${textos.para}: ${demo.publicoObjetivo.slice(0, 3).join(' · ')}`.toUpperCase()}
        max={100}
        maxLineas={1}
        alto={20}
        fontFamily={FUENTE}
        fontSize="15"
        fontWeight="600"
        fill="#94a3b8"
      />
      <text x="80" y="566" fontFamily={FUENTE} fontSize="20" fontWeight="700" fill="white">
        → {textos.seeDemo} · koptup.com{demo.path}
      </text>
    </>
  );
}

function PlantillaFunciones({ demo, textos }: { demo: KoptupDemo; textos: TextosSvg }) {
  const titulo = lineas(demo.titulo, 17, 3);
  const yTagline = 262 + titulo.length * 36 + 18;
  return (
    <>
      <defs>
        <linearGradient id="la-bg-fun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fafaf9" />
          <stop offset="100%" stopColor="#e7e5e4" />
        </linearGradient>
      </defs>
      <rect width="1200" height="627" fill="url(#la-bg-fun)" />
      <rect x="0" y="0" width="380" height="627" fill="#2563eb" />
      <Logo x={40} y={50} />
      <text x="40" y="200" fontFamily={FUENTE} fontSize="60">
        {demo.emoji}
      </text>
      <text x="40" y="262" fontFamily={FUENTE} fontSize="30" fontWeight="800" fill="white">
        {titulo.map((l, i) => (
          <tspan key={i} x="40" dy={i === 0 ? 0 : 36}>
            {l}
          </tspan>
        ))}
      </text>
      <TextoMultilinea x={40} y={yTagline} texto={demo.tagline} max={30} maxLineas={5} alto={22} fontFamily={FUENTE} fontSize="16" fill="#dbeafe" />
      <text x="40" y="590" fontFamily={FUENTE} fontSize="14" fontWeight="600" fill="white">
        koptup.com{demo.path}
      </text>

      <text x="440" y="96" fontFamily={FUENTE} fontSize="14" fontWeight="700" fill="#64748b" letterSpacing="3">
        {textos.includes}
      </text>
      {demo.funciones.slice(0, 4).map((f, i) => (
        <g key={i} transform={`translate(440,${140 + i * 104})`}>
          <circle cx="16" cy="16" r="16" fill="#2563eb" />
          <text x="16" y="21" fontFamily={FUENTE} fontSize="14" fontWeight="800" fill="white" textAnchor="middle">
            {i + 1}
          </text>
          <TextoMultilinea x={50} y={22} texto={f} max={52} maxLineas={2} alto={26} fontFamily={FUENTE} fontSize="20" fontWeight="600" fill="#0f172a" />
        </g>
      ))}
      <TextoMultilinea
        x={440}
        y={590}
        texto={`${textos.para}: ${demo.publicoObjetivo.slice(0, 3).join(' · ')}`}
        max={70}
        maxLineas={1}
        alto={18}
        fontFamily={FUENTE}
        fontSize="14"
        fontWeight="600"
        fill="#64748b"
      />
    </>
  );
}

/** SVG en línea → PNG (data URL). Usa una data URL para no "contaminar" el canvas. */
async function svgToPng(svg: SVGSVGElement, width: number, height: number): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('class');
  const xml = new XMLSerializer().serializeToString(clone);
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('SVG'));
    img.src = src;
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}
