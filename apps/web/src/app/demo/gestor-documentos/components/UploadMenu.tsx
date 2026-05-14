'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  CloudArrowUpIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  Squares2X2Icon,
  CloudIcon,
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface UploadMenuProps {
  onLocalUpload: () => void;
  className?: string;
}

type ChannelKey = 'email' | 'scan' | 'office' | 'drive' | 'api';

/**
 * Desplegable de subida con 5 canales de ingesta multi-canal + el upload local clásico.
 */
export default function UploadMenu({ onLocalUpload, className = '' }: UploadMenuProps) {
  const t = useTranslations('demoDocsPro');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const vaultEmail = 'vault-abc123@koptup.com';

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(vaultEmail);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const channels: Array<{ key: ChannelKey; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'email', icon: EnvelopeIcon },
    { key: 'scan', icon: DevicePhoneMobileIcon },
    { key: 'office', icon: Squares2X2Icon },
    { key: 'drive', icon: CloudIcon },
    { key: 'api', icon: CodeBracketIcon },
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex">
        <button
          onClick={onLocalUpload}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-l-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          <span className="truncate">{t('uploadMenu.label')}</span>
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="px-2 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-r-lg hover:from-blue-800 hover:to-indigo-800 transition-all shadow-lg border-l border-white/20"
          title={t('uploadMenu.title')}
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 sm:right-auto sm:min-w-[320px] mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50"
        >
          <p className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('uploadMenu.title')}
          </p>
          <p className="px-2 pb-2 text-xs text-slate-500 dark:text-slate-400">
            {t('uploadMenu.subtitle')}
          </p>

          <ul className="space-y-1">
            {channels.map(({ key, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-start gap-3 px-2 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t(`ingesta.channels.${key}.name`)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t(`ingesta.channels.${key}.desc`)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              {t('ingesta.emailLabel')}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 min-w-0 px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 break-all">
                {vaultEmail}
              </code>
              <button
                type="button"
                onClick={copyEmail}
                className="shrink-0 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
              >
                {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                {copied ? t('ingesta.copied') : t('ingesta.copy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
