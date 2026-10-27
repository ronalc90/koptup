'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Bars3BottomLeftIcon, CloudArrowUpIcon, PencilIcon } from '@heroicons/react/24/outline';
import { MAX_IMAGE_BYTES } from '../lib/data';
import { fmtBytes } from '../lib/dates';
import { imageToPng, typedSignature } from '../lib/files';
import { useFirma } from '../lib/store';
import type { SignatureMark } from '../lib/types';
import { focusRing, inputCls, labelCls, smallBtn } from './ui';

const W = 600;
const H = 180;

/** Firma dibujada (mouse, lápiz o dedo), escrita o subida como imagen. Entrega un PNG. */
export default function SignaturePad({ defaultName, onChange }: { defaultName: string; onChange: (mark: SignatureMark | null) => void }) {
  const t = useTranslations('demoSign.signer');
  const { loc } = useFirma();
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typed, setTyped] = useState(defaultName);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Cada modo entrega su firma (o ninguna) al cambiar.
  useEffect(() => {
    if (mode === 'type') onChangeRef.current(typed.trim().length >= 3 ? { kind: 'type', image: typedSignature(typed.trim()), text: typed.trim() } : null);
    else if (mode === 'upload') onChangeRef.current(uploaded ? { kind: 'upload', image: uploaded } : null);
    else onChangeRef.current(hasInk && canvas.current ? { kind: 'draw', image: canvas.current.toDataURL('image/png') } : null);
  }, [mode, typed, uploaded, hasInk]);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const ctx = () => {
    const c = canvas.current?.getContext('2d');
    if (c) {
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.strokeStyle = '#1e3a8a';
    }
    return c;
  };
  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const c = ctx();
    if (c && last.current) {
      c.beginPath();
      c.arc(last.current.x, last.current.y, 1.5, 0, Math.PI * 2);
      c.fillStyle = '#1e3a8a';
      c.fill();
    }
  };
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const p = point(e);
    const c = ctx();
    if (!c) return;
    c.beginPath();
    c.moveTo(last.current.x, last.current.y);
    c.lineTo(p.x, p.y);
    c.stroke();
    last.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setHasInk(true);
    if (canvas.current) onChangeRef.current({ kind: 'draw', image: canvas.current.toDataURL('image/png') });
  };
  const clear = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, W, H);
    setHasInk(false);
  };

  const tabs = [
    { id: 'draw' as const, icon: PencilIcon },
    { id: 'type' as const, icon: Bars3BottomLeftIcon },
    { id: 'upload' as const, icon: CloudArrowUpIcon },
  ];

  return (
    <div>
      <div role="tablist" aria-label={t('padLabel')} className="mb-2 flex flex-wrap gap-1">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              if (id === 'draw' && mode !== 'draw') setHasInk(false);
              setMode(id);
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${focusRing} ${
              mode === id ? 'bg-lime-700 text-white' : 'border border-secondary-200 text-secondary-700 hover:bg-secondary-100 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-800'
            }`}
          >
            <Icon className="h-4 w-4" /> {t(`modes.${id}`)}
          </button>
        ))}
      </div>

      {mode === 'draw' && (
        <div className="max-w-xl">
          <canvas
            ref={canvas}
            width={W}
            height={H}
            aria-label={t('drawArea')}
            className="block w-full touch-none rounded-lg border-2 border-dashed border-secondary-300 bg-white"
            style={{ aspectRatio: `${W} / ${H}` }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-secondary-500">
            <span>{hasInk ? t('drawDone') : t('drawHint')}</span>
            <button type="button" className={`${smallBtn} text-secondary-700 hover:bg-secondary-100 dark:text-secondary-200 dark:hover:bg-secondary-800`} onClick={clear} disabled={!hasInk}>
              {t('clear')}
            </button>
          </div>
        </div>
      )}

      {mode === 'type' && (
        <div className="space-y-2">
          <label htmlFor="typed-sig" className={labelCls}>
            {t('typeLabel')}
          </label>
          <input id="typed-sig" className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} />
          <div className="flex h-24 items-center overflow-hidden rounded-lg border-2 border-dashed border-secondary-300 bg-white px-4">
            <span className="truncate text-3xl italic text-blue-900" style={{ fontFamily: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive' }}>
              {typed}
            </span>
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div className="space-y-2">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-secondary-300 px-4 py-6 text-center text-sm hover:border-lime-500 dark:border-secondary-700">
            <CloudArrowUpIcon className="h-6 w-6 text-lime-700" />
            <span className="mt-1 font-medium">{t('uploadPick')}</span>
            <span className="text-xs text-secondary-500">{t('uploadHint', { max: fmtBytes(MAX_IMAGE_BYTES, loc) })}</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                setUploadError(null);
                if (!file) return;
                if (!/^image\/(png|jpeg)$/.test(file.type)) return setUploadError(t('uploadType'));
                if (file.size > MAX_IMAGE_BYTES) return setUploadError(t('uploadBig', { size: fmtBytes(file.size, loc) }));
                try {
                  setUploaded(await imageToPng(file));
                } catch {
                  setUploadError(t('uploadType'));
                }
              }}
            />
          </label>
          {uploadError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {uploadError}
            </p>
          )}
          {uploaded && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={uploaded} alt={t('uploadedAlt')} className="max-h-24 rounded border border-secondary-200 bg-white p-1" />
          )}
        </div>
      )}
    </div>
  );
}
