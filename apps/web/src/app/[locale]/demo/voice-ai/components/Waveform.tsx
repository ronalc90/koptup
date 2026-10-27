'use client';

import { cn } from '@/lib/utils';

interface WaveformProps {
  /** Hay alguien hablando en la llamada. */
  active?: boolean;
  /** Quién habla: cambia el color de las barras. */
  speaker?: 'ai' | 'customer';
  bars?: number;
  className?: string;
}

const HEIGHTS = [22, 38, 60, 84, 52, 36, 70, 92, 48, 28, 64, 88, 42, 56, 78, 34, 66, 90, 50, 30, 72, 86, 44, 58, 80, 38, 68, 54];
const DELAYS = [0, 80, 160, 40, 220, 120, 300, 60, 180, 260, 100, 340, 200, 20, 280, 140, 320, 160, 240, 80, 360, 120, 200, 40, 300, 180, 260, 100];

/**
 * Indicador ilustrativo de actividad de voz (animación CSS): se mueve
 * mientras alguien habla en la llamada de ejemplo y se detiene en pausa,
 * al terminar o al transferir. No se calcula a partir del audio.
 */
export default function Waveform({ active = true, speaker = 'ai', bars = 28, className }: WaveformProps) {
  return (
    <div className={cn('flex items-end justify-center gap-[3px] h-16 select-none', className)} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-full transition-[height] duration-300',
            active
              ? speaker === 'ai'
                ? 'bg-gradient-to-t from-emerald-500 via-cyan-400 to-violet-400 animate-pulse'
                : 'bg-gradient-to-t from-amber-500 via-amber-300 to-rose-300 animate-pulse'
              : 'bg-slate-600/50',
          )}
          style={{
            height: `${active ? HEIGHTS[i % HEIGHTS.length] : 14}%`,
            animationDelay: `${DELAYS[i % DELAYS.length]}ms`,
            animationDuration: active ? '900ms' : undefined,
          }}
        />
      ))}
    </div>
  );
}
