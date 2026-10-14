/** Descargas reales generadas en el navegador (CSV, JSON y PDF de ejemplo). */
import { buildCsv } from './logic';

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** CSV en UTF-8 con BOM (abre bien en Excel). En español usa punto y coma. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][], sep: ';' | ',') {
  triggerDownload(new Blob(['﻿' + buildCsv(headers, rows, sep)], { type: 'text/csv;charset=utf-8' }), filename);
}

export function downloadJson(filename: string, data: unknown) {
  triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}

/** Lee un archivo de texto (CSV) como UTF-8. */
export function readText(file: Blob): Promise<string> {
  return file.text();
}

/** Lleva una imagen a un PNG de máximo 600×200 px (firma subida). */
export function imageToPng(file: Blob, maxW = 600, maxH = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

/** Dibuja un nombre con letra manuscrita y lo devuelve como PNG. */
export function typedSignature(name: string): string {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 160;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#1e3a8a';
  ctx.textBaseline = 'middle';
  let size = 64;
  const font = (px: number) => `italic ${px}px "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive`;
  ctx.font = font(size);
  while (ctx.measureText(name).width > 560 && size > 20) {
    size -= 4;
    ctx.font = font(size);
  }
  ctx.fillText(name, 20, 80);
  return c.toDataURL('image/png');
}
