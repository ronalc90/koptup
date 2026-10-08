'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoldIcon, ItalicIcon, LinkIcon, ListBulletIcon, NumberedListIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { escapeHtml, isSafeHref } from '../lib/text';
import { btn, inputCls } from './ui';

const TAGS: Record<string, string> = { P: 'p', DIV: 'p', BR: 'br', B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', A: 'a', UL: 'ul', OL: 'ol', LI: 'li' };
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'svg', 'SVG', 'IMG', 'VIDEO', 'AUDIO']);

function cleanNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? '');
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  if (DROP.has(el.tagName)) return '';
  const inner = Array.from(el.childNodes).map(cleanNode).join('');
  const tag = TAGS[el.tagName];
  if (!tag) return inner;
  if (tag === 'br') return '<br>';
  if (tag === 'a') {
    const href = (el.getAttribute('href') ?? '').trim();
    return isSafeHref(href) ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner;
  }
  if (tag === 'p' && !inner.replace(/<br>/g, '').trim()) return '';
  return `<${tag}>${inner}</${tag}>`;
}

/**
 * HTML permitido en el editor: párrafos, negrita, cursiva, subrayado, listas y
 * enlaces http(s), mailto, tel o internos. Todo lo demás se descarta (también
 * lo que se pegue desde otro sitio).
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return Array.from(tpl.content.childNodes).map(cleanNode).join('').trim();
}

/** Editor visual (WYSIWYG) de un párrafo: lo que ves es lo que se publica. */
export default function RichText({ html, onChange, readOnly, label, placeholder }: { html: string; onChange: (html: string) => void; readOnly: boolean; label: string; placeholder?: string }) {
  const t = useTranslations('demoCms.rich');
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string | null>(null);
  const range = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [linkError, setLinkError] = useState(false);
  const [empty, setEmpty] = useState(!html.trim());
  const urlId = useId();

  // Solo se reescribe el DOM cuando el cambio viene de afuera (IA, restaurar versión, idioma).
  useEffect(() => {
    if (!ref.current || html === last.current) return;
    ref.current.innerHTML = sanitizeHtml(html);
    last.current = html;
    setEmpty(!html.trim());
  }, [html]);

  const emit = () => {
    if (!ref.current) return;
    const clean = sanitizeHtml(ref.current.innerHTML);
    last.current = clean;
    setEmpty(!clean);
    onChange(clean);
  };

  const exec = (cmd: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    emit();
  };

  const openLink = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) range.current = sel.getRangeAt(0).cloneRange();
    else range.current = null;
    setUrl('/');
    setLinkError(false);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = url.trim();
    if (!isSafeHref(href)) {
      setLinkError(true);
      return;
    }
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && range.current) {
      sel.removeAllRanges();
      sel.addRange(range.current);
    }
    if (!range.current || range.current.collapsed) {
      document.execCommand('insertHTML', false, `<a href="${escapeHtml(href)}">${escapeHtml(href)}</a>`);
    } else {
      document.execCommand('createLink', false, href);
    }
    setLinkOpen(false);
    emit();
  };

  const tools = [
    { id: 'bold', icon: BoldIcon, run: () => exec('bold') },
    { id: 'italic', icon: ItalicIcon, run: () => exec('italic') },
    { id: 'bullets', icon: ListBulletIcon, run: () => exec('insertUnorderedList') },
    { id: 'numbers', icon: NumberedListIcon, run: () => exec('insertOrderedList') },
    { id: 'link', icon: LinkIcon, run: openLink },
    { id: 'clear', icon: XMarkIcon, run: () => (exec('removeFormat'), exec('unlink')) },
  ] as const;

  return (
    <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-pink-500">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-slate-200 dark:border-slate-700" role="toolbar" aria-label={t('toolbar')}>
          {tools.map(({ id, icon: Icon, run }) => (
            <button
              key={id}
              type="button"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              onMouseDown={(e) => e.preventDefault()}
              onClick={run}
              aria-label={t(id)}
              title={t(id)}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}
      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <label className="sr-only" htmlFor={urlId}>
            {t('linkUrl')}
          </label>
          <input
            id={urlId}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setLinkError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
            }}
            className={`${inputCls} flex-1 min-w-[10rem] py-1`}
            placeholder="/sedes"
            autoFocus
          />
          <button type="button" className={btn.small} onClick={applyLink}>
            {t('linkApply')}
          </button>
          <button type="button" className={btn.small} onClick={() => setLinkOpen(false)}>
            {t('linkCancel')}
          </button>
          <p className={`basis-full text-[11px] ${linkError ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>{linkError ? t('linkInvalid') : t('linkHint')}</p>
        </div>
      )}
      <div className="relative">
        {empty && placeholder && <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">{placeholder}</span>}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onFocus={() => document.execCommand('defaultParagraphSeparator', false, 'p')}
          onInput={emit}
          onPaste={(e) => {
            // Se pega como texto plano (sin estilos ni scripts de otros sitios).
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          className="cms-rich min-h-[5rem] px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none [&_a]:text-pink-700 dark:[&_a]:text-pink-300 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
        />
      </div>
    </div>
  );
}
