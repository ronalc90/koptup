'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { DocumentArrowUpIcon, EyeIcon, PencilSquareIcon, PlusIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { generateQuestions, lessonsOf, pick } from '../lib/engine';
import { useLmsReady } from '../lib/store';
import type { Course, L, Lesson, LessonKind, Level, Mode, QuizQuestion, ScriptLine } from '../lib/types';
import { Empty, Modal, SectionTitle, SimNote, btn, inputCls, labelCls, selectCls, useFmt } from './ui';

interface DraftLesson {
  title: string;
  kind: Exclude<LessonKind, 'quiz'>;
  minutes: number;
  content: string;
}
interface DraftModule {
  title: string;
  lessons: DraftLesson[];
}
interface DraftQuestion {
  q: string;
  options: string[];
  correct: number;
}
interface Draft {
  id: string | null;
  title: string;
  desc: string;
  category: string;
  level: Level;
  mode: Mode;
  hours: number;
  price: number;
  modules: DraftModule[];
  files: { name: string; size: number }[];
  quiz: DraftQuestion[];
}

const GRADIENTS = [
  'from-sky-500 via-cyan-500 to-teal-500',
  'from-fuchsia-500 via-purple-500 to-indigo-500',
  'from-lime-500 via-green-500 to-emerald-600',
  'from-orange-500 via-amber-500 to-yellow-500',
];

const same = (s: string): L => ({ es: s, en: s });

const emptyDraft = (): Draft => ({
  id: null,
  title: '',
  desc: '',
  category: '',
  level: 'beginner',
  mode: 'self-paced',
  hours: 8,
  price: 150000,
  modules: [{ title: '', lessons: [{ title: '', kind: 'video', minutes: 8, content: '' }] }],
  files: [],
  quiz: [],
});

function toDraft(c: Course): Draft {
  return {
    id: c.id,
    title: c.title.es,
    desc: c.desc.es,
    category: c.category.es,
    level: c.level,
    mode: c.mode,
    hours: c.hours,
    price: c.price,
    modules: c.modules
      .map((m) => ({
        title: m.title.es,
        lessons: m.lessons
          .filter((x) => x.kind !== 'quiz')
          .map((x) => ({ title: x.title.es, kind: x.kind as 'video' | 'reading', minutes: Math.max(1, Math.round(x.duration / 60)), content: x.lines.map((ln) => ln.text.es).join('\n\n') })),
      }))
      .filter((m) => m.lessons.length > 0),
    files: c.files ?? [],
    quiz: c.quiz.map((qq) => ({ q: qq.q.es, options: qq.options.map((o) => o.es), correct: qq.correct })),
  };
}

function buildCourse(d: Draft, id: string, instructor: string, index: number, today: string, published: boolean): Course {
  let n = 0;
  const modules = d.modules.map((m, mi) => ({
    id: `${id}-m${mi + 1}`,
    title: same(m.title.trim()),
    lessons: m.lessons.map((ls): Lesson => {
      n += 1;
      const duration = Math.max(1, ls.minutes) * 60;
      const paras = ls.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      const lines: ScriptLine[] = paras.map((p, i) => ({ at: ls.kind === 'video' ? Math.floor((duration * i) / Math.max(1, paras.length)) : 0, text: same(p) }));
      return { id: `${id}-l${n}`, n, kind: ls.kind, title: same(ls.title.trim()), duration, lines };
    }),
  }));
  const quiz: QuizQuestion[] = d.quiz.map((qq, i) => ({
    id: `${id}-q${i + 1}`,
    q: same(qq.q.trim()),
    options: qq.options.map((o) => same(o.trim())),
    correct: qq.correct,
    lessonId: modules[0]?.lessons[0]?.id ?? `${id}-l1`,
  }));
  if (quiz.length > 0) {
    n += 1;
    modules.push({
      id: `${id}-m${modules.length + 1}`,
      title: { es: 'Evaluación', en: 'Assessment' },
      lessons: [{ id: `${id}-l${n}`, n, kind: 'quiz', title: { es: 'Evaluación final', en: 'Final assessment' }, duration: 600, lines: [] }],
    });
  }
  return {
    id,
    title: same(d.title.trim()),
    desc: same(d.desc.trim()),
    instructor,
    instructorBio: same(''),
    category: same(d.category.trim() || 'General'),
    level: d.level,
    mode: d.mode,
    hours: d.hours,
    price: d.price,
    rating: 0,
    reviews: 0,
    gradient: GRADIENTS[index % GRADIENTS.length],
    skills: [],
    requirements: [],
    modules,
    quiz,
    suggestions: [],
    custom: true,
    published,
    createdAt: today,
    files: d.files,
  };
}

