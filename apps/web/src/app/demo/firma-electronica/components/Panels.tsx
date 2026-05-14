'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useModalClose } from '@/hooks/useModalClose';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  PlusIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  ArrowRightIcon,
  Bars3BottomLeftIcon,
  PencilSquareIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  MapPinIcon,
  ComputerDesktopIcon,
  CubeTransparentIcon,
} from '@heroicons/react/24/outline';

export const TEMPLATES = [
  { key: 'nda', fields: 6, uses: 142 },
  { key: 'labor', fields: 12, uses: 87 },
  { key: 'service', fields: 9, uses: 64 },
  { key: 'saas', fields: 14, uses: 53 },
  { key: 'consent', fields: 5, uses: 219 },
  { key: 'vendor', fields: 8, uses: 31 },
];

export const INTEGRATIONS = ['salesforce', 'hubspot', 'pipedrive', 'workday', 'greenhouse', 'bamboohr', 'slack', 'googleDrive'];

export const AUDIT_EVENTS = [
  { key: 'created', time: '2026-05-13 09:00:12', ip: '190.85.12.4', device: 'Chrome 124 / macOS', geo: 'Bogotá, CO', hash: '0x9a3f...c2b1' },
  { key: 'sent', time: '2026-05-13 09:00:18', ip: '190.85.12.4', device: 'API', geo: 'Bogotá, CO', hash: '0x4e8d...ff90' },
  { key: 'viewed', time: '2026-05-13 10:14:33', ip: '181.49.55.21', device: 'Safari iOS 17', geo: 'Medellín, CO', hash: '0x77ab...3201' },
  { key: 'authenticated', time: '2026-05-13 10:15:02', ip: '181.49.55.21', device: 'SMS OTP', geo: 'Medellín, CO', hash: '0x2d10...8e44' },
  { key: 'signed', time: '2026-05-13 10:16:41', ip: '181.49.55.21', device: 'Safari iOS 17', geo: 'Medellín, CO', hash: '0xb8c2...19af' },
  { key: 'completed', time: '2026-05-13 10:17:00', ip: 'system', device: 'Platform', geo: '—', hash: '0xeef0...aa12' },
  { key: 'sealed', time: '2026-05-13 10:17:05', ip: 'system', device: 'TSA RFC 3161', geo: '—', hash: '0x5511...bcd9' },
];

export const CODE_SAMPLES = {
  curl: `curl -X POST https://api.koptup.sign/v1/envelopes \\
  -H "Authorization: Bearer $KOPTUP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "subject": "Acuerdo SaaS",
    "documents": [{ "name": "saas.pdf", "data": "<base64>" }],
    "signers": [
      { "email": "ceo@acme.com", "name": "Acme CEO", "order": 1, "auth": "sms" }
    ],
    "fields": [{ "type": "signature", "page": 3, "x": 120, "y": 480 }]
  }'`,
  ts: `import { Koptup } from '@koptup/sign';

const client = new Koptup({ apiKey: process.env.KOPTUP_KEY! });

const envelope = await client.envelopes.create({
  subject: 'Acuerdo SaaS',
  documents: [{ name: 'saas.pdf', file }],
  signers: [
    { email: 'ceo@acme.com', name: 'Acme CEO', order: 1, auth: 'sms' },
  ],
  fields: [{ type: 'signature', page: 3, x: 120, y: 480 }],
});

console.log(envelope.signingUrl);`,
  python: `from koptup import Koptup

client = Koptup(api_key=os.environ["KOPTUP_KEY"])

envelope = client.envelopes.create(
    subject="Acuerdo SaaS",
    documents=[{"name": "saas.pdf", "file": file}],
    signers=[{"email": "ceo@acme.com", "name": "Acme CEO", "order": 1, "auth": "sms"}],
    fields=[{"type": "signature", "page": 3, "x": 120, "y": 480}],
)
print(envelope.signing_url)`,
};

