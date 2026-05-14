'use client';

import { cn } from '@/lib/utils';

interface WaveformProps {
  active?: boolean;
  bars?: number;
  className?: string;
}

/**
 * Animated CSS-only waveform. No JS animation loop.
 * Each bar has a per-bar delay + height pattern so it looks organic.
 */
export default function Waveform({ active = true, bars = 28, className }: WaveformProps) {
  const heights = [22, 38, 60, 84, 52, 36, 70, 92, 48, 28, 64, 88, 42, 56, 78, 34, 66, 90, 50, 30, 72, 86, 44, 58, 80, 38, 68, 54];
  const delays = [0, 80, 160, 40, 220, 120, 300, 60, 180, 260, 100, 340, 200, 20, 280, 140, 320, 160, 240, 80, 360, 120, 200, 40, 300, 180, 260, 100];

  return (
    <div className={cn('flex items-end justify-center gap-[3px] h-20 select-none', className)} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const h = heights[i % heights.length];
        const d = delays[i % delays.length];
        return (
          <span
            key={i}
            className={cn(
              'w-[3px] rounded-full',
              active
                ? 'bg-gradient-to-t from-emerald-500 via-cyan-400 to-violet-400 animate-pulse'
                : 'bg-secondary-600/40'
            )}
            style={{
              height: `${active ? h : 18}%`,
              animationDelay: `${d}ms`,
              animationDuration: active ? '900ms' : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
