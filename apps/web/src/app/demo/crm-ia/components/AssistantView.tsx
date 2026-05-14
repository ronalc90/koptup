'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CONTACTS } from './mockData';

export default function AssistantView() {
  const t = useTranslations('demoCrm');

  const [contactId, setContactId] = useState<number>(CONTACTS[0].id);
  const [objective, setObjective] = useState('followUp');
  const [tone, setTone] = useState('professional');
  const [extraContext, setExtraContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const contact = CONTACTS.find((c) => c.id === contactId) ?? CONTACTS[0];

  const handleGenerate = () => {
    setIsGenerating(true);
    setDraftReady(false);
    setCopied(false);
    setTimeout(() => {
      setIsGenerating(false);
      setDraftReady(true);
    }, 1200);
  };

  const handleCopy = () => {
    const subject = t('assistant.subjectDraft', { company: contact.company });
    const body = t('assistant.bodyDraft', {
      name: contact.name.split(' ')[0],
      company: contact.company,
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${subject}\n\n${body}`).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 dark:text-white">
          {t('assistant.title')}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {t('assistant.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Composer */}
        <div className="lg:col-span-2 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-secondary-900 dark:text-white">
              {t('assistant.emailComposer')}
            </h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                {t('assistant.selectContact')}
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CONTACTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.company}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                  {t('assistant.objective')}
                </label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {(['intro', 'followUp', 'proposal', 'reEngage', 'closing'] as const).map((o) => (
                    <option key={o} value={o}>
                      {t(`assistant.objectives.${o}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                  {t('assistant.tone')}
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {(['professional', 'friendly', 'direct', 'consultative'] as const).map((tn) => (
                    <option key={tn} value={tn}>
                      {t(`assistant.tones.${tn}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                {t('assistant.context')}
              </label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={3}
                placeholder={t('assistant.contextPlaceholder')}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              {!isGenerating && <SparklesIcon className="h-5 w-5" />}
              {isGenerating ? t('assistant.generating') : t('assistant.generate')}
            </Button>

            {draftReady && (
              <div className="mt-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/30 p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="primary" size="sm">
                    {t('assistant.generated')}
                  </Badge>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-white dark:hover:bg-secondary-800 rounded-lg transition-colors"
                      title={t('assistant.copy')}
                    >
                      {copied ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-300" />
                      )}
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="p-1.5 hover:bg-white dark:hover:bg-secondary-800 rounded-lg transition-colors"
                      title={t('assistant.regenerate')}
                    >
                      <ArrowPathIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-300" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">
                      {t('assistant.subject')}
                    </p>
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">
                      {t('assistant.subjectDraft', { company: contact.company })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">
                      {t('assistant.body')}
                    </p>
                    <pre className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {t('assistant.bodyDraft', {
                        name: contact.name.split(' ')[0],
                        company: contact.company,
                      })}
                    </pre>
                  </div>
                </div>
                <Button size="sm" className="mt-4 flex items-center gap-1.5">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {t('assistant.send')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5">
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-yellow-500" />
            {t('assistant.quickActions')}
          </h3>
          <div className="space-y-2">
            {(['summarize', 'nextStep', 'competitor', 'objection'] as const).map((a) => (
              <button
                key={a}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors text-sm text-secondary-700 dark:text-secondary-300"
              >
                {t(`assistant.quickActionItems.${a}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
