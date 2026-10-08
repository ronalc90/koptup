/**
 * Exporta el carrusel a PDF (una página cuadrada por slide), el formato con el
 * que LinkedIn acepta carruseles como documento. Cada slide se dibuja en un
 * canvas de 1080×1080 y se inserta como imagen con jsPDF.
 */

import type { CarruselSlide } from './generador';

const LADO = 1080;

function envolver(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function dibujarSlide(
  slide: CarruselSlide,
  total: number,
  etiqueta: string,
  pie: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D no disponible');

  const fondo = ctx.createLinearGradient(0, 0, LADO, LADO);
  fondo.addColorStop(0, slide.numero === 1 || slide.numero === total ? '#1d4ed8' : '#eff6ff');
  fondo.addColorStop(1, slide.numero === 1 || slide.numero === total ? '#6d28d9' : '#f5f3ff');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, LADO, LADO);
  const oscuro = slide.numero === 1 || slide.numero === total;
  const colorTexto = oscuro ? '#ffffff' : '#0f172a';
  const colorSuave = oscuro ? '#dbeafe' : '#334155';
  const margen = 96;
  const ancho = LADO - margen * 2;
  const familia = 'Inter, "Segoe UI", Arial, sans-serif';

  ctx.textBaseline = 'top';
  ctx.fillStyle = oscuro ? '#bfdbfe' : '#2563eb';
  ctx.font = `700 30px ${familia}`;
  ctx.fillText(etiqueta.toUpperCase(), margen, margen);

  let y = margen + 90;
  ctx.fillStyle = colorTexto;
  ctx.font = `800 68px ${familia}`;
  for (const linea of envolver(ctx, slide.titulo, ancho).slice(0, 4)) {
    ctx.fillText(linea, margen, y);
    y += 82;
  }

  y += 40;
  ctx.font = `500 42px ${familia}`;
  for (const bullet of slide.bullets) {
    const lineas = envolver(ctx, bullet, ancho - 50);
    ctx.fillStyle = oscuro ? '#93c5fd' : '#2563eb';
    ctx.fillText('•', margen, y);
    ctx.fillStyle = colorSuave;
    for (const linea of lineas) {
      if (y > LADO - 200) break;
      ctx.fillText(linea, margen + 50, y);
      y += 56;
    }
    y += 24;
  }

  ctx.fillStyle = oscuro ? '#e0e7ff' : '#64748b';
  ctx.font = `600 28px ${familia}`;
  ctx.fillText(pie, margen, LADO - margen - 28);
  return canvas;
}

export async function descargarCarruselPdf(
  slides: CarruselSlide[],
  opciones: { nombreArchivo: string; etiqueta: (n: number, total: number) => string; pie: string },
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const lado = 540; // puntos: 7,5 pulgadas por lado; la imagen conserva 1080 px.
  const pdf = new jsPDF({ unit: 'pt', format: [lado, lado], orientation: 'portrait', compress: true });
  slides.forEach((slide, i) => {
    if (i > 0) pdf.addPage([lado, lado], 'portrait');
    const canvas = dibujarSlide(slide, slides.length, opciones.etiqueta(slide.numero, slides.length), opciones.pie);
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, lado, lado);
  });
  pdf.save(opciones.nombreArchivo);
}
