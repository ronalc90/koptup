'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, CodeBracketSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { isTrigger, typeKey } from './lib/catalog';
import { fmtWhen } from './lib/format';
import { AutomationProvider, useAutomation } from './lib/store';
import type { RunRecord, StepType } from './lib/types';
import { ReviewCard, UsageCard, VersionsCard } from './components/Cards';
import CodeEditorModal from './components/CodeEditorModal';
import DemoBar from './components/DemoBar';
import ExecutionLogs from './components/ExecutionLogs';
import FlowJsonModal from './components/FlowJsonModal';
import NodeInspector from './components/NodeInspector';
import NodePalette from './components/NodePalette';
import ReviewModal from './components/ReviewModal';
import TemplatesModal from './components/TemplatesModal';
import TopBar from './components/TopBar';
import WorkflowCanvas from './components/WorkflowCanvas';
import { ConfirmDialog, PromptDialog, Toasts, btnLink, focusRing } from './components/ui';

export default function AutomationDemoPage() {
  const t = useTranslations('demoAutomation.shell');
  return (
    <div className="flex min-h-screen flex-col bg-secondary-950 text-secondary-100">
      <AutomationProvider
        fallback={
          <div className="flex flex-1 flex-col">
            <div className="border-b border-secondary-800 px-3 py-1.5 text-[11px] sm:px-5">
              <Link href="/demo" className={`inline-flex items-center gap-1 rounded font-medium text-secondary-300 hover:text-white ${focusRing}`}>
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                {t('back')}
              </Link>
            </div>
            <p role="status" className="flex flex-1 items-center justify-center p-10 text-sm text-secondary-400">
              {t('loading')}
            </p>
          </div>
        }
      >
        <Workspace />
      </AutomationProvider>
    </div>
  );
}

type Panel = 'palette' | 'inspector' | null;

function firstEditable(steps: { id: string }[]): string | null {
  return steps[1]?.id ?? steps[0]?.id ?? null;
}