export function TemplatesPanel({ onUse }: { onUse: () => void }) {
  const t = useTranslations('demoSign');
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card variant="bordered">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg">{t('templates.title')}</CardTitle>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('templates.subtitle')}</p>
          </div>
          <Button size="sm" variant="outline">
            <PlusIcon className="w-4 h-4 mr-1" />
            {t('templates.new')}
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => (
            <div
              key={tpl.key}
              className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 hover:shadow-md transition-all bg-white dark:bg-secondary-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center shrink-0">
                  <DocumentTextIcon className="w-5 h-5" />
                </div>
                <Badge variant="outline" size="sm">{tpl.uses} {t('templates.uses')}</Badge>
              </div>
              <h3 className="font-semibold mt-3">{t(`templates.items.${tpl.key}`)}</h3>
              <p className="text-xs text-secondary-500 mt-1">{tpl.fields} {t('templates.fields')}</p>
              <Button size="sm" variant="outline" fullWidth className="mt-3" onClick={onUse}>
                <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                {t('templates.send')}
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <Card variant="bordered">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{t('templates.bulk')}</CardTitle>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('templates.bulkDesc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <CloudArrowUpIcon className="w-4 h-4 mr-1" />
              {t('templates.uploadCsv')}
            </Button>
            <Button size="sm">{t('templates.previewBulk')}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AuditPanel({ blockchainTs }: { blockchainTs: boolean }) {
  const t = useTranslations('demoSign');
  return (
    <Card variant="bordered" className="animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <CardTitle className="text-lg">{t('audit.title')}</CardTitle>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('audit.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline">
          <ShieldCheckIcon className="w-4 h-4 mr-1" />
          {t('audit.downloadCert')}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700">
          <p className="text-xs uppercase text-secondary-500">{t('audit.documentHash')}</p>
          <p className="font-mono text-xs mt-1 break-all">0xa3f1b9c7e4d2…f085921ab</p>
        </div>
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-xs uppercase text-green-700 dark:text-green-300 flex items-center gap-1">
            <CubeTransparentIcon className="w-3 h-3" />
            {t('audit.blockchainTs')}
          </p>
          <p className="text-xs mt-1 text-green-800 dark:text-green-200">{blockchainTs ? t('audit.blockchainEnabled') : t('audit.blockchainDisabled')}</p>
        </div>
      </div>
      <p className="text-xs uppercase tracking-wide text-secondary-500 mb-3">{t('audit.timeline')}</p>
      <ol className="relative border-l-2 border-primary-200 dark:border-primary-900 ml-3 space-y-4">
        {AUDIT_EVENTS.map((ev, idx) => (
          <li key={idx} className="ml-5">
            <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-primary-500 ring-4 ring-white dark:ring-secondary-900" />
            <div className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-semibold">{t(`audit.events.${ev.key}`)}</p>
                <span className="text-xs text-secondary-500">{ev.time}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                <span className="text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" /> {ev.geo}
                </span>
                <span className="text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                  <ComputerDesktopIcon className="w-3 h-3" /> {ev.device}
                </span>
                <span className="text-secondary-500 dark:text-secondary-400 flex items-center gap-1">
                  {t('audit.fields.ip')}: {ev.ip}
                </span>
                <span className="font-mono text-secondary-500 dark:text-secondary-400 truncate" title={ev.hash}>
                  {ev.hash}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function ApiPanel() {
  const t = useTranslations('demoSign');
  const [codeTab, setCodeTab] = useState<'curl' | 'ts' | 'python'>('ts');
  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(CODE_SAMPLES[codeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card variant="bordered" className="animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle className="text-lg">{t('api.title')}</CardTitle>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('api.subtitle')}</p>
      </CardHeader>
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1">
              {(['curl', 'ts', 'python'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCodeTab(c)}
                  className={`px-2.5 py-1 text-xs font-medium rounded ${
                    codeTab === c
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t(`api.tabs.${c}`)}
                </button>
              ))}
            </div>
            <button
              onClick={copyCode}
              className="text-xs font-medium px-2 py-1 rounded text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 inline-flex items-center gap-1"
            >
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              {copied ? t('api.copied') : t('api.copy')}
            </button>
          </div>
          <pre className="text-xs bg-secondary-900 dark:bg-black text-green-300 p-4 rounded-lg overflow-x-auto leading-relaxed font-mono">
            <code>{CODE_SAMPLES[codeTab]}</code>
          </pre>
          <Button variant="outline" size="sm" className="mt-3">
            <CodeBracketIcon className="w-4 h-4 mr-1" />
            {t('api.openDocs')}
          </Button>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">{t('api.embedTitle')}</p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">{t('api.embedDesc')}</p>
          <div className="rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/30 dark:to-secondary-900 p-4">
            <div className="rounded-lg bg-white dark:bg-secondary-800 shadow-md p-4">
              <div className="flex items-center gap-2 pb-3 border-b border-secondary-200 dark:border-secondary-700">
                <LockClosedIcon className="w-4 h-4 text-green-500" />
                <span className="text-xs text-secondary-500">sign.koptup.io/embed/env_003</span>
              </div>
              <div className="py-4 space-y-2">
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
                <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded" />
                <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded w-5/6" />
                <div className="h-10 bg-primary-100 dark:bg-primary-950 rounded mt-3 border border-dashed border-primary-400 flex items-center justify-center text-xs text-primary-700 dark:text-primary-300">
                  {t('signer.signHere')}
                </div>
              </div>
              <Button size="sm" fullWidth>
                <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                {t('signer.continue')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SignerPanel() {
  const t = useTranslations('demoSign');
  return (
    <Card variant="bordered" padding="none" className="overflow-hidden animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs opacity-80">{t('signer.from')}: Acme Corp</p>
            <h2 className="text-lg font-bold mt-0.5">{t('signer.subject')}</h2>
          </div>
          <Badge variant="success" size="sm">
            <LockClosedIcon className="w-3 h-3 mr-1" />
            TLS
          </Badge>
        </div>
      </div>
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('signer.instructions')}</p>
        <div className="aspect-[8.5/11] bg-white dark:bg-secondary-100 rounded-lg shadow-md border border-secondary-200 relative overflow-hidden">
          <div className="absolute inset-0 p-6 text-secondary-700 select-none">
            <h3 className="text-base font-bold">Acuerdo SaaS — Acme</h3>
            <div className="mt-3 space-y-2">
              {[3, 4, 5, 4, 3, 5, 4].map((w, i) => (
                <div key={i} className="h-2 bg-secondary-200 rounded" style={{ width: `${60 + w * 5}%` }} />
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-secondary-400">{t('wizard.steps.fields.types.signature')}</p>
                <div className="h-12 mt-1 border-2 border-dashed border-primary-500 rounded bg-primary-50 flex items-center justify-center text-primary-700 text-xs font-medium">
                  {t('signer.signHere')}
                </div>
              </div>
              <div>
                <p className="text-xs text-secondary-400">{t('wizard.steps.fields.types.date')}</p>
                <div className="h-12 mt-1 border-2 border-dashed border-primary-500 rounded bg-primary-50 flex items-center justify-center text-primary-700 text-xs font-medium">
                  2026-05-14
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm"><PencilSquareIcon className="w-4 h-4 mr-1" /> {t('signer.draw')}</Button>
          <Button variant="outline" size="sm"><Bars3BottomLeftIcon className="w-4 h-4 mr-1" /> {t('signer.type')}</Button>
          <Button variant="outline" size="sm"><CloudArrowUpIcon className="w-4 h-4 mr-1" /> {t('signer.upload')}</Button>
        </div>
        <label className="flex items-start gap-2 mt-4 text-sm">
          <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 accent-primary-600" />
          <span className="text-secondary-700 dark:text-secondary-300">{t('signer.agree')}</span>
        </label>
        <p className="text-xs text-secondary-500 mt-2 flex items-center gap-1">
          <ShieldCheckIcon className="w-3 h-3 text-green-500" />
          {t('signer.secured')}
        </p>
      </div>
      <div className="border-t border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 flex items-center justify-between sticky bottom-0">
        <p className="text-xs text-secondary-500">env_003 · 3/3</p>
        <Button>
          {t('signer.continue')}
          <ArrowRightIcon className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

export function IntegrationsPanel() {
  const t = useTranslations('demoSign');
  return (
    <Card variant="bordered" className="animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle className="text-lg">{t('integrations.title')}</CardTitle>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('integrations.subtitle')}</p>
      </CardHeader>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {INTEGRATIONS.map((k) => (
          <div
            key={k}
            className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:shadow-md hover:border-primary-400 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-700 dark:to-secondary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
              {t(`integrations.items.${k}`).charAt(0)}
            </div>
            <p className="font-medium mt-3 text-sm">{t(`integrations.items.${k}`)}</p>
            <Button size="sm" variant="outline" fullWidth className="mt-3">{t('integrations.connect')}</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AuditModal({ doc, onClose }: { doc: { id: string; name: string }; onClose: () => void }) {
  const t = useTranslations('demoSign');
  useModalClose(true, onClose);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-audit-title"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-50 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-secondary-200 dark:border-secondary-800"
      >
        <div className="p-5 border-b border-secondary-200 dark:border-secondary-800 flex items-start justify-between gap-3">
          <div>
            <h2 id="sign-audit-title" className="text-lg font-bold">{t('audit.title')}</h2>
            <p className="text-sm text-secondary-500">{doc.name} · {doc.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 flex items-center justify-center"
            aria-label={t('audit.close')}
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700">
              <p className="text-xs uppercase text-secondary-500">{t('audit.documentHash')}</p>
              <p className="font-mono text-xs break-all">0xa3f1b9c7…f085921ab</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
              <p className="text-xs uppercase text-green-700 dark:text-green-300">{t('audit.blockchainTs')}</p>
              <p className="text-xs text-green-800 dark:text-green-200">{t('audit.blockchainEnabled')}</p>
            </div>
          </div>
          <ol className="relative border-l-2 border-primary-200 dark:border-primary-900 ml-3 space-y-3 mt-3">
            {AUDIT_EVENTS.map((ev, idx) => (
              <li key={idx} className="ml-5">
                <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-primary-500 ring-4 ring-white dark:ring-secondary-900" />
                <div className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-semibold">{t(`audit.events.${ev.key}`)}</p>
                    <span className="text-xs text-secondary-500">{ev.time}</span>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    {ev.geo} · {ev.device} · IP {ev.ip} · <span className="font-mono">{ev.hash}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="p-4 border-t border-secondary-200 dark:border-secondary-800 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>×</Button>
          <Button size="sm">
            <ShieldCheckIcon className="w-4 h-4 mr-1" />
            {t('audit.downloadCert')}
          </Button>
        </div>
      </div>
    </div>
  );
}
