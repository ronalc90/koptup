'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { isBuiltin, suggestedFields } from '../../lib/data';
import { acts, validateStep, type StepError } from '../../lib/logic';
import { useFirma } from '../../lib/store';
import { Errors, Panel, focusRing } from '../ui';
import StepDocument from './StepDocument';
import StepSigners from './StepSigners';
import StepFields from './StepFields';
import StepSecurity from './StepSecurity';

const STEPS = ['document', 'signers', 'fields', 'security'] as const;

export default function Wizard() {
  const t = useTranslations('demoSign');
  const { s, patchDraft, saveDraft, sendDraft, discardDraft, templateVars, go, toast } = useFirma();
  const d = s.draft;
  const [errors, setErrors] = useState<StepError[]>([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const vars = d.doc?.kind === 'template' ? templateVars(d.doc.templateId) : [];
  const tplId = d.doc?.templateId;
  // Los nombres de las variables faltantes se muestran con su etiqueta.
  const check = (step: number) =>
    validateStep(d, step, vars).map((e) =>
      e.key === 'varsRequired'
        ? { ...e, params: { vars: String(e.params?.vars ?? '').split(', ').map((v) => (isBuiltin(tplId) ? t(`templates.vars.${v}`) : v)).join(', ') } }
        : e,
    );

  const goStep = (n: number) => {
    setErrors([]);
    // Al pasar a "Campos" se quitan los campos de firmantes que ya no firman y se proponen campos si no hay.
    if (n === 2) {
      const valid = d.fields.filter((f) => d.signers.some((x) => x.id === f.signerId && acts(x)));
      patchDraft({ step: n, fields: valid.length ? valid : suggestedFields(d.signers, `f${Date.now() % 100000}-`) });
      return;
    }
    patchDraft({ step: n });
  };

  const next = () => {
    const errs = check(d.step);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    goStep(d.step + 1);
  };

  const send = () => {
    for (let i = 0; i < STEPS.length; i++) {
      const errs = check(i);
      if (errs.length) {
        patchDraft({ step: i });
        setErrors(errs);
        return;
      }
    }
    const id = sendDraft();
    setErrors([]);
    toast(t('wizard.sentToast', { id }));
    go('home');
  };

  const save = () => {
    if (!d.doc) {
      setErrors([{ key: 'docRequired' }]);
      return;
    }
    const id = saveDraft();
    setErrors([]);
    toast(t('wizard.savedToast', { id }));
  };

  return (
    <Panel
      title={d.editingId ? t('wizard.titleEditing', { id: d.editingId }) : t('wizard.title')}
      subtitle={t('wizard.subtitle')}
      actions={
        confirmDiscard ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-secondary-600 dark:text-secondary-300">{t('wizard.discardConfirm')}</span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                discardDraft();
                setErrors([]);
                setConfirmDiscard(false);
                toast(t('wizard.discarded'), 'info');
              }}
            >
              {t('wizard.discardYes')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDiscard(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        ) : d.doc || d.signers.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDiscard(true)}>
            {t('wizard.discard')}
          </Button>
        ) : undefined
      }
    >
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label={t('wizard.stepsLabel')}>
        {STEPS.map((key, idx) => {
          const active = d.step === idx;
          const done = d.step > idx;
          return (
            <li key={key} className="min-w-0">
              <button
                type="button"
                disabled={idx > d.step}
                onClick={() => goStep(idx)}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full min-w-0 flex-col items-center gap-1 rounded-lg p-1 text-center sm:flex-row sm:gap-2 sm:text-left ${focusRing} disabled:cursor-default`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : active
                        ? 'bg-lime-700 text-white ring-4 ring-lime-100 dark:ring-lime-950'
                        : 'bg-secondary-200 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300'
                  }`}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : idx + 1}
                </span>
                <span className={`min-w-0 text-xs font-medium sm:text-sm ${active ? 'text-lime-800 dark:text-lime-300' : 'text-secondary-600 dark:text-secondary-400'}`}>
                  {t(`wizard.steps.${key}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="space-y-4">
        {d.step === 0 && <StepDocument />}
        {d.step === 1 && <StepSigners />}
        {d.step === 2 && <StepFields />}
        {d.step === 3 && <StepSecurity />}
        <Errors errors={errors} />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-secondary-200 pt-4 dark:border-secondary-800 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" disabled={d.step === 0} onClick={() => goStep(Math.max(0, d.step - 1))}>
          <ArrowLeftIcon className="mr-1 h-4 w-4" /> {t('wizard.back')}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" onClick={save}>
            {t('wizard.saveDraft')}
          </Button>
          {d.step < STEPS.length - 1 ? (
            <Button onClick={next}>
              {t('wizard.next')} <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={send}>
              <PaperAirplaneIcon className="mr-1 h-4 w-4" /> {t('wizard.send')}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
