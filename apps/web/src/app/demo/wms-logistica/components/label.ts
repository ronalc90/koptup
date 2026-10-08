/**
 * Etiqueta de despacho de ejemplo (10 × 15 cm): se descarga en PDF con jsPDF o
 * se imprime desde un iframe oculto. La guía es simulada: en un proyecto real
 * el número y la etiqueta los entrega la transportadora por su API.
 */
import { CARRIER_BY_ID, CITY_BY_ID, CLIENT_BY_ID, COMPANY, WAREHOUSE_BY_ID } from '../lib/catalog';
import type { Order, Shipment } from '../lib/types';

export interface LabelTexts {
  sample: string;
  from: string;
  to: string;
  order: string;
  guide: string;
  weight: string;
  box: string;
  service: string;
  units: string;
  /** Nombre visible de la transportadora en el idioma de la demo. */
  carrierName?: string;
}

/** Barras ilustrativas derivadas del número de guía (no es un código legible por lector). */
export function bars(code: string): number[] {
  const out: number[] = [];
  for (const ch of code) {
    const c = ch.charCodeAt(0);
    out.push(1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3), 1);
  }
  return out;
}

export function labelLines(order: Order, sh: Shipment) {
  const w = WAREHOUSE_BY_ID[order.wh];
  return {
    from: [`${COMPANY.name}`, `${w.name} · ${w.city}`, `${CLIENT_BY_ID[order.client].name}`],
    to: [order.customer, order.address, `${CITY_BY_ID[order.city]?.name ?? ''}, ${CITY_BY_ID[order.city]?.dept ?? ''}`],
    carrier: CARRIER_BY_ID[sh.carrier].name,
  };
}

export async function labelPdf(order: Order, sh: Shipment, tx: LabelTexts, units: number) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: [100, 150] });
  const l = labelLines(order, sh);
  const carrier = tx.carrierName ?? l.carrier;
  doc.setFillColor(68, 64, 60);
  doc.rect(0, 0, 100, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(carrier, 5, 9);
  doc.setFontSize(8);
  doc.text(tx.sample, 95, 9, { align: 'right' });
  doc.setTextColor(20, 20, 20);
  let y = 22;
  doc.setFontSize(7);
  doc.text(tx.from.toUpperCase(), 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const s of l.from) doc.text(s, 5, (y += 4.2));
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(tx.to.toUpperCase(), 5, y);
  doc.setFontSize(11);
  doc.text(l.to[0], 5, (y += 5.5));
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(doc.splitTextToSize(l.to[1], 90), 5, (y += 5));
  doc.setFont('helvetica', 'bold');
  doc.text(l.to[2], 5, (y += 9));
  y += 6;
  doc.setDrawColor(120, 120, 120);
  doc.line(5, y, 95, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${tx.order}: ${order.id}`, 5, (y += 6));
  doc.text(`${tx.weight}: ${sh.weightKg.toFixed(2)} kg · ${tx.box}: ${sh.box} · ${units} ${tx.units}`, 5, (y += 5));
  doc.text(`${tx.service}: ${sh.etaDays === 0 ? '0' : sh.etaDays} d`, 5, (y += 5));
  // Barras ilustrativas
  y += 6;
  let x = 8;
  for (const [i, wbar] of bars(sh.id).entries()) {
    if (i % 2 === 0) {
      doc.setFillColor(0, 0, 0);
      doc.rect(x, y, wbar * 0.45, 24, 'F');
    }
    x += wbar * 0.45;
    if (x > 92) break;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${tx.guide} ${sh.id}`, 50, y + 31, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28);
  doc.text(doc.splitTextToSize(tx.sample, 90), 50, 145, { align: 'center' });
  doc.save(`etiqueta-${sh.id}.pdf`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function printLabel(order: Order, sh: Shipment, tx: LabelTexts, units: number) {
  const l = labelLines(order, sh);
  const carrier = tx.carrierName ?? l.carrier;
  const barsHtml = bars(sh.id)
    .map((w, i) => `<span style="display:inline-block;height:60px;width:${w * 2}px;background:${i % 2 === 0 ? '#000' : 'transparent'}"></span>`)
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sh.id)}</title>
<style>@page{size:100mm 150mm;margin:4mm}body{font-family:Arial,sans-serif;margin:0;color:#111}
.h{background:#44403c;color:#fff;padding:8px;display:flex;justify-content:space-between;font-weight:bold}
.s{font-size:10px;color:#666;text-transform:uppercase;margin-top:10px}.b{font-weight:bold}.big{font-size:18px;font-weight:bold}
.bars{margin-top:12px;white-space:nowrap;overflow:hidden}.warn{color:#b91c1c;font-size:9px;margin-top:10px}</style></head>
<body><div class="h"><span>${esc(carrier)}</span><span>${esc(tx.sample)}</span></div>
<div class="s">${esc(tx.from)}</div>${l.from.map((x) => `<div>${esc(x)}</div>`).join('')}
<div class="s">${esc(tx.to)}</div><div class="big">${esc(l.to[0])}</div><div>${esc(l.to[1])}</div><div class="b">${esc(l.to[2])}</div>
<hr><div>${esc(tx.order)}: ${esc(order.id)}</div><div>${esc(tx.weight)}: ${sh.weightKg.toFixed(2)} kg · ${esc(tx.box)}: ${sh.box} · ${units} ${esc(tx.units)}</div>
<div class="bars">${barsHtml}</div><div class="big" style="text-align:center">${esc(tx.guide)} ${esc(sh.id)}</div>
<div class="warn">${esc(tx.sample)}</div></body></html>`;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return false;
  }
  doc.open();
  doc.write(html);
  doc.close();
  window.setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 2000);
    }
  }, 150);
  return true;
}
