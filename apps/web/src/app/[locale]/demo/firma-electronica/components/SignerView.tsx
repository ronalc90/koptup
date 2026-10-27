'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, CheckCircleIcon, ChatBubbleLeftEllipsisIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { COMPANY } from '../lib/data';
import { fmtDate, fmtDateTime } from '../lib/dates';
import { acts, canAct, maskEmail, maskMobile, whoIsNext } from '../lib/logic';
import { shortHash } from '../lib/sha256';
import { useFirma } from '../lib/store';
import type { Envelope, Field, SignatureMark, Signer } from '../lib/types';
import { Panel, Paper, SignerDot, SimNote, focusRing, inputCls, labelCls, selectCls } from './ui';
import SignaturePad from './SignaturePad';
import { downloadCertificate, downloadSignedPdf } from './pdfSpecs';

export default function SignerView() {
  const t = useTranslations('demoSign');
  const { s, focusEnv, focusSigner, setFocusEnv, setFocusSigner, envTitle, go } = useFirma();
  const options = s.envelopes
    .filter((e) => e.status === 'sent' || e.status === 'partial' || (e.id === focusEnv && e.status !== 'draft'))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const env = options.find((e) => e.id === focusEnv) ?? options[0];

  if (!env) {
    return (
      <Panel title={t('signer.title')} subtitle={t('signer.subtitle')}>
        <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('signer.none')}</p>
        <Button size="sm" className="mt-3" onClick={() => go('create')}>
          {t('signer.createOne')}
        </Button>
      </Panel>
    );
  }

  const acting = env.signers.filter(acts);
  const signer = acting.find((x) => x.id === focusSigner) ?? whoIsNext(env)[0] ?? acting[acting.length - 1];

  return (
    <Panel title={t('signer.title')} subtitle={t('signer.subtitle')}>
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <label htmlFor="sv-env" className={labelCls}>
              {t('signer.pickEnvelope')}
            </label>
            <select
              id="sv-env"
              className={selectCls}
              value={env.id}
              onChange={(e) => {
                setFocusEnv(e.target.value);
                setFocusSigner(null);
              }}
            >
              {options.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} · {envTitle(e)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelCls}>{t('signer.whoSigns', { mode: t(`wizard.signers.modes.${env.mode}.name`).toLowerCase() })}</p>
            <ul className="space-y-1.5">
              {env.signers.map((x, i) => {
                const turn = canAct(env, x.id);
                const state = !acts(x) ? t('signerStates.copy') : x.state === 'signed' ? t('signerStates.signed') : turn ? t('signer.yourTurn') : t('signer.waiting');
                return (
                  <li key={x.id}>
                    <button
                      type="button"
                      disabled={!acts(x)}
                      aria-pressed={signer?.id === x.id}
                      onClick={() => setFocusSigner(x.id)}
                      className={`flex w-full min-w-0 items-start gap-2 rounded-lg border p-2 text-left text-sm ${focusRing} disabled:cursor-default disabled:opacity-60 ${
                        signer?.id === x.id ? 'border-lime-600 bg-lime-50 dark:bg-lime-950/40' : 'border-secondary-200 hover:border-lime-400 dark:border-secondary-700'
                      }`}
                    >
                      <SignerDot index={i} />
                      <span className="min-w-0">
                        <span className="block break-words font-medium">{x.name}</span>
                        <span className="block text-xs text-secondary-500 dark:text-secondary-400">
                          {t(`roles.${x.role}`)} · {state}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <SimNote>{t('signer.simNote')}</SimNote>
        </div>

        {signer && <SignerSession key={`${env.id}-${signer.id}`} env={env} signer={signer} />}
      </div>
    </Panel>
  );
}

function SignerSession({ env, signer }: { env: Envelope; signer: Signer }) {
  const t = useTranslations('demoSign');
  const store = useFirma();
  const { loc, now, envTitle, docText, view, sendCode, verify, sign, setFocusSigner, go, toast } = store;
  const [code, setCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [mark, setMark] = useState<SignatureMark | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const turn = canAct(env, signer.id);
  const opened = signer.state !== 'pending';
  const myFields = env.fields.filter((f) => f.signerId === signer.id);
  const inputs = myFields.filter((f) => f.type === 'text' || f.type === 'checkbox');
  const isApprover = signer.role === 'approver';
  const channel = env.auth === 'smsOtp' ? 'sms' : env.auth === 'whatsappOtp' ? 'whatsapp' : 'email';
  const dest = channel === 'email' ? maskEmail(signer.email) : maskMobile(signer.phone);
  const fieldLabel = (f: Field, i: number) => `${t(`fieldTypes.${f.type}`)} ${i + 1}`;

  const missing: string[] = [];
  if (!verified) missing.push(t('signer.missing.verify'));
  if (!isApprover && !mark) missing.push(t('signer.missing.signature'));
  inputs.forEach((f, i) => {
    if (f.type === 'text' && !values[f.id]?.trim()) missing.push(t('signer.missing.text', { field: fieldLabel(f, i) }));
    if (f.type === 'checkbox' && values[f.id] !== 'yes') missing.push(t('signer.missing.checkbox', { field: fieldLabel(f, i) }));
  });
  if (!consent) missing.push(t('signer.missing.consent'));

  if (signer.state === 'signed') {
    const next = whoIsNext(env)[0];
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="flex items-center gap-2 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          <CheckCircleIcon className="h-6 w-6" /> {t(isApprover ? 'signer.doneApproved' : 'signer.doneSigned', { name: signer.name })}
        </p>
        <p className="text-sm text-emerald-900 dark:text-emerald-100">{signer.signedAt ? fmtDateTime(signer.signedAt, loc, true) : ''}</p>
        {signer.signature?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signer.signature.image} alt={t('signer.yourSignature')} className="max-h-20 rounded border border-emerald-200 bg-white p-1" />
        )}
        <p className="text-sm text-emerald-900 dark:text-emerald-100">
          {env.status === 'completed' ? t('signer.envCompleted') : next ? t('signer.nextIs', { name: next.name }) : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {next && (
            <Button size="sm" onClick={() => setFocusSigner(next.id)}>
              {t('signer.signAs', { name: next.name })}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCertificate(env, store, t).then(() => toast(t('pdf.certDone')))}>
            <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('signer.receipt')}
          </Button>
          {env.status === 'completed' && (
            <Button size="sm" variant="outline" onClick={() => downloadSignedPdf(env, store, t).then(() => toast(t('pdf.signedDone')))}>
              <ArrowDownTrayIcon className="mr-1 h-4 w-4" /> {t('evidence.downloadSigned')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => go('evidence', { envId: env.id })}>
            <ShieldCheckIcon className="mr-1 h-4 w-4" /> {t('signer.seeEvidence')}
          </Button>
        </div>
      </div>
    );
  }

  if (!turn) {
    const next = whoIsNext(env)[0];
    return (
      <div className="rounded-2xl border border-secondary-200 p-5 text-sm dark:border-secondary-700">
        <p className="font-medium">{t('signer.notYourTurn', { name: signer.name })}</p>
        {next && (
          <Button size="sm" className="mt-3" onClick={() => setFocusSigner(next.id)}>
            {t('signer.signAs', { name: next.name })}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-secondary-200 dark:border-secondary-700">
      <div className="bg-gradient-to-r from-lime-700 to-lime-800 p-4 text-white">
        <p className="text-xs opacity-85">{t('signer.from', { company: COMPANY.name })}</p>
        <p className="mt-0.5 break-words text-lg font-semibold">{envTitle(env)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs opacity-85">
          <LockClosedIcon className="h-3.5 w-3.5" /> {t('signer.viewing', { name: signer.name })}
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <section aria-labelledby="sv-step1">
          <h3 id="sv-step1" className="text-sm font-semibold">
            1. {t('signer.step1')}
          </h3>
          <div className="mt-2 flex gap-2 rounded-lg bg-secondary-100 p-3 text-sm dark:bg-secondary-800">
            <ChatBubbleLeftEllipsisIcon className="mt-0.5 h-5 w-5 shrink-0 text-lime-700 dark:text-lime-400" />
            <p className="min-w-0 break-words">
              {t('signer.invite', {
                channel: t(`channels.${signer.channel}`),
                company: COMPANY.short,
                title: envTitle(env),
                date: fmtDate(env.expiresAt ?? now, loc),
              })}
            </p>
          </div>
          {!opened && (
            <Button
              size="sm"
              className="mt-2"
              onClick={() => {
                setFocusSigner(signer.id);
                view(env.id, signer.id);
              }}
            >
              {t('signer.open')}
            </Button>
          )}
        </section>

        {opened && (
          <>
            <section aria-labelledby="sv-step2">
              <h3 id="sv-step2" className="text-sm font-semibold">
                2. {t('signer.step2')}
              </h3>
              {env.doc.kind === 'template' ? (
                <Paper className="mt-2 max-h-72 overflow-y-auto p-4">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{docText(env)}</p>
                </Paper>
              ) : (
                <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">{t('signer.uploadedDoc', { file: env.doc.fileName ?? '' })}</p>
              )}
              <p className="mt-1 break-all font-mono text-[11px] text-secondary-500" title={env.doc.hash}>
                SHA-256 {shortHash(env.doc.hash, 12)}
              </p>
              <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">
                {t('signer.yourFields', { list: myFields.length ? myFields.map((f) => t(`fieldTypes.${f.type}`)).join(', ') : t('signer.noFields') })}
              </p>
            </section>

            <section aria-labelledby="sv-step3">
              <h3 id="sv-step3" className="text-sm font-semibold">
                3. {t('signer.step3')}
              </h3>
              {verified ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircleIcon className="h-4 w-4" /> {t('signer.verified', { method: t(`auth.${env.auth}.name`) })}
                </p>
              ) : env.auth === 'idCheck' ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('signer.idCheckText')}</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      verify(env.id, signer.id, 'idCheck');
                      setVerified(true);
                    }}
                  >
                    {t('signer.idCheckSimulate')}
                  </Button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {!code ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setCode(String(Math.floor(100000 + Math.random() * 900000)));
                        sendCode(env.id, signer.id);
                      }}
                    >
                      {t('signer.sendCode', { channel: t(`channels.${channel}`), dest })}
                    </Button>
                  ) : (
                    <>
                      <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100" role="status">
                        {t('signer.codeShown', { code, channel: t(`channels.${channel}`) })}
                      </p>
                      <form
                        className="flex flex-col gap-2 sm:flex-row sm:items-end"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (codeInput.replace(/\D/g, '') === code) {
                            verify(env.id, signer.id, env.auth);
                            setVerified(true);
                            setCodeError(false);
                          } else setCodeError(true);
                        }}
                      >
                        <div className="sm:w-48">
                          <label htmlFor="otp" className={labelCls}>
                            {t('signer.codeLabel')}
                          </label>
                          <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={7} className={inputCls} value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
                        </div>
                        <Button size="sm" type="submit">
                          {t('signer.verify')}
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCode(String(Math.floor(100000 + Math.random() * 900000)));
                            setCodeInput('');
                            setCodeError(false);
                            sendCode(env.id, signer.id);
                          }}
                        >
                          {t('signer.resend')}
                        </Button>
                      </form>
                      {codeError && (
                        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                          {t('signer.codeWrong')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              {env.sigType === 'digital' && <p className="mt-2 text-xs text-secondary-500">{t('signer.digitalNote')}</p>}
            </section>

            <section aria-labelledby="sv-step4">
              <h3 id="sv-step4" className="text-sm font-semibold">
                4. {isApprover ? t('signer.step4Approve') : t('signer.step4')}
              </h3>
              <div className="mt-2 space-y-3">
                {isApprover ? (
                  <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('signer.approveText')}</p>
                ) : (
                  <SignaturePad defaultName={signer.name} onChange={setMark} />
                )}
                {inputs.map((f, i) =>
                  f.type === 'text' ? (
                    <div key={f.id}>
                      <label htmlFor={`v-${f.id}`} className={labelCls}>
                        {fieldLabel(f, i)}
                      </label>
                      <input id={`v-${f.id}`} className={inputCls} value={values[f.id] ?? ''} onChange={(e) => setValues({ ...values, [f.id]: e.target.value })} />
                    </div>
                  ) : (
                    <label key={f.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 accent-lime-700" checked={values[f.id] === 'yes'} onChange={(e) => setValues({ ...values, [f.id]: e.target.checked ? 'yes' : '' })} />
                      {fieldLabel(f, i)}
                    </label>
                  ),
                )}
                {myFields.some((f) => f.type === 'date') && <p className="text-xs text-secondary-500">{t('signer.dateAuto', { date: fmtDate(now, loc) })}</p>}
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-lime-700" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>{t('signer.consent')}</span>
                </label>
                {missing.length > 0 && <p className="text-xs text-secondary-500">{t('signer.missingTitle', { list: missing.join(' · ') })}</p>}
                <Button
                  disabled={missing.length > 0}
                  onClick={() => {
                    // Se fija la persona para que, tras firmar, se vea su confirmación y no la de la siguiente.
                    setFocusSigner(signer.id);
                    sign(env.id, signer.id, isApprover ? { kind: 'approve' } : (mark as SignatureMark), values);
                    toast(t(isApprover ? 'signer.approvedToast' : 'signer.signedToast', { name: signer.name }));
                  }}
                >
                  {isApprover ? t('signer.approveButton') : t('signer.signButton')}
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
