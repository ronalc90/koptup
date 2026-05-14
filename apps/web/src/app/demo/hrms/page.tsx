'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  UsersIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChartBarIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CakeIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  StarIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PerformanceTab from './components/PerformanceTab';
import PayrollTab from './components/PayrollTab';
import LearningTab from './components/LearningTab';

type TabId = 'dashboard' | 'people' | 'talent' | 'performance' | 'payroll' | 'learning';
type AtsStage = 'sourced' | 'screening' | 'interview' | 'offer' | 'hired';
type FitLevel = 'great' | 'good' | 'avg';
type ComplianceState = 'ok' | 'warn' | 'fail';

interface Person {
  id: number;
  name: string;
  role: string;
  department: string;
  site: string;
  country: 'CO' | 'MX' | 'AR' | 'PE';
  email: string;
  phone: string;
  joined: string;
  manager: string;
  salary: number;
  band: string;
  birthday: string;
  initials: string;
  color: string;
}

interface Candidate {
  id: number;
  name: string;
  role: string;
  stage: AtsStage;
  fit: FitLevel;
  score: number;
  experience: number;
  source: string;
}

interface OrgNode {
  id: number;
  name: string;
  role: string;
  children?: OrgNode[];
}

interface VacationRequest {
  id: number;
  employee: string;
  days: number;
  from: string;
  to: string;
}

const COLORS = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-pink-500',
];

