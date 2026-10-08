'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { COMPANY, SITE_CITY } from '../lib/catalog';
import { makePdf } from '../lib/pdf';
import { liquidate, type Period } from '../lib/payroll';
import { examDue, vacationBalance } from '../lib/selectors';
import { useHr } from '../lib/store';
import type { Candidate, Employee, Novelty } from '../lib/types';
import { useFmt, usePos } from './ui';

const safe = (s: string) => s.normalize('NFD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();

/** Arma y descarga los PDF de la demo con los textos del idioma activo. */
export function useDocuments() {
  const t = useTranslations('demoHrms.pdf');
  const pos = usePos();
  const tc = useTranslations('demoHrms.contracts');
  const te = useTranslations('demoHrms.education');
  const tsrc = useTranslations('demoHrms.sources');
  const { state } = useHr();
  const f = useFmt();
  const hr = state.employees.find((e) => e.positionId === 'hrHead');
  const signature = useMemo(() => (hr ? { name: hr.name, role: t('hrHeadRole') } : undefined), [hr, t]);

  const run = useCallback(async (job: () => Promise<void>, ok: string) => {
    try {
      await job();
      toast.success(ok);
    } catch {
      toast.error(t('error'));
    }
  }, [t]);

  const certificate = useCallback(
    (e: Employee, withSalary: boolean) =>
      run(async () => {
        const retired = e.status === 'retired';
        const proc = state.processes.find((p) => p.kind === 'out' && p.employeeId === e.id);
        const body = t(retired ? 'cert.bodyRetired' : 'cert.body', {
          company: COMPANY.name,
          nit: COMPANY.nitFormatted,
          name: e.name,
          doc: e.docId,
          joined: f.date(e.joined, 'long'),
          until: proc && proc.kind === 'out' ? f.date(proc.lastDay, 'long') : '',
          contract: tc(e.contract).toLowerCase(),
          end: e.contractEnd && !retired ? t('cert.endPart', { date: f.date(e.contractEnd, 'long') }) : '',
          position: pos(e),
          salary: withSalary ? t('cert.salaryPart', { salary: f.money(e.salary) }) : '',
        });
        await makePdf({
          filename: `certificado-laboral-${safe(e.name)}.pdf`,
          title: t('cert.title'),
          sample: t('sample'),
          sections: [{ paragraphs: [t('cert.intro'), body, t('cert.closing', { city: SITE_CITY[e.site], date: f.date(state.baseDate, 'long') })] }],
          signature,
          footer: t('footer'),
        });
      }, t('cert.done', { name: e.name })),
    [run, state, t, tc, pos, f, signature],
  );

  const payslip = useCallback(
    (e: Employee, novelties: Novelty[], period: Period, periodLabel: string) =>
      run(async () => {
        const l = liquidate(e, novelties, period);
        const rows: [string, number, number][] = [
          [l.apprentice ? t('slip.support') : t('slip.salary'), l.salary, 0],
          [t('slip.transport'), l.transport, 0],
          [t('slip.overtime'), l.overtime, 0],
          [t('slip.commission'), l.commission, 0],
          [t('slip.health'), 0, l.health],
          [t('slip.pension'), 0, l.pension],
          [t('slip.fsp'), 0, l.fsp],
          [t('slip.withholding'), 0, l.withholding],
        ];
        const visible = rows.filter(([, a, b]) => a !== 0 || b !== 0);
        await makePdf({
          filename: `desprendible-${period.id}-${safe(e.name)}.pdf`,
          title: t('slip.title'),
          subtitle: periodLabel,
          sample: t('sample'),
          sections: [
            {
              rows: [
                [t('slip.employee'), e.name],
                [t('slip.doc'), e.docId],
                [t('slip.position'), pos(e)],
                [t('slip.monthly'), f.money(e.salary)],
                [t('slip.days'), String(l.days)],
                [t('slip.payDate'), f.date(period.payDate, 'long')],
                [t('slip.account'), `${e.bank} ****${e.account.slice(-4)}`],
              ],
            },
            {
              heading: t('slip.detail'),
              table: {
                head: [t('slip.concept'), t('slip.earned'), t('slip.deducted')],
                rows: [
                  ...visible.map(([k, a, b]) => [k, a ? f.money(a) : '', b ? f.money(b) : '']),
                  [t('slip.totals'), f.money(l.earned), f.money(l.deductions)],
                  [t('slip.net'), f.money(l.net), ''],
                ],
                bold: [visible.length, visible.length + 1],
              },
            },
          ],
          footer: t('slip.footer'),
        });
      }, t('slip.done', { name: e.name })),
    [run, t, pos, f],
  );

  const record = useCallback(
    (e: Employee, kind: 'contract' | 'affiliations' | 'exam') =>
      run(async () => {
        const bal = vacationBalance(state, e);
        const rows: Record<typeof kind, [string, string][]> = {
          contract: [
            [t('rec.employee'), e.name],
            [t('rec.doc'), e.docId],
            [t('rec.position'), pos(e)],
            [t('rec.contract'), tc(e.contract)],
            [t('rec.joined'), f.date(e.joined, 'long')],
            [t('rec.end'), e.contractEnd ? f.date(e.contractEnd, 'long') : t('rec.noEnd')],
            [t('rec.salary'), f.money(e.salary)],
            [t('rec.site'), SITE_CITY[e.site]],
            [t('rec.vacation'), t('rec.vacationValue', { n: f.num(bal.balance) })],
          ],
          affiliations: [
            [t('rec.employee'), e.name],
            [t('rec.eps'), e.eps],
            [t('rec.afp'), e.afp],
            [t('rec.arl'), `${COMPANY.arl} - ${t('rec.riskClass', { n: e.arlClass })}`],
            [t('rec.ccf'), e.ccf],
          ],
          exam: [
            [t('rec.employee'), e.name],
            [t('rec.position'), pos(e)],
            [t('rec.lastExam'), f.date(e.lastExam, 'long')],
            [t('rec.nextExam'), f.date(examDue(e), 'long')],
            [t('rec.examResult'), t('rec.examFit')],
          ],
        };
        await makePdf({
          filename: `${kind}-${safe(e.name)}.pdf`,
          title: t(`rec.${kind}Title`),
          sample: t('sample'),
          sections: [{ rows: rows[kind] }, { paragraphs: [t(`rec.${kind}Note`)] }],
          footer: t('footer'),
        });
      }, t('rec.done')),
    [run, state, t, pos, tc, f],
  );

  const cv = useCallback(
    (c: Candidate, vacancyLabel: string, scoreRows: [string, string][]) =>
      run(async () => {
        await makePdf({
          filename: `hoja-de-vida-${safe(c.name)}.pdf`,
          title: t('cv.title'),
          subtitle: `${c.name} - ${vacancyLabel}`,
          sample: t('sample'),
          sections: [
            {
              rows: [
                [t('cv.phone'), c.phone],
                [t('cv.education'), te(c.education)],
                [t('cv.years'), t('cv.yearsValue', { n: c.years })],
                [t('cv.shifts'), c.shifts ? t('cv.yes') : t('cv.no')],
                [t('cv.distance'), `${c.distanceKm} km`],
                [t('cv.source'), tsrc(c.source)],
                [t('cv.applied'), f.date(c.appliedOn, 'long')],
              ],
            },
            { heading: t('cv.score'), rows: scoreRows },
          ],
          footer: t('footer'),
        });
      }, t('cv.done')),
    [run, t, te, tsrc, f],
  );

  return { certificate, payslip, record, cv };
}
