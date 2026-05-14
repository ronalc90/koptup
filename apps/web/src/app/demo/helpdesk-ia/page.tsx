'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  EnvelopeIcon, ChatBubbleBottomCenterTextIcon, ChatBubbleLeftRightIcon, PhoneIcon,
  HashtagIcon, GlobeAltIcon, CameraIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon,
  SparklesIcon, BookOpenIcon, BoltIcon, ArrowPathIcon, PaperAirplaneIcon, StarIcon, XMarkIcon,
  MagnifyingGlassIcon, AdjustmentsHorizontalIcon, CpuChipIcon, PlusIcon, UserCircleIcon, TagIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

// ---------- Types ----------
type Channel = 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'chat' | 'voice';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Sentiment = 'positive' | 'neutral' | 'negative';
type Status = 'open' | 'pending' | 'resolved';

interface ConversationMsg { role: 'agent' | 'customer'; key: string; minutesAgo: number; }
interface InternalNote { id: string; author: string; text: string; minutesAgo: number; }
interface Ticket {
  id: string;
  subjectKey: string;
  previewKey: string;
  customer: string;
  channel: Channel;
  priority: Priority;
  sentiment: Sentiment;
  status: Status;
  slaMinutes: number; // remaining
  createdMinutesAgo: number;
  assignedAgent: string | null;
  brand: 'alpha' | 'beta' | 'gamma';
  department: 'billing' | 'support' | 'sales' | 'retention';
  skills: string[];
  conversation: ConversationMsg[];
  suggestions: { key: string; confidence: number }[];
  initialNotes: InternalNote[];
}

interface AutoReplyLog { id: string; channel: Channel; minutesAgo: number; intent: string; confidence: number; result: 'sent' | 'escalated' | 'queued'; }

// ---------- Static / mock data ----------
const channelIcon: Record<Channel, typeof EnvelopeIcon> = {
  email: EnvelopeIcon,
  whatsapp: ChatBubbleBottomCenterTextIcon,
  instagram: CameraIcon,
  facebook: ChatBubbleLeftRightIcon,
  twitter: HashtagIcon,
  chat: GlobeAltIcon,
  voice: PhoneIcon,
};

const channelColor: Record<Channel, string> = {
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200',
  facebook: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
  twitter: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  chat: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  voice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
};

