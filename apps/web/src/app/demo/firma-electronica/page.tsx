'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  UserPlusIcon,
  Squares2X2Icon,
  ArrowRightIcon,
  TrashIcon,
  Bars3BottomLeftIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  CheckIcon,
  HashtagIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  IdentificationIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { TemplatesPanel, AuditPanel, ApiPanel, SignerPanel, IntegrationsPanel, AuditModal } from './components/Panels';
import FileDropZone from '@/components/demo/FileDropZone';

type TabKey = 'dashboard' | 'create' | 'templates' | 'audit' | 'api' | 'signer' | 'integrations';
type Status = 'sent' | 'viewed' | 'signed' | 'expired' | 'draft';
type SigType = 'simple' | 'advanced' | 'qualified' | 'ley527';
type AuthMethod = 'sms' | 'email' | 'kyc' | 'video' | 'biometric';
type FieldType = 'signature' | 'initials' | 'date' | 'text' | 'checkbox';
type SignerMode = 'parallel' | 'sequential' | 'conditional';

interface DocRow { id: string; name: string; signers: string[]; type: SigType; status: Status; updated: string; }
interface Signer { id: string; name: string; email: string; role: 'signer' | 'approver' | 'viewer' | 'witness'; order: number; }
interface PlacedField { id: string; type: FieldType; x: number; y: number; signerId: string; }

const STATUS_VARIANT: Record<Status, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  sent: 'info', viewed: 'warning', signed: 'success', expired: 'danger', draft: 'default',
};
const SIG_VARIANT: Record<SigType, 'default' | 'primary' | 'success' | 'info'> = {
  simple: 'default', advanced: 'info', qualified: 'primary', ley527: 'success',
};

const MOCK_DOCS: DocRow[] = [
  { id: 'env_001', name: 'NDA — Pharma Corp', signers: ['Ronald G.', 'Laura M.'], type: 'qualified', status: 'signed', updated: '2026-05-13 14:22' },
  { id: 'env_002', name: 'Contrato laboral — Diego R.', signers: ['Diego R.', 'RRHH'], type: 'advanced', status: 'viewed', updated: '2026-05-13 11:05' },
  { id: 'env_003', name: 'Acuerdo SaaS — Acme', signers: ['Acme CEO', 'Legal', 'CFO'], type: 'qualified', status: 'sent', updated: '2026-05-12 18:40' },
  { id: 'env_004', name: 'Consentimiento clínico', signers: ['Paciente'], type: 'ley527', status: 'signed', updated: '2026-05-12 09:12' },
  { id: 'env_005', name: 'Anexo proveedor logística', signers: ['Proveedor', 'Compras'], type: 'simple', status: 'expired', updated: '2026-05-08 10:30' },
  { id: 'env_006', name: 'Adenda contrato servicios', signers: ['Cliente', 'Ronald G.'], type: 'advanced', status: 'draft', updated: '2026-05-07 16:55' },
];

const FIELD_PALETTE: { type: FieldType; icon: typeof PencilSquareIcon }[] = [
  { type: 'signature', icon: PencilSquareIcon },
  { type: 'initials', icon: HashtagIcon },
  { type: 'date', icon: CalendarDaysIcon },
  { type: 'text', icon: Bars3BottomLeftIcon },
  { type: 'checkbox', icon: CheckIcon },
];

const AUTH_OPTIONS: { id: AuthMethod; icon: typeof DevicePhoneMobileIcon }[] = [
  { id: 'sms', icon: DevicePhoneMobileIcon },
  { id: 'email', icon: EnvelopeIcon },
  { id: 'kyc', icon: IdentificationIcon },
  { id: 'video', icon: VideoCameraIcon },
  { id: 'biometric', icon: FingerPrintIcon },
];

function StatusIcon({ status }: { status: Status }) {
  if (status === 'signed') return <CheckBadgeIcon className="w-4 h-4" />;
  if (status === 'viewed') return <EyeIcon className="w-4 h-4" />;
  if (status === 'sent') return <PaperAirplaneIcon className="w-4 h-4" />;
  if (status === 'expired') return <ExclamationTriangleIcon className="w-4 h-4" />;
  return <DocumentTextIcon className="w-4 h-4" />;
}

