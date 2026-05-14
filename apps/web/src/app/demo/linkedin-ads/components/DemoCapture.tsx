'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CameraIcon,
  VideoCameraIcon,
  StopCircleIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { KOPTUP_DEMOS, type KoptupDemo } from './data';

interface DemoCaptureProps {
  demoId: string;
  onDemoChange: (id: string) => void;
  onImageCaptured?: (dataUrl: string) => void;
}

type ModoCaptura = 'auto' | 'visual' | 'pantalla';

/**
 * Captura visual del demo. Dos modos:
 * - Visual: SVG template diseñado, siempre funciona, sin permisos. Ideal para LinkedIn 1200×627.
 * - Pantalla: usa getDisplayMedia() del navegador para capturar el iframe real
 *   (foto y/o video). Requiere permiso del usuario y solo funciona en HTTPS / localhost.
 */
export default function DemoCapture({
  demoId,
  onDemoChange,
  onImageCaptured,
}: DemoCaptureProps) {
  const demo = KOPTUP_DEMOS.find((d) => d.id === demoId) ?? KOPTUP_DEMOS[0];
  const [modo, setModo] = useState<ModoCaptura>('auto');
  const [iframeUrl, setIframeUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIframeUrl(`${window.location.origin}${demo.path}`);
  }, [demo.path]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
            Capturas para el post
          </h2>
          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
            Generá un visual diseñado o capturá el demo en vivo. Descargá PNG / WebM listo para subir.
          </p>
        </div>

        <select
          value={demoId}
          onChange={(e) => onDemoChange(e.target.value)}
          className="rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm font-medium text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100"
        >
          {KOPTUP_DEMOS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.emoji} {d.titulo}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-secondary-100 p-1 text-xs dark:bg-secondary-800">
        {(
          [
            { key: 'auto', label: 'Auto (real, sin permisos)', Icon: CameraIcon },
            { key: 'visual', label: 'Mockup diseñado', Icon: PhotoIcon },
            { key: 'pantalla', label: 'Grabar pantalla', Icon: VideoCameraIcon },
          ] as { key: ModoCaptura; label: string; Icon: typeof PhotoIcon }[]
        ).map(({ key, label, Icon }) => {
          const activo = modo === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setModo(key)}
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

      {modo === 'auto' ? (
        <AutoCapture iframeUrl={iframeUrl} demo={demo} onImageCaptured={onImageCaptured} />
      ) : modo === 'visual' ? (
        <VisualGenerator demo={demo} onImageCaptured={onImageCaptured} />
      ) : (
        <ScreenCapture iframeUrl={iframeUrl} demo={demo} onImageCaptured={onImageCaptured} />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Modo 0: AUTO — captura real del iframe sin pedir permisos                 */
/*  Same-origin → podemos acceder a contentDocument y renderizarlo a canvas   */
/*  vía html-to-image. Para video, capturamos el canvas con captureStream().  */
/* ────────────────────────────────────────────────────────────────────────── */

function AutoCapture({
  iframeUrl,
  demo,
  onImageCaptured,
}: {
  iframeUrl: string;
  demo: KoptupDemo;
  onImageCaptured?: (dataUrl: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [duracion, setDuracion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);

  const esperarCargaIframe = (): Promise<HTMLIFrameElement> =>
    new Promise((resolve, reject) => {
      const el = iframeRef.current;
      if (!el) return reject(new Error('iframe no montado'));
      const doc = el.contentDocument;
      if (doc && doc.readyState === 'complete' && doc.body && doc.body.childElementCount > 0) {
        return resolve(el);
      }
      const onLoad = () => {
        el.removeEventListener('load', onLoad);
        setTimeout(() => resolve(el), 400); // breathing room para hydration React
      };
      el.addEventListener('load', onLoad);
      setTimeout(() => resolve(el), 8000); // timeout duro
    });

  const tomarFoto = async () => {
    setError(null);
    setGenerando(true);
    try {
      const el = await esperarCargaIframe();
      const doc = el.contentDocument;
      if (!doc || !doc.body) throw new Error('Sin acceso al contenido del iframe');
      // Forzar scroll al top para captura consistente
      doc.documentElement.scrollTop = 0;
      doc.body.scrollTop = 0;
      // Import dinámico para que html-to-image no entre en el bundle SSR
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(doc.body, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
        width: doc.documentElement.scrollWidth,
        height: Math.max(doc.documentElement.scrollHeight, 627),
        style: { transform: 'translate(0, 0)' },
        filter: (node) => {
          // saltar scripts y elementos invisibles
          if (node instanceof HTMLElement) {
            if (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT') return false;
          }
          return true;
        },
      });
      setPhotoUrl(dataUrl);
      onImageCaptured?.(dataUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo capturar el iframe: ${msg}`);
    } finally {
      setGenerando(false);
    }
  };

  const iniciarVideo = async () => {
    setError(null);
    setVideoUrl(null);
    chunksRef.current = [];
    try {
      const el = await esperarCargaIframe();
      const doc = el.contentDocument;
      if (!doc || !doc.body) throw new Error('Sin acceso al contenido del iframe');
      const { toCanvas } = await import('html-to-image');

      // Canvas que se redibuja periódicamente desde el iframe
      const W = 1280;
      const H = 720;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D no disponible');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      let frameInFlight = false;
      const renderFrame = async () => {
        if (frameInFlight) return;
        frameInFlight = true;
        try {
          const sourceCanvas = await toCanvas(doc.body, {
            backgroundColor: '#ffffff',
            cacheBust: false,
            pixelRatio: 1,
            width: Math.max(doc.body.scrollWidth, 1200),
            height: Math.max(doc.body.scrollHeight, 627),
            filter: (node) =>
              !(node instanceof HTMLElement && (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT')),
          });
          // Encajar manteniendo aspecto (cover)
          const sw = sourceCanvas.width;
          const sh = sourceCanvas.height;
          const ratio = Math.max(W / sw, H / sh);
          const dw = sw * ratio;
          const dh = sh * ratio;
          ctx.drawImage(sourceCanvas, (W - dw) / 2, 0, dw, dh);
        } catch {
          // ignorar frames con error
        } finally {
          frameInFlight = false;
        }
      };

      // Stream del canvas (15 fps)
      const stream = (canvas as HTMLCanvasElement & { captureStream(fps: number): MediaStream }).captureStream(15);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        setVideoUrl(URL.createObjectURL(blob));
        setGrabando(false);
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setGrabando(true);
      setDuracion(0);
      timerRef.current = setInterval(() => setDuracion((d) => d + 1), 1000);

      // Loop de renderizado a ~10 fps (html-to-image es lento, no más rápido)
      const loop = () => {
        renderFrame();
        rafRef.current = window.setTimeout(loop, 100) as unknown as number;
      };
      loop();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo iniciar grabación: ${msg}`);
    }
  };

  const detenerVideo = () => {
    recorderRef.current?.stop();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) clearTimeout(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stop();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
        <CameraIcon className="mr-1 inline h-4 w-4" />
        <strong>Modo automático:</strong> capturamos el demo real renderizado en el iframe.
        Sin permisos, sin compartir pantalla, 100% del DOM real. La foto sale en 1-3 segundos;
        para video grabamos a 10 fps mientras interactuás con el demo.
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
        <div className="flex items-center justify-between border-b border-secondary-200 bg-secondary-50 px-3 py-2 dark:border-secondary-700 dark:bg-secondary-800">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-3 truncate text-xs text-secondary-600 dark:text-secondary-300">
              {iframeUrl}
            </span>
          </div>
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Abrir en pestaña
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
        </div>
        {iframeUrl ? (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            title={`Preview ${demo.titulo}`}
            className="block aspect-video w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={tomarFoto}
          disabled={generando || grabando}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          <CameraIcon className="h-4 w-4" />
          {generando ? 'Capturando…' : 'Tomar foto del demo'}
        </button>
        {!grabando ? (
          <button
            type="button"
            onClick={iniciarVideo}
            disabled={generando}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
          >
            <VideoCameraIcon className="h-4 w-4" />
            Grabar video (10 fps)
          </button>
        ) : (
          <button
            type="button"
            onClick={detenerVideo}
            className="inline-flex items-center gap-2 rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition"
          >
            <StopCircleIcon className="h-4 w-4 animate-pulse" />
            Detener ({duracion}s)
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {photoUrl ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Foto del demo real
          </p>
          <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Captura automática" className="w-full" />
          </div>
          <a
            href={photoUrl}
            download={`koptup-${demo.slug}-real.png`}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar PNG
          </a>
        </div>
      ) : null}

      {videoUrl ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Video del demo (WebM)
          </p>
          <video src={videoUrl} controls className="w-full rounded-lg border border-secondary-200 dark:border-secondary-700" />
          <a
            href={videoUrl}
            download={`koptup-${demo.slug}-real.webm`}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar WebM
          </a>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
            LinkedIn no acepta WebM directo. Convertí a MP4 con{' '}
            <a className="underline" href="https://cloudconvert.com/webm-to-mp4" target="_blank" rel="noreferrer">
              CloudConvert
            </a>{' '}
            o ffmpeg: <code>ffmpeg -i input.webm -c:v libx264 -crf 18 output.mp4</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Modo 1: VISUAL DISEÑADO                                                   */
/*  Renderiza un SVG inline y lo exporta a PNG vía canvas.                    */
/*  Tamaño: 1200×627 (óptimo para link share LinkedIn).                       */
/* ────────────────────────────────────────────────────────────────────────── */

function VisualGenerator({
  demo,
  onImageCaptured,
}: {
  demo: KoptupDemo;
  onImageCaptured?: (dataUrl: string) => void;
}) {
  const [estilo, setEstilo] = useState<'mockup-browser' | 'metric-hero' | 'feature-list'>(
    'mockup-browser',
  );
  const [descargando, setDescargando] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const descargarPNG = async () => {
    if (!svgRef.current) return;
    setDescargando(true);
    try {
      const dataUrl = await svgToPng(svgRef.current, 1200, 627);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `koptup-${demo.slug}-${estilo}.png`;
      a.click();
      onImageCaptured?.(dataUrl);
    } finally {
      setDescargando(false);
    }
  };

  const usarEnPost = async () => {
    if (!svgRef.current || !onImageCaptured) return;
    const dataUrl = await svgToPng(svgRef.current, 1200, 627);
    onImageCaptured(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'mockup-browser', label: '🖥️ Mockup browser' },
            { key: 'metric-hero', label: '📈 Métrica hero' },
            { key: 'feature-list', label: '✨ Lista de features' },
          ] as { key: typeof estilo; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setEstilo(key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              estilo === key
                ? 'border-primary-500 bg-primary-50 text-primary-900 dark:border-primary-400 dark:bg-primary-950/60 dark:text-primary-100'
                : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300'
            }`}
          >
            {label}
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
          >
            {estilo === 'mockup-browser' ? (
              <PlantillaMockupBrowser demo={demo} />
            ) : estilo === 'metric-hero' ? (
              <PlantillaMetricaHero demo={demo} />
            ) : (
              <PlantillaFeatureList demo={demo} />
            )}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={descargarPNG}
          disabled={descargando}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {descargando ? 'Generando…' : 'Descargar PNG 1200×627'}
        </button>
        {onImageCaptured ? (
          <button
            type="button"
            onClick={usarEnPost}
            className="inline-flex items-center gap-2 rounded-md border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50 dark:border-primary-400 dark:text-primary-200 dark:hover:bg-primary-950/60"
          >
            Usar en vista previa del post
          </button>
        ) : null}
      </div>
      <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
        Tamaño optimizado para link share. Para post nativo LinkedIn usá 1200×627 (paisaje) o 1080×1080
        (cuadrado para carrusel) — podés cambiar el viewBox del SVG.
      </p>
    </div>
  );
}

function PlantillaMockupBrowser({ demo }: { demo: KoptupDemo }) {
  return (
    <>
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect width="1200" height="627" fill="url(#bgGrad)" />
      {/* Logo Koptup */}
      <g transform="translate(50,40)">
        <rect width="44" height="44" rx="10" fill="white" opacity="0.18" />
        <text x="22" y="30" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="800" fill="white" textAnchor="middle">
          K
        </text>
        <text x="58" y="29" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" fill="white">
          KOPTUP
        </text>
      </g>

      {/* Mockup browser */}
      <g transform="translate(80,110)">
        <rect width="1040" height="470" rx="18" fill="url(#cardGrad)" />
        {/* Browser chrome */}
        <rect width="1040" height="40" rx="18" fill="#e2e8f0" />
        <rect y="20" width="1040" height="20" fill="#e2e8f0" />
        <circle cx="22" cy="20" r="6" fill="#ef4444" />
        <circle cx="44" cy="20" r="6" fill="#f59e0b" />
        <circle cx="66" cy="20" r="6" fill="#22c55e" />
        <rect x="190" y="11" width="660" height="18" rx="9" fill="#f1f5f9" />
        <text x="210" y="24" fontFamily="Inter, sans-serif" fontSize="11" fill="#64748b">
          🔒 koptup.com{demo.path}
        </text>

        {/* Demo header */}
        <g transform="translate(40,70)">
          <text fontFamily="Inter, sans-serif" fontSize="44" fontWeight="800" fill="#0f172a">
            {demo.emoji} {demo.titulo}
          </text>
          <text y="40" fontFamily="Inter, sans-serif" fontSize="20" fill="#475569">
            {demo.tagline}
          </text>
        </g>

        {/* Benefit cards */}
        <g transform="translate(40,180)">
          {demo.beneficiosClave.slice(0, 4).map((b, i) => (
            <g key={i} transform={`translate(${(i % 2) * 480},${Math.floor(i / 2) * 110})`}>
              <rect width="455" height="90" rx="12" fill="#eff6ff" />
              <circle cx="30" cy="45" r="14" fill="#2563eb" />
              <text x="30" y="50" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="800" fill="white" textAnchor="middle">
                {i + 1}
              </text>
              <foreignObject x="58" y="22" width="380" height="50">
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#0f172a',
                    lineHeight: 1.3,
                  }}
                >
                  {b}
                </div>
              </foreignObject>
            </g>
          ))}
        </g>
      </g>

      {/* Footer CTA */}
      <g transform="translate(80,595)">
        <text fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" fill="white">
          Probá la demo gratis · koptup.com{demo.path}
        </text>
      </g>
    </>
  );
}

function PlantillaMetricaHero({ demo }: { demo: KoptupDemo }) {
  const partes = demo.metricaImpactante.split(/[:·]/);
  const principal = partes[0]?.trim() ?? demo.metricaImpactante;
  const detalle = partes.slice(1).join(' · ').trim();

  return (
    <>
      <defs>
        <linearGradient id="metricBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect width="1200" height="627" fill="url(#metricBg)" />
      {/* Grid pattern */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="627" stroke="#ffffff" strokeOpacity="0.05" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 90} x2="1200" y2={i * 90} stroke="#ffffff" strokeOpacity="0.05" />
      ))}

      <g transform="translate(80,90)">
        <text fontFamily="Inter, sans-serif" fontSize="16" fontWeight="700" fill="#60a5fa" letterSpacing="0.2em">
          KOPTUP · {demo.industria.split(' / ')[0].toUpperCase()}
        </text>
        <text y="64" fontFamily="Inter, sans-serif" fontSize="42" fontWeight="800" fill="white">
          {demo.emoji} {demo.titulo}
        </text>
      </g>

      <g transform="translate(80,260)">
        <text fontFamily="Inter, sans-serif" fontSize="96" fontWeight="900" fill="#60a5fa">
          {truncateFor(principal, 28)}
        </text>
        <text y="50" fontFamily="Inter, sans-serif" fontSize="22" fill="#cbd5e1">
          {truncateFor(detalle || demo.tagline, 80)}
        </text>
      </g>

      <g transform="translate(80,470)">
        <text fontFamily="Inter, sans-serif" fontSize="16" fontWeight="600" fill="#94a3b8">
          PARA: {demo.publicoObjetivo.slice(0, 4).join(' · ').toUpperCase()}
        </text>
        <text y="80" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" fill="white">
          → Probalo en koptup.com{demo.path}
        </text>
      </g>
    </>
  );
}

function PlantillaFeatureList({ demo }: { demo: KoptupDemo }) {
  return (
    <>
      <defs>
        <linearGradient id="flBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fafaf9" />
          <stop offset="100%" stopColor="#e7e5e4" />
        </linearGradient>
      </defs>
      <rect width="1200" height="627" fill="url(#flBg)" />
      <rect x="0" y="0" width="380" height="627" fill="#2563eb" />

      {/* Left side */}
      <g transform="translate(40,60)">
        <rect width="44" height="44" rx="10" fill="white" opacity="0.2" />
        <text x="22" y="30" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="800" fill="white" textAnchor="middle">
          K
        </text>
        <text x="60" y="29" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="white" letterSpacing="0.2em">
          KOPTUP
        </text>

        <text y="120" fontFamily="Inter, sans-serif" fontSize="64" fontWeight="800" fill="white">
          {demo.emoji}
        </text>
        <foreignObject y="190" width="320" height="160">
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              color: 'white',
              fontWeight: 800,
              fontSize: 30,
              lineHeight: 1.1,
            }}
          >
            {demo.titulo}
          </div>
        </foreignObject>

        <foreignObject y="380" width="320" height="120">
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#dbeafe',
              fontWeight: 500,
              fontSize: 16,
              lineHeight: 1.4,
            }}
          >
            {demo.tagline}
          </div>
        </foreignObject>

        <text y="565" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="600" fill="white">
          koptup.com{demo.path}
        </text>
      </g>

      {/* Right side: feature list */}
      <g transform="translate(440,70)">
        <text fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#64748b" letterSpacing="0.2em">
          QUÉ INCLUYE
        </text>

        {[...demo.beneficiosClave, ...demo.caracteristicasIA.slice(0, 2)].slice(0, 6).map((b, i) => (
          <g key={i} transform={`translate(0,${60 + i * 70})`}>
            <circle cx="14" cy="14" r="14" fill="#2563eb" />
            <text x="14" y="19" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="800" fill="white" textAnchor="middle">
              {i + 1}
            </text>
            <foreignObject x="44" y="-2" width="640" height="60">
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#0f172a',
                  lineHeight: 1.35,
                }}
              >
                {b}
              </div>
            </foreignObject>
          </g>
        ))}
      </g>
    </>
  );
}

function truncateFor(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…';
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Modo 2: CAPTURA EN VIVO                                                   */
/*  Usa getDisplayMedia + MediaRecorder. Permite foto y video.                */
/* ────────────────────────────────────────────────────────────────────────── */

function ScreenCapture({
  iframeUrl,
  demo,
  onImageCaptured,
}: {
  iframeUrl: string;
  demo: KoptupDemo;
  onImageCaptured?: (dataUrl: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duracion, setDuracion] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detener = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarStream = async () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      setError('Tu navegador no soporta captura de pantalla. Probá Chrome/Edge en HTTPS o localhost.');
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: false,
      });
      streamRef.current = stream;
      return stream;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo iniciar la captura: ${msg}`);
      return null;
    }
  };

  const tomarFoto = async () => {
    const stream = await iniciarStream();
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const ImageCaptureCtor = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => unknown }).ImageCapture;
      let bitmap: ImageBitmap;
      if (ImageCaptureCtor) {
        const ic = new ImageCaptureCtor(track) as { grabFrame: () => Promise<ImageBitmap> };
        bitmap = await ic.grabFrame();
      } else {
        // Fallback: render video element 1 frame
        const v = document.createElement('video');
        v.srcObject = stream;
        await v.play();
        await new Promise((r) => setTimeout(r, 250));
        const cnv = document.createElement('canvas');
        cnv.width = v.videoWidth;
        cnv.height = v.videoHeight;
        cnv.getContext('2d')!.drawImage(v, 0, 0);
        v.pause();
        const dataUrl = cnv.toDataURL('image/png');
        setPhotoUrl(dataUrl);
        onImageCaptured?.(dataUrl);
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const cnv = document.createElement('canvas');
      cnv.width = bitmap.width;
      cnv.height = bitmap.height;
      cnv.getContext('2d')!.drawImage(bitmap, 0, 0);
      const dataUrl = cnv.toDataURL('image/png');
      setPhotoUrl(dataUrl);
      onImageCaptured?.(dataUrl);
    } finally {
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  const iniciarVideo = async () => {
    setVideoUrl(null);
    chunksRef.current = [];
    const stream = await iniciarStream();
    if (!stream) return;

    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };
    stream.getVideoTracks()[0].addEventListener('ended', () => detener());
    recorder.start(200);
    mediaRecorderRef.current = recorder;
    setRecording(true);
    setDuracion(0);
    timerRef.current = setInterval(() => setDuracion((d) => d + 1), 1000);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
        <ExclamationTriangleIcon className="mr-1 inline h-4 w-4" />
        <strong>Cómo funciona:</strong> el navegador te va a pedir permiso para compartir pantalla.
        Elegí la pestaña donde está el demo (o solo la ventana). Luego tomamos foto o grabamos
        video desde el contenido real. Funciona en Chrome/Edge sobre HTTPS o localhost.
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900">
        <div className="flex items-center justify-between border-b border-secondary-200 bg-secondary-50 px-3 py-2 dark:border-secondary-700 dark:bg-secondary-800">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-3 truncate text-xs text-secondary-600 dark:text-secondary-300">
              {iframeUrl}
            </span>
          </div>
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Abrir en pestaña
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
        </div>
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            title={`Preview ${demo.titulo}`}
            className="block aspect-video w-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={tomarFoto}
          disabled={recording}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          <CameraIcon className="h-4 w-4" />
          Tomar foto del demo
        </button>
        {!recording ? (
          <button
            type="button"
            onClick={iniciarVideo}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <VideoCameraIcon className="h-4 w-4" />
            Grabar video
          </button>
        ) : (
          <button
            type="button"
            onClick={detener}
            className="inline-flex items-center gap-2 rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition"
          >
            <StopCircleIcon className="h-4 w-4 animate-pulse" />
            Detener ({duracion}s)
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {photoUrl ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Foto capturada
          </p>
          <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Captura" className="w-full" />
          </div>
          <a
            href={photoUrl}
            download={`koptup-${demo.slug}-foto.png`}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar PNG
          </a>
        </div>
      ) : null}

      {videoUrl ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
            Video grabado (WebM)
          </p>
          <video src={videoUrl} controls className="w-full rounded-lg border border-secondary-200 dark:border-secondary-700" />
          <a
            href={videoUrl}
            download={`koptup-${demo.slug}-video.webm`}
            className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar WebM
          </a>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
            LinkedIn no acepta WebM directo. Convertilo a MP4 con{' '}
            <a className="underline" href="https://cloudconvert.com/webm-to-mp4" target="_blank" rel="noreferrer">
              CloudConvert
            </a>{' '}
            o ffmpeg: <code>ffmpeg -i input.webm -c:v libx264 output.mp4</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Util: SVG inline → PNG dataURL                                            */
/* ────────────────────────────────────────────────────────────────────────── */

async function svgToPng(svg: SVGSVGElement, width: number, height: number): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('No se pudo cargar el SVG'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
