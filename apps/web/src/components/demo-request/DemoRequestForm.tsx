'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  PaperAirplaneIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { track, trackWhatsappClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  ApiError,
  type CatalogItem,
  KOPTUP_WHATSAPP_NUMBER,
  apiRequest,
  catalogMap,
  demoName,
  fetchPublicCatalog,
  parseDemoSlugsParam,
  storedUser,
} from '@/lib/demo-system';

/** Tamaños de empresa que acepta el backend (config/demos.ts → COMPANY_SIZES). */
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;

/** Países del formulario: se envía el nombre en español; se muestra en el idioma de la página. */
const COUNTRIES: ReadonlyArray<{ value: string; en: string }> = [
  { value: 'Colombia', en: 'Colombia' },
  { value: 'México', en: 'Mexico' },
  { value: 'Perú', en: 'Peru' },
  { value: 'Chile', en: 'Chile' },
  { value: 'Ecuador', en: 'Ecuador' },
  { value: 'Argentina', en: 'Argentina' },
  { value: 'Panamá', en: 'Panama' },
  { value: 'Costa Rica', en: 'Costa Rica' },
  { value: 'Guatemala', en: 'Guatemala' },
  { value: 'República Dominicana', en: 'Dominican Republic' },
  { value: 'Venezuela', en: 'Venezuela' },
  { value: 'Bolivia', en: 'Bolivia' },
  { value: 'Paraguay', en: 'Paraguay' },
  { value: 'Uruguay', en: 'Uruguay' },
  { value: 'España', en: 'Spain' },
  { value: 'Estados Unidos', en: 'United States' },
  { value: 'Otro', en: 'Other' },
];

const PHONE = /^[+0-9 ().-]{7,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USE_CASE_MIN = 10;
const USE_CASE_MAX = 2000;
const MAX_DEMOS = 10;

type Field = 'nombre' | 'empresa' | 'cargo' | 'email' | 'telefono' | 'pais' | 'tamanoEmpresa' | 'demos' | 'casoDeUso' | 'consentimiento';
type Errors = Partial<Record<Field, string>>;

interface FormState {
  nombre: string;
  empresa: string;
  cargo: string;
  email: string;
  telefono: string;
  pais: string;
  tamanoEmpresa: string;
  casoDeUso: string;
  consentimiento: boolean;
  website: string;
}

interface Success {
  codigo: string;
  fusionada: boolean;
  email: string;
}

const INPUT =
  'w-full px-4 py-3 rounded-lg border bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';

function utmFrom(params: URLSearchParams) {
  const utm: Record<string, string> = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value.slice(0, 120);
  }
  return Object.keys(utm).length ? utm : undefined;
}