export default function FirmaElectronicaDemo() {
  const t = useTranslations('demoSign');
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [auditDoc, setAuditDoc] = useState<DocRow | null>(null);

  // Wizard
  const [step, setStep] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [signerMode, setSignerMode] = useState<SignerMode>('sequential');
  const [signers, setSigners] = useState<Signer[]>([
    { id: 's1', name: 'Ronald G.', email: 'ronald@koptup.io', role: 'signer', order: 1 },
    { id: 's2', name: 'Diego R.', email: 'diego@acme.com', role: 'approver', order: 2 },
  ]);
  const [fields, setFields] = useState<PlacedField[]>([
    { id: 'f1', type: 'signature', x: 30, y: 65, signerId: 's1' },
    { id: 'f2', type: 'date', x: 60, y: 65, signerId: 's1' },
    { id: 'f3', type: 'initials', x: 80, y: 30, signerId: 's2' },
  ]);
  const [draggingField, setDraggingField] = useState<FieldType | null>(null);
  const [auth, setAuth] = useState<AuthMethod>('sms');
  const [sigType, setSigType] = useState<SigType>('advanced');
  const [expiry, setExpiry] = useState(14);
  const [reminderEvery, setReminderEvery] = useState(3);
  const [redlines, setRedlines] = useState(false);
  const [blockchainTs, setBlockchainTs] = useState(true);

  const [search, setSearch] = useState('');
  const [comments, setComments] = useState([
    { id: 'c1', author: 'Legal', text: 'Cláusula 4.2: precisar SLA mensual.', status: 'open' as 'open' | 'accepted' | 'rejected' },
    { id: 'c2', author: 'Acme CEO', text: 'Sugiero limitar la responsabilidad a 12 meses.', status: 'open' as 'open' | 'accepted' | 'rejected' },
  ]);
  const [newComment, setNewComment] = useState('');

  const stats = useMemo(() => {
    const pending = MOCK_DOCS.filter((d) => d.status === 'sent' || d.status === 'viewed').length;
    const signed = MOCK_DOCS.filter((d) => d.status === 'signed').length;
    return { pending, signed: signed * 14, completion: 92, avg: 8 };
  }, []);

  const filteredDocs = useMemo(
    () => MOCK_DOCS.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const tabs: { key: TabKey; icon: typeof Squares2X2Icon }[] = [
    { key: 'dashboard', icon: Squares2X2Icon },
    { key: 'create', icon: PlusIcon },
    { key: 'templates', icon: DocumentTextIcon },
    { key: 'audit', icon: ShieldCheckIcon },
    { key: 'api', icon: CodeBracketIcon },
    { key: 'signer', icon: EyeIcon },
    { key: 'integrations', icon: PuzzlePieceIcon },
  ];

  const addSigner = () => {
    const id = `s${signers.length + 1}`;
    setSigners([...signers, { id, name: '', email: '', role: 'signer', order: signers.length + 1 }]);
  };
  const removeSigner = (id: string) => setSigners(signers.filter((s) => s.id !== id));
  const updateSigner = (id: string, patch: Partial<Signer>) =>
    setSigners(signers.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleDropOnPreview = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggingField) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = `f${fields.length + 1}_${Date.now()}`;
    setFields([...fields, { id, type: draggingField, x, y, signerId: signers[0]?.id || 's1' }]);
    setDraggingField(null);
  };

  const stepLabels = ['upload', 'signers', 'fields', 'security'] as const;

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 text-secondary-900 dark:text-white">
      <header className="border-b border-secondary-200 dark:border-secondary-800 bg-white/80 dark:bg-secondary-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/demo" className="inline-flex items-center text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-1" /> {t('back')}
            </Link>
            <span className="hidden md:block w-px h-6 bg-secondary-200 dark:bg-secondary-700" />
            <div className="hidden md:flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-lime-600 to-lime-800 flex items-center justify-center text-white shadow-md">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight tracking-tight">{t('pageTitle')}</h1>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Koptup Sign</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['eidas', 'esign', 'ueta', 'ley527', 'nom151'] as const).map((k) => (
              <Badge key={k} variant={k === 'eidas' || k === 'ley527' ? 'success' : 'info'} size="sm">
                <ShieldCheckIcon className="w-3 h-3 mr-1" /> {t(`compliance.${k}`)}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-lime-600 to-lime-800 text-white p-6 md:p-8 shadow-lg">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="w-8 h-8 md:w-10 md:h-10 shrink-0 opacity-90" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
              <p className="text-lg text-lime-50/90 mt-2 max-w-3xl">{t('pageSubtitle')}</p>
            </div>
          </div>
        </section>

        <nav className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-1 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-1 w-max min-w-full">
            {tabs.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  tab === key
                    ? 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {t(`tabs.${key}`)}
              </button>
            ))}
          </div>
        </nav>

        {tab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'pending', value: stats.pending, icon: ClockIcon, color: 'from-amber-500 to-orange-600' },
                { key: 'signedMonth', value: stats.signed, icon: CheckBadgeIcon, color: 'from-green-500 to-emerald-600' },
                { key: 'completion', value: `${stats.completion}%`, icon: SparklesIcon, color: 'from-blue-500 to-indigo-600' },
                { key: 'avgTime', value: `${stats.avg} ${t('metrics.minutes')}`, icon: BellAlertIcon, color: 'from-primary-500 to-primary-700' },
              ].map(({ key, value, icon: Icon, color }) => (
                <Card key={key} variant="bordered" className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t(`metrics.${key}`)}</p>
                      <p className="text-3xl font-bold mt-2">{value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card variant="bordered">
              <CardHeader><CardTitle className="text-lg">{t('types.title')}</CardTitle></CardHeader>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(['simple', 'advanced', 'qualified', 'ley527'] as SigType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSigType(s)}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      sigType === s
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 shadow-sm'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                    }`}
                  >
                    <Badge variant={SIG_VARIANT[s]} size="sm">{t(`types.${s}`)}</Badge>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2 leading-snug">{t(`types.${s}Desc`)}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card variant="bordered">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <CardTitle className="text-lg">{t('documents.title')}</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input placeholder={t('documents.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-64" />
                  <Button size="sm" onClick={() => setTab('create')}><PlusIcon className="w-4 h-4 mr-1" /> {t('documents.newEnvelope')}</Button>
                </div>
              </div>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-800">
                    <tr>
                      <th className="py-2.5 pr-4">{t('documents.headers.name')}</th>
                      <th className="py-2.5 pr-4">{t('documents.headers.signers')}</th>
                      <th className="py-2.5 pr-4">{t('documents.headers.type')}</th>
                      <th className="py-2.5 pr-4">{t('documents.headers.status')}</th>
                      <th className="py-2.5 pr-4 hidden md:table-cell">{t('documents.headers.updated')}</th>
                      <th className="py-2.5 pr-4">{t('documents.headers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                    {filteredDocs.map((d) => (
                      <tr key={d.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-secondary-400" />
                            <span className="font-medium">{d.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-secondary-600 dark:text-secondary-400">{d.signers.join(', ')}</td>
                        <td className="py-3 pr-4"><Badge variant={SIG_VARIANT[d.type]} size="sm">{t(`types.${d.type}`)}</Badge></td>
                        <td className="py-3 pr-4">
                          <Badge variant={STATUS_VARIANT[d.status]} size="sm">
                            <StatusIcon status={d.status} /><span className="ml-1">{t(`documents.status.${d.status}`)}</span>
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell text-secondary-500 dark:text-secondary-400">{d.updated}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAuditDoc(d)} className="text-xs font-medium px-2 py-1 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950">
                              {t('documents.actions.audit')}
                            </button>
                            {d.status !== 'signed' && d.status !== 'expired' && (
                              <button className="text-xs font-medium px-2 py-1 rounded text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800">
                                {t('documents.actions.remind')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab === 'create' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card variant="bordered">
              <div className="mb-6">
                <CardTitle className="text-lg">{t('wizard.title')}</CardTitle>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('wizard.subtitle')}</p>
              </div>
              <ol className="flex items-center w-full mb-8 overflow-x-auto pb-2">
                {stepLabels.map((label, idx) => {
                  const active = step === idx;
                  const done = step > idx;
                  return (
                    <li key={label} className="flex items-center flex-1 min-w-max">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          done ? 'bg-green-500 text-white' : active ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950' : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300'
                        }`}>
                          {done ? <CheckIcon className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-sm font-medium ${active ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-600 dark:text-secondary-400'}`}>
                          {t(`wizard.steps.${label}.label`)}
                        </span>
                      </div>
                      {idx < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${done ? 'bg-green-500' : 'bg-secondary-200 dark:bg-secondary-700'}`} />}
                    </li>
                  );
                })}
              </ol>

              {step === 0 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-semibold">{t('wizard.steps.upload.title')}</h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.steps.upload.subtitle')}</p>
                  </div>
                  <FileDropZone
                    label={t('wizard.steps.upload.drag')}
                    hint={t('wizard.steps.upload.types')}
                    onFilesAdded={() => setUploaded(true)}
                  />
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setUploaded(true); }}>
                    <DocumentTextIcon className="w-4 h-4 mr-1" /> {t('wizard.steps.upload.useTemplate')}
                  </Button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-semibold">{t('wizard.steps.signers.title')}</h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.steps.signers.subtitle')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['parallel', 'sequential', 'conditional'] as SignerMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSignerMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          signerMode === m
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium'
                            : 'border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400 hover:border-primary-300'
                        }`}
                      >
                        {t(`wizard.steps.signers.modes.${m}`)}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {signers.map((s, idx) => (
                      <div key={s.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
                        <div className="col-span-1 flex items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                        </div>
                        <Input className="col-span-3" placeholder={t('wizard.steps.signers.name')} value={s.name} onChange={(e) => updateSigner(s.id, { name: e.target.value })} />
                        <Input className="col-span-4" placeholder={t('wizard.steps.signers.email')} value={s.email} onChange={(e) => updateSigner(s.id, { email: e.target.value })} />
                        <select
                          className="col-span-3 block w-full rounded-lg border border-secondary-300 dark:border-secondary-600 px-3 py-2.5 bg-white dark:bg-secondary-800 text-sm"
                          value={s.role}
                          onChange={(e) => updateSigner(s.id, { role: e.target.value as Signer['role'] })}
                        >
                          {(['signer', 'approver', 'viewer', 'witness'] as const).map((r) => (
                            <option key={r} value={r}>{t(`wizard.steps.signers.roles.${r}`)}</option>
                          ))}
                        </select>
                        <button onClick={() => removeSigner(s.id)} className="col-span-1 text-secondary-400 hover:text-red-500 justify-self-center" aria-label="remove">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addSigner}><UserPlusIcon className="w-4 h-4 mr-1" /> {t('wizard.steps.signers.addSigner')}</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-semibold">{t('wizard.steps.fields.title')}</h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.steps.fields.subtitle')}</p>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-3">
                      <p className="text-xs uppercase tracking-wide text-secondary-500 mb-2">{t('wizard.steps.fields.palette')}</p>
                      <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                        {FIELD_PALETTE.map(({ type, icon: Icon }) => (
                          <div
                            key={type}
                            draggable
                            onDragStart={() => setDraggingField(type)}
                            onDragEnd={() => setDraggingField(null)}
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 cursor-grab hover:border-primary-400 hover:shadow-sm transition-all active:cursor-grabbing"
                          >
                            <Icon className="w-4 h-4 text-primary-600" />
                            <span className="text-sm">{t(`wizard.steps.fields.types.${type}`)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-secondary-500 mt-3">{fields.length} {t('wizard.steps.fields.fieldsPlaced')}</p>
                    </div>
                    <div className="col-span-12 md:col-span-9">
                      <p className="text-xs uppercase tracking-wide text-secondary-500 mb-2">{t('wizard.steps.fields.preview')}</p>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropOnPreview}
                        className="relative aspect-[8.5/11] bg-white dark:bg-secondary-100 rounded-lg border border-secondary-300 shadow-inner overflow-hidden"
                      >
                        <div className="absolute inset-0 p-8 text-secondary-700 select-none pointer-events-none">
                          <div className="text-xs text-secondary-400">{t('wizard.steps.fields.pagePlaceholder')}</div>
                          <div className="mt-4 space-y-2">
                            {[3, 5, 4, 2, 0, 5, 4, 3].map((w, i) => (
                              <div key={i} className={`h-2 bg-secondary-200 rounded`} style={{ width: w === 0 ? '0' : `${50 + w * 8}%`, marginTop: w === 0 ? '1rem' : undefined }} />
                            ))}
                          </div>
                        </div>
                        {fields.map((f) => {
                          const Icon = FIELD_PALETTE.find((p) => p.type === f.type)?.icon || PencilSquareIcon;
                          return (
                            <div
                              key={f.id}
                              className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-primary-100 border-2 border-dashed border-primary-500 text-primary-800 text-xs font-medium flex items-center gap-1 shadow-sm"
                              style={{ left: `${f.x}%`, top: `${f.y}%` }}
                            >
                              <Icon className="w-3 h-3" /> {t(`wizard.steps.fields.types.${f.type}`)}
                            </div>
                          );
                        })}
                        {draggingField && (
                          <div className="absolute inset-0 bg-primary-500/10 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center text-primary-700 font-medium text-sm">
                            {t('wizard.steps.fields.dropHere')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-semibold">{t('wizard.steps.security.title')}</h3>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.steps.security.subtitle')}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-secondary-500 mb-2">{t('wizard.steps.security.authMethod')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {AUTH_OPTIONS.map(({ id, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setAuth(id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            auth === id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 shadow-sm' : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${auth === id ? 'text-primary-600' : 'text-secondary-500'}`} />
                          <p className="text-sm font-medium mt-1.5">{t(`wizard.steps.security.auth.${id}`)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-secondary-500 mb-2">{t('wizard.steps.security.signatureType')}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['simple', 'advanced', 'qualified', 'ley527'] as SigType[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSigType(s)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            sigType === s ? 'bg-primary-600 text-white shadow-sm' : 'bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400'
                          }`}
                        >
                          {t(`types.${s}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('wizard.steps.security.expiry')}</label>
                      <Input type="number" value={expiry} onChange={(e) => setExpiry(Number(e.target.value))} min={1} max={90} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t('wizard.steps.security.reminders')} ({t('wizard.steps.security.days')})</label>
                      <Input type="number" value={reminderEvery} onChange={(e) => setReminderEvery(Number(e.target.value))} min={1} max={30} />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:border-primary-400 transition-colors">
                    <input type="checkbox" checked={redlines} onChange={(e) => setRedlines(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary-600" />
                    <div>
                      <p className="text-sm font-medium">{t('wizard.steps.security.redlines')}</p>
                      <p className="text-xs text-secondary-500">{t('wizard.steps.security.redlinesHelp')}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:border-primary-400 transition-colors">
                    <input type="checkbox" checked={blockchainTs} onChange={(e) => setBlockchainTs(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary-600" />
                    <div>
                      <p className="text-sm font-medium">{t('audit.blockchainTs')}</p>
                      <p className="text-xs text-secondary-500">{blockchainTs ? t('audit.blockchainEnabled') : t('audit.blockchainDisabled')}</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-5 border-t border-secondary-200 dark:border-secondary-800">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
                  <ArrowLeftIcon className="w-4 h-4 mr-1" /> {t('wizard.back')}
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">{t('wizard.saveDraft')}</Button>
                  {step < stepLabels.length - 1 ? (
                    <Button onClick={() => setStep(step + 1)}>{t('wizard.next')}<ArrowRightIcon className="w-4 h-4 ml-1" /></Button>
                  ) : (
                    <Button onClick={() => { setTab('dashboard'); setStep(0); }}>
                      <PaperAirplaneIcon className="w-4 h-4 mr-1" /> {t('wizard.send')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {redlines && (
              <Card variant="bordered">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-lg">{t('redlines.title')}</CardTitle>
                  <Badge variant="info" size="sm"><ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" /> {t('redlines.suggestMode')}</Badge>
                </div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('redlines.subtitle')}</p>
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/60 dark:bg-secondary-800/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{c.author}</p>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{c.text}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.status === 'open' ? (
                            <>
                              <button onClick={() => setComments(comments.map((x) => (x.id === c.id ? { ...x, status: 'accepted' } : x)))} className="text-xs px-2 py-1 rounded text-green-700 hover:bg-green-100 dark:hover:bg-green-950">{t('redlines.accept')}</button>
                              <button onClick={() => setComments(comments.map((x) => (x.id === c.id ? { ...x, status: 'rejected' } : x)))} className="text-xs px-2 py-1 rounded text-red-700 hover:bg-red-100 dark:hover:bg-red-950">{t('redlines.reject')}</button>
                            </>
                          ) : (
                            <Badge variant={c.status === 'accepted' ? 'success' : 'danger'} size="sm">{c.status}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Textarea rows={2} placeholder={t('redlines.addComment')} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  <Button size="sm" onClick={() => {
                    if (!newComment.trim()) return;
                    setComments([...comments, { id: `c${comments.length + 1}`, author: 'You', text: newComment, status: 'open' }]);
                    setNewComment('');
                  }}><PlusIcon className="w-4 h-4" /></Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === 'templates' && <TemplatesPanel onUse={() => setTab('create')} />}
        {tab === 'audit' && <AuditPanel blockchainTs={blockchainTs} />}
        {tab === 'api' && <ApiPanel />}
        {tab === 'signer' && <SignerPanel />}
        {tab === 'integrations' && <IntegrationsPanel />}
      </main>

      {auditDoc && <AuditModal doc={auditDoc} onClose={() => setAuditDoc(null)} />}
    </div>
  );
}
