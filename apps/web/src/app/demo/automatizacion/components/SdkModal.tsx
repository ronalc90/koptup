'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useModalClose } from '@/hooks/useModalClose';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SNIPPET = `import { defineNode, z } from '@platform/sdk';

export default defineNode({
  id: 'hubspot.upsertContact',
  category: 'actions',
  inputs: z.object({
    email: z.string().email(),
    properties: z.record(z.string()).optional(),
  }),
  outputs: z.object({
    id: z.string(),
    created: z.boolean(),
  }),
  async run({ input, secrets, log }) {
    log.info('Upserting contact', { email: input.email });
    const res = await fetch('https://api.hubspot.com/contacts/v1/contact', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secrets.HUBSPOT },
      body: JSON.stringify(input),
    });
    return res.json();
  },
});`;

export default function SdkModal({ open, onClose }: Props) {
  const t = useTranslations('demoAutomation.sdk');
  useModalClose(open, onClose);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sdk-modal-title"
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative z-50 bg-secondary-900 border border-secondary-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-secondary-800">
          <div>
            <h2 id="sdk-modal-title" className="text-base font-semibold text-white">{t('title')}</h2>
            <p className="text-xs text-secondary-500">{t('subtitle')}</p>
          </div>
          <button onClick={onClose} aria-label={t('close')} className="text-secondary-500 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs text-secondary-400 mb-1.5">{t('install')}</p>
            <pre className="text-[12px] bg-secondary-950 border border-secondary-800 rounded-md p-3 text-sky-300 font-mono">
              npm install @platform/sdk
            </pre>
          </div>

          <div>
            <p className="text-xs text-secondary-400 mb-1.5">{t('snippet')}</p>
            <pre className="text-[11px] bg-secondary-950 border border-secondary-800 rounded-md p-3 text-emerald-300 font-mono leading-relaxed overflow-x-auto">
              {SNIPPET}
            </pre>
          </div>

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300"
          >
            {t('docs')}
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
