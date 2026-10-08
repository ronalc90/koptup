'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CameraIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import type { Order } from './types';
import { Modal } from './ui';
import { useDelivery } from './store';

/**
 * Prueba de entrega: código de 4 dígitos que el cliente recibió, o foto +
 * firma cuando el cliente no tiene el código a mano. La foto y la firma no
 * salen del navegador.
 */
export default function ProofOfDelivery({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations('demoDelivery');
  const { dispatch, notify } = useDelivery();
  const [mode, setMode] = useState<'code' | 'photoSignature'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null);
  const [signed, setSigned] = useState(false);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);

  const confirm = () => {
    if (mode === 'code') {
      if (!/^\d{4}$/.test(code)) return setError(t('pod.codeFormat'));
      if (code !== order.code) return setError(t('pod.codeWrong'));
      dispatch({ type: 'deliver', id: order.id, method: 'code' });
    } else {
      if (!photo || !signed) return setError(t('pod.needBoth'));
      dispatch({ type: 'deliver', id: order.id, method: 'photoSignature', photoName: photo.name });
    }
    notify(t('pod.done', { id: order.id }));
    onClose();
  };

  return (
    <Modal
      scope="phone"
      title={t('pod.title', { id: order.id })}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={confirm}>{t('pod.confirm')}</Button>
        </>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-secondary-100 p-1 text-xs dark:bg-secondary-800" role="tablist">
        {(['code', 'photoSignature'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setError(''); }}
            className={`rounded-md py-1.5 font-semibold ${mode === m ? 'bg-white shadow dark:bg-secondary-900' : 'text-secondary-600 dark:text-secondary-300'}`}
          >
            {t(`pod.mode.${m}`)}
          </button>
        ))}
      </div>

      {mode === 'code' ? (
        <div className="space-y-2 text-xs">
          <label className="block">
            <span className="mb-1 block font-semibold">{t('pod.codeLabel')}</span>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="0000"
              className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] dark:border-secondary-600 dark:bg-secondary-900"
            />
          </label>
          <p className="rounded-lg bg-sky-50 p-2 text-[11px] text-sky-900 dark:bg-sky-900/30 dark:text-sky-100">
            {order.own ? t('pod.hintOwn') : t('pod.hintSample', { code: order.code })}
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div>
            <span className="mb-1 block font-semibold">{t('pod.photo')}</span>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-secondary-300 p-2 dark:border-secondary-600">
              <CameraIcon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 truncate">{photo ? photo.name : t('pod.photoPick')}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!f.type.startsWith('image/')) return setError(t('pod.photoType'));
                  setPhoto({ name: f.name, url: URL.createObjectURL(f) });
                  setError('');
                }}
              />
            </label>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt={t('pod.photoAlt')} className="mt-2 h-24 w-full rounded-lg object-cover" />
            )}
          </div>
          <SignaturePad onChange={(v) => { setSigned(v); if (v) setError(''); }} />
          <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('pod.privacy')}</p>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </Modal>
  );
}

function SignaturePad({ onChange }: { onChange: (signed: boolean) => void }) {
  const t = useTranslations('demoDelivery.pod');
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = pos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!has) {
      setHas(true);
      onChange(true);
    }
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = ref.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setHas(false);
    onChange(false);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-semibold">{t('signature')}</span>
        <button type="button" onClick={clear} className="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-400">{t('clear')}</button>
      </div>
      <canvas
        ref={ref}
        width={600}
        height={200}
        aria-label={t('signatureArea')}
        role="img"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-28 w-full touch-none rounded-lg border-2 border-dashed border-secondary-300 bg-white dark:border-secondary-600"
      />
      <p className="mt-0.5 text-[10px] text-secondary-500 dark:text-secondary-400">{has ? t('signed') : t('signHere')}</p>
    </div>
  );
}