const STEPS = ['data', 'modules', 'files', 'quiz'] as const;

export default function AuthoringPanel({ onPreview }: { onPreview: (id: string) => void }) {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, today, dispatch } = useLmsReady();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const custom = state.customCourses;

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setModule = (mi: number, patch: Partial<DraftModule>) =>
    setDraft((d) => (d ? { ...d, modules: d.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)) } : d));
  const setLesson = (mi: number, li: number, patch: Partial<DraftLesson>) =>
    setDraft((d) =>
      d ? { ...d, modules: d.modules.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.map((ls, j) => (j === li ? { ...ls, ...patch } : ls)) } : m)) } : d,
    );
  const setQuestion = (qi: number, patch: Partial<DraftQuestion>) =>
    setDraft((d) => (d ? { ...d, quiz: d.quiz.map((qq, i) => (i === qi ? { ...qq, ...patch } : qq)) } : d));

  const validateStep = (d: Draft, s: number): string[] => {
    const e: string[] = [];
    if (s === 0) {
      if (d.title.trim().length < 5) e.push(t('authoring.errTitle'));
      if (d.desc.trim().length < 10) e.push(t('authoring.errDesc'));
      if (!(d.hours >= 1 && d.hours <= 300)) e.push(t('authoring.errHours'));
      if (!(d.price >= 0 && d.price <= 20000000)) e.push(t('authoring.errPrice'));
    }
    if (s === 1) {
      if (d.modules.length === 0) e.push(t('authoring.errModules'));
      d.modules.forEach((m, i) => {
        if (!m.title.trim()) e.push(t('authoring.errModuleTitle', { n: i + 1 }));
        if (m.lessons.length === 0) e.push(t('authoring.errModuleLessons', { n: i + 1 }));
        m.lessons.forEach((ls, j) => {
          if (!ls.title.trim()) e.push(t('authoring.errLessonTitle', { m: i + 1, n: j + 1 }));
        });
      });
    }
    if (s === 3) {
      d.quiz.forEach((qq, i) => {
        if (!qq.q.trim() || qq.options.some((o) => !o.trim())) e.push(t('authoring.errQuestion', { n: i + 1 }));
      });
    }
    return e;
  };

  const next = () => {
    if (!draft) return;
    const e = validateStep(draft, step);
    setErrors(e);
    if (e.length === 0) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const save = (publish: boolean) => {
    if (!draft) return;
    const all = [0, 1, 3].flatMap((s) => validateStep(draft, s));
    setErrors(all);
    if (all.length > 0) return;
    const id = draft.id ?? `custom-${Date.now().toString(36)}`;
    const index = draft.id ? custom.findIndex((c) => c.id === draft.id) : custom.length;
    const course = buildCourse(draft, id, state.profile.name, Math.max(0, index), today, publish);
    dispatch({ type: 'course.save', course });
    toast.success(publish ? t('authoring.publishedToast') : t('authoring.savedToast'));
    setDraft(null);
    setStep(0);
  };

  const numberInput = (value: number, onChange: (n: number) => void, id: string, min: number, max: number, stepN = 1) => (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={stepN}
      className={inputCls}
      value={Number.isFinite(value) ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
    />
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('authoring.title')}
        subtitle={t('authoring.subtitle')}
        action={
          !draft && (
            <button
              type="button"
              className={btn.primary}
              onClick={() => {
                setDraft(emptyDraft());
                setStep(0);
                setErrors([]);
              }}
            >
              <PlusIcon className="w-4 h-4" />
              {t('authoring.create')}
            </button>
          )
        }
      />

      {draft && (
        <Card variant="elevated">
          <CardContent className="p-0 space-y-5">
            <ol className="flex flex-wrap gap-2" aria-label={t('authoring.stepsLabel')}>
              {STEPS.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      if (i <= step) setStep(i);
                      else next();
                    }}
                    aria-current={i === step ? 'step' : undefined}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      i === step
                        ? 'bg-primary-600 text-white'
                        : i < step
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
                          : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300'
                    }`}
                  >
                    {i + 1}. {t(`authoring.step_${s}`)}
                  </button>
                </li>
              ))}
            </ol>

            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="lms-a-title">
                    {t('authoring.fTitle')}
                  </label>
                  <input id="lms-a-title" className={inputCls} value={draft.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} placeholder={t('authoring.fTitlePh')} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="lms-a-desc">
                    {t('authoring.fDesc')}
                  </label>
                  <textarea id="lms-a-desc" className={inputCls} rows={2} value={draft.desc} maxLength={220} onChange={(e) => set({ desc: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="lms-a-cat">
                    {t('authoring.fCategory')}
                  </label>
                  <input id="lms-a-cat" className={inputCls} value={draft.category} maxLength={30} onChange={(e) => set({ category: e.target.value })} placeholder={t('authoring.fCategoryPh')} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="lms-a-level">
                    {t('catalog.filterLevel')}
                  </label>
                  <select id="lms-a-level" className={selectCls} value={draft.level} onChange={(e) => set({ level: e.target.value as Level })}>
                    <option value="beginner">{t('catalog.levelBeginner')}</option>
                    <option value="intermediate">{t('catalog.levelIntermediate')}</option>
                    <option value="advanced">{t('catalog.levelAdvanced')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="lms-a-mode">
                    {t('authoring.fMode')}
                  </label>
                  <select id="lms-a-mode" className={selectCls} value={draft.mode} onChange={(e) => set({ mode: e.target.value as Mode })}>
                    <option value="self-paced">{t('catalog.modeSelfPaced')}</option>
                    <option value="cohort">{t('catalog.modeCohort')}</option>
                    <option value="live">{t('catalog.modeLive')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="lms-a-hours">
                      {t('authoring.fHours')}
                    </label>
                    {numberInput(draft.hours, (n) => set({ hours: n }), 'lms-a-hours', 1, 300)}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="lms-a-price">
                      {t('authoring.fPrice')}
                    </label>
                    {numberInput(draft.price, (n) => set({ price: n }), 'lms-a-price', 0, 20000000, 1000)}
                    <p className="text-[11px] text-secondary-500 mt-1">{Number.isFinite(draft.price) ? (draft.price > 0 ? f.money(draft.price) : t('catalog.free')) : ''}</p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                {draft.modules.map((m, mi) => (
                  <div key={mi} className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-3 space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className={labelCls} htmlFor={`lms-a-m${mi}`}>
                          {t('detail.moduleN', { n: mi + 1 })}
                        </label>
                        <input id={`lms-a-m${mi}`} className={inputCls} value={m.title} maxLength={60} onChange={(e) => setModule(mi, { title: e.target.value })} />
                      </div>
                      <button
                        type="button"
                        className={btn.ghost}
                        disabled={draft.modules.length === 1}
                        onClick={() => set({ modules: draft.modules.filter((_, i) => i !== mi) })}
                        aria-label={t('authoring.removeModule')}
                        title={t('authoring.removeModule')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    {m.lessons.map((ls, li) => (
                      <div key={li} className="pl-3 border-l-2 border-cyan-200 dark:border-cyan-800 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                          <div>
                            <label className={labelCls} htmlFor={`lms-a-l${mi}-${li}`}>
                              {t('authoring.lessonTitle', { n: li + 1 })}
                            </label>
                            <input id={`lms-a-l${mi}-${li}`} className={inputCls} value={ls.title} maxLength={70} onChange={(e) => setLesson(mi, li, { title: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelCls} htmlFor={`lms-a-k${mi}-${li}`}>
                              {t('authoring.lessonKind')}
                            </label>
                            <select id={`lms-a-k${mi}-${li}`} className={selectCls} value={ls.kind} onChange={(e) => setLesson(mi, li, { kind: e.target.value as 'video' | 'reading' })}>
                              <option value="video">{t('kind.video')}</option>
                              <option value="reading">{t('kind.reading')}</option>
                            </select>
                          </div>
                          <div className="w-24">
                            <label className={labelCls} htmlFor={`lms-a-min${mi}-${li}`}>
                              {t('authoring.lessonMinutes')}
                            </label>
                            {numberInput(ls.minutes, (n) => setLesson(mi, li, { minutes: n }), `lms-a-min${mi}-${li}`, 1, 180)}
                          </div>
                          <button
                            type="button"
                            className={btn.ghost}
                            disabled={m.lessons.length === 1}
                            onClick={() => setModule(mi, { lessons: m.lessons.filter((_, j) => j !== li) })}
                            aria-label={t('authoring.removeLesson')}
                            title={t('authoring.removeLesson')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <label className={labelCls} htmlFor={`lms-a-c${mi}-${li}`}>
                            {t('authoring.lessonContent')}
                          </label>
                          <textarea
                            id={`lms-a-c${mi}-${li}`}
                            className={inputCls}
                            rows={2}
                            maxLength={2000}
                            value={ls.content}
                            onChange={(e) => setLesson(mi, li, { content: e.target.value })}
                            placeholder={t('authoring.lessonContentPh')}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={btn.small}
                      onClick={() => setModule(mi, { lessons: [...m.lessons, { title: '', kind: 'video', minutes: 8, content: '' }] })}
                      disabled={m.lessons.length >= 8}
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      {t('authoring.addLesson')}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={btn.outline}
                  onClick={() => set({ modules: [...draft.modules, { title: '', lessons: [{ title: '', kind: 'video', minutes: 8, content: '' }] }] })}
                  disabled={draft.modules.length >= 8}
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('authoring.addModule')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-secondary-300 dark:border-secondary-700 cursor-pointer hover:border-primary-400 text-center">
                  <DocumentArrowUpIcon className="w-8 h-8 text-secondary-400" />
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-200">{t('authoring.filesPick')}</span>
                  <span className="text-[11px] text-secondary-500">{t('authoring.filesTypes')}</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.mp4,.mov,.zip,.pptx,.docx,.txt"
                    className="sr-only"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []).map((x) => ({ name: x.name, size: x.size }));
                      set({ files: [...draft.files, ...picked].slice(0, 10) });
                      e.target.value = '';
                    }}
                  />
                </label>
                {draft.files.length > 0 && (
                  <ul className="space-y-1.5">
                    {draft.files.map((file, i) => (
                      <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary-50 dark:bg-secondary-800/50 text-sm">
                        <span className="truncate text-secondary-800 dark:text-secondary-100">{file.name}</span>
                        <span className="text-[11px] text-secondary-500 shrink-0">{f.dec(file.size / 1024 / 1024)} MB</span>
                        <button type="button" className={btn.ghost} onClick={() => set({ files: draft.files.filter((_, j) => j !== i) })} aria-label={t('authoring.removeFile')}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <SimNote>{t('authoring.filesNote')}</SimNote>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('authoring.quizHint')}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={btn.outline}
                    disabled={draft.quiz.length >= 5}
                    onClick={() => {
                      const generated = generateQuestions(
                        draft.modules.flatMap((m) => m.lessons.map((ls) => ls.content)),
                        5 - draft.quiz.length,
                        t('authoring.generatedPrompt'),
                      );
                      if (generated.length === 0) {
                        toast.error(t('authoring.generateNone'));
                        return;
                      }
                      set({ quiz: [...draft.quiz, ...generated] });
                      toast.success(t('authoring.generateDone', { count: generated.length }));
                    }}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    {t('authoring.generate')}
                  </button>
                  <span className="text-[11px] text-secondary-500">{t('authoring.generateHint')}</span>
                </div>
                {draft.quiz.map((qq, qi) => (
                  <div key={qi} className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-3 space-y-2">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className={labelCls} htmlFor={`lms-a-q${qi}`}>
                          {t('authoring.questionN', { n: qi + 1 })}
                        </label>
                        <input id={`lms-a-q${qi}`} className={inputCls} value={qq.q} maxLength={160} onChange={(e) => setQuestion(qi, { q: e.target.value })} />
                      </div>
                      <button type="button" className={btn.ghost} onClick={() => set({ quiz: draft.quiz.filter((_, i) => i !== qi) })} aria-label={t('authoring.removeQuestion')}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {qq.options.map((o, oi) => (
                        <label key={oi} className="flex items-center gap-2">
                          <input type="radio" name={`lms-a-correct-${qi}`} checked={qq.correct === oi} onChange={() => setQuestion(qi, { correct: oi })} aria-label={t('authoring.correctOption')} />
                          <input
                            className={inputCls}
                            value={o}
                            maxLength={100}
                            placeholder={t('authoring.optionN', { letter: String.fromCharCode(65 + oi) })}
                            onChange={(e) => setQuestion(qi, { options: qq.options.map((x, k) => (k === oi ? e.target.value : x)) })}
                          />
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-secondary-500">{t('authoring.correctHint')}</p>
                  </div>
                ))}
                <button
                  type="button"
                  className={btn.outline}
                  disabled={draft.quiz.length >= 5}
                  onClick={() => set({ quiz: [...draft.quiz, { q: '', options: ['', '', '', ''], correct: 0 }] })}
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('authoring.addQuestion')}
                </button>
              </div>
            )}

            {errors.length > 0 && (
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 list-disc pl-5" role="alert">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-800">
              <button
                type="button"
                className={btn.outline}
                onClick={() => {
                  setDraft(null);
                  setErrors([]);
                }}
              >
                {t('common.cancel')}
              </button>
              <div className="ml-auto flex flex-wrap gap-2">
                {step > 0 && (
                  <button type="button" className={btn.outline} onClick={() => setStep((s) => s - 1)}>
                    {t('authoring.back')}
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button type="button" className={btn.primary} onClick={next}>
                    {t('authoring.next')}
                  </button>
                ) : (
                  <>
                    <button type="button" className={btn.outline} onClick={() => save(false)}>
                      {t('authoring.saveDraft')}
                    </button>
                    <button type="button" className={btn.primary} onClick={() => save(true)}>
                      {t('authoring.savePublish')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="bordered">
        <CardContent className="p-0">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">{t('authoring.myCourses')}</h3>
          {custom.length === 0 ? (
            <Empty>{t('authoring.empty')}</Empty>
          ) : (
            <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {custom.map((c) => (
                <li key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-secondary-900 dark:text-white truncate">{pick(c.title, f.locale)}</p>
                      <Badge variant={c.published ? 'success' : 'default'} size="sm">
                        {c.published ? t('authoring.published') : t('authoring.draft')}
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {t('detail.lessonsCount', { count: lessonsOf(c).length })} · {c.price > 0 ? f.money(c.price) : t('catalog.free')} ·{' '}
                      {t('authoring.filesCount', { count: c.files?.length ?? 0 })} · {t('authoring.questionsCount', { count: c.quiz.length })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={btn.small} onClick={() => onPreview(c.id)}>
                      <EyeIcon className="w-3.5 h-3.5" />
                      {t('authoring.preview')}
                    </button>
                    <button
                      type="button"
                      className={btn.small}
                      onClick={() => {
                        setDraft(toDraft(c));
                        setStep(0);
                        setErrors([]);
                      }}
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" />
                      {t('authoring.edit')}
                    </button>
                    <button
                      type="button"
                      className={btn.small}
                      onClick={() => {
                        dispatch({ type: 'course.publish', id: c.id, published: !c.published });
                        toast.success(c.published ? t('authoring.unpublishedToast') : t('authoring.publishedToast'));
                      }}
                    >
                      {c.published ? t('authoring.unpublish') : t('authoring.publish')}
                    </button>
                    <button type="button" className={btn.small} onClick={() => setConfirmDelete(c)} aria-label={t('authoring.delete')}>
                      <TrashIcon className="w-3.5 h-3.5" />
                      {t('authoring.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('authoring.deleteTitle')} labelledBy="lms-del-title" closeLabel={t('common.close')}>
        <div className="p-5 space-y-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('authoring.deleteBody', { title: confirmDelete ? pick(confirmDelete.title, f.locale) : '' })}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn.outline} onClick={() => setConfirmDelete(null)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={`${btn.primary} bg-red-600 hover:bg-red-700`}
              onClick={() => {
                if (confirmDelete) dispatch({ type: 'course.remove', id: confirmDelete.id });
                setConfirmDelete(null);
                toast.success(t('authoring.deletedToast'));
              }}
            >
              {t('authoring.delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
