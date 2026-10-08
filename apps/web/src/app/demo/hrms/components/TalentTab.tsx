'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FEMALE, MALE, SITE_CITY } from '../lib/catalog';
import { useHr } from '../lib/store';
import { fitBand, fitScore } from '../lib/talent';
import { STAGES, type Candidate, type CandidateSource, type Education, type Stage } from '../lib/types';
import ProcessesCard from './ProcessesCard';
import { useDocuments } from './useDocuments';
import { Field, Modal, SectionTitle, TabIntro, btn, inputCls, useFmt } from './ui';

const bandCls = {
  high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  mid: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  low: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300',
};

export default function TalentTab() {
  const t = useTranslations('demoHrms.talent');
  const tp = useTranslations('demoHrms.positions');
  const tsrc = useTranslations('demoHrms.sources');
  const { state, dispatch } = useHr();
  const f = useFmt();
  const [vacancy, setVacancy] = useState<string>('all');
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const vac = useMemo(() => new Map(state.vacancies.map((v) => [v.id, v])), [state.vacancies]);
  const list = state.candidates.filter((c) => (vacancy === 'all' || c.vacancyId === vacancy) && !!c.discarded === showDiscarded);
  const discardedCount = state.candidates.filter((c) => c.discarded && (vacancy === 'all' || c.vacancyId === vacancy)).length;
  const current = viewing ? state.candidates.find((c) => c.id === viewing) : undefined;

  const move = (c: Candidate, stage: Stage) => {
    const v = vac.get(c.vacancyId);
    if (stage === 'hired' && v && v.hired >= v.openings) {
      toast.error(t('vacancyFull'));
      return;
    }
    dispatch({ type: 'candidate.move', id: c.id, stage });
    toast.success(stage === 'hired' ? t('hiredToast', { name: c.name }) : t('movedToast', { name: c.name, stage: t(`stages.${stage}`) }));
  };

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle')} />

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button type="button" onClick={() => setVacancy('all')} aria-pressed={vacancy === 'all'} className={`shrink-0 rounded-xl border p-3 text-left w-40 ${vacancy === 'all' ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900'}`}>
          <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t('allVacancies')}</p>
          <p className="text-xs text-secondary-500">{t('openCount', { n: state.vacancies.reduce((a, v) => a + v.openings - v.hired, 0) })}</p>
        </button>
        {state.vacancies.map((v) => (
          <button key={v.id} type="button" onClick={() => setVacancy(v.id)} aria-pressed={vacancy === v.id} className={`shrink-0 rounded-xl border p-3 text-left w-56 ${vacancy === v.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40' : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900'}`}>
            <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{tp(v.positionId)}</p>
            <p className="text-xs text-secondary-500">{SITE_CITY[v.site]} · {t('filled', { hired: v.hired, total: v.openings })}</p>
            <div className="h-1.5 mt-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600" style={{ width: `${(v.hired / v.openings) * 100}%` }} />
            </div>
          </button>
        ))}
      </div>

      <Card variant="bordered">
        <SectionTitle
          title={t('pipeline')}
          subtitle={t('pipelineSub')}
          action={
            <>
              <button type="button" className={btn.outline} onClick={() => setShowDiscarded((s) => !s)}>
                {showDiscarded ? t('hideDiscarded') : t('showDiscarded', { n: discardedCount })}
              </button>
              <button type="button" className={btn.primary} onClick={() => setAdding(true)}>
                <PlusIcon className="w-4 h-4" />
                {t('addCandidate')}
              </button>
            </>
          }
        />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
          {STAGES.map((stage, si) => {
            const items = list.filter((c) => c.stage === stage);
            return (
              <div key={stage} className="shrink-0 w-64 xl:w-auto xl:flex-1 xl:min-w-0 rounded-xl bg-secondary-50 dark:bg-secondary-800/60 p-2">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h4 className="text-sm font-bold text-secondary-900 dark:text-white">{t(`stages.${stage}`)}</h4>
                  <Badge variant="default" size="sm">{items.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {items.map((c) => {
                    const v = vac.get(c.vacancyId)!;
                    const s = fitScore(c, v);
                    return (
                      <div key={c.id} className="rounded-lg bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{c.name}</p>
                            <p className="text-xs text-secondary-500 truncate">{tp(v.positionId)} · {SITE_CITY[v.site]}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${bandCls[fitBand(s.total)]}`} title={t('scoreHint')}>{s.total}</span>
                        </div>
                        <p className="text-[11px] text-secondary-500 mt-1">{tsrc(c.source)} · {f.date(c.appliedOn, 'dayMonth')}</p>
                        <div className="flex gap-1.5 mt-2">
                          <button type="button" className={`${btn.small} flex-1`} onClick={() => setViewing(c.id)}>{t('viewCv')}</button>
                          {!c.discarded && stage !== 'hired' && (
                            <button type="button" className={`${btn.small} flex-1`} onClick={() => move(c, STAGES[si + 1])} title={t('advanceTo', { stage: t(`stages.${STAGES[si + 1]}`) })}>
                              {t('advance')} <ArrowRightIcon className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-secondary-500 mt-2">{t('scoreNote')}</p>
      </Card>

      <ProcessesCard />

      {current && <CandidateModal c={current} onClose={() => setViewing(null)} onMove={move} />}
      {adding && <AddCandidate onClose={() => setAdding(false)} defaultVacancy={vacancy === 'all' ? state.vacancies[0].id : vacancy} />}
    </div>
  );
}

function CandidateModal({ c, onClose, onMove }: { c: Candidate; onClose: () => void; onMove: (c: Candidate, s: Stage) => void }) {
  const t = useTranslations('demoHrms.talent');
  const tp = useTranslations('demoHrms.positions');
  const te = useTranslations('demoHrms.education');
  const tsrc = useTranslations('demoHrms.sources');
  const { state, dispatch } = useHr();
  const f = useFmt();
  const docs = useDocuments();
  const v = state.vacancies.find((x) => x.id === c.vacancyId)!;
  const s = fitScore(c, v);
  const req = v.minYears === 0 ? t('cv.noMin') : t('cv.minYears', { n: v.minYears });
  const scoreRows: [string, string][] = [
    [t('cv.experience'), `${s.experience}/40 (${t('cv.yearsValue', { n: c.years })}; ${req})`],
    [t('cv.education'), `${s.education}/25 (${te(c.education)}; ${t('cv.requires', { x: te(v.education) })})`],
    [t('cv.shifts'), `${s.shifts}/20 (${c.shifts ? t('cv.yes') : t('cv.no')}${v.shifts ? '' : `; ${t('cv.notRequired')}`})`],
    [t('cv.distance'), `${s.distance}/15 (${c.distanceKm} km)`],
    [t('cv.total'), `${s.total}/100`],
  ];

  return (
    <Modal title={c.name} subtitle={`${tp(v.positionId)} · ${SITE_CITY[v.site]} · ${t(`stages.${c.stage}`)}`} onClose={onClose} labelId="hrms-cv-title">
      <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
        {[
          [t('cv.phone'), c.phone],
          [t('cv.source'), tsrc(c.source)],
          [t('cv.applied'), f.date(c.appliedOn)],
          [t('cv.education'), te(c.education)],
        ].map(([k, val]) => (
          <div key={k} className="p-2 rounded bg-secondary-50 dark:bg-secondary-800">
            <dt className="text-[11px] text-secondary-500">{k}</dt>
            <dd className="font-medium">{val}</dd>
          </div>
        ))}
      </dl>
      <h3 className="text-sm font-bold mb-2">{t('cv.scoreTitle')}</h3>
      <ul className="space-y-1 text-xs mb-3">
        {scoreRows.map(([k, val]) => (
          <li key={k} className="flex justify-between gap-3"><span className="text-secondary-500">{k}</span><span className="text-right">{val}</span></li>
        ))}
      </ul>
      <p className="text-[11px] text-secondary-500 mb-4">{t('scoreNote')}</p>
      <div className="flex flex-wrap gap-2 justify-between">
        <button type="button" className={btn.outline} onClick={() => docs.cv(c, `${tp(v.positionId)} (${SITE_CITY[v.site]})`, scoreRows)}>{t('cv.download')}</button>
        {!c.discarded && c.stage !== 'hired' && (
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="cv-stage">{t('moveTo')}</label>
            <select
              id="cv-stage"
              className={`${inputCls} w-auto`}
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                onMove(c, e.target.value as Stage);
                onClose();
              }}
            >
              <option value="">{t('moveTo')}</option>
              {STAGES.filter((st) => st !== c.stage).map((st) => <option key={st} value={st}>{t(`stages.${st}`)}</option>)}
            </select>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
              onClick={() => {
                dispatch({ type: 'candidate.discard', id: c.id });
                toast(t('discardedToast', { name: c.name }));
                onClose();
              }}
            >
              {t('discard')}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AddCandidate({ onClose, defaultVacancy }: { onClose: () => void; defaultVacancy: string }) {
  const t = useTranslations('demoHrms.talent');
  const tp = useTranslations('demoHrms.positions');
  const te = useTranslations('demoHrms.education');
  const tsrc = useTranslations('demoHrms.sources');
  const { state, dispatch } = useHr();
  const [name, setName] = useState('');
  const [vacancyId, setVacancyId] = useState(defaultVacancy);
  const [source, setSource] = useState<CandidateSource>('jobBoard');
  const [years, setYears] = useState(1);
  const [education, setEducation] = useState<Education>('highSchool');
  const [shifts, setShifts] = useState(true);
  const [distanceKm, setDistance] = useState(10);
  const [phone, setPhone] = useState('');
  const valid = name.trim().length >= 5 && /^[0-9 ]{10,13}$/.test(phone.trim()) && years >= 0 && years <= 40 && distanceKm >= 0 && distanceKm <= 200;
  return (
    <Modal title={t('addCandidate')} subtitle={t('addSubtitle')} onClose={onClose} labelId="hrms-add-cand">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          const first = name.trim().split(' ')[0];
          const gender = FEMALE.includes(first) ? 'F' : MALE.includes(first) ? 'M' : undefined;
          dispatch({ type: 'candidate.add', candidate: { name: name.trim(), gender, vacancyId, stage: 'applied', source, years, education, shifts, distanceKm, appliedOn: state.baseDate, phone: phone.trim() } });
          toast.success(t('addedToast', { name: name.trim() }));
          onClose();
        }}
      >
        <Field label={t('form.name')} htmlFor="cand-name"><input id="cand-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('form.vacancy')} htmlFor="cand-vac">
            <select id="cand-vac" className={inputCls} value={vacancyId} onChange={(e) => setVacancyId(e.target.value)}>
              {state.vacancies.map((v) => <option key={v.id} value={v.id}>{tp(v.positionId)} · {SITE_CITY[v.site]}</option>)}
            </select>
          </Field>
          <Field label={t('form.phone')} htmlFor="cand-phone" hint={t('form.phoneHint')}><input id="cand-phone" inputMode="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="310 123 4567" /></Field>
          <Field label={t('form.source')} htmlFor="cand-src">
            <select id="cand-src" className={inputCls} value={source} onChange={(e) => setSource(e.target.value as CandidateSource)}>
              {(['jobBoard', 'referral', 'publicService', 'socialMedia', 'walkIn'] as const).map((s) => <option key={s} value={s}>{tsrc(s)}</option>)}
            </select>
          </Field>
          <Field label={t('form.education')} htmlFor="cand-edu">
            <select id="cand-edu" className={inputCls} value={education} onChange={(e) => setEducation(e.target.value as Education)}>
              {(['highSchool', 'technical', 'technologist', 'professional'] as const).map((s) => <option key={s} value={s}>{te(s)}</option>)}
            </select>
          </Field>
          <Field label={t('form.years')} htmlFor="cand-years"><input id="cand-years" type="number" min={0} max={40} className={inputCls} value={years} onChange={(e) => setYears(Number(e.target.value))} /></Field>
          <Field label={t('form.distance')} htmlFor="cand-dist"><input id="cand-dist" type="number" min={0} max={200} className={inputCls} value={distanceKm} onChange={(e) => setDistance(Number(e.target.value))} /></Field>
        </div>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={shifts} onChange={(e) => setShifts(e.target.checked)} className="rounded border-secondary-300" />{t('form.shifts')}</label>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn.outline} onClick={onClose}>{t('form.cancel')}</button>
          <button type="submit" className={btn.primary} disabled={!valid}>{t('form.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