export default function HrmsDemo() {
  const t = useTranslations('demoHrms');
  const [tab, setTab] = useState<TabId>('dashboard');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [showMobile, setShowMobile] = useState(false);
  const [orgExpanded, setOrgExpanded] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });
  const [onboardingTab, setOnboardingTab] = useState<'on' | 'off'>('on');
  const [vacations, setVacations] = useState<VacationRequest[]>([
    { id: 1, employee: 'Camila Rojas', days: 7, from: '2026-06-02', to: '2026-06-09' },
    { id: 2, employee: 'Diego Fernández', days: 3, from: '2026-05-28', to: '2026-05-31' },
    { id: 3, employee: 'Luisa Martínez', days: 10, from: '2026-07-15', to: '2026-07-25' },
  ]);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const people = useMemo<Person[]>(() => [
    { id: 1, name: 'Camila Rojas', role: 'Senior Frontend Dev', department: 'Tech', site: 'Bogotá', country: 'CO', email: 'camila.rojas@koptup.io', phone: '+57 300 123 4567', joined: '2022-03-14', manager: 'Andrés Gómez', salary: 8500000, band: 'IC4', birthday: '2026-05-22', initials: 'CR', color: COLORS[0] },
    { id: 2, name: 'Diego Fernández', role: 'Product Designer', department: 'Product', site: 'CDMX', country: 'MX', email: 'diego.fernandez@koptup.io', phone: '+52 55 4321 8765', joined: '2021-09-01', manager: 'Lucía Vega', salary: 65000, band: 'IC4', birthday: '2026-05-19', initials: 'DF', color: COLORS[1] },
    { id: 3, name: 'Luisa Martínez', role: 'People Partner', department: 'People', site: 'Bogotá', country: 'CO', email: 'luisa.martinez@koptup.io', phone: '+57 311 555 8899', joined: '2023-02-10', manager: 'Carolina Páez', salary: 6200000, band: 'P3', birthday: '2026-06-04', initials: 'LM', color: COLORS[2] },
    { id: 4, name: 'Andrés Gómez', role: 'Engineering Manager', department: 'Tech', site: 'Medellín', country: 'CO', email: 'andres.gomez@koptup.io', phone: '+57 320 778 1144', joined: '2019-11-04', manager: 'Carolina Páez', salary: 14500000, band: 'M3', birthday: '2026-08-30', initials: 'AG', color: COLORS[3] },
    { id: 5, name: 'Mariana López', role: 'Data Analyst', department: 'Data', site: 'Buenos Aires', country: 'AR', email: 'mariana.lopez@koptup.io', phone: '+54 11 4455 6677', joined: '2024-01-15', manager: 'Andrés Gómez', salary: 850000, band: 'IC3', birthday: '2026-05-27', initials: 'ML', color: COLORS[4] },
    { id: 6, name: 'Sebastián Ruiz', role: 'DevOps Engineer', department: 'Tech', site: 'Lima', country: 'PE', email: 'sebastian.ruiz@koptup.io', phone: '+51 9 1234 5678', joined: '2022-07-21', manager: 'Andrés Gómez', salary: 9800, band: 'IC4', birthday: '2026-09-12', initials: 'SR', color: COLORS[5] },
    { id: 7, name: 'Valentina Cruz', role: 'Recruiter', department: 'People', site: 'CDMX', country: 'MX', email: 'valentina.cruz@koptup.io', phone: '+52 55 9988 2211', joined: '2023-05-09', manager: 'Carolina Páez', salary: 42000, band: 'P2', birthday: '2026-05-21', initials: 'VC', color: COLORS[0] },
    { id: 8, name: 'Jorge Salas', role: 'Backend Dev', department: 'Tech', site: 'Bogotá', country: 'CO', email: 'jorge.salas@koptup.io', phone: '+57 315 442 7799', joined: '2021-04-12', manager: 'Andrés Gómez', salary: 7800000, band: 'IC4', birthday: '2026-11-02', initials: 'JS', color: COLORS[1] },
    { id: 9, name: 'Carolina Páez', role: 'Chief People Officer', department: 'People', site: 'Bogotá', country: 'CO', email: 'carolina.paez@koptup.io', phone: '+57 318 221 4455', joined: '2018-01-08', manager: 'CEO', salary: 22000000, band: 'D1', birthday: '2026-12-14', initials: 'CP', color: COLORS[2] },
    { id: 10, name: 'Felipe Quintero', role: 'QA Lead', department: 'Tech', site: 'Medellín', country: 'CO', email: 'felipe.q@koptup.io', phone: '+57 322 005 1199', joined: '2020-08-22', manager: 'Andrés Gómez', salary: 9100000, band: 'IC5', birthday: '2026-10-03', initials: 'FQ', color: COLORS[3] },
    { id: 11, name: 'Ana Suárez', role: 'Finance Analyst', department: 'Finance', site: 'Bogotá', country: 'CO', email: 'ana.suarez@koptup.io', phone: '+57 310 887 6543', joined: '2023-09-04', manager: 'Carolina Páez', salary: 5500000, band: 'P2', birthday: '2026-06-08', initials: 'AS', color: COLORS[4] },
    { id: 12, name: 'Lucía Vega', role: 'Head of Product', department: 'Product', site: 'CDMX', country: 'MX', email: 'lucia.vega@koptup.io', phone: '+52 55 1122 3344', joined: '2020-02-17', manager: 'CEO', salary: 95000, band: 'D1', birthday: '2026-07-19', initials: 'LV', color: COLORS[5] },
  ], []);

  const candidates: Candidate[] = [
    { id: 1, name: 'Tomás Herrera', role: 'Frontend Dev', stage: 'sourced', fit: 'great', score: 92, experience: 5, source: 'LinkedIn' },
    { id: 2, name: 'Sofía Cabrera', role: 'Product Designer', stage: 'sourced', fit: 'good', score: 81, experience: 4, source: 'Referral' },
    { id: 3, name: 'Mateo Núñez', role: 'Backend Dev', stage: 'screening', fit: 'great', score: 89, experience: 6, source: 'GitHub' },
    { id: 4, name: 'Paula Restrepo', role: 'Data Engineer', stage: 'screening', fit: 'avg', score: 65, experience: 3, source: 'Get on Board' },
    { id: 5, name: 'Bruno Castaño', role: 'DevOps', stage: 'interview', fit: 'great', score: 94, experience: 7, source: 'LinkedIn' },
    { id: 6, name: 'Renata Silva', role: 'QA Engineer', stage: 'interview', fit: 'good', score: 78, experience: 4, source: 'Referral' },
    { id: 7, name: 'Iván Moreno', role: 'Frontend Dev', stage: 'offer', fit: 'great', score: 91, experience: 5, source: 'LinkedIn' },
    { id: 8, name: 'Daniela Pinto', role: 'Recruiter', stage: 'hired', fit: 'good', score: 84, experience: 3, source: 'Referral' },
  ];

  const orgTree: OrgNode = {
    id: 1, name: 'Carolina Páez', role: 'CPO', children: [
      { id: 2, name: 'Andrés Gómez', role: 'Engineering Manager', children: [
        { id: 5, name: 'Camila Rojas', role: 'Senior Frontend' },
        { id: 6, name: 'Jorge Salas', role: 'Backend Dev' },
        { id: 7, name: 'Felipe Quintero', role: 'QA Lead' },
      ] },
      { id: 3, name: 'Lucía Vega', role: 'Head of Product', children: [
        { id: 8, name: 'Diego Fernández', role: 'Product Designer' },
      ] },
      { id: 4, name: 'Luisa Martínez', role: 'People Partner', children: [
        { id: 9, name: 'Valentina Cruz', role: 'Recruiter' },
      ] },
    ],
  };

  const tabs: { id: TabId; icon: typeof UsersIcon; label: string }[] = [
    { id: 'dashboard', icon: ChartBarIcon, label: t('tabs.dashboard') },
    { id: 'people', icon: UsersIcon, label: t('tabs.people') },
    { id: 'talent', icon: BriefcaseIcon, label: t('tabs.talent') },
    { id: 'performance', icon: StarIcon, label: t('tabs.performance') },
    { id: 'payroll', icon: BanknotesIcon, label: t('tabs.payroll') },
    { id: 'learning', icon: AcademicCapIcon, label: t('tabs.learning') },
  ];

  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase());
      const matchesDept = filterDept === 'all' || p.department === filterDept;
      const matchesSite = filterSite === 'all' || p.site === filterSite;
      return matchesSearch && matchesDept && matchesSite;
    });
  }, [people, search, filterDept, filterSite]);

  const pagedPeople = filteredPeople.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / pageSize));

  const departments = Array.from(new Set(people.map((p) => p.department)));
  const sites = Array.from(new Set(people.map((p) => p.site)));

  const fitColor = (fit: FitLevel) =>
    fit === 'great' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : fit === 'good' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  const complianceTone = (s: ComplianceState): 'success' | 'warning' | 'danger' =>
    s === 'ok' ? 'success' : s === 'warn' ? 'warning' : 'danger';

  const approveVacation = (id: number) => setVacations((v) => v.filter((r) => r.id !== id));
  const toggleOrg = (id: number) => setOrgExpanded((s) => ({ ...s, [id]: !s[id] }));

  const renderOrgNode = (node: OrgNode, depth = 0) => {
    const expanded = orgExpanded[node.id] ?? false;
    return (
      <div key={node.id} className="relative">
        <div className={`flex items-center gap-2 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 ${depth > 0 ? 'ml-6' : ''}`}>
          {node.children && node.children.length > 0 ? (
            <button onClick={() => toggleOrg(node.id)} className="p-0.5">
              {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-xs font-bold">
            {node.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary-900 dark:text-white text-sm truncate">{node.name}</p>
            <p className="text-xs text-secondary-500 truncate">{node.role}</p>
          </div>
        </div>
        {expanded && node.children && (
          <div className="mt-2 space-y-2 border-l-2 border-dashed border-secondary-300 dark:border-secondary-700 pl-2">
            {node.children.map((c) => renderOrgNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const kpis = [
    { icon: UsersIcon, key: 'headcount', value: '482', delta: '+12', up: true },
    { icon: ArrowTrendingDownIcon, key: 'turnover', value: '8.4%', delta: '-1.2', up: true },
    { icon: SparklesIcon, key: 'enps', value: '+42', delta: '+5', up: true },
    { icon: BanknotesIcon, key: 'hrCost', value: '$1.84M', delta: '+2.1%', up: false },
    { icon: BriefcaseIcon, key: 'openRoles', value: '14', delta: '+3', up: false },
    { icon: ClockIcon, key: 'absenteeism', value: '3.2%', delta: '-0.4', up: true },
  ];

  const compliance: { c: string; s: ComplianceState }[] = [
    { c: 'co', s: 'ok' }, { c: 'mx', s: 'ok' }, { c: 'ar', s: 'warn' }, { c: 'pe', s: 'ok' },
  ];

  const onboardingEmps = onboardingTab === 'on'
    ? [
        { name: 'Iván Moreno', role: 'Frontend Dev', tasks: [{ name: 'Equipo asignado', done: true }, { name: 'Accesos', done: true }, { name: 'Buddy', done: false }, { name: 'Training inicial', done: false }], owner: 'Luisa M.', signed: true },
        { name: 'Daniela Pinto', role: 'Recruiter', tasks: [{ name: 'Contrato', done: true }, { name: 'Equipo', done: false }, { name: 'Onboarding 30/60/90', done: false }], owner: 'Valentina C.', signed: true },
      ]
    : [
        { name: 'Carlos Mejía', role: 'QA Engineer', tasks: [{ name: 'Knowledge transfer', done: true }, { name: 'Devolución equipos', done: false }, { name: 'Liquidación', done: false }], owner: 'Felipe Q.', signed: false },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
            <p className="text-lg text-violet-50/90 mt-2 max-w-3xl">{t('pageSubtitle')}</p>
          </div>
          <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/30 text-white" onClick={() => setShowMobile((s) => !s)}>
            <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
            {showMobile ? t('mobile.hide') : t('mobile.show')}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((tb) => {
            const Icon = tb.icon;
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => { setTab(tb.id); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
                  active
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-white dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 border border-secondary-200 dark:border-secondary-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('dashboard.title')}</h2>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t('dashboard.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kpis.map((k) => {
                  const Icon = k.icon;
                  return (
                    <Card key={k.key} variant="bordered" padding="sm">
                      <div className="flex items-start justify-between">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <Badge variant={k.up ? 'success' : 'warning'} size="sm">{k.delta}</Badge>
                      </div>
                      <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-3">{k.value}</p>
                      <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 mt-1">{t(`dashboard.kpis.${k.key}`)}</p>
                      <p className="text-xs text-secondary-500">{t(`dashboard.kpis.${k.key}Sub`)}</p>
                    </Card>
                  );
                })}
              </div>

              <Card variant="bordered">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-secondary-900 dark:text-white">{t('dashboard.moodChart.title')}</h3>
                    <p className="text-xs text-secondary-500">{t('dashboard.moodChart.subtitle')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary-500">{t('dashboard.moodChart.current')}</p>
                    <p className="text-2xl font-bold text-emerald-600">7.8</p>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-32">
                  {[6.2, 6.5, 6.4, 6.8, 7.0, 6.9, 7.2, 7.1, 7.4, 7.3, 7.5, 7.6, 7.4, 7.7, 7.8, 7.6, 7.9, 7.8, 7.5, 7.7, 7.9, 8.0, 7.8, 7.9, 7.7, 7.8, 8.0, 8.1, 7.9, 7.8].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary-200 to-primary-500" style={{ height: `${(v / 10) * 100}%` }} />
                  ))}
                </div>
              </Card>

              <Card variant="bordered">
                <div className="mb-4">
                  <h3 className="font-bold text-secondary-900 dark:text-white">{t('dashboard.compliance.title')}</h3>
                  <p className="text-xs text-secondary-500">{t('dashboard.compliance.subtitle')}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {compliance.map((it) => (
                    <div key={it.c} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-secondary-500" />
                        <span className="font-medium text-sm text-secondary-900 dark:text-white">{t(`dashboard.compliance.${it.c}`)}</span>
                      </div>
                      <Badge variant={complianceTone(it.s)} size="sm">{t(`dashboard.compliance.${it.s}`)}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card variant="bordered" className="border-violet-300 dark:border-violet-700 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-secondary-900">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <h3 className="font-bold text-secondary-900 dark:text-white">{t('dashboard.aiInsights.title')}</h3>
                </div>
                <p className="text-xs text-secondary-500 mb-4">{t('dashboard.aiInsights.subtitle')}</p>
                <div className="space-y-3">
                  {['retention', 'sentiment', 'promotions', 'salary'].map((k) => (
                    <div key={k} className="flex items-start gap-2">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t(`dashboard.aiInsights.${k}`)}</p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">{t(`dashboard.aiInsights.${k}Desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="bordered">
                <div className="flex items-center gap-2 mb-3">
                  <CakeIcon className="w-5 h-5 text-pink-500" />
                  <h3 className="font-bold text-secondary-900 dark:text-white">{t('dashboard.birthdays.title')}</h3>
                </div>
                <p className="text-xs text-secondary-500 mb-3">{t('dashboard.birthdays.subtitle')}</p>
                <div className="space-y-2">
                  {people.filter((p) => p.birthday.startsWith('2026-05') || p.birthday.startsWith('2026-06')).slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${p.color} text-white flex items-center justify-center text-xs font-bold`}>
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs text-secondary-500">{p.role}</p>
                      </div>
                      <span className="text-xs font-semibold text-pink-600">{p.birthday.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card variant="bordered">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDaysIcon className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-secondary-900 dark:text-white">{t('dashboard.vacations.title')}</h3>
                </div>
                <div className="space-y-2">
                  {vacations.length === 0 && (
                    <p className="text-sm text-secondary-500 py-4 text-center">{t('dashboard.vacations.empty')}</p>
                  )}
                  {vacations.map((v) => (
                    <div key={v.id} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-secondary-900 dark:text-white">{v.employee}</p>
                          <p className="text-xs text-secondary-500">{v.from} → {v.to}</p>
                        </div>
                        <Badge variant="info" size="sm">{v.days} {t('dashboard.vacations.days')}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveVacation(v.id)} className="flex-1 px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200">
                          {t('dashboard.vacations.approve')}
                        </button>
                        <button onClick={() => approveVacation(v.id)} className="flex-1 px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-200">
                          {t('dashboard.vacations.reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* PEOPLE */}
        {tab === 'people' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('people.title')}</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t('people.subtitle')}</p>
            </div>

            <Card variant="bordered">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none z-10" />
                  <Input
                    placeholder={t('people.searchPlaceholder')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterDept}
                  onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
                  className="rounded-lg border border-secondary-300 dark:border-secondary-600 px-4 py-2.5 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm"
                >
                  <option value="all">{t('people.filters.allDepts')}</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={filterSite}
                  onChange={(e) => { setFilterSite(e.target.value); setPage(1); }}
                  className="rounded-lg border border-secondary-300 dark:border-secondary-600 px-4 py-2.5 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm"
                >
                  <option value="all">{t('people.filters.allSites')}</option>
                  {sites.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedPeople.map((p) => (
                <Card key={p.id} variant="bordered" padding="md" className="hover:shadow-medium transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.color} text-white flex items-center justify-center font-bold flex-shrink-0`}>
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-secondary-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-secondary-500 truncate">{p.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" size="sm">{p.department}</Badge>
                        <Badge variant="outline" size="sm">{p.country}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-secondary-600 dark:text-secondary-400 space-y-1 mb-3">
                    <p><span className="font-semibold">{t('people.card.joined')}:</span> {p.joined}</p>
                    <p><span className="font-semibold">{t('people.card.manager')}:</span> {p.manager}</p>
                  </div>
                  <Button size="sm" variant="outline" fullWidth onClick={() => setSelectedPerson(p)}>
                    {t('people.card.viewProfile')}
                  </Button>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-500">
                {t('common.showing')} {pagedPeople.length} {t('common.of')} {filteredPeople.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  {t('common.previous')}
                </Button>
                <span className="text-sm font-medium">{page} / {totalPages}</span>
                <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            </div>

            <Card variant="bordered">
              <div className="flex items-center gap-2 mb-1">
                <UserGroupIcon className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-secondary-900 dark:text-white">{t('people.orgChart.title')}</h3>
              </div>
              <p className="text-xs text-secondary-500 mb-4">{t('people.orgChart.subtitle')}</p>
              <div className="space-y-2">{renderOrgNode(orgTree)}</div>
            </Card>
          </div>
        )}

        {/* TALENT */}
        {tab === 'talent' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('talent.title')}</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t('talent.subtitle')}</p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {(['sourced', 'screening', 'interview', 'offer', 'hired'] as AtsStage[]).map((stage) => {
                const stageCandidates = candidates.filter((c) => c.stage === stage);
                return (
                  <div key={stage} className="flex-shrink-0 w-72">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-secondary-900 dark:text-white text-sm">{t(`talent.stages.${stage}`)}</h3>
                      <Badge variant="default" size="sm">{stageCandidates.length}</Badge>
                    </div>
                    <div className="space-y-3 min-h-[100px]">
                      {stageCandidates.map((c) => (
                        <Card key={c.id} variant="bordered" padding="sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-secondary-900 dark:text-white text-sm truncate">{c.name}</p>
                              <p className="text-xs text-secondary-500 truncate">{c.role}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${fitColor(c.fit)}`}>{c.score}</div>
                          </div>
                          <div className="mb-2">
                            <Badge variant="outline" size="sm">{t(`talent.scoring.${c.fit}`)}</Badge>
                          </div>
                          <div className="text-xs text-secondary-500 space-y-1 mb-2">
                            <p>{t('talent.candidate.experience')}: {c.experience} {t('talent.candidate.years')}</p>
                            <p>{t('talent.candidate.source')}: {c.source}</p>
                          </div>
                          {stage === 'sourced' || stage === 'screening' ? (
                            <button className="w-full text-xs font-medium px-2 py-1.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 hover:bg-primary-200 flex items-center justify-center gap-1">
                              <PhoneIcon className="w-3 h-3" />
                              {t('talent.actions.screeningCall')}
                            </button>
                          ) : (
                            <button className="w-full text-xs font-medium px-2 py-1.5 rounded bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200">
                              {t('talent.actions.viewCv')}
                            </button>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Card variant="bordered">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-secondary-900 dark:text-white">{t('talent.onboarding.title')}</h3>
                  <p className="text-xs text-secondary-500">{t('talent.onboarding.subtitle')}</p>
                </div>
                <div className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
                  <button
                    onClick={() => setOnboardingTab('on')}
                    className={`px-3 py-1 text-xs font-medium rounded ${onboardingTab === 'on' ? 'bg-white dark:bg-secondary-700 shadow-sm' : 'text-secondary-600'}`}
                  >
                    {t('talent.onboarding.tabOnboarding')}
                  </button>
                  <button
                    onClick={() => setOnboardingTab('off')}
                    className={`px-3 py-1 text-xs font-medium rounded ${onboardingTab === 'off' ? 'bg-white dark:bg-secondary-700 shadow-sm' : 'text-secondary-600'}`}
                  >
                    {t('talent.onboarding.tabOffboarding')}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {onboardingEmps.map((emp) => {
                  const done = emp.tasks.filter((tk) => tk.done).length;
                  const pct = Math.round((done / emp.tasks.length) * 100);
                  return (
                    <div key={emp.name} className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-secondary-900 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-secondary-500">{emp.role} · {t('talent.onboarding.owner')}: {emp.owner}</p>
                        </div>
                        <Badge variant={emp.signed ? 'success' : 'warning'} size="sm">
                          <DocumentCheckIcon className="w-3 h-3 mr-1 inline" />
                          {t('talent.onboarding.eSign')}: {emp.signed ? t('talent.onboarding.signed') : t('talent.onboarding.pending')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-secondary-500 mb-1">
                        <span>{t('talent.onboarding.progress')}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {emp.tasks.map((task) => (
                          <div key={task.name} className="flex items-center gap-2 text-xs">
                            {task.done ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-secondary-400" />}
                            <span className={task.done ? 'line-through text-secondary-500' : 'text-secondary-700 dark:text-secondary-300'}>
                              {task.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {tab === 'performance' && <PerformanceTab />}
        {tab === 'payroll' && <PayrollTab />}
        {tab === 'learning' && <LearningTab />}
      </div>

      {/* Profile Modal */}
      {selectedPerson && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[150]" onClick={() => setSelectedPerson(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="hrms-profile-title" className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-secondary-900 z-[200] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 p-6 z-10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedPerson.color} text-white flex items-center justify-center text-xl font-bold`}>
                  {selectedPerson.initials}
                </div>
                <div>
                  <h2 id="hrms-profile-title" className="text-xl font-bold text-secondary-900 dark:text-white">{selectedPerson.name}</h2>
                  <p className="text-sm text-secondary-500">{selectedPerson.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPerson(null)} aria-label={t('common.close')} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <section>
                <h3 className="font-bold text-secondary-900 dark:text-white mb-3 text-sm uppercase tracking-wide">{t('people.profile.personal')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4 text-secondary-400" /> {selectedPerson.email}</div>
                  <div className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-secondary-400" /> {selectedPerson.phone}</div>
                  <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-secondary-400" /> {selectedPerson.site}, {selectedPerson.country}</div>
                  <div className="flex items-center gap-2"><CakeIcon className="w-4 h-4 text-secondary-400" /> {selectedPerson.birthday}</div>
                </div>
              </section>
              <section>
                <h3 className="font-bold text-secondary-900 dark:text-white mb-3 text-sm uppercase tracking-wide">{t('people.profile.employment')}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                    <p className="text-xs text-secondary-500">{t('people.card.joined')}</p>
                    <p className="font-semibold">{selectedPerson.joined}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                    <p className="text-xs text-secondary-500">{t('people.profile.contract')}</p>
                    <p className="font-semibold">{t('people.profile.permanent')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                    <p className="text-xs text-secondary-500">{t('common.department')}</p>
                    <p className="font-semibold">{selectedPerson.department}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                    <p className="text-xs text-secondary-500">{t('people.card.manager')}</p>
                    <p className="font-semibold">{selectedPerson.manager}</p>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="font-bold text-secondary-900 dark:text-white mb-3 text-sm uppercase tracking-wide">{t('people.profile.compensation')}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-950">
                    <p className="text-xs text-secondary-500">{t('people.profile.salary')}</p>
                    <p className="font-bold text-primary-700 dark:text-primary-300">
                      {selectedPerson.salary.toLocaleString()} {selectedPerson.country === 'CO' ? 'COP' : selectedPerson.country === 'MX' ? 'MXN' : selectedPerson.country === 'AR' ? 'ARS' : 'USD'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                    <p className="text-xs text-secondary-500">{t('people.profile.band')}</p>
                    <p className="font-semibold">{selectedPerson.band}</p>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="font-bold text-secondary-900 dark:text-white mb-3 text-sm uppercase tracking-wide">{t('people.profile.documents')}</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { name: 'Contrato laboral.pdf', icon: DocumentCheckIcon },
                    { name: 'Acuerdo de confidencialidad.pdf', icon: DocumentCheckIcon },
                    { name: 'Cédula.pdf', icon: IdentificationIcon },
                  ].map((d) => {
                    const Icon = d.icon;
                    return (
                      <div key={d.name} className="flex items-center gap-2 p-2 rounded bg-secondary-50 dark:bg-secondary-800">
                        <Icon className="w-4 h-4 text-secondary-500" />
                        <span className="flex-1">{d.name}</span>
                        <button className="text-xs text-primary-600 hover:underline">{t('common.viewAll')}</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Mobile Self-Service Wireframe */}
      {showMobile && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[150]" onClick={() => setShowMobile(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="hrms-mobile-title" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="bg-secondary-900 rounded-[2rem] p-3 shadow-2xl w-[280px]">
              <div className="bg-gradient-to-br from-primary-50 to-white dark:from-secondary-800 dark:to-secondary-900 rounded-[1.5rem] overflow-hidden">
                <div className="bg-primary-600 text-white p-4">
                  <p className="text-xs opacity-80">{t('mobile.title')}</p>
                  <p className="text-lg font-bold">Camila Rojas</p>
                  <p className="text-xs opacity-80">Senior Frontend Dev</p>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { icon: UsersIcon, label: t('mobile.myProfile') },
                    { icon: CalendarDaysIcon, label: t('mobile.myVacations'), badge: `12 ${t('mobile.days')}` },
                    { icon: BanknotesIcon, label: t('mobile.myPayslip') },
                    { icon: AcademicCapIcon, label: t('mobile.myCourses'), badge: '3' },
                  ].map((it) => {
                    const Icon = it.icon;
                    return (
                      <div key={it.label} className="flex items-center gap-2 p-2.5 bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
                        <Icon className="w-4 h-4 text-primary-600" />
                        <span className="text-xs flex-1 font-medium text-secondary-900 dark:text-white">{it.label}</span>
                        {it.badge && <Badge variant="primary" size="sm">{it.badge}</Badge>}
                      </div>
                    );
                  })}
                  <button className="w-full bg-primary-600 text-white text-xs font-semibold py-2.5 rounded-lg mt-3">
                    {t('mobile.requestTimeOff')}
                  </button>
                </div>
              </div>
              <button onClick={() => setShowMobile(false)} className="w-full mt-3 text-white/70 text-xs hover:text-white">
                {t('common.close')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
