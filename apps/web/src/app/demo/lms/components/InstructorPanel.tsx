'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { analytics, pick, riskOf, toCsv, type Risk } from '../lib/engine';
import { downloadText } from '../lib/files';
import { useLmsReady } from '../lib/store';
import { allCourses, cohortWithMe } from '../lib/selectors';
import { SectionTitle, SimNote, btn, useFmt } from './ui';

function Gauge({ value, display, label }: { value: number; display: string; label: string }) {
  const angle = (Math.min(100, Math.max(0, value)) / 100) * 180;
  const color = value >= 30 ? '#f43f5e' : value >= 15 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 w-32 h-32 rounded-full bg-secondary-100 dark:bg-secondary-800" />
        <div
          className="absolute inset-x-0 top-0 w-32 h-32 rounded-full"
          style={{ background: `conic-gradient(from 270deg, ${color} 0deg, ${color} ${angle}deg, transparent ${angle}deg)` }}
        />
        <div className="absolute left-3 right-3 top-3 h-[6.5rem] rounded-full bg-white dark:bg-secondary-900" />
      </div>
      <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">{display}</p>
      <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">{label}</p>
    </div>
  );
}

const RISK_VARIANT: Record<Risk, 'danger' | 'warning' | 'success' | 'info'> = { high: 'danger', mid: 'warning', low: 'success', done: 'info' };

