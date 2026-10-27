'use client';

/**
 * Vista del paciente: enlace por WhatsApp (simulado, armado según quién llena la
 * pre-consulta), prueba de cámara y micrófono (real, solo en este navegador), pre-consulta
 * y consentimientos. Quien tiene cita hoy hace aquí su ingreso: entra a la sala de espera
 * con la especialidad de su cita. Lo que el paciente envía aparece en el consultorio.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { CheckCircleIcon, ExclamationTriangleIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { GENERIC_SCRIPT, IPS, PAYERS } from './mockData';
import { assignSpec, classifySymptoms, queuePosition, specOf, tx } from './logic';
import { attachStream, useCameraAllowed, useLocalMedia, useMicLevel } from './useLocalMedia';
import { PRIORITY_STYLES, SimTag, useLoc } from './ui';
import type { TelemedStore } from './store';
import type { Patient, Preconsult, Priority, SpecKey } from './types';

interface Props {
  store: TelemedStore;
  visible: boolean;
  notify: (text: string, tone?: 'ok' | 'warn') => void;
  goConsole: () => void;
  /** Cita de hoy que se elige al llegar desde la agenda (n cambia en cada clic). */
  preset: { apptId: string; n: number } | null;
}

const EMPTY = {
  reason: '',
  onset: '',
  intensity: 5,
  prev: '',
  temp: '',
  bp: '',
};
const EMPTY_NEW = {
  name: '',
  docType: 'CC' as Patient['docType'],
  doc: '',
  age: '',
  payerId: 'cordillera',
};

