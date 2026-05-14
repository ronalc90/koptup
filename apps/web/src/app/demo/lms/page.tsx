'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  AcademicCapIcon,
  ClockIcon,
  UsersIcon,
  PlayCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  LockClosedIcon,
  BookOpenIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BeakerIcon,
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  ShieldCheckIcon,
  VideoCameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  PuzzlePieceIcon,
  BoltIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PlayerPanel, { PlaylistItem } from './components/PlayerPanel';
import QuizPanel, { QuizQuestion } from './components/QuizPanel';
import InstructorPanel from './components/InstructorPanel';
import CatalogGrid, {
  Course,
  Level,
  modeBadgeFor,
  levelLabelFor,
} from './components/CatalogGrid';
import {
  LiveSection,
  GamificationSection,
  CertificatesSection,
  LiveSession,
  BadgeDef,
  LeaderboardEntry,
  Certificate,
} from './components/EngagementSections';

type Role = 'student' | 'instructor' | 'admin';
type Section = 'catalog' | 'learning' | 'live' | 'gamification' | 'certificates';

interface Resource {
  id: number;
  type: 'video' | 'pdf' | 'quiz' | 'lab' | 'reading';
  title: string;
  duration: string;
}

const resourceIconMap = {
  video: VideoCameraIcon,
  pdf: DocumentTextIcon,
  quiz: QuestionMarkCircleIcon,
  lab: BeakerIcon,
  reading: BookOpenIcon,
};