export default function DemoRequestForm() {
  const t = useTranslations('requestDemo');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const preselected = useMemo(
    () => parseDemoSlugsParam(searchParams.get('demos'), searchParams.get('demo')),
    [searchParams],
  );

  const [catalog, setCatalog] = useState<Map<string, CatalogItem>>(() => catalogMap(null));
  const [selected, setSelected] = useState<string[]>(preselected);
  const [form, setForm] = useState<FormState>({
    nombre: '',
    empresa: '',
    cargo: '',
    email: '',
    telefono: '',
    pais: '',
    tamanoEmpresa: '',
    casoDeUso: '',
    consentimiento: false,
    website: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicCatalog(controller.signal)
      .then((items) => setCatalog(catalogMap(items)))
      .catch(() => undefined);
    // Con sesión, se adelantan el nombre y el email.
    const user = storedUser();
    if (user?.email || user?.name) {
      setForm((f) => ({ ...f, nombre: f.nombre || user.name || '', email: f.email || user.email || '' }));
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setSelected((current) => (current.length ? current : preselected));
  }, [preselected]);

  // Demos que se ofrecen: abiertas y por solicitud (activas). Las privadas
  // ("solo por invitación") solo aparecen si llegan elegidas desde su página.
  const options = useMemo(() => {
    const list = [...catalog.values()].filter(
      (d) => (d.accessMode !== 'privado' && d.activo) || selected.includes(d.slug) || preselected.includes(d.slug),
    );
    const rank = (d: CatalogItem) => (preselected.includes(d.slug) ? 0 : d.accessMode === 'solicitud' ? 1 : d.accessMode === 'privado' ? 2 : 3);
    return list.sort((a, b) => rank(a) - rank(b) || demoName(a, locale).localeCompare(demoName(b, locale), locale));
  }, [catalog, selected, preselected, locale]);

  // Al corregir el último campo marcado, se quita también el aviso general.
  const clearError = (field: Field) => {
    if (!errors[field]) return;
    const next = { ...errors, [field]: undefined };
    setErrors(next);
    if (Object.values(next).every((v) => !v) && formError === t('errors.checkFields')) setFormError('');
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key !== 'website') clearError(key as Field);
  };

  const toggleDemo = (slug: string) => {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      if (current.length >= MAX_DEMOS) return current;
      return [...current, slug];
    });
    clearError('demos');
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (selected.length === 0) e.demos = t('errors.demos');
    if (form.nombre.trim().length < 2) e.nombre = t('errors.nombre');
    if (!form.empresa.trim()) e.empresa = t('errors.empresa');
    if (!EMAIL.test(form.email.trim())) e.email = t('errors.email');
    if (form.telefono.trim() && !PHONE.test(form.telefono.trim())) e.telefono = t('errors.telefono');
    if (!form.pais) e.pais = t('errors.pais');
    if (!form.tamanoEmpresa) e.tamanoEmpresa = t('errors.tamanoEmpresa');
    if (form.casoDeUso.trim().length < USE_CASE_MIN) e.casoDeUso = t('errors.casoDeUso', { min: USE_CASE_MIN });
    if (!form.consentimiento) e.consentimiento = t('errors.consentimiento');
    return e;
  };

  const focusFirstError = (e: Errors) => {
    const first = (Object.keys(e) as Field[])[0];
    if (!first) return;
    const el = document.getElementById(first === 'demos' ? 'demos-group' : first === 'tamanoEmpresa' ? 'size-group' : first);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el && 'focus' in el) (el as HTMLElement).focus({ preventScroll: true });
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setFormError(t('errors.checkFields'));
      focusFirstError(e);
      return;
    }

    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    let pagina: string | undefined;
    let externalReferrer: string | undefined;
    try {
      if (referrer) {
        const ref = new URL(referrer);
        if (ref.origin === window.location.origin) pagina = `${ref.pathname}${ref.search}`.slice(0, 300);
        else externalReferrer = referrer.slice(0, 300);
      }
    } catch {
      // referrer inválido: se ignora
    }

    setSubmitting(true);
    try {
      const data = await apiRequest<{ codigo: string; estado: string; fusionada: boolean }>('/demo-requests', {
        method: 'POST',
        auth: false,
        body: {
          nombre: form.nombre.trim(),
          empresa: form.empresa.trim(),
          cargo: form.cargo.trim() || undefined,
          email: form.email.trim(),
          telefono: form.telefono.trim() || undefined,
          pais: form.pais,
          tamanoEmpresa: form.tamanoEmpresa,
          demos: selected,
          casoDeUso: form.casoDeUso.trim(),
          consentimiento: form.consentimiento,
          website: form.website,
          origen: {
            pagina: pagina ?? '/solicitar-demo',
            referrer: externalReferrer,
            utm: utmFrom(new URLSearchParams(window.location.search)),
          },
        },
      });

      // Conversión `generate_lead` (solo envío exitoso, sin datos personales).
      track('generate_lead', {
        lead_source: 'demo-request',
        demos_count: selected.length,
        demo_slugs: selected.join(',').slice(0, 100),
      });

      setSuccess({ codigo: data.codigo, fusionada: data.fusionada === true, email: form.email.trim() });
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 429) {
        setFormError(t('errors.rateLimited'));
      } else if (apiErr?.status === 400) {
        // Errores por campo del backend (zod). En inglés se muestra el texto propio.
        const serverErrors = (apiErr.data.errores ?? {}) as Record<string, string>;
        const fields = (Array.isArray(apiErr.data.fields) ? apiErr.data.fields : Object.keys(serverErrors)) as string[];
        const mapped: Errors = {};
        for (const raw of fields) {
          const key = (raw.split('.')[0] || '') as Field;
          if (!['nombre', 'empresa', 'cargo', 'email', 'telefono', 'pais', 'tamanoEmpresa', 'demos', 'casoDeUso', 'consentimiento'].includes(key)) continue;
          mapped[key] = locale === 'es' && serverErrors[raw] ? serverErrors[raw] : t('errors.invalidField');
        }
        if (apiErr.code === 'unknown_demo') mapped.demos = t('errors.unknownDemo');
        setErrors(mapped);
        setFormError(Object.keys(mapped).length ? t('errors.checkFields') : locale === 'es' ? apiErr.message : t('errors.generic'));
        focusFirstError(mapped);
      } else if (apiErr?.status === 0) {
        setFormError(t('errors.network'));
      } else {
        setFormError(t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = `https://wa.me/${KOPTUP_WHATSAPP_NUMBER}?text=${encodeURIComponent(t('aside.whatsappText'))}`;

  if (success) {
    return (
      <div ref={topRef} className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center" data-testid="demo-request-success">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
            <CheckCircleIcon className="h-14 w-14 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">{t('success.title')}</h1>
          <p className="text-lg text-secondary-700 dark:text-secondary-300">
            {t.rich('success.code', {
              code: success.codigo,
              mono: (chunks) => (
                <code className="px-2 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800 font-mono font-bold text-secondary-900 dark:text-white" data-testid="request-code">
                  {chunks}
                </code>
              ),
            })}
          </p>
          {success.fusionada && <p className="mt-2 text-secondary-600 dark:text-secondary-400">{t('success.merged')}</p>}
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">{t('success.emailNote', { email: success.email })}</p>

          <Card variant="bordered" className="mt-10 text-left">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-4">{t('success.nextTitle')}</h2>
              <ol className="space-y-4">
                {[
                  { icon: CheckCircleIcon, color: 'text-green-600 dark:text-green-400', title: t('success.step1Title'), body: t('success.step1Body') },
                  { icon: ClockIcon, color: 'text-amber-600 dark:text-amber-400', title: t('success.step2Title'), body: t('success.step2Body') },
                  { icon: KeyIcon, color: 'text-primary-600 dark:text-primary-400', title: t('success.step3Title'), body: t('success.step3Body') },
                ].map((step) => (
                  <li key={step.title} className="flex gap-3">
                    <step.icon className={cn('h-6 w-6 flex-shrink-0', step.color)} />
                    <div>
                      <p className="font-semibold text-secondary-900 dark:text-white">{step.title}</p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card variant="bordered" className="mt-6 text-left">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-secondary-900 dark:text-white">{t('success.ragTitle')}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('success.ragBody')}</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/demo/chatbot" className="flex items-center gap-2">
                  <PlayCircleIcon className="h-5 w-5" />
                  {t('success.ragCta')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsappClick('solicitar_demo_gracias')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-green-600 text-green-700 dark:text-green-400 font-semibold hover:bg-green-50 dark:hover:bg-green-950"
            >
              <FaWhatsapp className="h-5 w-5" />
              {t('aside.whatsappCta')}
            </a>
            <Link href="/" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              {t('success.home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fieldClass = (f: Field) =>
    cn(INPUT, errors[f] ? 'border-red-500 dark:border-red-500' : 'border-secondary-300 dark:border-secondary-700');
  const label = 'block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2';
  const errorText = (f: Field) =>
    errors[f] ? (
      <p id={`${f}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
        {errors[f]}
      </p>
    ) : null;

  return (
    <div ref={topRef} className="min-h-screen bg-secondary-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400 mb-4">
          <Link href="/" className="hover:text-primary-600">
            {t('breadcrumbHome')}
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-secondary-800 dark:text-secondary-200">{t('title')}</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-3">{t('title')}</h1>
        <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-10 max-w-3xl">{t('subtitle')}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card variant="bordered" className="lg:col-span-2 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-8" data-testid="demo-request-form">
                {formError && (
                  <div role="alert" className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
                  </div>
                )}

                {/* 1. Demos */}
                <fieldset id="demos-group" tabIndex={-1} aria-describedby={errors.demos ? 'demos-error' : undefined}>
                  <legend className="text-lg font-bold text-secondary-900 dark:text-white mb-1">
                    <span className="inline-flex w-7 h-7 mr-2 items-center justify-center rounded-full bg-primary-600 text-white text-sm">1</span>
                    {t('form.sectionDemos')} <span className="text-red-500">*</span>
                  </legend>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('form.demosHelp', { max: MAX_DEMOS })}</p>
                  <div className="flex flex-wrap gap-2">
                    {options.map((d) => {
                      const active = selected.includes(d.slug);
                      return (
                        <button
                          key={d.slug}
                          type="button"
                          onClick={() => toggleDemo(d.slug)}
                          aria-pressed={active}
                          data-demo-option={d.slug}
                          className={cn(
                            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left',
                            active
                              ? 'border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200'
                              : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400',
                          )}
                        >
                          <span
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                              active ? 'bg-primary-600 border-primary-600' : 'border-secondary-400',
                            )}
                            aria-hidden="true"
                          >
                            {active && <CheckCircleIcon className="h-3.5 w-3.5 text-white" />}
                          </span>
                          {demoName(d, locale)}
                          {d.accessMode !== 'publico' && <DemoAccessBadge mode={d.accessMode} activo={d.activo} />}
                        </button>
                      );
                    })}
                  </div>
                  {errorText('demos')}
                </fieldset>

                {/* 2. Datos */}
                <fieldset className="space-y-6">
                  <legend className="text-lg font-bold text-secondary-900 dark:text-white mb-4">
                    <span className="inline-flex w-7 h-7 mr-2 items-center justify-center rounded-full bg-primary-600 text-white text-sm">2</span>
                    {t('form.sectionYou')}
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="nombre" className={label}>
                        {t('form.name')} <span className="text-red-500">*</span>
                      </label>
                      <input id="nombre" name="nombre" autoComplete="name" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} maxLength={120} className={fieldClass('nombre')} placeholder={t('form.namePlaceholder')} aria-invalid={!!errors.nombre} aria-describedby={errors.nombre ? 'nombre-error' : undefined} />
                      {errorText('nombre')}
                    </div>
                    <div>
                      <label htmlFor="empresa" className={label}>
                        {t('form.company')} <span className="text-red-500">*</span>
                      </label>
                      <input id="empresa" name="empresa" autoComplete="organization" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} maxLength={160} className={fieldClass('empresa')} placeholder={t('form.companyPlaceholder')} aria-invalid={!!errors.empresa} aria-describedby={errors.empresa ? 'empresa-error' : undefined} />
                      {errorText('empresa')}
                    </div>
                    <div>
                      <label htmlFor="cargo" className={label}>
                        {t('form.jobTitle')} <span className="text-secondary-400 font-normal">{t('form.optional')}</span>
                      </label>
                      <input id="cargo" name="cargo" autoComplete="organization-title" value={form.cargo} onChange={(e) => set('cargo', e.target.value)} maxLength={120} className={fieldClass('cargo')} placeholder={t('form.jobTitlePlaceholder')} />
                      {errorText('cargo')}
                    </div>
                    <div>
                      <label htmlFor="email" className={label}>
                        {t('form.email')} <span className="text-red-500">*</span>
                      </label>
                      <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} maxLength={254} className={fieldClass('email')} placeholder={t('form.emailPlaceholder')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
                      {errorText('email')}
                    </div>
                    <div>
                      <label htmlFor="telefono" className={label}>
                        {t('form.phone')} <span className="text-secondary-400 font-normal">{t('form.optional')}</span>
                      </label>
                      <input id="telefono" name="telefono" type="tel" autoComplete="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} maxLength={40} className={fieldClass('telefono')} placeholder={t('form.phonePlaceholder')} aria-invalid={!!errors.telefono} aria-describedby="telefono-help" />
                      <p id="telefono-help" className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{t('form.phoneHelp')}</p>
                      {errorText('telefono')}
                    </div>
                    <div>
                      <label htmlFor="pais" className={label}>
                        {t('form.country')} <span className="text-red-500">*</span>
                      </label>
                      <select id="pais" name="pais" value={form.pais} onChange={(e) => set('pais', e.target.value)} className={fieldClass('pais')} aria-invalid={!!errors.pais} aria-describedby={errors.pais ? 'pais-error' : undefined}>
                        <option value="">{t('form.countryPlaceholder')}</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {locale === 'en' ? c.en : c.value}
                          </option>
                        ))}
                      </select>
                      {errorText('pais')}
                    </div>
                  </div>

                  <div id="size-group" tabIndex={-1} role="radiogroup" aria-labelledby="size-label" aria-describedby={errors.tamanoEmpresa ? 'tamanoEmpresa-error' : undefined}>
                    <p id="size-label" className={label}>
                      {t('form.size')} <span className="text-red-500">*</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {COMPANY_SIZES.map((size) => {
                        const active = form.tamanoEmpresa === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => set('tamanoEmpresa', size)}
                            className={cn(
                              'px-3 py-3 rounded-lg border text-sm font-medium transition-colors',
                              active
                                ? 'border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200'
                                : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400',
                            )}
                          >
                            {t('form.sizeOption', { size })}
                          </button>
                        );
                      })}
                    </div>
                    {errorText('tamanoEmpresa')}
                  </div>

                  <div>
                    <label htmlFor="casoDeUso" className={label}>
                      {t('form.useCase')} <span className="text-red-500">*</span>
                    </label>
                    <textarea id="casoDeUso" name="casoDeUso" rows={5} value={form.casoDeUso} onChange={(e) => set('casoDeUso', e.target.value.slice(0, USE_CASE_MAX))} className={fieldClass('casoDeUso')} placeholder={t('form.useCasePlaceholder')} aria-invalid={!!errors.casoDeUso} aria-describedby="casoDeUso-hint" />
                    <div className="mt-1 flex items-start justify-between gap-4">
                      <p id="casoDeUso-hint" className="flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
                        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                        {t('form.useCaseHint')}
                      </p>
                      <span className="text-xs text-secondary-500 tabular-nums">
                        {form.casoDeUso.length}/{USE_CASE_MAX}
                      </span>
                    </div>
                    {errorText('casoDeUso')}
                  </div>
                </fieldset>

                {/* Honeypot: invisible para las personas; si llega lleno, el backend lo descarta. */}
                <div className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">{t('form.honeypot')}</label>
                  <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
                </div>

                <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
                  <label htmlFor="consentimiento" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id="consentimiento"
                      name="consentimiento"
                      type="checkbox"
                      checked={form.consentimiento}
                      onChange={(e) => set('consentimiento', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-secondary-400 text-primary-600 focus:ring-primary-500"
                      aria-invalid={!!errors.consentimiento}
                      aria-describedby={errors.consentimiento ? 'consentimiento-error' : undefined}
                    />
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      {t.rich('form.consent', {
                        link: (chunks) => (
                          <Link href="/privacy" target="_blank" className="text-primary-600 dark:text-primary-400 underline font-medium">
                            {chunks}
                          </Link>
                        ),
                      })}{' '}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errorText('consentimiento')}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                  <p className="text-xs text-secondary-500">
                    <span className="text-red-500">*</span> {t('form.required')}
                  </p>
                  <Button type="submit" size="lg" isLoading={submitting} disabled={submitting}>
                    {!submitting && <PaperAirplaneIcon className="h-5 w-5 mr-2" />}
                    {submitting ? t('form.submitting') : t('form.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card variant="bordered">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-5">{t('aside.title')}</h2>
                <ol className="space-y-5">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center flex-shrink-0">
                        {n}
                      </span>
                      <div>
                        <p className="font-semibold text-secondary-900 dark:text-white">{t(`aside.step${n}Title`)}</p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t(`aside.step${n}Body`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 pt-5 border-t border-secondary-200 dark:border-secondary-800">
                  <p className="font-semibold text-secondary-900 dark:text-white">{t('aside.talkTitle')}</p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">{t('aside.talkBody')}</p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsappClick('solicitar_demo')}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border-2 border-green-600 text-green-700 dark:text-green-400 font-semibold hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <FaWhatsapp className="h-5 w-5" />
                    {t('aside.whatsappCta')}
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card variant="bordered">
              <CardContent className="p-5 flex gap-3">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('aside.privacy')}</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