export default function PreconsultForm({ store, visible, notify, goConsole, preset }: Props) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const media = useLocalMedia();
  const level = useMicLevel(media.stream);
  const camAllowed = useCameraAllowed();
  const { day } = store.state;
  const waiting = store.state.patients.filter((p) => p.status === 'waiting');
  const todayAppts = store.state.appointments.filter((a) => a.date === day && a.status === 'booked').sort((a, b) => a.time.localeCompare(b.time));

  const [whoState, setWho] = useState<string>('new');
  const [np, setNp] = useState(EMPTY_NEW);
  const [form, setForm] = useState(EMPTY);
  const [consents, setConsents] = useState({
    tele: false,
    data: false,
    rec: false,
  });
  const [done, setDone] = useState<{
    name: string;
    priority: Priority;
    alarm: boolean;
    position: number;
    spec: SpecKey;
  } | null>(null);

  const doneBox = useRef<HTMLDivElement | null>(null);

  // Al enviar, la confirmación queda arriba del formulario: se lleva a la vista (en el celular el botón Enviar queda lejos).
  useEffect(() => {
    if (done) window.setTimeout(() => doneBox.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, [done]);

  useEffect(() => {
    if (!visible) media.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Llegada desde la agenda: se elige la cita de hoy.
  useEffect(() => {
    if (preset) pick(`appt:${preset.apptId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  // Si el paciente elegido ya salió de la sala de espera (lo llamaron) o la cita ya no está, vuelve a "Paciente nuevo".
  const existing = waiting.find((p) => p.id === whoState) ?? null;
  const appt = whoState.startsWith('appt:') ? (todayAppts.find((a) => `appt:${a.id}` === whoState) ?? null) : null;
  const who = existing || appt ? whoState : 'new';
  const needsData = who === 'new' || !!appt;
  const dataOk = !needsData || (np.name.trim().length >= 3 && /^[0-9.]{5,15}$/.test(np.doc.trim()) && Number(np.age) > 0 && Number(np.age) < 120);
  const canSubmit = !!form.reason.trim() && consents.tele && consents.data && dataOk;

  function pick(id: string) {
    setWho(id);
    setDone(null);
    if (id.startsWith('appt:')) {
      const a = store.state.appointments.find((x) => `appt:${x.id}` === id);
      setNp({ ...EMPTY_NEW, name: a?.patient ?? '', payerId: a?.payerId ?? EMPTY_NEW.payerId });
      setForm(EMPTY);
      setConsents({ tele: false, data: false, rec: false });
      return;
    }
    const p = waiting.find((x) => x.id === id);
    if (p?.preconsult) {
      const pre = p.preconsult;
      setForm({
        reason: tx(pre.reason, loc),
        onset: tx(pre.onset, loc),
        intensity: pre.intensity,
        prev: tx(pre.prev, loc),
        temp: pre.temp,
        bp: pre.bp,
      });
      setConsents({
        tele: pre.consentTele,
        data: pre.consentData,
        rec: pre.consentRec,
      });
    } else {
      setForm(EMPTY);
      setConsents({ tele: false, data: false, rec: false });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const pre: Preconsult = {
      reason: form.reason.trim(),
      onset: form.onset.trim(),
      intensity: form.intensity,
      prev: form.prev.trim(),
      temp: form.temp.trim(),
      bp: form.bp.trim(),
      consentTele: consents.tele,
      consentData: consents.data,
      consentRec: consents.rec,
      at: store.clock(),
    };
    const tri = classifySymptoms(pre.reason as string);
    const temp = parseFloat(form.temp.replace(',', '.'));
    const vitalsPatch = {
      ...(Number.isFinite(temp) ? { temp } : {}),
      ...(/^\d{2,3}\/\d{2,3}$/.test(form.bp.trim()) ? { bp: form.bp.trim() } : {}),
    };
    let name = '';
    let spec: SpecKey = 'general';
    const position = queuePosition(waiting, tri.urgency, existing?.id);
    if (needsData) {
      name = np.name.trim();
      spec = appt ? appt.spec : assignSpec(tri, Number(np.age));
      const patientId = store.addPatient({
        name,
        age: Number(np.age),
        docType: np.docType,
        doc: np.doc.trim(),
        payerId: np.payerId,
        reason: pre.reason,
        priority: tri.urgency,
        spec,
        arrivedAt: store.clock(),
        ...(appt ? { appointmentId: appt.id } : {}),
        status: 'waiting',
        allergies: [],
        history: [],
        meds: [],
        vitals: { ...vitalsPatch, source: 'preconsult' },
        pastConsults: [],
        preconsult: pre,
        script: GENERIC_SCRIPT,
        labs: [],
      });
      if (appt) store.updateAppointment(appt.id, { status: 'checkedIn', patientId });
    } else if (existing) {
      name = existing.name;
      spec = existing.spec;
      store.updatePatient(existing.id, {
        preconsult: pre,
        reason: pre.reason,
        priority: tri.urgency,
        vitals: { ...existing.vitals, ...vitalsPatch },
      });
    }
    store.log(
      'patient',
      appt ? 'preconsultAppt' : 'preconsultSent',
      { patient: name, priority: { t: `priority.${tri.urgency}` }, spec: { t: `specialties.${spec}` }, ...(appt ? { code: appt.id } : {}) },
      name,
    );
    setDone({ name, priority: tri.urgency, alarm: tri.alarm, position, spec });
    notify(t('toasts.preconsult', { name }));
    setForm(EMPTY);
    setConsents({ tele: false, data: false, rec: false });
    setNp(EMPTY_NEW);
    setWho('new');
  }

  // Mensaje de ejemplo con el enlace a la pre-consulta, según quién la está llenando.
  const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? '';
  const wa = appt
    ? {
        text: t('patient.waAppt', { name: firstName(appt.patient), ips: IPS.name, spec: t(`specialties.${appt.spec}`), pro: specOf(appt.spec).pro, time: appt.time }),
        link: `https://tu-ips.example/sala/${appt.id}`,
      }
    : existing
      ? {
          text: t('patient.waQueue', { name: firstName(existing.name), ips: IPS.name, spec: t(`specialties.${existing.spec}`) }),
          link: `https://tu-ips.example/sala/${existing.id.toUpperCase()}`,
        }
      : {
          text: np.name.trim() ? t('patient.waNew', { name: firstName(np.name), ips: IPS.name }) : t('patient.waNewNoName', { ips: IPS.name }),
          link: 'https://tu-ips.example/pre-consulta',
        };

  const consentItems = [
    { k: 'tele' as const, required: true },
    { k: 'data' as const, required: true },
    { k: 'rec' as const, required: false },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0">
        <CardHeader>
          <CardTitle>{t('patient.title')}</CardTitle>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('patient.subtitle')}</p>
        </CardHeader>
        <CardContent>
          {done && store.state.patients.some((p) => p.name === done.name) && (
            <div ref={doneBox} className="mb-4 space-y-2 scroll-mt-24">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">{t('patient.doneTitle', { name: done.name })}</p>
                  <p>
                    {done.alarm ? t('patient.doneAlarm') : t('patient.doneBody', { position: String(done.position) })}{' '}
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_STYLES[done.priority].chip}`}>
                      {t(`priority.${done.priority}`)}
                    </span>
                  </p>
                  <p className="mt-0.5">{t('patient.doneSpec', { spec: t(`specialties.${done.spec}`), pro: specOf(done.spec).pro })}</p>
                </div>
              </div>
              {done.alarm && (
                <p
                  role="alert"
                  className="flex gap-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-900 dark:text-red-100"
                >
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  {t('patient.alarm')}
                </p>
              )}
              <Button size="sm" variant="outline" onClick={goConsole}>
                {t('patient.goConsole')}
              </Button>
            </div>
          )}

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="pc-who" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                {t('patient.who')}
              </label>
              <select
                id="pc-who"
                value={who}
                onChange={(e) => pick(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2.5 text-sm"
              >
                <option value="new">{t('patient.newPatient')}</option>
                {todayAppts.length > 0 && (
                  <optgroup label={t('patient.withAppt')}>
                    {todayAppts.map((a) => (
                      <option key={a.id} value={`appt:${a.id}`}>
                        {a.patient} · {t(`specialties.${a.spec}`)} {a.time} · {a.id}
                      </option>
                    ))}
                  </optgroup>
                )}
                {waiting.length > 0 && (
                  <optgroup label={t('patient.inQueueGroup')}>
                    {waiting.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {t('patient.inQueue')}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">
                {appt
                  ? t('patient.apptInfo', { code: appt.id, spec: t(`specialties.${appt.spec}`), pro: specOf(appt.spec).pro, time: appt.time })
                  : existing
                    ? t('patient.updateInfo', { spec: t(`specialties.${existing.spec}`) })
                    : t('patient.newInfo')}
              </p>
            </div>

            {needsData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={`${t('patient.name')} *`}
                  value={np.name}
                  onChange={(e) => setNp({ ...np, name: e.target.value })}
                  placeholder={t('patient.namePh')}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="pc-doctype" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      {t('patient.docType')}
                    </label>
                    <select
                      id="pc-doctype"
                      value={np.docType}
                      onChange={(e) =>
                        setNp({
                          ...np,
                          docType: e.target.value as Patient['docType'],
                        })
                      }
                      className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-2 py-2.5 text-sm"
                    >
                      <option value="CC">CC</option>
                      <option value="TI">TI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      label={`${t('patient.doc')} *`}
                      value={np.doc}
                      onChange={(e) => setNp({ ...np, doc: e.target.value })}
                      placeholder="1.000.000.000"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <Input label={`${t('patient.age')} *`} type="number" min={0} max={119} value={np.age} onChange={(e) => setNp({ ...np, age: e.target.value })} />
                <div>
                  <label htmlFor="pc-payer" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('patient.payer')}
                  </label>
                  <select
                    id="pc-payer"
                    value={np.payerId}
                    onChange={(e) => setNp({ ...np, payerId: e.target.value })}
                    className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2.5 text-sm"
                  >
                    {PAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {tx(p.name, loc)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Textarea
              label={`${t('patient.reason')} *`}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder={t('patient.reasonPh')}
              rows={3}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('patient.onset')}
                value={form.onset}
                onChange={(e) => setForm({ ...form, onset: e.target.value })}
                placeholder={t('patient.onsetPh')}
              />
              <div>
                <label htmlFor="pc-intensity" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  {t('patient.intensity')}: <span className="font-bold">{form.intensity}</span>/10
                </label>
                <input
                  id="pc-intensity"
                  type="range"
                  min={1}
                  max={10}
                  value={form.intensity}
                  onChange={(e) => setForm({ ...form, intensity: Number(e.target.value) })}
                  className="w-full accent-rose-600"
                />
              </div>
              <Input
                label={t('patient.temp')}
                value={form.temp}
                onChange={(e) => setForm({ ...form, temp: e.target.value })}
                placeholder="37,2"
                inputMode="decimal"
              />
              <Input label={t('patient.bp')} value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} placeholder="120/80" />
            </div>
            <Textarea
              label={t('patient.prev')}
              value={form.prev}
              onChange={(e) => setForm({ ...form, prev: e.target.value })}
              placeholder={t('patient.prevPh')}
              rows={2}
            />

            <fieldset>
              <legend className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('patient.consents')}</legend>
              <div className="space-y-2">
                {consentItems.map(({ k, required }) => (
                  <div key={k} className="flex items-start gap-3 p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={consents[k]}
                      aria-labelledby={`pc-consent-${k}`}
                      onClick={() => setConsents((c) => ({ ...c, [k]: !c[k] }))}
                      className={`relative mt-0.5 w-10 h-5 shrink-0 rounded-full transition-colors ${consents[k] ? 'bg-emerald-500' : 'bg-secondary-300 dark:bg-secondary-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${consents[k] ? 'translate-x-5' : ''}`} />
                    </button>
                    <div className="text-sm">
                      <p id={`pc-consent-${k}`} className="font-medium text-secondary-800 dark:text-secondary-100">
                        {t(`patient.consent.${k}.title`)}{' '}
                        {required ? <span className="text-red-600">*</span> : <span className="text-xs text-secondary-500">({t('patient.optional')})</span>}
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-300">{t(`patient.consent.${k}.text`, { ips: IPS.name })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <Button type="submit" fullWidth disabled={!canSubmit}>
              {needsData ? t('patient.submit') : t('patient.update')}
            </Button>
            {!canSubmit && <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('patient.submitHint')}</p>}
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-4 min-w-0">
        <Card variant="bordered" padding="md">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{t('patient.waTitle')}</CardTitle>
              <SimTag>{t('common.simulated')}</SimTag>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-[#e7f6e7] dark:bg-emerald-950/50 p-3 text-sm text-secondary-900 dark:text-emerald-50">
              <p>{wa.text}</p>
              <p className="mt-1 font-mono text-xs text-sky-700 dark:text-sky-300 break-all">{wa.link}</p>
            </div>
            <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('patient.waNote')}</p>
          </CardContent>
        </Card>

        {camAllowed && (
          <Card variant="bordered" padding="md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <VideoCameraIcon className="w-5 h-5" /> {t('patient.camTitle')}
              </CardTitle>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t('patient.camSubtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative w-full overflow-hidden rounded-xl bg-slate-800" style={{ aspectRatio: '16 / 9' }}>
                {media.stream ? (
                  <video
                    ref={attachStream(media.stream)}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover -scale-x-100"
                    aria-label={t('patient.camPreview')}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-white/70 px-4">{t('patient.camIdle')}</div>
                )}
              </div>
              {media.stream && (
                <div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-300 mb-1">{media.hasAudio ? t('patient.micLevel') : t('patient.noMic')}</p>
                  <div
                    className="h-2 w-full rounded-full bg-secondary-200 dark:bg-secondary-700 overflow-hidden"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(level * 100)}
                    aria-label={t('patient.micLevel')}
                  >
                    <div className="h-full bg-emerald-500 transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
                  </div>
                </div>
              )}
              {media.error && <p className="text-xs text-amber-700 dark:text-amber-300">{t(`video.errors.${media.error}`)}</p>}
              <Button
                variant={media.stream ? 'outline' : 'primary'}
                fullWidth
                disabled={media.starting}
                onClick={async () => {
                  if (media.stream) {
                    media.stop();
                    return;
                  }
                  const ok = await media.start(true);
                  if (ok) {
                    store.log('patient', 'camTest');
                    notify(t('toasts.camOk'));
                  } else notify(t('video.camError'), 'warn');
                }}
              >
                {media.stream ? t('patient.camStop') : t('patient.camStart')}
              </Button>
              <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('patient.camPrivacy')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