const priorityVariant: Record<Priority, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const sentimentColor: Record<Sentiment, string> = {
  positive: 'text-green-600 dark:text-green-400',
  neutral: 'text-secondary-500 dark:text-secondary-400',
  negative: 'text-red-600 dark:text-red-400',
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TCK-1041', subjectKey: 't1Subject', previewKey: 't1Preview', customer: 'Lucía Andrade',
    channel: 'email', priority: 'high', sentiment: 'negative', status: 'open', slaMinutes: 18, createdMinutesAgo: 22,
    assignedAgent: 'maria', brand: 'alpha', department: 'billing', skills: ['billing', 'spanish'],
    conversation: [
      { role: 'customer', key: 'customer1', minutesAgo: 22 },
      { role: 'agent', key: 'agent1', minutesAgo: 17 },
      { role: 'customer', key: 'customer2', minutesAgo: 12 },
      { role: 'agent', key: 'agent2', minutesAgo: 6 },
    ],
    suggestions: [
      { key: 's1', confidence: 0.94 },
      { key: 's2', confidence: 0.61 },
    ],
    initialNotes: [{ id: 'n1', author: 'maria', text: 'Cliente VIP, dos reembolsos previos OK.', minutesAgo: 14 }],
  },
  {
    id: 'TCK-1042', subjectKey: 't2Subject', previewKey: 't2Preview', customer: 'Pedro Salas',
    channel: 'chat', priority: 'medium', sentiment: 'neutral', status: 'open', slaMinutes: 45, createdMinutesAgo: 12,
    assignedAgent: 'carlos', brand: 'beta', department: 'support', skills: ['tech', 'spanish'],
    conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 12 }],
    suggestions: [{ key: 's2', confidence: 0.88 }],
    initialNotes: [],
  },
  {
    id: 'TCK-1043', subjectKey: 't3Subject', previewKey: 't3Preview', customer: 'Marta Quiroz',
    channel: 'whatsapp', priority: 'medium', sentiment: 'negative', status: 'pending', slaMinutes: 120, createdMinutesAgo: 60,
    assignedAgent: 'ana', brand: 'gamma', department: 'retention', skills: ['retention', 'spanish'],
    conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 60 }],
    suggestions: [{ key: 's3', confidence: 0.81 }],
    initialNotes: [],
  },
  {
    id: 'TCK-1044', subjectKey: 't4Subject', previewKey: 't4Preview', customer: 'Diego Núñez',
    channel: 'instagram', priority: 'low', sentiment: 'neutral', status: 'open', slaMinutes: 240, createdMinutesAgo: 8,
    assignedAgent: null, brand: 'alpha', department: 'sales', skills: ['spanish'],
    conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 8 }],
    suggestions: [{ key: 's2', confidence: 0.72 }],
    initialNotes: [],
  },
  {
    id: 'TCK-1045', subjectKey: 't5Subject', previewKey: 't5Preview', customer: 'Sofía Castro',
    channel: 'twitter', priority: 'low', sentiment: 'positive', status: 'resolved', slaMinutes: 0, createdMinutesAgo: 180,
    assignedAgent: 'maria', brand: 'alpha', department: 'support', skills: ['spanish'],
    conversation: [{ role: 'customer', key: 'customer2', minutesAgo: 180 }],
    suggestions: [],
    initialNotes: [],
  },
  {
    id: 'TCK-1046', subjectKey: 't6Subject', previewKey: 't6Preview', customer: 'Javier Bravo',
    channel: 'voice', priority: 'urgent', sentiment: 'negative', status: 'open', slaMinutes: 6, createdMinutesAgo: 25,
    assignedAgent: 'luis', brand: 'beta', department: 'support', skills: ['tech', 'spanish'],
    conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 25 }, { role: 'agent', key: 'agent1', minutesAgo: 18 }],
    suggestions: [{ key: 's2', confidence: 0.69 }],
    initialNotes: [{ id: 'n2', author: 'luis', text: 'Sector con incidencia abierta nivel 2.', minutesAgo: 10 }],
  },
  {
    id: 'TCK-1047', subjectKey: 't7Subject', previewKey: 't7Preview', customer: 'Karen Lobos',
    channel: 'email', priority: 'medium', sentiment: 'neutral', status: 'open', slaMinutes: 90, createdMinutesAgo: 30,
    assignedAgent: 'ana', brand: 'gamma', department: 'sales', skills: ['english', 'billing'],
    conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 30 }],
    suggestions: [{ key: 's1', confidence: 0.55 }],
    initialNotes: [],
  },
  {
    id: 'TCK-1048', subjectKey: 't8Subject', previewKey: 't8Preview', customer: 'Roberto Vidal',
    channel: 'facebook', priority: 'urgent', sentiment: 'negative', status: 'open', slaMinutes: 12, createdMinutesAgo: 40,
    assignedAgent: null, brand: 'alpha', department: 'billing', skills: ['billing', 'vip', 'spanish'],
    conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 40 }],
    suggestions: [{ key: 's1', confidence: 0.91 }],
    initialNotes: [],
  },
];

const KB_ARTICLES = [
  { id: 'a1', views: 4821, tags: ['billing', 'refund'] },
  { id: 'a2', views: 9120, tags: ['auth', 'password'] },
  { id: 'a3', views: 2310, tags: ['shipping'] },
  { id: 'a4', views: 1654, tags: ['warranty'] },
  { id: 'a5', views: 3402, tags: ['auth', '2fa'] },
  { id: 'a6', views: 5210, tags: ['tech', 'network'] },
];

const MACROS_RUNS = [142, 87, 64, 31];

const INITIAL_AUTOREPLY_LOG: AutoReplyLog[] = [
  { id: 'l1', channel: 'whatsapp', minutesAgo: 3, intent: 'FAQ: password reset', confidence: 0.96, result: 'sent' },
  { id: 'l2', channel: 'email', minutesAgo: 8, intent: 'Shipping status', confidence: 0.89, result: 'sent' },
  { id: 'l3', channel: 'chat', minutesAgo: 14, intent: 'Refund request', confidence: 0.62, result: 'escalated' },
  { id: 'l4', channel: 'instagram', minutesAgo: 25, intent: 'Greeting', confidence: 0.78, result: 'queued' },
];

const CSAT_BY_AGENT = [
  { agent: 'maria', avg: 4.8, tickets: 142 },
  { agent: 'carlos', avg: 4.5, tickets: 118 },
  { agent: 'ana', avg: 4.6, tickets: 96 },
  { agent: 'luis', avg: 4.2, tickets: 74 },
];

