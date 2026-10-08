'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Voz real con la síntesis de voz del navegador (Web Speech API).
 * No usa servicios externos: suena con las voces instaladas en el equipo.
 * Si el navegador no tiene voces para el idioma, `available` es false y la
 * demo avanza solo con la transcripción.
 */
export interface SpeechVoice {
  uri: string;
  name: string;
  lang: string;
}

const PREFERRED: Record<string, string[]> = {
  es: ['es-CO', 'es-419', 'es-US', 'es-MX', 'es-ES', 'es'],
  en: ['en-US', 'en-GB', 'en'],
};

function rank(lang: string, base: string) {
  const order = PREFERRED[base] ?? [base];
  const norm = lang.replace('_', '-');
  const idx = order.findIndex((p) => norm.toLowerCase().startsWith(p.toLowerCase()));
  return idx < 0 ? order.length : idx;
}

export function useSpeech(locale: string) {
  const base = locale.startsWith('en') ? 'en' : 'es';
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const rawRef = useRef<SpeechSynthesisVoice[]>([]);
  const speakingRef = useRef(false);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    setSupported(true);
    const synth = window.speechSynthesis;
    const load = () => {
      const all = synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
      all.sort((a, b) => rank(a.lang, base) - rank(b.lang, base) || a.name.localeCompare(b.name));
      rawRef.current = all;
      setVoices(all.map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang })));
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => {
      synth.removeEventListener?.('voiceschanged', load);
      synth.cancel();
    };
  }, [base]);

  const cancel = useCallback(() => {
    tokenRef.current += 1;
    speakingRef.current = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  /**
   * Habla el texto. `voiceUri` vacío = la mejor voz disponible del idioma.
   * Para el cliente se usa otra voz (si hay más de una) o un tono distinto.
   */
  const speak = useCallback(
    (text: string, opts: { voiceUri?: string; customer?: boolean; rate?: number }) => {
      if (!supported || rawRef.current.length === 0) return false;
      const synth = window.speechSynthesis;
      synth.cancel();
      const token = ++tokenRef.current;
      const list = rawRef.current;
      const agentVoice = list.find((v) => v.voiceURI === opts.voiceUri) ?? list[0];
      const other = list.find((v) => v.voiceURI !== agentVoice.voiceURI);
      const voice = opts.customer ? other ?? agentVoice : agentVoice;
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Math.min(2, Math.max(0.5, opts.rate ?? 1));
      u.pitch = opts.customer && !other ? 0.8 : 1;
      const done = () => {
        if (tokenRef.current === token) speakingRef.current = false;
      };
      u.onend = done;
      u.onerror = done;
      speakingRef.current = true;
      synth.speak(u);
      return true;
    },
    [supported],
  );

  return useMemo(
    () => ({ supported, available: supported && voices.length > 0, voices, speak, cancel, speakingRef }),
    [supported, voices, speak, cancel],
  );
}
