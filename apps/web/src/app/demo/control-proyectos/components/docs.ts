'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { downloadBlob, memberById, milestoneStats, slugify, type WeeklyReport } from '../lib/engine';
import { makePdf, type PdfDoc } from '../lib/pdf';
import { formatNit } from '../lib/seed';
import { uploadedFiles, useDemo } from '../lib/store';
import type { Attachment, HistoryEntry, Milestone, Priority, StatusId, Task } from '../lib/types';
import { useFmt, useStatusLabel } from './ui';

/** Texto legible de una entrada del historial (con estados, prioridades y fechas traducidos). */
export function useHistoryText() {
  const t = useTranslations('demoProjectsPro.history');
  const tp = useTranslations('demoProjectsPro.priority');
  const label = useStatusLabel();
  const f = useFmt();
  const { state } = useDemo();
  return useCallback(
    (h: HistoryEntry) => {
      const p = h.params ?? {};
      const params: Record<string, string> = { ...p };
      if (p.status) params.status = label(state.sector, p.status as StatusId);
      if (p.priority) params.priority = tp(p.priority as Priority);
      if (p.date) params.date = f.date(p.date, 'short');
      return t(h.key, { ...params, actor: h.actor || t('automation') });
    },
    [t, tp, label, f, state.sector],
  );
}

