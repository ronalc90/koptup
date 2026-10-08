/**
 * Ilustraciones de ejemplo dibujadas en SVG (sin fotos de terceros ni
 * servicios externos). Se generan al vuelo para no guardar imágenes pesadas
 * en el navegador.
 */
import type { ArtKey, Media } from './types';

const PALETTE: Record<ArtKey, [string, string, string]> = {
  facade: ['#dbeafe', '#93c5fd', '#1e3a8a'],
  facade2: ['#dcfce7', '#86efac', '#14532d'],
  reception: ['#fae8ff', '#f0abfc', '#701a75'],
  consult: ['#e0f2fe', '#7dd3fc', '#0c4a6e'],
  team: ['#fef3c7', '#fcd34d', '#78350f'],
  lab: ['#ede9fe', '#c4b5fd', '#4c1d95'],
  ultrasound: ['#cffafe', '#67e8f9', '#164e63'],
  dental: ['#f1f5f9', '#cbd5e1', '#0f172a'],
  physio: ['#ffedd5', '#fdba74', '#7c2d12'],
  calendar: ['#fee2e2', '#fca5a5', '#7f1d1d'],
  chat: ['#d1fae5', '#6ee7b7', '#064e3b'],
  city: ['#e2e8f0', '#94a3b8', '#1e293b'],
};

function shapes(key: ArtKey, c: string, mid: string): string {
  switch (key) {
    case 'facade':
    case 'facade2':
      return `<rect x="40" y="26" width="80" height="62" rx="2" fill="#fff" stroke="${c}" stroke-width="1.5"/><rect x="40" y="20" width="80" height="10" rx="2" fill="${c}"/><rect x="72" y="58" width="16" height="30" fill="${mid}"/>${[48, 92, 104]
        .map((x) => `<rect x="${x}" y="38" width="10" height="12" fill="${mid}"/>`)
        .join('')}<rect x="48" y="58" width="16" height="12" fill="${mid}"/><path d="M72 88 L58 96 H44" stroke="${c}" stroke-width="1.5" fill="none"/><rect x="74" y="8" width="12" height="12" fill="#fff" stroke="${c}"/><path d="M80 10 v8 M76 14 h8" stroke="#dc2626" stroke-width="2"/>`;
    case 'reception':
      return `<rect x="30" y="52" width="100" height="26" rx="3" fill="#fff" stroke="${c}" stroke-width="1.5"/><circle cx="80" cy="40" r="8" fill="${mid}"/><rect x="70" y="47" width="20" height="10" rx="4" fill="${mid}"/>${[18, 136]
        .map((x) => `<rect x="${x}" y="70" width="10" height="16" rx="2" fill="${c}"/>`)
        .join('')}<rect x="60" y="16" width="40" height="10" rx="2" fill="${c}"/>`;
    case 'consult':
      return `<rect x="24" y="58" width="70" height="8" rx="2" fill="${c}"/><rect x="28" y="66" width="4" height="22" fill="${c}"/><rect x="86" y="66" width="4" height="22" fill="${c}"/><rect x="40" y="38" width="26" height="18" rx="2" fill="#fff" stroke="${c}"/><rect x="104" y="44" width="34" height="40" rx="3" fill="#fff" stroke="${c}" stroke-width="1.5"/><path d="M121 54 v20 M111 64 h20" stroke="#dc2626" stroke-width="3"/>`;
    case 'team':
      return [44, 80, 116]
        .map((x, i) => `<circle cx="${x}" cy="${40 + (i % 2) * 4}" r="11" fill="${mid}"/><rect x="${x - 16}" y="${54 + (i % 2) * 4}" width="32" height="34" rx="12" fill="${i === 1 ? '#fff' : c}" stroke="${c}"/>`)
        .join('');
    case 'lab':
      return `<path d="M68 18 h24 M74 18 v24 l-20 40 h52 l-20 -40 v-24" fill="#fff" stroke="${c}" stroke-width="2"/><path d="M60 72 h40 l6 10 h-52z" fill="${mid}"/><rect x="118" y="40" width="8" height="40" rx="4" fill="#fff" stroke="${c}"/><rect x="118" y="60" width="8" height="20" rx="4" fill="#dc2626"/>`;
    case 'ultrasound':
      return `<rect x="30" y="20" width="64" height="44" rx="4" fill="${c}"/><path d="M38 52 q8 -24 16 0 q8 -18 16 0 q8 -12 16 0" stroke="${mid}" stroke-width="2" fill="none"/><rect x="58" y="64" width="8" height="18" fill="${c}"/><rect x="100" y="60" width="44" height="10" rx="3" fill="#fff" stroke="${c}"/><rect x="104" y="70" width="4" height="18" fill="${c}"/><rect x="136" y="70" width="4" height="18" fill="${c}"/>`;
    case 'dental':
      return `<path d="M64 24 q16 -8 32 0 q10 6 6 26 q-4 18 -8 34 q-4 6 -8 -4 l-6 -18 l-6 18 q-4 10 -8 4 q-4 -16 -8 -34 q-4 -20 6 -26z" fill="#fff" stroke="${c}" stroke-width="2"/><circle cx="118" cy="30" r="5" fill="${mid}"/><circle cx="40" cy="70" r="4" fill="${mid}"/>`;
    case 'physio':
      return `<circle cx="70" cy="26" r="8" fill="${c}"/><path d="M70 34 v26 l-14 24 M70 60 l16 22 M70 42 l-20 -8 M70 42 l22 6" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="100" y="78" width="44" height="8" rx="4" fill="${mid}"/><circle cx="122" cy="56" r="10" fill="#fff" stroke="${c}" stroke-width="2"/>`;
    case 'calendar':
      return `<rect x="44" y="20" width="72" height="66" rx="4" fill="#fff" stroke="${c}" stroke-width="2"/><rect x="44" y="20" width="72" height="14" rx="4" fill="${c}"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${52 + (i % 4) * 16}" y="${42 + Math.floor(i / 4) * 13}" width="10" height="8" rx="1" fill="${i === 6 ? '#dc2626' : mid}"/>`).join('')}`;
    case 'chat':
      return `<rect x="56" y="10" width="48" height="84" rx="8" fill="#fff" stroke="${c}" stroke-width="2"/><rect x="62" y="22" width="30" height="10" rx="5" fill="${mid}"/><rect x="68" y="38" width="30" height="10" rx="5" fill="${c}"/><rect x="62" y="54" width="26" height="10" rx="5" fill="${mid}"/><rect x="72" y="70" width="26" height="10" rx="5" fill="${c}"/>`;
    case 'city':
      return `${[
        [20, 50, 18, 40],
        [42, 34, 20, 56],
        [66, 44, 16, 46],
        [86, 24, 22, 66],
        [112, 40, 18, 50],
        [134, 56, 16, 34],
      ]
        .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" opacity="0.85"/>`)
        .join('')}<path d="M0 90 h160" stroke="${c}" stroke-width="2"/><circle cx="130" cy="20" r="8" fill="#fde68a"/>`;
  }
}

export function artSvg(key: ArtKey): string {
  const [bg, mid, c] = PALETTE[key];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs><rect width="160" height="100" fill="url(#g)"/>${shapes(key, c, mid)}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const cache = new Map<ArtKey, string>();

/** URL que se pinta en la demo para una imagen de la biblioteca. */
export function mediaSrc(m: Pick<Media, 'src' | 'art'>): string {
  if (m.src) return m.src;
  if (!m.art) return '';
  let s = cache.get(m.art);
  if (!s) {
    s = artSvg(m.art);
    cache.set(m.art, s);
  }
  return s;
}
