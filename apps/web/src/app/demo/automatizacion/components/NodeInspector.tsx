'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { NodeKind } from './types';

interface Props {
  nodeKind: NodeKind | null;
}

type TabKey = 'params' | 'auth' | 'retry' | 'test';

const MOCK_PREVIEW: Record<NodeKind, string> = {
  trigger: `{
  "headers": { "x-signature": "v0=…" },
  "body": {
    "customer_id": "cus_8f2",
    "plan": "PRO",
    "email": "ana@empresa.com"
  }
}`,
  filter: `{ "pass": true, "reason": "plan matches 'PRO'" }`,
  http: `{
  "company": "Empresa SA",
  "industry": "SaaS",
  "employees": 142,
  "score": 87
}`,
  llm: `{
  "summary": "Cuenta PRO de mid-market, alta intención.",
  "next_action": "asignar CSM senior",
  "confidence": 0.92
}`,
  transform: `{
  "name": "Ana García",
  "tier": "PRO",
  "owner_id": "u_45",
  "tags": ["pro", "mid-market"]
}`,
  slack: `{ "ok": true, "channel": "C0XXX", "ts": "1718…" }`,
  subflow: `{ "csm_assigned": "Lucía R.", "playbook": "pro-onboarding" }`,
};

export default function NodeInspector({ nodeKind }: Props) {
  const t = useTranslations('demoAutomation.inspector');
  const tn = useTranslations('demoAutomation.canvas.nodes');
  const [tab, setTab] = useState<TabKey>('params');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  if (!nodeKind) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <p className="text-xs text-secondary-500">{t('empty')}</p>
      </div>
    );
  }

  const runStep = () => {
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      setOutput(MOCK_PREVIEW[nodeKind]);
      setRunning(false);
    }, 700);
  };

  const tabs: TabKey[] = ['params', 'auth', 'retry', 'test'];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-secondary-800">
        <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-wider">
          {t('title')}
        </h3>
        <p className="text-sm text-white font-medium mt-1 truncate">
          {tn(nodeKind)}
        </p>
      </div>

      <div className="flex border-b border-secondary-800 bg-secondary-950/40">
        {tabs.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 px-2 py-2 text-[11px] font-medium transition-colors ${
              tab === k
                ? 'text-primary-300 border-b-2 border-primary-500 bg-secondary-900/60'
                : 'text-secondary-500 hover:text-secondary-200 border-b-2 border-transparent'
            }`}
          >
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'params' && (
          <>
            <Field label={t('fields.name')} value={tn(nodeKind)} />
            {nodeKind === 'http' && (
              <>
                <SelectField
                  label={t('fields.method')}
                  options={['GET', 'POST', 'PUT', 'DELETE']}
                />
                <Field label={t('fields.url')} value="https://api.clearbit.com/v2/companies/find" />
                <CodeField
                  label={t('fields.headers')}
                  value={`{
  "Authorization": "Bearer {{secrets.CLEARBIT}}"
}`}
                />
              </>
            )}
            {nodeKind === 'llm' && (
              <>
                <SelectField
                  label={t('fields.model')}
                  options={['gpt-4o', 'claude-sonnet-4', 'llama-3.1-70b']}
                />
                <Field label={t('fields.temperature')} value="0.2" />
                <CodeField
                  label={t('fields.prompt')}
                  value={`Resumí al cliente {{input.email}} en 2 frases y recomendá siguiente acción.`}
                  rows={4}
                />
              </>
            )}
            {nodeKind === 'filter' && (
              <CodeField
                label={t('fields.condition')}
                value="$.body.plan === 'PRO'"
              />
            )}
            {nodeKind === 'slack' && (
              <>
                <Field label={t('fields.channel')} value="#ventas-pro" />
                <CodeField
                  label={t('fields.message')}
                  value="Nuevo cliente PRO: {{llm.summary}}"
                  rows={3}
                />
              </>
            )}
            {nodeKind === 'transform' && (
              <CodeField
                label="map"
                value={`{
  name: input.full_name,
  tier: input.plan,
  owner_id: lookup.csm
}`}
                rows={5}
              />
            )}
            {nodeKind === 'trigger' && (
              <>
                <Field label="path" value="/hooks/onboarding" />
                <SelectField label={t('fields.method')} options={['POST', 'PUT']} />
              </>
            )}
            {nodeKind === 'subflow' && (
              <Field label="ref" value="wf_assign_csm@v3" />
            )}
          </>
        )}

        {tab === 'auth' && (
          <div className="space-y-2">
            <SelectField
              label="provider"
              options={['OAuth2', 'API Key', 'Basic', 'Secret manager']}
            />
            <Field label="credential" value="prod_clearbit_v2" />
            <p className="text-[11px] text-secondary-500 leading-relaxed">
              Credenciales cifradas (KMS). Rotación automática cada 90 días.
            </p>
          </div>
        )}

        {tab === 'retry' && (
          <div className="space-y-3">
            <Field label={t('retry.attempts')} value="5" />
            <SelectField
              label={t('retry.backoff')}
              options={[t('retry.backoffOpts.exponential'), t('retry.backoffOpts.linear')]}
            />
            <div className="rounded-md border border-secondary-800 bg-secondary-900/50 p-2 space-y-1">
              <p className="text-[11px] text-secondary-400 font-medium">
                {t('retry.dlq')}
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-secondary-300 font-mono">
                  dlq:onboarding-failed
                </span>
              </div>
            </div>
            <Field label={t('retry.alert')} value="@oncall-platform" />
            {/* Backoff visualization */}
            <div>
              <p className="text-[11px] text-secondary-500 mb-1.5">
                visualización backoff
              </p>
              <div className="flex items-end gap-1 h-12">
                {[1, 2, 4, 8, 16].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary-700 to-primary-400 rounded-sm"
                    style={{ height: `${(v / 16) * 100}%` }}
                    title={`${v}s`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'test' && (
          <div className="space-y-3">
            <button
              onClick={runStep}
              disabled={running}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-colors disabled:opacity-60"
            >
              {nodeKind === 'llm' ? (
                <SparklesIcon className="h-3.5 w-3.5" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5" />
              )}
              {t('test.run')}
            </button>
            <div>
              <p className="text-[11px] text-secondary-500 mb-1">
                {t('test.preview')}
              </p>
              <pre className="text-[11px] bg-secondary-950 border border-secondary-800 rounded-md p-2 text-emerald-300 font-mono overflow-x-auto leading-relaxed min-h-[120px]">
                {running ? '⏳ running…' : output ?? t('test.mockOutput')}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[11px] text-secondary-500 mb-1">
        {label}
      </label>
      <input
        defaultValue={value}
        className="w-full px-2 py-1.5 text-xs bg-secondary-950 border border-secondary-800 rounded-md text-secondary-200 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
      />
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-[11px] text-secondary-500 mb-1">
        {label}
      </label>
      <select className="w-full px-2 py-1.5 text-xs bg-secondary-950 border border-secondary-800 rounded-md text-secondary-200 focus:outline-none focus:ring-1 focus:ring-primary-500">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function CodeField({
  label,
  value,
  rows = 3,
}: {
  label: string;
  value: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[11px] text-secondary-500 mb-1">
        {label}
      </label>
      <textarea
        defaultValue={value}
        rows={rows}
        className="w-full px-2 py-1.5 text-[11px] bg-secondary-950 border border-secondary-800 rounded-md text-emerald-300 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono leading-relaxed resize-none"
      />
    </div>
  );
}