export default function LmsDemoPage() {
  const t = useTranslations('demoLms');

  const [role, setRole] = useState<Role>('student');
  const [section, setSection] = useState<Section>('catalog');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all');
  const [openCourse, setOpenCourse] = useState<Course | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [currentCourseId, setCurrentCourseId] = useState<number>(1);

  const courses: Course[] = useMemo(
    () => [
      {
        id: 1,
        titleKey: 'courses.c1Title',
        descKey: 'courses.c1Desc',
        instructorKey: 'instructors.i1',
        duration: '24h',
        rating: 4.8,
        students: 3120,
        mode: 'self-paced',
        level: 'intermediate',
        progress: 42,
        gradient: 'from-indigo-500 via-purple-500 to-pink-500',
        modules: [
          { titleKey: 'modules.intro', lessons: 4, done: 4 },
          { titleKey: 'modules.fundamentals', lessons: 6, done: 3 },
          { titleKey: 'modules.practice', lessons: 5, done: 0 },
          { titleKey: 'modules.project', lessons: 3, done: 0 },
          { titleKey: 'modules.evaluation', lessons: 2, done: 0 },
        ],
        skillsKeys: [],
      },
      {
        id: 2,
        titleKey: 'courses.c2Title',
        descKey: 'courses.c2Desc',
        instructorKey: 'instructors.i2',
        duration: '18h',
        rating: 4.9,
        students: 2480,
        mode: 'cohort',
        level: 'beginner',
        progress: 0,
        gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
        modules: [
          { titleKey: 'modules.intro', lessons: 3, done: 0 },
          { titleKey: 'modules.fundamentals', lessons: 5, done: 0 },
          { titleKey: 'modules.practice', lessons: 4, done: 0 },
        ],
        skillsKeys: [],
      },
      {
        id: 3,
        titleKey: 'courses.c3Title',
        descKey: 'courses.c3Desc',
        instructorKey: 'instructors.i3',
        duration: '30h',
        rating: 4.6,
        students: 5210,
        mode: 'live',
        level: 'beginner',
        progress: 70,
        gradient: 'from-rose-500 via-pink-500 to-orange-500',
        modules: [
          { titleKey: 'modules.intro', lessons: 4, done: 4 },
          { titleKey: 'modules.fundamentals', lessons: 6, done: 6 },
          { titleKey: 'modules.practice', lessons: 5, done: 3 },
          { titleKey: 'modules.evaluation', lessons: 2, done: 0 },
        ],
        skillsKeys: [],
      },
      {
        id: 4,
        titleKey: 'courses.c4Title',
        descKey: 'courses.c4Desc',
        instructorKey: 'instructors.i4',
        duration: '36h',
        rating: 4.7,
        students: 4090,
        mode: 'self-paced',
        level: 'advanced',
        progress: 12,
        gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
        modules: [
          { titleKey: 'modules.intro', lessons: 3, done: 3 },
          { titleKey: 'modules.fundamentals', lessons: 6, done: 1 },
          { titleKey: 'modules.practice', lessons: 6, done: 0 },
          { titleKey: 'modules.project', lessons: 4, done: 0 },
        ],
        skillsKeys: [],
      },
      {
        id: 5,
        titleKey: 'courses.c5Title',
        descKey: 'courses.c5Desc',
        instructorKey: 'instructors.i5',
        duration: '12h',
        rating: 4.5,
        students: 1850,
        mode: 'cohort',
        level: 'intermediate',
        progress: 0,
        gradient: 'from-amber-500 via-orange-500 to-rose-500',
        modules: [
          { titleKey: 'modules.intro', lessons: 2, done: 0 },
          { titleKey: 'modules.fundamentals', lessons: 4, done: 0 },
          { titleKey: 'modules.advanced', lessons: 3, done: 0 },
        ],
        skillsKeys: [],
      },
      {
        id: 6,
        titleKey: 'courses.c6Title',
        descKey: 'courses.c6Desc',
        instructorKey: 'instructors.i6',
        duration: '22h',
        rating: 4.7,
        students: 2740,
        mode: 'live',
        level: 'advanced',
        progress: 100,
        gradient: 'from-slate-700 via-slate-800 to-slate-900',
        modules: [
          { titleKey: 'modules.intro', lessons: 3, done: 3 },
          { titleKey: 'modules.fundamentals', lessons: 5, done: 5 },
          { titleKey: 'modules.advanced', lessons: 5, done: 5 },
          { titleKey: 'modules.evaluation', lessons: 2, done: 2 },
        ],
        skillsKeys: [],
      },
    ],
    []
  );

  const currentCourse = courses.find((c) => c.id === currentCourseId) ?? courses[0];

  const playlist: PlaylistItem[] = useMemo(
    () => [
      { id: 1, title: t('modules.intro'), duration: '08:24', type: 'video' },
      { id: 2, title: t('modules.fundamentals'), duration: '14:10', type: 'video' },
      { id: 3, title: t('modules.practice'), duration: '22:05', type: 'video' },
      { id: 4, title: t('modules.evaluation'), duration: '06:00', type: 'quiz' },
      { id: 5, title: t('modules.project'), duration: '45:30', type: 'reading' },
    ],
    [t]
  );

  const tutorReplies = useMemo(
    () => [
      t('tutorReplies.r1'),
      t('tutorReplies.r2'),
      t('tutorReplies.r3'),
      t('tutorReplies.r4'),
      t('tutorReplies.r5'),
    ],
    [t]
  );

  const quiz: QuizQuestion[] = useMemo(
    () => [
      {
        id: 1,
        question: '¿Cuál es la principal ventaja del aprendizaje supervisado?',
        options: [
          'No requiere datos etiquetados',
          'Aprende de ejemplos con etiquetas conocidas',
          'Solo funciona con imágenes',
          'No usa funciones de pérdida',
        ],
        correct: 1,
      },
      {
        id: 2,
        question: 'Selecciona un algoritmo de clasificación supervisada:',
        options: ['K-Means', 'Random Forest', 'DBSCAN', 'PCA'],
        correct: 1,
      },
      {
        id: 3,
        question: 'El overfitting ocurre cuando un modelo:',
        options: [
          'Generaliza muy bien',
          'No aprende los datos de entrenamiento',
          'Memoriza los datos de entrenamiento',
          'No tiene parámetros',
        ],
        correct: 2,
      },
    ],
    []
  );

  const resources: Resource[] = [
    { id: 1, type: 'video', title: t('modules.intro'), duration: '08:24' },
    { id: 2, type: 'pdf', title: t('modules.fundamentals'), duration: '15 ' + t('common.minutes') },
    { id: 3, type: 'quiz', title: t('modules.evaluation'), duration: '10 ' + t('common.minutes') },
    { id: 4, type: 'lab', title: t('modules.practice'), duration: '45 ' + t('common.minutes') },
    { id: 5, type: 'reading', title: t('modules.advanced'), duration: '20 ' + t('common.minutes') },
  ];

  const nav: { key: Section; icon: any; label: string }[] = [
    { key: 'catalog', icon: AcademicCapIcon, label: t('nav.catalog') },
    { key: 'learning', icon: PlayCircleIcon, label: t('nav.learning') },
    { key: 'live', icon: VideoCameraIcon, label: t('nav.live') },
    { key: 'gamification', icon: TrophyIcon, label: t('nav.gamification') },
    { key: 'certificates', icon: ShieldCheckIcon, label: t('nav.certificates') },
  ];

  const stats = [
    { label: t('stats.courses'), value: '120+', icon: AcademicCapIcon, color: 'from-indigo-500 to-purple-500' },
    { label: t('stats.students'), value: '24.5k', icon: UsersIcon, color: 'from-pink-500 to-rose-500' },
    { label: t('stats.completion'), value: '87%', icon: ChartBarIcon, color: 'from-emerald-500 to-teal-500' },
    { label: t('stats.hours'), value: '3,200', icon: ClockIcon, color: 'from-amber-500 to-orange-500' },
  ];

  const pathNodes = [
    { id: 'a', titleKey: 'modules.intro', state: 'done' as const, branch: false },
    { id: 'b', titleKey: 'modules.fundamentals', state: 'inProgress' as const, branch: false },
    { id: 'c1', titleKey: 'modules.practice', state: 'next' as const, branch: true },
    { id: 'c2', titleKey: 'modules.advanced', state: 'locked' as const, branch: true },
    { id: 'd', titleKey: 'modules.project', state: 'locked' as const, branch: false },
    { id: 'e', titleKey: 'modules.evaluation', state: 'locked' as const, branch: false },
  ];

  const badges: BadgeDef[] = [
    { key: 'b1', icon: SparklesIcon, color: 'from-amber-400 to-orange-500', unlocked: true },
    { key: 'b2', icon: FireIcon, color: 'from-rose-400 to-pink-500', unlocked: true },
    { key: 'b3', icon: TrophyIcon, color: 'from-yellow-400 to-amber-500', unlocked: true },
    { key: 'b4', icon: BoltIcon, color: 'from-indigo-400 to-purple-500', unlocked: true },
    { key: 'b5', icon: PuzzlePieceIcon, color: 'from-cyan-400 to-blue-500', unlocked: false },
    { key: 'b6', icon: ShieldCheckIcon, color: 'from-emerald-400 to-teal-500', unlocked: false },
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Mariana', xp: 5420 },
    { rank: 2, name: 'Diego', xp: 4980 },
    { rank: 3, name: 'Sofia', xp: 4810 },
    { rank: 4, name: 'Pablo', xp: 4200 },
    { rank: 5, name: 'Ronald', xp: 2340, you: true },
    { rank: 6, name: 'Camila', xp: 2150 },
    { rank: 7, name: 'Andres', xp: 1980 },
    { rank: 8, name: 'Laura', xp: 1840 },
    { rank: 9, name: 'Esteban', xp: 1620 },
    { rank: 10, name: 'Valeria', xp: 1450 },
  ];

  const certificates: Certificate[] = [
    {
      id: 'CERT-2026-0142',
      titleKey: 'courses.c6Title',
      instructorKey: 'instructors.i6',
      date: '2026-04-22',
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
    },
    {
      id: 'CERT-2026-0098',
      titleKey: 'courses.c3Title',
      instructorKey: 'instructors.i3',
      date: '2026-03-10',
      gradient: 'from-rose-500 via-pink-500 to-orange-500',
    },
  ];

  const liveSessions: LiveSession[] = [
    {
      id: 1,
      titleKey: 'courses.c3Title',
      hostKey: 'instructors.i3',
      whenKey: 'today',
      time: '18:00',
      attendees: 142,
      rooms: 4,
      live: true,
      countdown: '00:14:22',
    },
    {
      id: 2,
      titleKey: 'courses.c2Title',
      hostKey: 'instructors.i2',
      whenKey: 'tomorrow',
      time: '10:30',
      attendees: 86,
      rooms: 3,
      live: false,
      countdown: '18:42:00',
    },
    {
      id: 3,
      titleKey: 'courses.c5Title',
      hostKey: 'instructors.i5',
      whenKey: 'tomorrow',
      time: '16:00',
      attendees: 54,
      rooms: 2,
      live: false,
      countdown: '24:12:00',
    },
  ];

  const pathStateMap = {
    done: { cls: 'bg-green-100 dark:bg-green-900/30 ring-green-300 dark:ring-green-700 text-green-700 dark:text-green-300', label: t('path.done'), icon: CheckCircleIcon },
    inProgress: { cls: 'bg-primary-100 dark:bg-primary-900/30 ring-primary-300 dark:ring-primary-700 text-primary-700 dark:text-primary-300', label: t('path.inProgress'), icon: PlayCircleIcon },
    next: { cls: 'bg-amber-100 dark:bg-amber-900/30 ring-amber-300 dark:ring-amber-700 text-amber-700 dark:text-amber-300', label: t('path.recommendation'), icon: SparklesIcon },
    locked: { cls: 'bg-secondary-100 dark:bg-secondary-800 ring-secondary-200 dark:ring-secondary-700 text-secondary-500 dark:text-secondary-400', label: t('path.locked'), icon: LockClosedIcon },
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-secondary-900/80 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center shadow-md">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-secondary-900 dark:text-white leading-tight">
                {t('header.title')}
              </h1>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 leading-tight">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-secondary-100 dark:bg-secondary-800">
            {(['student', 'instructor', 'admin'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === r
                    ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                {t(`header.role${r.charAt(0).toUpperCase() + r.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>

        {role === 'student' && (
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex gap-1 overflow-x-auto">
            {nav.map((n) => (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  section === n.key
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                <n.icon className="w-4 h-4" />
                {n.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label} variant="bordered" padding="sm">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-secondary-900 dark:text-white leading-tight">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-secondary-500 dark:text-secondary-400 leading-tight truncate">
                    {s.label}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {(role === 'instructor' || role === 'admin') && (
          <InstructorPanel
            completion={87}
            engagement={73}
            avgScore={82}
            activeStudents={1248}
            trend={[120, 145, 162, 138, 184, 210, 245]}
            topModules={[
              { name: t('modules.fundamentals'), value: 92 },
              { name: t('modules.intro'), value: 88 },
              { name: t('modules.practice'), value: 74 },
            ]}
            weakModules={[
              { name: t('modules.evaluation'), value: 48 },
              { name: t('modules.project'), value: 39 },
              { name: t('modules.advanced'), value: 31 },
            ]}
            riskStudents={[
              { name: 'Ana Torres', risk: 78 },
              { name: 'Luis Pérez', risk: 55 },
              { name: 'María García', risk: 22 },
            ]}
          />
        )}

        {role === 'student' && section === 'catalog' && (
          <CatalogGrid
            courses={courses}
            search={search}
            setSearch={setSearch}
            levelFilter={levelFilter}
            setLevelFilter={setLevelFilter}
            onOpenDetails={(c) => setOpenCourse(c)}
            onStart={(c) => {
              setCurrentCourseId(c.id);
              setSection('learning');
            }}
          />
        )}

        {role === 'student' && section === 'learning' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                  {t(currentCourse.titleKey)}
                </h2>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {t('catalog.instructor')}: {t(currentCourse.instructorKey)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
                    {t('detail.progress')}
                  </p>
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {currentCourse.progress}%
                  </p>
                </div>
                <div className="w-32 h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                    style={{ width: `${currentCourse.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <PlayerPanel
              courseTitle={t(currentCourse.titleKey)}
              playlist={playlist}
              tutorReplies={tutorReplies}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuizPanel questions={quiz} />

              <Card variant="bordered">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                        {t('path.title')}
                      </h3>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {t('path.subtitle')}
                      </p>
                    </div>
                    <Badge variant="info" size="sm">
                      {t('path.currentLevel')}: {levelLabelFor(currentCourse.level, t)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {pathNodes.map((n, idx) => {
                      const s = pathStateMap[n.state];
                      const Icon = s.icon;
                      return (
                        <div key={n.id} className="flex items-center gap-3">
                          {n.branch && (
                            <div className="w-4 flex justify-center">
                              <div className="w-px h-full bg-secondary-200 dark:bg-secondary-700" />
                            </div>
                          )}
                          <div className={`flex-1 flex items-center gap-3 p-3 rounded-lg ring-1 ${s.cls} ${n.branch ? 'ml-4' : ''}`}>
                            <div className="w-8 h-8 rounded-md bg-white dark:bg-secondary-900 flex items-center justify-center">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{t(n.titleKey)}</p>
                              <p className="text-[11px] opacity-80">{s.label}</p>
                            </div>
                            {idx < pathNodes.length - 1 && !n.branch && (
                              <ArrowRightIcon className="w-4 h-4 text-secondary-300 dark:text-secondary-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {role === 'student' && section === 'live' && <LiveSection sessions={liveSessions} />}

        {role === 'student' && section === 'gamification' && (
          <GamificationSection
            xp={2340}
            level={7}
            nextLevelXp={3000}
            streak={12}
            badges={badges}
            leaderboard={leaderboard}
          />
        )}

        {role === 'student' && section === 'certificates' && (
          <CertificatesSection certificates={certificates} />
        )}
      </main>

      {openCourse && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lms-course-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpenCourse(null)}
        >
          <div
            className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative p-6 bg-gradient-to-br ${openCourse.gradient} text-white`}>
              <button
                onClick={() => setOpenCourse(null)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20"
                aria-label={t('detail.close')}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <div className="flex gap-1.5 mb-3">
                <Badge variant={modeBadgeFor(openCourse.mode, t).variant} size="sm">
                  {modeBadgeFor(openCourse.mode, t).label}
                </Badge>
                <Badge variant="default" size="sm" className="bg-white/20 text-white border-white/20">
                  {levelLabelFor(openCourse.level, t)}
                </Badge>
              </div>
              <h2 id="lms-course-modal-title" className="text-2xl font-black">{t(openCourse.titleKey)}</h2>
              <p className="text-sm opacity-90 mt-1">{t(openCourse.descKey)}</p>
              <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {openCourse.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <StarSolid className="w-4 h-4 text-amber-300" />
                  {openCourse.rating}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  {openCourse.students.toLocaleString()} {t('catalog.students')}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {t('detail.progress')}
                  </h3>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {openCourse.progress}%
                  </span>
                </div>
                <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                    style={{ width: `${openCourse.progress}%` }}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">
                  {t('detail.syllabus')}{' '}
                  <span className="text-xs font-normal text-secondary-500 dark:text-secondary-400">
                    ({openCourse.modules.length} {t('detail.modules')})
                  </span>
                </h3>
                <div className="space-y-2">
                  {openCourse.modules.map((m, idx) => {
                    const expanded = expandedModule === idx;
                    const pct = m.lessons ? Math.round((m.done / m.lessons) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedModule(expanded ? null : idx)}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800/50"
                        >
                          {expanded ? (
                            <ChevronDownIcon className="w-4 h-4 text-secondary-400" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-secondary-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">
                              {t(m.titleKey)}
                            </p>
                            <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
                              {m.lessons} {t('detail.lessons')} · {pct}% {t('detail.completed')}
                            </p>
                          </div>
                          <div className="w-20 h-1.5 bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                        {expanded && (
                          <div className="border-t border-secondary-200 dark:border-secondary-700 p-3 space-y-1.5 bg-secondary-50/60 dark:bg-secondary-800/30">
                            {resources.slice(0, 3).map((r) => {
                              const Icon = resourceIconMap[r.type];
                              return (
                                <div
                                  key={r.id}
                                  className="flex items-center gap-2 text-xs text-secondary-700 dark:text-secondary-200"
                                >
                                  <Icon className="w-4 h-4 text-primary-500" />
                                  <span className="flex-1 truncate">{r.title}</span>
                                  <span className="text-secondary-500 dark:text-secondary-400">
                                    {r.duration}
                                  </span>
                                  <Badge variant="outline" size="sm">
                                    {t(`resources.${r.type}`)}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">
                  {t('detail.resources')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {resources.map((r) => {
                    const Icon = resourceIconMap[r.type];
                    return (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 flex flex-col items-center text-center"
                      >
                        <Icon className="w-5 h-5 text-primary-500 mb-1" />
                        <p className="text-[11px] font-medium text-secondary-800 dark:text-secondary-100">
                          {t(`resources.${r.type}`)}
                        </p>
                        <p className="text-[10px] text-secondary-500 dark:text-secondary-400">
                          {r.duration}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setOpenCourse(null)}
                >
                  {t('detail.close')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    setCurrentCourseId(openCourse.id);
                    setOpenCourse(null);
                    setSection('learning');
                  }}
                >
                  {openCourse.progress > 0 ? t('detail.continue') : t('detail.start')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