export default function InstructorPanel() {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, today, dispatch } = useLmsReady();
  const [scope, setScope] = useState('all');
  const courses = allCourses(state);
  const rows = useMemo(() => cohortWithMe(state, today).filter((r) => scope === 'all' || r.courseId === scope), [state, today, scope]);
  const scopedCourses = scope === 'all' ? courses : courses.filter((c) => c.id === scope);
  const a = useMemo(() => analytics(rows, scopedCourses, today), [rows, scopedCourses, today]);
  const maxTrend = Math.max(1, ...a.trend.map((x) => x.count));
  const courseTitle = (id: string) => {
    const c = courses.find((x) => x.id === id);
    return c ? pick(c.title, f.locale) : id;
  };
  const sortedRates = [...a.lessonRates].filter((x) => x.lesson.kind !== 'quiz');
  const top = [...sortedRates].sort((x, y) => y.rate - x.rate).slice(0, 3);
  const weak = [...sortedRates].sort((x, y) => x.rate - y.rate).slice(0, 3);
  const highIds = a.atRisk.filter((r) => r.risk === 'high' && r.studentId !== 'me' && !state.reminders[r.id]).map((r) => r.id);

  const exportCsv = () => {
    const head = [t('analytics.csvName'), t('analytics.csvCity'), t('analytics.csvCourse'), t('analytics.csvProgress'), t('analytics.csvIdle'), t('analytics.csvScore'), t('analytics.csvRisk')];
    const body = rows.map((r) => [
      r.name,
      r.city,
      courseTitle(r.courseId),
      r.progress,
      Math.max(0, Math.round((Date.parse(today) - Date.parse(r.lastActive)) / 86400000)),
      r.score ?? '',
      t(`analytics.risk_${riskOf(r, today)}`),
    ]);
    downloadText(`estudiantes-${scope}-${today}.csv`, toCsv([head, ...body]), 'text/csv;charset=utf-8');
    toast.success(t('analytics.csvDone', { count: rows.length }));
  };

  const kpis = [
    { icon: UsersIcon, label: t('analytics.enrolled'), value: f.int(a.enrolled), color: 'from-amber-500 to-orange-600' },
    { icon: ChartBarIcon, label: t('analytics.active7'), value: f.int(a.active7), color: 'from-blue-500 to-indigo-600' },
    { icon: AcademicCapIcon, label: t('analytics.completionRate'), value: f.pct(a.completion), color: 'from-green-500 to-emerald-600' },
    { icon: ArrowTrendingUpIcon, label: t('analytics.avgScore'), value: a.avgScore === null ? '—' : `${a.avgScore}/100`, color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
        action={
          <>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              aria-label={t('analytics.scope')}
              className="text-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 pl-3 pr-9 py-2 text-secondary-800 dark:text-secondary-100 max-w-[16rem]"
            >
              <option value="all">{t('analytics.allCourses')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c.title, f.locale)}
                </option>
              ))}
            </select>
            <button type="button" className={btn.outline} onClick={exportCsv}>
              <ArrowDownTrayIcon className="w-4 h-4" />
              {t('analytics.exportCsv')}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} variant="bordered">
            <CardContent className="p-0">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}>
                <k.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="bordered" className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-1 gap-2">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('analytics.trend')}</h3>
              <Badge variant="info" size="sm">
                {t('analytics.trendTotal', { count: a.trend.reduce((s, x) => s + x.count, 0) })}
              </Badge>
            </div>
            <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mb-4">{t('analytics.trendHint')}</p>
            <div className="h-48 flex items-end gap-2">
              {a.trend.map((d) => (
                <div key={d.date} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-semibold text-secondary-600 dark:text-secondary-300">{d.count}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-purple-500 transition-all duration-700 min-h-[2px]"
                    style={{ height: `${(d.count / maxTrend) * 80}%` }}
                    title={`${f.date(d.date, 'dayMonth')}: ${d.count}`}
                  />
                  <span className="text-[10px] text-secondary-500 dark:text-secondary-400 capitalize">{f.date(d.date, 'weekday')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent className="p-0 flex flex-col items-center">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">{t('analytics.dropoutRisk')}</h3>
            <Gauge value={a.riskHighPct} display={f.pct(a.riskHighPct)} label={t('analytics.gaugeLabel')} />
            <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-3 text-center">{t('analytics.riskRule')}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <div>
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('analytics.atRiskTitle')}</h3>
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('analytics.atRiskCount', { count: a.atRisk.length })}</p>
            </div>
            <button
              type="button"
              className={btn.outline}
              disabled={highIds.length === 0}
              onClick={() => {
                dispatch({ type: 'remind', ids: highIds });
                toast.success(t('analytics.remindAllDone', { count: highIds.length }));
              }}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {t('analytics.remindAll', { count: highIds.length })}
            </button>
          </div>
          {a.atRisk.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('analytics.noRisk')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                    <th className="py-2 pr-3 font-semibold">{t('analytics.csvName')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('analytics.csvCourse')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('analytics.csvProgress')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('analytics.csvIdle')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('analytics.csvRisk')}</th>
                    <th className="py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {a.atRisk.slice(0, 8).map((r) => {
                    const sent = state.reminders[r.id];
                    return (
                      <tr key={r.id} className="border-t border-secondary-100 dark:border-secondary-800">
                        <td className="py-2 pr-3 text-secondary-800 dark:text-secondary-100">
                          {r.name}
                          <span className="block text-[11px] text-secondary-500">{r.city}</span>
                        </td>
                        <td className="py-2 pr-3 text-secondary-600 dark:text-secondary-300 text-xs">{courseTitle(r.courseId)}</td>
                        <td className="py-2 pr-3">{f.pct(r.progress)}</td>
                        <td className="py-2 pr-3">{t('analytics.idleDays', { count: r.idle })}</td>
                        <td className="py-2 pr-3">
                          <Badge variant={RISK_VARIANT[r.risk]} size="sm">
                            {t(`analytics.risk_${r.risk}`)}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          {r.studentId === 'me' ? (
                            <span className="text-[11px] text-secondary-500">{t('gamification.you')}</span>
                          ) : sent ? (
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-300">{t('analytics.reminded')}</span>
                          ) : (
                            <button
                              type="button"
                              className={btn.small}
                              onClick={() => {
                                dispatch({ type: 'remind', ids: [r.id] });
                                toast.success(t('analytics.remindDone', { name: r.name }));
                              }}
                            >
                              {t('analytics.remind')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3">
            <SimNote>{t('analytics.remindNote')}</SimNote>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: t('analytics.topLessons'), list: top, icon: ArrowTrendingUpIcon, iconCls: 'text-green-500', bar: 'from-green-400 to-emerald-500' },
          { title: t('analytics.weakLessons'), list: weak, icon: ArrowTrendingDownIcon, iconCls: 'text-amber-500', bar: 'from-amber-400 to-orange-500' },
        ].map((block) => (
          <Card key={block.title} variant="bordered">
            <CardContent className="p-0">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-1 flex items-center gap-2">
                <block.icon className={`w-5 h-5 ${block.iconCls}`} />
                {block.title}
              </h3>
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mb-4">{t('analytics.lessonRateHint')}</p>
              <div className="space-y-3">
                {block.list.map((m) => (
                  <div key={m.lesson.id}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-sm text-secondary-800 dark:text-secondary-100 min-w-0 truncate">
                        {pick(m.lesson.title, f.locale)}
                        <span className="text-[11px] text-secondary-500"> · {courseTitle(m.courseId)}</span>
                      </span>
                      <span className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 shrink-0">{f.pct(m.rate)}</span>
                    </div>
                    <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${block.bar}`} style={{ width: `${m.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