function Workspace() {
  const t = useTranslations('demoAutomation');
  const { s, wf, now, loc, msg, addStep, replaceTrigger, moveStep, removeStep, saveVersion, run, toast, live } = useAutomation();
  const [selectedId, setSelectedId] = useState<string | null>(() => firstEditable(wf.steps));
  const [panel, setPanel] = useState<Panel>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [codeStep, setCodeStep] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingTrigger, setPendingTrigger] = useState<StepType | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Al cambiar de flujo (o si el paso elegido ya no existe) se elige otro.
  useEffect(() => {
    setSelectedId((cur) => (cur && wf.steps.some((x) => x.id === cur) ? cur : firstEditable(wf.steps)));
  }, [wf.id, wf.steps]);

  // Paneles del celular: Escape cierra y el foco entra al panel.
  useEffect(() => {
    if (!panel) return;
    panelRef.current?.querySelector<HTMLElement>('button, input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [panel]);

  const isMobile = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1023px)').matches;

  const focusNode = (id: string) => {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-step-id="${id}"]`);
      el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  };

  const insertStep = (type: StepType, index?: number) => {
    if (isTrigger(type)) {
      if (wf.steps[0]?.type === type) {
        toast(t('toasts.sameTrigger'), 'info');
        return;
      }
      setPendingTrigger(type);
      return;
    }
    const selectedIndex = wf.steps.findIndex((x) => x.id === selectedId);
    const id = addStep(type, index ?? (selectedIndex >= 0 ? selectedIndex + 1 : wf.steps.length));
    if (!id) return;
    setSelectedId(id);
    setPanel(null);
    toast(t('toasts.stepAdded', { name: t(`types.${typeKey(type)}.name`) }));
    focusNode(id);
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id && isMobile()) setPanel('inspector');
  };

  const lastRun = s.runs.find((r) => r.workflowId === wf.id);

  const replay = (r: RunRecord) => {
    run({ sampleId: r.sampleId, source: 'replay', sourceRun: r.id });
  };

  const inspector = (
    <NodeInspector
      key={`${wf.id}-${selectedId}`}
      stepId={selectedId}
      onSelect={(id) => setSelectedId(id)}
      onOpenCode={(id) => {
        setPanel(null);
        setCodeStep(id);
      }}
    />
  );

  return (
    <>
      <DemoBar />
      <TopBar onOpenPalette={() => setPanel('palette')} onOpenInspector={() => setPanel('inspector')} onOpenTemplates={() => setTemplatesOpen(true)} onSaveVersion={() => setSaving(true)} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-secondary-800 bg-secondary-900/50 lg:flex" aria-label={t('palette.title')}>
          <NodePalette onAdd={(type) => insertStep(type)} disabled={live.running} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="p-3">
            <WorkflowCanvas
              steps={wf.steps}
              selectedId={selectedId}
              onSelect={select}
              live={live}
              onDropNew={(type, index) => insertStep(type, index)}
              onMove={(id, index) => moveStep(id, index)}
              onDelete={(id) => {
                const idx = wf.steps.findIndex((x) => x.id === id);
                removeStep(id);
                setSelectedId(wf.steps[idx - 1]?.id ?? null);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 px-3 pb-3 md:grid-cols-3">
            <UsageCard />
            <VersionsCard onSave={() => setSaving(true)} />
            <ReviewCard onOpen={() => setReviewOpen(true)} />
          </div>

          <div className="h-[380px] shrink-0 border-t border-secondary-800 lg:h-[340px]">
            <ExecutionLogs onReplay={replay} />
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 flex-col border-l border-secondary-800 bg-secondary-900/50 lg:flex" aria-label={t('inspector.title')}>
          {inspector}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-secondary-800 bg-secondary-900/80 px-3 py-2 text-[11px] text-secondary-400 sm:px-5">
        <span className="min-w-0 truncate">
          {lastRun
            ? t('footer.lastRun', { when: fmtWhen(lastRun.startedAt, now, loc), id: lastRun.id, status: t(`logs.statuses.${lastRun.status}`) })
            : t('footer.noRuns')}
        </span>
        <button type="button" onClick={() => setJsonOpen(true)} className={btnLink}>
          <CodeBracketSquareIcon className="h-3.5 w-3.5" />
          {t('footer.json')}
        </button>
      </footer>

      {panel && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[90] flex lg:hidden" role="dialog" aria-modal="true" aria-label={panel === 'palette' ? t('palette.title') : t('inspector.title')}>
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 bg-black/60" onClick={() => setPanel(null)} />
          <div ref={panelRef} className={`relative flex h-full w-[86%] max-w-sm flex-col border-secondary-800 bg-secondary-900 ${panel === 'inspector' ? 'ml-auto border-l' : 'border-r'}`}>
            <div className="flex items-center justify-between border-b border-secondary-800 px-3 py-2">
              <span className="text-xs font-semibold text-secondary-200">{panel === 'palette' ? t('palette.title') : t('inspector.title')}</span>
              <button type="button" onClick={() => setPanel(null)} aria-label={t('common.close')} className={`rounded p-1 text-secondary-300 hover:bg-secondary-800 ${focusRing}`}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">{panel === 'palette' ? <NodePalette onAdd={(type) => insertStep(type)} disabled={live.running} /> : inspector}</div>
          </div>
        </div>
      )}

      <TemplatesModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} onCreated={() => setSelectedId(null)} />
      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
      <FlowJsonModal open={jsonOpen} onClose={() => setJsonOpen(false)} />
      <CodeEditorModal stepId={codeStep} onClose={() => setCodeStep(null)} />
      <PromptDialog
        open={saving}
        title={t('versions.saveTitle')}
        label={t('versions.noteLabel')}
        initial={t('versions.defaultNote')}
        confirmLabel={t('versions.save')}
        maxLength={120}
        onClose={() => setSaving(false)}
        onConfirm={(note) => {
          saveVersion(note);
          toast(t('versions.savedToast', { n: (wf.versions[wf.versions.length - 1]?.n ?? 0) + 1 }));
        }}
      />
      <ConfirmDialog
        open={pendingTrigger !== null}
        title={t('trigger.title')}
        body={pendingTrigger ? t('trigger.body', { from: wf.steps[0]?.name ?? '—', to: t(`types.${typeKey(pendingTrigger)}.name`) }) : ''}
        confirmLabel={t('trigger.confirm')}
        onClose={() => setPendingTrigger(null)}
        onConfirm={() => {
          if (!pendingTrigger) return;
          const id = replaceTrigger(pendingTrigger);
          setSelectedId(id);
          setPanel(null);
          toast(t('toasts.triggerChanged', { name: t(`types.${typeKey(pendingTrigger)}.name`) }));
        }}
      />
      <Toasts />
      <span className="sr-only" aria-live="polite">
        {live.running ? t('run.runningSr') : lastRun ? msg(lastRun.summary) : ''}
      </span>
    </>
  );
}
