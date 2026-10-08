/**
 * Subida de imágenes en el navegador: se reduce a máx. 1280 px y se guarda
 * como JPEG comprimido (data URI) en el estado de la demo. No sale de tu
 * equipo; en tu proyecto iría a tu almacenamiento o CDN de imágenes.
 */
import type { Media } from './types';

export const MAX_UPLOAD_MB = 8;
const MAX_SIDE = 1280;

export type UploadError = 'notImage' | 'tooBig' | 'unreadable';

export async function imageFileToMedia(file: File, id: string, nowIso: string): Promise<Media | UploadError> {
  if (!file.type.startsWith('image/')) return 'notImage';
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return 'tooBig';
  const dataUrl = await new Promise<string | null>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
  if (!dataUrl) return 'unreadable';
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = dataUrl;
  });
  if (!img || !img.naturalWidth) return 'unreadable';
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'unreadable';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const src = canvas.toDataURL('image/jpeg', 0.8);
  const name = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'imagen';
  return {
    id,
    name: `${name}.jpg`,
    src,
    art: null,
    alt: { es: '', en: '' },
    focal: { x: 50, y: 50 },
    width: w,
    height: h,
    sizeKb: Math.round((src.length * 3) / 4 / 1024),
    source: 'upload',
    createdAt: nowIso,
  };
}
