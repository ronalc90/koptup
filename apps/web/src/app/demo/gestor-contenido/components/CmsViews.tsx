'use client';

import { BlocksPanel, DamPanel, WorkflowPanel, MultisitePanel, WorkflowStep, SiteKey } from './CmsProShared';

export function BlocksView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow p-6">
        <BlocksPanel />
      </div>
    </div>
  );
}

export function DamView() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow p-6">
        <DamPanel />
      </div>
    </div>
  );
}

export function WorkflowView({
  current,
  onChange,
  site,
}: {
  current: WorkflowStep;
  onChange: (s: WorkflowStep) => void;
  site: SiteKey;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6">
          <WorkflowPanel current={current} onChange={onChange} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6">
          <MultisitePanel site={site} />
        </div>
      </div>
    </div>
  );
}
