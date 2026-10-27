'use client';

import { useMemo, useRef, type RefObject } from 'react';

/** Estilos de la página de ejemplo (aislados bajo `.kx-page`). */
const CSS = `
.kx-page{background:#fff;color:#1f2937;font-family:ui-sans-serif,system-ui,sans-serif;padding:14px;font-size:13px;line-height:1.35;overflow-wrap:anywhere}
.kx-page .tienda-encabezado{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #e5e7eb}
.kx-page .tienda-logo{display:inline-flex;width:34px;height:34px;flex-shrink:0;border-radius:8px;color:#fff;font-weight:700;align-items:center;justify-content:center}
.kx-page .tienda-nombre{font-weight:700;font-size:15px;margin:0}
.kx-page .tienda-dominio{color:#6b7280;font-size:11px;margin:0}
.kx-page .tienda-ruta{color:#6b7280;font-size:11px;margin:8px 0 2px}
.kx-page .tienda-titulo{font-size:16px;font-weight:700;margin:0 0 10px}
.kx-page .productos{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:10px}
.kx-page .producto{border:1px solid #e5e7eb;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px}
.kx-page .producto-imagen{height:48px;border-radius:6px;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:11px}
.kx-page .producto-info{display:flex;flex-direction:column;gap:3px}
.kx-page .producto-nombre{font-size:12px;font-weight:600;margin:0}
.kx-page .producto-enlace{color:#111827;text-decoration:none}
.kx-page .precios{margin:0}
.kx-page .precio-actual{font-size:15px;font-weight:700;color:#b91c1c}
.kx-page .precio-antes{font-size:11px;color:#9ca3af;text-decoration:line-through;margin-left:4px}
.kx-page .stock{margin:0;font-size:11px;color:#047857}
.kx-page .stock.agotado{color:#b91c1c;font-weight:600}
.kx-page .envio{margin:0;font-size:11px;color:#374151}
.kx-page .producto-boton{margin-top:auto;text-align:center;background:#111827;color:#fff;border-radius:6px;padding:4px;font-size:11px}
.kx-page .tienda-pie{margin-top:12px;color:#9ca3af;font-size:10px}
.kx-page.kx-user h1{font-size:18px;font-weight:700;margin:4px 0}
.kx-page.kx-user h2{font-size:15px;font-weight:700;margin:4px 0}
.kx-page.kx-user h3,.kx-page.kx-user h4{font-size:13px;font-weight:700;margin:4px 0}
.kx-page.kx-user p{margin:4px 0}
.kx-page.kx-user ul,.kx-page.kx-user ol{padding-left:18px;list-style:disc;margin:4px 0}
.kx-page.kx-user table{border-collapse:collapse;margin:6px 0}
.kx-page.kx-user td,.kx-page.kx-user th{border:1px solid #e5e7eb;padding:3px 6px;text-align:left}
.kx-page.kx-user a{color:#1d4ed8;text-decoration:underline}
.kx-page.kx-user img{display:inline-block;min-width:48px;min-height:32px;border:1px dashed #9ca3af;background:#f3f4f6}
.kx-page.kx-selecting,.kx-page.kx-selecting *{cursor:crosshair}
.kx-page [data-kx-hover]{outline:2px dashed #f59e0b;outline-offset:1px}
.kx-page [data-kx-match]{outline:2px solid #10b981;outline-offset:1px;background-color:rgba(16,185,129,.14)}
`;

export type Device = 'desktop' | 'tablet' | 'mobile';
const STYLE = { __html: CSS };
const WIDTHS: Record<Device, string> = { desktop: 'w-full', tablet: 'mx-auto max-w-[620px]', mobile: 'mx-auto max-w-[360px]' };

interface Props {
  html: string;
  address: string;
  device: Device;
  selecting: boolean;
  user?: boolean;
  rootRef: RefObject<HTMLDivElement>;
  onPick: (el: Element) => void;
  label: string;
}

/**
 * Vista previa de una página. En modo selección, pasar el cursor resalta el
 * elemento y hacer clic lo convierte en un campo (los enlaces no navegan).
 */
export default function PagePreview({ html, address, device, selecting, user = false, rootRef, onPick, label }: Props) {
  const hovered = useRef<Element | null>(null);
  // Objeto estable: React compara `dangerouslySetInnerHTML` por referencia y, si cambia,
  // reescribe la página (y borraría el resaltado de «Probar»).
  const inner = useMemo(() => ({ __html: html }), [html]);
  const clearHover = () => {
    hovered.current?.removeAttribute('data-kx-hover');
    hovered.current = null;
  };
  return (
    <div className={`${WIDTHS[device]} overflow-hidden rounded-lg border border-secondary-700`}>
      <style dangerouslySetInnerHTML={STYLE} />
      <div className="flex items-center gap-1.5 border-b border-secondary-800 bg-secondary-900 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="min-w-0 flex-1 truncate px-2 text-center font-mono text-[11px] text-secondary-400">{address}</div>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        <div
          ref={rootRef}
          aria-label={label}
          className={`kx-page ${user ? 'kx-user' : ''} ${selecting ? 'kx-selecting' : ''}`}
          onMouseOver={(e) => {
            if (!selecting) return;
            const el = e.target as Element;
            if (!rootRef.current || el === rootRef.current || !rootRef.current.contains(el)) return;
            if (hovered.current !== el) {
              clearHover();
              el.setAttribute('data-kx-hover', '');
              hovered.current = el;
            }
          }}
          onMouseLeave={clearHover}
          onClick={(e) => {
            const el = e.target as Element;
            if (el.closest('a')) e.preventDefault();
            if (!selecting || !rootRef.current || el === rootRef.current || !rootRef.current.contains(el)) return;
            e.preventDefault();
            clearHover();
            onPick(el);
          }}
          dangerouslySetInnerHTML={inner}
        />
      </div>
    </div>
  );
}
