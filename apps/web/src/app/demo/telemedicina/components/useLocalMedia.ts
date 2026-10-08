'use client';

/**
 * Cámara y micrófono del visitante (opcional, con el permiso del navegador).
 * La imagen y el audio se muestran solo en esta pantalla: no se graban ni se envían.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type MediaError = 'unsupported' | 'denied' | 'notFound' | 'other';

type PolicyDoc = Document & {
  permissionsPolicy?: { allowsFeature: (f: string) => boolean };
  featurePolicy?: { allowsFeature: (f: string) => boolean };
};

/** ¿El navegador y la política de permisos del sitio dejan usar la cámara / el micrófono? */
export function mediaAllowed(feature: 'camera' | 'microphone') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  const doc = document as PolicyDoc;
  const policy = doc.permissionsPolicy ?? doc.featurePolicy;
  return policy ? policy.allowsFeature(feature) : true;
}

/** null mientras no se ha montado (igual en servidor y navegador); luego true/false. */
export function useCameraAllowed() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    setAllowed(mediaAllowed('camera'));
  }, []);
  return allowed;
}

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<MediaError | null>(null);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async (audio = true) => {
    setError(null);
    if (!mediaAllowed('camera')) {
      setError('unsupported');
      return false;
    }
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: audio && mediaAllowed('microphone'),
      });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = s;
      setStream(s);
      return true;
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setError(
        name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'notFound' : 'other',
      );
      return false;
    } finally {
      setStarting(false);
    }
  }, []);

  const setAudioEnabled = useCallback((on: boolean) => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = on;
    });
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  return { stream, error, starting, start, stop, setAudioEnabled, hasAudio: !!stream?.getAudioTracks().length };
}

/** Nivel del micrófono (0–1) con la Web Audio API; solo se calcula en el navegador. */
export function useMicLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) {
      setLevel(0);
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
      setLevel(Math.min(1, peak / 64));
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.cancelAnimationFrame(raf);
      src.disconnect();
      ctx.close().catch(() => {});
    };
  }, [stream]);
  return level;
}

/** Asigna el stream a un <video> (callback ref). */
export function attachStream(stream: MediaStream | null) {
  return (el: HTMLVideoElement | null) => {
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
      if (stream) el.play().catch(() => {});
    }
  };
}
