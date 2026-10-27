'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, CheckIcon, ClipboardDocumentIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { DEMO_WEBHOOK_SECRET } from '../lib/data';
import { acts } from '../lib/logic';
import { downloadJson } from '../lib/files';
import { hmacSha256Hex } from '../lib/sha256';
import { useFirma } from '../lib/store';
import type { Envelope } from '../lib/types';
import { Panel, SimNote, focusRing, labelCls, selectCls } from './ui';

const API = 'https://api.tu-empresa.example/v1';

function payload(env: Envelope, title: string) {
  return {
    subject: title,
    document: env.doc.kind === 'upload' ? { name: env.doc.fileName, sha256: env.doc.hash } : { template: env.doc.templateId, variables: env.doc.vars, sha256: env.doc.hash },
    signing_order: env.mode,
    authentication: env.auth,
    signature_type: env.sigType,
    expires_in_days: env.expiryDays,
    reminder_every_days: env.reminderDays,
    timestamp: env.timestamp,
    signers: env.signers.map((s, i) => ({ order: i + 1, name: s.name, email: s.email, phone: s.phone || undefined, channel: s.channel, role: s.role })),
    fields: env.fields.map((f) => ({ type: f.type, signer: env.signers.findIndex((s) => s.id === f.signerId) + 1, page: 1, x_pct: f.x, y_pct: f.y })),
  };
}

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('demoSign.common');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 1800);
    return () => window.clearTimeout(id);
  }, [done]);
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    setDone(document.execCommand('copy'));
    ta.remove();
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-secondary-300 hover:bg-white/10 hover:text-white ${focusRing}`}
      onClick={() => {
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => setDone(true)).catch(fallback);
        else fallback();
      }}
    >
      {done ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
      {done ? t('copied') : t('copy')}
    </button>
  );
}

function Code({ code, label }: { code: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-800 bg-secondary-950 text-secondary-100">
      <div className="flex items-center justify-between border-b border-secondary-800 px-3 py-1.5 text-[11px] uppercase tracking-wider text-secondary-400">
        <span>{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-xs leading-relaxed">
        <code className="whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export default function Developers() {
  const t = useTranslations('demoSign');
  const { s, focusEnv, setFocusEnv, envTitle, go, toast } = useFirma();
  const [lang, setLang] = useState<'curl' | 'ts' | 'python'>('ts');
  const options = [...s.envelopes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const env = options.find((e) => e.id === focusEnv) ?? options[0];
  if (!env) return null;

  const title = envTitle(env);
  const body = JSON.stringify(payload(env, title), null, 2);
  const code = {
    curl: `curl -X POST ${API}/envelopes \\\n  -H "Authorization: Bearer $API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body.replace(/'/g, "'\\''")}'`,
    ts: `const res = await fetch('${API}/envelopes', {\n  method: 'POST',\n  headers: {\n    Authorization: \`Bearer \${process.env.API_KEY}\`,\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify(${body.replace(/\n/g, '\n  ')}),\n});\nconst envelope = await res.json(); // { id, status: 'sent', signing_urls: [...] }`,
    python: `import os, requests\n\nres = requests.post(\n    "${API}/envelopes",\n    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},\n    json=${body.replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None').replace(/\n/g, '\n    ')},\n)\nprint(res.json()["id"])`,
  }[lang];

  const eventName = env.status === 'completed' ? 'envelope.completed' : env.status === 'voided' ? 'envelope.voided' : env.status === 'expired' ? 'envelope.expired' : 'envelope.sent';
  const hook = JSON.stringify(
    {
      event: eventName,
      envelope_id: env.id,
      status: env.status,
      occurred_at: `${env.updatedAt}-05:00`,
      document_sha256: env.doc.hash,
      last_event_hash: env.events.length ? env.events[env.events.length - 1].hash : null,
      signers: env.signers.filter(acts).map((x) => ({ name: x.name, state: x.state, signed_at: x.signedAt ? `${x.signedAt}-05:00` : null })),
    },
    null,
    2,
  );
  const signature = hmacSha256Hex(DEMO_WEBHOOK_SECRET, hook);
  const verifyCode = `import crypto from 'node:crypto';\n\nconst expected = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET)\n  .update(rawBody)\n  .digest('hex');\nconst ok = crypto.timingSafeEqual(\n  Buffer.from(expected),\n  Buffer.from(req.headers['x-signature'].replace('sha256=', '')),\n);`;

  return (
    <div className="space-y-5">
      <Panel title={t('dev.title')} subtitle={t('dev.subtitle')}>
        <div className="mb-4 max-w-xl">
          <label htmlFor="dev-env" className={labelCls}>
            {t('dev.pick')}
          </label>
          <select id="dev-env" className={selectCls} value={env.id} onChange={(e) => setFocusEnv(e.target.value)}>
            {options.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} · {envTitle(e)} ({t(`status.${e.status}`)})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <div role="tablist" aria-label={t('dev.langLabel')} className="flex flex-wrap gap-1">
              {(['curl', 'ts', 'python'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={lang === k}
                  onClick={() => setLang(k)}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${focusRing} ${
                    lang === k ? 'bg-lime-700 text-white' : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'
                  }`}
                >
                  {t(`dev.langs.${k}`)}
                </button>
              ))}
            </div>
            <Code code={code} label={t('dev.createLabel')} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadJson(`${env.id}.json`, payload(env, title));
                toast(t('dev.jsonDone', { id: env.id }));
              }}
            >
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('dev.downloadJson')}
            </Button>
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold">{t('dev.webhookTitle')}</p>
            <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('dev.webhookHelp', { event: eventName })}</p>
            <Code code={`POST https://tu-sistema.example/webhooks/firma\nX-Signature: sha256=${signature}\n\n${hook}`} label={t('dev.webhookLabel')} />
            <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('dev.hmacHelp', { secret: DEMO_WEBHOOK_SECRET })}</p>
            <Code code={verifyCode} label={t('dev.verifyLabel')} />
          </div>
        </div>
      </Panel>

      <Panel title={t('dev.embedTitle')} subtitle={t('dev.embedSubtitle')}>
        <div className="max-w-xl rounded-xl border-2 border-dashed border-lime-300 p-4 dark:border-lime-800">
          <div className="rounded-lg bg-white p-4 shadow-md dark:bg-secondary-800">
            <div className="flex items-center gap-2 border-b border-secondary-200 pb-2 text-xs text-secondary-500 dark:border-secondary-700">
              <LockClosedIcon className="h-4 w-4 text-emerald-600" /> firma.tu-empresa.example/embed/{env.id}
            </div>
            <p className="mt-3 break-words text-sm font-medium">{title}</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 w-11/12 rounded bg-secondary-200 dark:bg-secondary-700" />
              <div className="h-2 w-4/5 rounded bg-secondary-200 dark:bg-secondary-700" />
            </div>
            <Button size="sm" className="mt-3" disabled={env.status !== 'sent' && env.status !== 'partial'} onClick={() => go('signer', { envId: env.id, signerId: '' })}>
              {t('dev.embedOpen')}
            </Button>
            {env.status !== 'sent' && env.status !== 'partial' && <p className="mt-1 text-xs text-secondary-500">{t('dev.embedClosed')}</p>}
          </div>
        </div>
      </Panel>
      <SimNote>{t('dev.simNote')}</SimNote>
    </div>
  );
}