// ---------- Component ----------
export default function HelpdeskIaDemoPage() {
  const t = useTranslations('demoHelpdesk');

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_TICKETS[0].id);
  const [channelFilter, setChannelFilter] = useState<Channel | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [brand, setBrand] = useState<'all' | 'alpha' | 'beta' | 'gamma'>('all');
  const [department, setDepartment] = useState<'all' | 'billing' | 'support' | 'sales' | 'retention'>('all');
  const [search, setSearch] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [notesByTicket, setNotesByTicket] = useState<Record<string, InternalNote[]>>(() => Object.fromEntries(INITIAL_TICKETS.map((t) => [t.id, t.initialNotes])));
  const [kbQuery, setKbQuery] = useState('');
  const [autoReplyOn, setAutoReplyOn] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);
  const [autoLog] = useState<AutoReplyLog[]>(INITIAL_AUTOREPLY_LOG);
  const [csatOpen, setCsatOpen] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatComment, setCsatComment] = useState('');
  const [csatSubmitted, setCsatSubmitted] = useState(false);
  const [routing, setRouting] = useState<null | { ticket: Ticket; phase: 'analyzing' | 'matched' | 'done' }>(null);
  const [toast, setToast] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  // SLA countdown every 30s
  useEffect(() => {
    const id = setInterval(() => {
      setTickets((prev) => prev.map((tk) => tk.status === 'resolved' ? tk : { ...tk, slaMinutes: Math.max(0, tk.slaMinutes - 1) }));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // Auto-scroll conversation on ticket change
  useEffect(() => {
    if (conversationRef.current) conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    setReplyDraft('');
    setNoteDraft('');
  }, [selectedId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((tk) => {
      if (channelFilter !== 'all' && tk.channel !== channelFilter) return false;
      if (priorityFilter !== 'all' && tk.priority !== priorityFilter) return false;
      if (brand !== 'all' && tk.brand !== brand) return false;
      if (department !== 'all' && tk.department !== department) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const subject = t(`tickets.${tk.subjectKey}`).toLowerCase();
        if (!subject.includes(q) && !tk.customer.toLowerCase().includes(q) && !tk.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tickets, channelFilter, priorityFilter, brand, department, search, t]);

  const selected = useMemo(() => tickets.find((tk) => tk.id === selectedId) || null, [tickets, selectedId]);

  // KB contextual suggestion based on selected ticket subject
  const kbContextualTags = useMemo(() => {
    if (!selected) return [] as string[];
    const tagMap: Record<string, string[]> = {
      t1Subject: ['billing', 'refund'], t2Subject: ['auth', 'password'], t3Subject: ['billing'],
      t4Subject: ['shipping'], t6Subject: ['tech', 'network'], t7Subject: ['warranty'], t8Subject: ['billing', 'refund'],
    };
    return tagMap[selected.subjectKey] || [];
  }, [selected]);

  const filteredKb = useMemo(() => {
    const q = kbQuery.toLowerCase().trim();
    return KB_ARTICLES.filter((a) => {
      if (!q) return true;
      const title = t(`kb.articles.${a.id}Title`).toLowerCase();
      const snippet = t(`kb.articles.${a.id}Snippet`).toLowerCase();
      return title.includes(q) || snippet.includes(q) || a.tags.some((tg) => tg.includes(q));
    });
  }, [kbQuery, t]);

  const contextualKb = useMemo(() => {
    if (kbContextualTags.length === 0) return [] as typeof KB_ARTICLES;
    return KB_ARTICLES.filter((a) => a.tags.some((tg) => kbContextualTags.includes(tg))).slice(0, 3);
  }, [kbContextualTags]);

  const fmtAgo = (n: number) => n < 60 ? t('common.minutesAgo', { n }) : n < 24 * 60 ? t('common.hoursAgo', { n: Math.floor(n / 60) }) : t('common.daysAgo', { n: Math.floor(n / (60 * 24)) });

  const handleInsertSuggestion = (key: string) => {
    if (!selected) return;
    setReplyDraft(t(`suggestions.${key}`, { name: selected.customer.split(' ')[0] }));
    setToast(t('detail.messageInserted'));
  };

  const handleSendReply = () => {
    if (!selected || !replyDraft.trim()) return;
    setTickets((prev) => prev.map((tk) => tk.id === selected.id ? {
      ...tk,
      conversation: [...tk.conversation, { role: 'agent', key: '__draft__', minutesAgo: 0 }],
      status: 'pending',
    } : tk));
    setReplyDraft('');
    setToast(t('detail.replySent'));
  };

  const handleSaveNote = () => {
    if (!selected || !noteDraft.trim()) return;
    const newNote: InternalNote = { id: `n-${Date.now()}`, author: 'you', text: noteDraft.trim(), minutesAgo: 0 };
    setNotesByTicket((prev) => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), newNote] }));
    setNoteDraft('');
    setToast(t('detail.noteAdded'));
  };

  const handleResolve = () => {
    if (!selected) return;
    setTickets((prev) => prev.map((tk) => tk.id === selected.id ? { ...tk, status: 'resolved', slaMinutes: 0 } : tk));
    setToast(t('detail.resolvedToast'));
  };

  // Simulate incoming ticket → routing animation
  const simulateIncoming = () => {
    const base = INITIAL_TICKETS[0];
    const nextId = `TCK-${1049 + tickets.length - INITIAL_TICKETS.length}`;
    const newTk: Ticket = {
      ...base, id: nextId, customer: 'Nuevo Cliente', slaMinutes: 30, createdMinutesAgo: 0,
      conversation: [{ role: 'customer', key: 'customer1', minutesAgo: 0 }],
      assignedAgent: null, status: 'open',
      initialNotes: [],
    };
    setRouting({ ticket: newTk, phase: 'analyzing' });
    setTimeout(() => setRouting({ ticket: newTk, phase: 'matched' }), 900);
    setTimeout(() => {
      setRouting({ ticket: { ...newTk, assignedAgent: 'maria' }, phase: 'done' });
      setTickets((prev) => [{ ...newTk, assignedAgent: 'maria' }, ...prev]);
    }, 2000);
    setTimeout(() => setRouting(null), 3800);
  };

  const submitCsat = () => {
    setCsatSubmitted(true);
    setTimeout(() => { setCsatOpen(false); setCsatSubmitted(false); setCsatRating(0); setCsatComment(''); }, 1500);
  };

  const channelButtons: (Channel | 'all')[] = ['all', 'email', 'whatsapp', 'instagram', 'facebook', 'twitter', 'chat', 'voice'];
  const priorityButtons: (Priority | 'all')[] = ['all', 'low', 'medium', 'high', 'urgent'];

  // -------- Render helpers --------
  const renderChannelBadge = (ch: Channel) => {
    const Icon = channelIcon[ch];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${channelColor[ch]}`}>
        <Icon className="h-3.5 w-3.5" />
        {t(`channels.${ch}`)}
      </span>
    );
  };

  const renderSlaBadge = (m: number, status: Status) => {
    if (status === 'resolved') return <Badge variant="success" size="sm"><CheckCircleIcon className="h-3.5 w-3.5 mr-1" />{t('statuses.resolved')}</Badge>;
    if (m <= 0) return <Badge variant="danger" size="sm"><ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />{t('inbox.slaBreached')}</Badge>;
    const variant = m <= 15 ? 'danger' : m <= 60 ? 'warning' : 'info';
    return <Badge variant={variant} size="sm"><ClockIcon className="h-3.5 w-3.5 mr-1" />{t('inbox.slaIn')} {m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-secondary-950 py-8 sm:py-12">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 p-6 sm:p-8 shadow-lg mb-6 sm:mb-8">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_25%_25%,white,transparent_45%)]" aria-hidden="true" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{t('pageTitle')}</h1>
              <p className="text-sm sm:text-base text-rose-100 mt-2 max-w-2xl">{t('pageSubtitle')}</p>
            </div>
            {/* Brand / Dept selectors */}
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-rose-100 mb-1">{t('brandLabel')}</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value as typeof brand)} className="px-3 py-2 rounded-lg border border-white/30 bg-white/95 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white">
                  <option value="all">{t('brands.all')}</option>
                  <option value="alpha">{t('brands.alpha')}</option>
                  <option value="beta">{t('brands.beta')}</option>
                  <option value="gamma">{t('brands.gamma')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-rose-100 mb-1">{t('departmentLabel')}</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value as typeof department)} className="px-3 py-2 rounded-lg border border-white/30 bg-white/95 text-sm text-secondary-900 focus:outline-none focus:ring-2 focus:ring-white">
                  <option value="all">{t('departments.all')}</option>
                  <option value="billing">{t('departments.billing')}</option>
                  <option value="support">{t('departments.support')}</option>
                  <option value="sales">{t('departments.sales')}</option>
                  <option value="retention">{t('departments.retention')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[
            { label: t('metrics.frt'), value: '1.4', unit: t('metrics.frtUnit'), delta: '-12%', trendUp: false, icon: ClockIcon },
            { label: t('metrics.aht'), value: '6.8', unit: t('metrics.ahtUnit'), delta: '-8%', trendUp: false, icon: BoltIcon },
            { label: t('metrics.fcr'), value: '78', unit: '%', delta: '+4%', trendUp: true, icon: CheckCircleIcon },
            { label: t('metrics.csat'), value: '4.7', unit: '/5', delta: '+0.2', trendUp: true, icon: StarIcon },
            { label: t('metrics.deflection'), value: '41', unit: '%', delta: '+6%', trendUp: true, icon: CpuChipIcon },
          ].map((m, i) => {
            const Icon = m.icon;
            const TrendIcon = m.trendUp ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
            return (
              <Card key={i} variant="bordered" padding="sm" className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${m.trendUp ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400'}`}>
                    <TrendIcon className="h-3.5 w-3.5" />{m.delta}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{m.value}</span>
                  <span className="text-xs text-secondary-500">{m.unit}</span>
                </div>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 truncate">{m.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Routing animation */}
        {routing && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Card variant="bordered" padding="sm" className="border-primary-300 dark:border-primary-700 bg-primary-50/60 dark:bg-primary-950/30">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold text-primary-700 dark:text-primary-200">
                  <SparklesIcon className="h-5 w-5" />{t('routing.incoming')} {routing.ticket.id}
                </span>
                <span className="flex items-center gap-2 text-secondary-700 dark:text-secondary-300">
                  {routing.phase === 'analyzing' && (<><ArrowPathIcon className="h-4 w-4 animate-spin" />{t('routing.analyzing')}</>)}
                  {routing.phase !== 'analyzing' && (
                    <>
                      <CpuChipIcon className="h-4 w-4" />
                      <Badge variant="primary" size="sm">{t('routing.matched')}: {t('skills.spanish')}, {t('skills.billing')}</Badge>
                      {routing.phase === 'done' && (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300"><CheckCircleIcon className="h-4 w-4" />{t('routing.done')} → {t('agents.maria')}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Main 3-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* LEFT: Channels + filters */}
          <aside className="lg:col-span-2 space-y-4">
            <Card variant="bordered" padding="sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2 flex items-center gap-1.5"><AdjustmentsHorizontalIcon className="h-4 w-4" />{t('channels.title')}</h3>
              <div className="space-y-1">
                {channelButtons.map((ch) => {
                  const active = channelFilter === ch;
                  const Icon = ch === 'all' ? GlobeAltIcon : channelIcon[ch];
                  return (
                    <button key={ch} onClick={() => setChannelFilter(ch)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${active ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200 font-medium' : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'}`}>
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{t(`channels.${ch}`)}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card variant="bordered" padding="sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">{t('priorities.title')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {priorityButtons.map((p) => (
                  <button key={p} onClick={() => setPriorityFilter(p)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${priorityFilter === p ? 'bg-secondary-900 dark:bg-white text-white dark:text-secondary-900' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'}`}>
                    {t(`priorities.${p}`)}
                  </button>
                ))}
              </div>
            </Card>

            <Card variant="bordered" padding="sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2 flex items-center gap-1.5"><BookOpenIcon className="h-4 w-4" />{t('kb.title')}</h3>
              <div className="relative mb-2">
                <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-secondary-400" />
                <input value={kbQuery} onChange={(e) => setKbQuery(e.target.value)} placeholder={t('kb.search')} className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              {contextualKb.length > 0 && !kbQuery && (
                <p className="text-[10px] uppercase tracking-wide font-semibold text-primary-600 dark:text-primary-400 mb-1 flex items-center gap-1"><SparklesIcon className="h-3 w-3" />{t('kb.contextual')}</p>
              )}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(kbQuery ? filteredKb : contextualKb.length > 0 ? contextualKb : filteredKb).slice(0, 6).map((a) => (
                  <div key={a.id} className="p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/60 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 transition-colors">
                    <p className="text-xs font-semibold text-secondary-900 dark:text-white leading-snug">{t(`kb.articles.${a.id}Title`)}</p>
                    <p className="text-[11px] text-secondary-600 dark:text-secondary-400 mt-0.5 line-clamp-2">{t(`kb.articles.${a.id}Snippet`)}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-secondary-500">{a.views.toLocaleString()} {t('kb.views')}</span>
                      <button onClick={() => setReplyDraft((prev) => `${prev}${prev ? '\n\n' : ''}→ ${t(`kb.articles.${a.id}Title`)}: ${t(`kb.articles.${a.id}Snippet`)}`)} className="text-[10px] font-medium text-primary-600 dark:text-primary-400 hover:underline">{t('kb.useArticle')}</button>
                    </div>
                  </div>
                ))}
                {kbQuery && filteredKb.length === 0 && (<p className="text-xs text-secondary-500">{t('kb.noResults')}</p>)}
              </div>
            </Card>
          </aside>

          {/* MIDDLE: Ticket list */}
          <section className="lg:col-span-4">
            <Card variant="bordered" padding="none" className="overflow-hidden">
              <CardHeader className="p-3 sm:p-4 border-b border-secondary-200 dark:border-secondary-700 mb-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <CardTitle className="text-base sm:text-lg">{t('inbox.title')}</CardTitle>
                  <span className="text-xs text-secondary-500">{t('inbox.ticketsCount', { count: filteredTickets.length })}</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('inbox.search')} className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <Button size="sm" onClick={simulateIncoming} className="whitespace-nowrap">
                    <PlusIcon className="h-4 w-4 mr-1" />{t('inbox.newTicketCta')}
                  </Button>
                </div>
              </CardHeader>
              <div className="max-h-[640px] overflow-y-auto divide-y divide-secondary-100 dark:divide-secondary-800">
                {filteredTickets.length === 0 && (
                  <p className="p-6 text-sm text-secondary-500 text-center">{t('inbox.noResults')}</p>
                )}
                {filteredTickets.map((tk) => {
                  const active = tk.id === selectedId;
                  return (
                    <button key={tk.id} onClick={() => setSelectedId(tk.id)} className={`w-full text-left p-3 transition-colors ${active ? 'bg-primary-50 dark:bg-primary-950/30 border-l-4 border-primary-500' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/40 border-l-4 border-transparent'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-secondary-500">{tk.id}</span>
                          {renderChannelBadge(tk.channel)}
                          <Badge variant={priorityVariant[tk.priority]} size="sm">{t(`priorities.${tk.priority}`)}</Badge>
                        </div>
                        {renderSlaBadge(tk.slaMinutes, tk.status)}
                      </div>
                      <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{t(`tickets.${tk.subjectKey}`)}</p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 line-clamp-1 mt-0.5">{t(`tickets.${tk.previewKey}`)}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                        <span className="text-secondary-500 flex items-center gap-1"><UserCircleIcon className="h-3.5 w-3.5" />{tk.customer}</span>
                        <span className={`flex items-center gap-1 ${sentimentColor[tk.sentiment]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{t(`sentiments.${tk.sentiment}`)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>

          {/* RIGHT: Detail */}
          <section className="lg:col-span-6">
            {!selected ? (
              <Card variant="bordered" className="h-full flex items-center justify-center text-secondary-500 text-sm py-20">{t('detail.empty')}</Card>
            ) : (
              <Card variant="bordered" padding="none" className="overflow-hidden">
                <div key={selected.id} className="animate-in fade-in duration-300">
                  {/* Detail header */}
                  <div className="p-4 sm:p-5 border-b border-secondary-200 dark:border-secondary-700">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-mono text-secondary-500">{selected.id}</span>
                          {renderChannelBadge(selected.channel)}
                          <Badge variant={priorityVariant[selected.priority]} size="sm">{t(`priorities.${selected.priority}`)}</Badge>
                          <Badge variant={selected.status === 'resolved' ? 'success' : selected.status === 'pending' ? 'warning' : 'info'} size="sm">{t(`statuses.${selected.status}`)}</Badge>
                          {renderSlaBadge(selected.slaMinutes, selected.status)}
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-secondary-900 dark:text-white">{t(`tickets.${selected.subjectKey}`)}</h2>
                        <p className="text-xs text-secondary-500 mt-1">{selected.customer} · {t('inbox.assigned')} {selected.assignedAgent ? t(`agents.${selected.assignedAgent}`) : t('inbox.unassigned')} · {fmtAgo(selected.createdMinutesAgo)}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selected.skills.map((s) => (<Badge key={s} variant="outline" size="sm" className="text-secondary-600 dark:text-secondary-300"><TagIcon className="h-3 w-3 mr-1" />{t(`skills.${s}`)}</Badge>))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={handleResolve} disabled={selected.status === 'resolved'}><CheckCircleIcon className="h-4 w-4 mr-1" />{t('detail.resolve')}</Button>
                        <Button size="sm" variant="ghost"><ExclamationTriangleIcon className="h-4 w-4 mr-1" />{t('detail.escalate')}</Button>
                      </div>
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 flex items-center gap-1.5"><ChatBubbleLeftRightIcon className="h-4 w-4" />{t('detail.conversation')}</h3>
                    <div ref={conversationRef} className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {selected.conversation.map((m, idx) => {
                        const isAgent = m.role === 'agent';
                        return (
                          <div key={idx} className={`flex gap-2 ${isAgent ? 'justify-end' : ''}`}>
                            {!isAgent && (<div className="w-7 h-7 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-300" /></div>)}
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isAgent ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white rounded-tl-sm'}`}>
                              <p className="text-[10px] uppercase tracking-wide font-semibold opacity-70 mb-0.5">{isAgent ? t('detail.you') : t('detail.customerRole')}</p>
                              <p className="text-sm whitespace-pre-wrap">{m.key === '__draft__' ? '…' : t(`messages.${m.key}`)}</p>
                              <p className="text-[10px] opacity-60 mt-1">{fmtAgo(m.minutesAgo)}</p>
                            </div>
                            {isAgent && (<div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-4 w-4 text-primary-600 dark:text-primary-300" /></div>)}
                          </div>
                        );
                      })}
                    </div>

                    {/* Suggestions */}
                    {selected.suggestions.length > 0 && selected.status !== 'resolved' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 flex items-center gap-1.5"><SparklesIcon className="h-4 w-4 text-primary-600" />{t('detail.suggestedReplies')}</p>
                        {selected.suggestions.map((s) => (
                          <div key={s.key} className="p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-950/30">
                            <div className="flex items-center justify-between mb-1.5">
                              <Badge variant="primary" size="sm">{Math.round(s.confidence * 100)}% {t('routing.confidence')}</Badge>
                              <button onClick={() => handleInsertSuggestion(s.key)} className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline inline-flex items-center gap-1">{t('detail.insertSuggestion')}<ChevronRightIcon className="h-3 w-3" /></button>
                            </div>
                            <p className="text-xs text-secondary-700 dark:text-secondary-300 line-clamp-3">{t(`suggestions.${s.key}`, { name: selected.customer.split(' ')[0] })}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply composer */}
                    {selected.status !== 'resolved' && (
                      <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
                        <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder={t('detail.replyPlaceholder')} rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleSendReply} disabled={!replyDraft.trim()}><PaperAirplaneIcon className="h-4 w-4 mr-1" />{t('detail.send')}</Button>
                        </div>
                      </div>
                    )}

                    {/* Internal notes */}
                    <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
                      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">{t('detail.internalNotes')}</p>
                      <div className="space-y-1.5 mb-2">
                        {(notesByTicket[selected.id] || []).length === 0 && (<p className="text-xs text-secondary-500 italic">{t('detail.noNotes')}</p>)}
                        {(notesByTicket[selected.id] || []).map((n) => (
                          <div key={n.id} className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 text-xs">
                            <span className="font-semibold text-yellow-800 dark:text-yellow-200">{t(`agents.${n.author}`)}</span>
                            <span className="text-secondary-500 ml-2">{fmtAgo(n.minutesAgo)}</span>
                            <p className="text-secondary-700 dark:text-secondary-300 mt-0.5">{n.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()} placeholder={t('detail.addNote')} className="flex-1 px-3 py-1.5 text-xs rounded-md border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                        <Button size="sm" variant="outline" onClick={handleSaveNote} disabled={!noteDraft.trim()}>{t('detail.addNoteCta')}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </section>
        </div>

        {/* Bottom rows: Auto-reply, Macros, CSAT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
          {/* Auto-reply */}
          <Card variant="bordered" padding="md">
            <CardHeader className="mb-3">
              <CardTitle className="text-base flex items-center gap-2"><CpuChipIcon className="h-5 w-5 text-primary-600" />{t('autoReply.title')}</CardTitle>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('autoReply.subtitle')}</p>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between mb-3 cursor-pointer">
                <span className="text-sm text-secondary-700 dark:text-secondary-300">{t('autoReply.enable')}</span>
                <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoReplyOn ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700'}`} onClick={() => setAutoReplyOn(!autoReplyOn)}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoReplyOn ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </span>
              </label>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-secondary-700 dark:text-secondary-300">{t('autoReply.threshold')}</span>
                  <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input type="range" min={0.5} max={0.99} step={0.01} value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))} className="w-full accent-primary-600" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">{t('autoReply.log')}</p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {autoLog.length === 0 && (<p className="text-xs text-secondary-500 italic">{t('autoReply.empty')}</p>)}
                {autoLog.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/60 text-xs">
                    {renderChannelBadge(l.channel)}
                    <span className="flex-1 truncate text-secondary-700 dark:text-secondary-300">{l.intent}</span>
                    <span className="font-mono text-secondary-500">{Math.round(l.confidence * 100)}%</span>
                    <Badge variant={l.result === 'sent' ? 'success' : l.result === 'escalated' ? 'warning' : 'info'} size="sm">{t(`autoReply.results.${l.result}`)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Macros */}
          <Card variant="bordered" padding="md">
            <CardHeader className="mb-3">
              <CardTitle className="text-base flex items-center gap-2"><BoltIcon className="h-5 w-5 text-primary-600" />{t('macros.title')}</CardTitle>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('macros.subtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {['m1', 'm2', 'm3', 'm4'].map((m, i) => (
                <div key={m} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 text-xs hover:border-primary-400 transition-colors">
                  <div className="flex items-start gap-2 mb-1">
                    <Badge variant="outline" size="sm" className="text-[10px] flex-shrink-0">{t('macros.if')}</Badge>
                    <span className="text-secondary-700 dark:text-secondary-300">{t(`macros.items.${m}If`)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="primary" size="sm" className="text-[10px] flex-shrink-0">{t('macros.then')}</Badge>
                    <span className="text-secondary-700 dark:text-secondary-300">{t(`macros.items.${m}Then`)}</span>
                  </div>
                  <div className="text-right mt-1 text-[10px] text-secondary-500">{MACROS_RUNS[i]} {t('macros.runs')}</div>
                </div>
              ))}
              <Button size="sm" variant="outline" fullWidth><PlusIcon className="h-4 w-4 mr-1" />{t('macros.addNew')}</Button>
            </CardContent>
          </Card>

          {/* CSAT */}
          <Card variant="bordered" padding="md">
            <CardHeader className="mb-3">
              <CardTitle className="text-base flex items-center gap-2"><StarIcon className="h-5 w-5 text-primary-600" />{t('csat.title')}</CardTitle>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('csat.subtitle')}</p>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" fullWidth onClick={() => setCsatOpen(true)} className="mb-3"><StarIcon className="h-4 w-4 mr-1" />{t('csat.openSurvey')}</Button>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">{t('csat.byAgent')}</p>
              <div className="space-y-2">
                {CSAT_BY_AGENT.map((a) => (
                  <div key={a.agent} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-secondary-700 dark:text-secondary-300 truncate">{t(`agents.${a.agent}`)}</span>
                    <span className="flex items-center gap-0.5 text-yellow-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarSolid key={s} className={`h-3.5 w-3.5 ${s <= Math.round(a.avg) ? 'text-yellow-500' : 'text-secondary-300 dark:text-secondary-700'}`} />
                      ))}
                    </span>
                    <span className="font-mono font-semibold text-secondary-900 dark:text-white text-xs w-9 text-right">{a.avg.toFixed(1)}</span>
                    <span className="text-[10px] text-secondary-500 w-16 text-right">{a.tickets} {t('csat.tickets')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSAT Modal */}
      {csatOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="csat-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={() => setCsatOpen(false)}>
          <Card variant="elevated" padding="lg" className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 id="csat-modal-title" className="text-lg font-bold text-secondary-900 dark:text-white">{t('csat.modalTitle')}</h3>
                <p className="text-xs text-secondary-500 mt-1">{t('csat.modalSubtitle', { id: selected?.id || 'TCK-1041', agent: t('agents.maria') })}</p>
              </div>
              <button onClick={() => setCsatOpen(false)} aria-label={t('csat.cancel')} className="p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-md"><XMarkIcon className="h-5 w-5 text-secondary-500" /></button>
            </div>
            {csatSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-secondary-900 dark:text-white">{t('csat.thanks')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 my-5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setCsatRating(s)} aria-label={`${s} / 5`} className="transition-transform hover:scale-110">
                      <StarSolid className={`h-10 w-10 ${s <= csatRating ? 'text-yellow-500' : 'text-secondary-300 dark:text-secondary-700'}`} />
                    </button>
                  ))}
                </div>
                <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('csat.comment')}</label>
                <textarea value={csatComment} onChange={(e) => setCsatComment(e.target.value)} rows={3} placeholder={t('csat.commentPlaceholder')} className="w-full px-3 py-2 text-sm rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                <div className="flex justify-end gap-2 mt-4">
                  <Button size="sm" variant="ghost" onClick={() => setCsatOpen(false)}>{t('csat.cancel')}</Button>
                  <Button size="sm" onClick={submitCsat} disabled={csatRating === 0}>{t('csat.submit')}</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-400 dark:text-green-600" />{toast}
          </div>
        </div>
      )}
    </div>
  );
}