export function useDocs() {
  const t = useTranslations('demoProjectsPro.docs');
  const th = useTranslations('demoProjectsPro.health');
  const f = useFmt();
  const label = useStatusLabel();
  const { ws, state, today } = useDemo();

  const head = useCallback(
    () => ({
      company: ws.company.name,
      companyLine: t('companyLine', { nit: formatNit(ws.company.nit), city: ws.company.city }),
      sample: t('sample'),
    }),
    [ws.company, t],
  );

  const downloadAttachment = useCallback(
    async (task: Task, att: Attachment) => {
      if (att.source === 'upload') {
        const file = uploadedFiles.get(att.id);
        if (!file) {
          toast.error(t('uploadGone'));
          return;
        }
        downloadBlob(file, att.name, file.type || 'application/octet-stream');
        return;
      }
      const project = ws.projects.find((p) => p.id === task.projectId)!;
      const ms = ws.milestones.find((m) => m.id === task.milestoneId);
      const who = memberById(ws, task.assigneeId);
      const kind = att.doc ?? 'informe';
      const sections: PdfDoc['sections'] = [
        {
          rows: [
            [t('project'), project.name],
            [t('client'), `${project.client} (${project.clientContact})`],
            [t('task'), task.title],
            [t('milestone'), ms?.name ?? '—'],
            [t('owner'), who?.name ?? '—'],
            [t('date'), f.date(today, 'long')],
          ],
        },
        { heading: t('descriptionHeading'), paragraphs: [task.description || '—'] },
      ];
      if (task.checklist.length) {
        sections.push({ heading: t('checklistHeading'), bullets: task.checklist.map((c) => `${c.done ? t('done') : t('pending')}: ${c.text}`) });
      }
      if (kind === 'acta' && ms) {
        const tasks = ws.tasks.filter((x) => x.milestoneId === ms.id);
        sections.push({
          heading: t('actaActivities'),
          table: {
            head: [t('activity'), t('status'), t('due')],
            rows: tasks.map((x) => [x.title, label(state.sector, x.status), f.date(x.due, 'short')]),
          },
        });
        const st = milestoneStats(ws, ms, today);
        sections.push({ rows: [[t('milestoneProgress'), `${st.progress} %`]] });
        sections.push({ heading: t('signatures'), paragraphs: [t('signatureLines')] });
      }
      if (kind === 'presupuesto') {
        const list = ws.milestones.filter((m) => m.projectId === project.id);
        sections.push({
          heading: t('budgetHeading'),
          table: {
            head: [t('milestone'), t('budget'), t('billing')],
            rows: [...list.map((m) => [m.name, f.money(m.budget), f.money(m.billing)]), [t('total'), f.money(list.reduce((s, m) => s + m.budget, 0)), f.money(list.reduce((s, m) => s + m.billing, 0))]],
            bold: [list.length],
          },
        });
      }
      if (kind === 'brief') {
        sections.push({ heading: t('briefContext'), paragraphs: [project.description] });
        sections.push({ heading: t('briefDeliverables'), bullets: ws.tasks.filter((x) => x.projectId === project.id && x.clientVisible).map((x) => x.title) });
      }
      if (kind === 'especificacion') {
        const next = ws.tasks.filter((x) => x.dependsOn.includes(task.id));
        if (next.length) sections.push({ heading: t('specDependents'), bullets: next.map((x) => x.title) });
      }
      if (kind === 'fotos' || kind === 'piezas') {
        sections.push({ heading: kind === 'fotos' ? t('photosHeading') : t('piecesHeading'), photos: [1, 2, 3, 4].map((n) => t(kind === 'fotos' ? 'photoCaption' : 'pieceCaption', { n })) });
      }
      await makePdf({
        ...head(),
        filename: att.name.endsWith('.pdf') ? att.name : `${att.name}.pdf`,
        title: t(`kind.${kind}`),
        subtitle: `${task.title} · ${project.name}`,
        sections,
        footer: t('footer'),
      });
    },
    [ws, state.sector, today, t, f, label, head],
  );

  const downloadWeekly = useCallback(
    async (r: WeeklyReport) => {
      const p = r.stats.project;
      await makePdf({
        ...head(),
        filename: `${t('weeklyFile')}-${slugify(p.name)}-${r.to}.pdf`,
        title: t('weeklyTitle', { project: p.name }),
        subtitle: t('weeklyPeriod', { from: f.date(r.from, 'long'), to: f.date(r.to, 'long'), client: p.client }),
        sections: [
          {
            heading: t('weeklySummary'),
            rows: [
              [t('progress'), `${r.stats.progress} %`],
              [t('health'), th(r.stats.health.level)],
              [t('completedWeek'), String(r.completed.length)],
              [t('overdueNow'), String(r.overdue.length)],
              [t('hoursWeek'), f.hours(r.hours)],
              [t('budgetSpent'), `${r.stats.spent} % (${f.money(r.stats.cost)} / ${f.money(r.stats.budget)})`],
            ],
          },
          { heading: t('weeklyCompleted'), bullets: r.completed.length ? r.completed.map((x) => x.title) : [t('none')] },
          { heading: t('weeklyOverdue'), bullets: r.overdue.length ? r.overdue.map((x) => t('overdueLine', { task: x.title, date: f.date(x.due, 'short') })) : [t('none')] },
          { heading: t('weeklyUpcoming'), bullets: r.upcoming.length ? r.upcoming.map((x) => `${f.date(x.due, 'short')}: ${x.title}`) : [t('none')] },
          { heading: t('weeklyApproval'), bullets: r.inClientReview.length ? r.inClientReview.map((x) => x.title) : [t('none')] },
          {
            heading: t('weeklyMilestones'),
            table: {
              head: [t('milestone'), t('end'), t('progress'), t('budgetSpent')],
              rows: r.stats.milestones.map((m) => [m.milestone.name, f.date(m.milestone.end, 'short'), `${m.progress} %`, `${m.spent} %`]),
            },
          },
        ],
        footer: t('footer'),
      });
    },
    [head, t, th, f],
  );

  const weeklyText = useCallback(
    (r: WeeklyReport) => {
      const p = r.stats.project;
      const lines = [
        t('waHello', { name: p.clientContact.split(' ')[0] }),
        t('waIntro', { project: p.name, from: f.date(r.from, 'short'), to: f.date(r.to, 'short') }),
        '',
        t('waProgress', { progress: r.stats.progress, status: th(r.stats.health.level) }),
        t('waCompleted', { count: r.completed.length }),
        ...r.completed.slice(0, 4).map((x) => `- ${x.title}`),
      ];
      if (r.inClientReview.length) {
        lines.push(t('waApproval', { count: r.inClientReview.length }));
        lines.push(...r.inClientReview.map((x) => `- ${x.title}`));
      }
      if (r.upcoming.length) {
        lines.push(t('waUpcoming'));
        lines.push(...r.upcoming.slice(0, 4).map((x) => `- ${f.date(x.due, 'short')}: ${x.title}`));
      }
      if (r.overdue.length) lines.push(t('waOverdue', { count: r.overdue.length }));
      lines.push('', t('waBye', { company: ws.company.name }));
      return lines.join('\n');
    },
    [t, th, f, ws.company.name],
  );

  const downloadInvoice = useCallback(
    async (m: Milestone) => {
      const project = ws.projects.find((p) => p.id === m.projectId)!;
      const iva = Math.round(m.billing * 0.19);
      await makePdf({
        ...head(),
        filename: `${t('invoiceFile')}-${m.invoice?.number ?? 'borrador'}.pdf`,
        title: t('invoiceTitle', { number: m.invoice?.number ?? '' }),
        subtitle: `${project.name} · ${m.name}`,
        sections: [
          {
            rows: [
              [t('client'), project.client],
              [t('contact'), project.clientContact],
              [t('date'), f.date(m.invoice?.on ?? today, 'long')],
            ],
          },
          {
            table: {
              head: [t('concept'), t('value')],
              rows: [
                [t('invoiceConcept', { milestone: m.name }), f.money(m.billing)],
                [t('iva'), f.money(iva)],
                [t('total'), f.money(m.billing + iva)],
              ],
              bold: [2],
            },
          },
          { paragraphs: [t('invoiceNote')] },
        ],
        footer: t('footer'),
      });
    },
    [ws.projects, head, t, f, today],
  );

  return { downloadAttachment, downloadWeekly, weeklyText, downloadInvoice };
}
