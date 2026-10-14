/** Arma el contenido de los PDF de ejemplo (certificado y documento firmado) con los textos del idioma. */
import { COMPANY } from '../lib/data';
import { fmtBytes, fmtDateTime } from '../lib/dates';
import { acts, formatNit, verifyChain } from '../lib/logic';
import { buildReportPdf } from '../lib/pdf';
import type { useFirma } from '../lib/store';
import type { Envelope } from '../lib/types';
import { actorLabel, eventText, whereLabel, type T } from './text';

type Store = ReturnType<typeof useFirma>;

function baseRows(env: Envelope, store: Store, t: T): [string, string][] {
  const { loc, envTitle } = store;
  const rows: [string, string][] = [
    [t('pdf.envelope'), env.id],
    [t('pdf.subject'), envTitle(env)],
    [t('pdf.sender'), `${COMPANY.name} · NIT ${formatNit(COMPANY.nit)}`],
    [t('pdf.status'), t(`status.${env.status}`)],
    [t('pdf.created'), fmtDateTime(env.createdAt, loc, true)],
  ];
  if (env.sentAt) rows.push([t('pdf.sent'), fmtDateTime(env.sentAt, loc, true)]);
  if (env.completedAt) rows.push([t('pdf.completed'), fmtDateTime(env.completedAt, loc, true)]);
  rows.push(
    [t('pdf.mode'), t(`wizard.signers.modes.${env.mode}.name`)],
    [t('pdf.auth'), t(`auth.${env.auth}.name`)],
    [t('pdf.sigType'), t(`sigTypes.${env.sigType}.name`)],
    [t('pdf.timestamp'), env.timestamp ? t('pdf.timestampYes') : t('pdf.timestampNo')],
  );
  return rows;
}

function docRows(env: Envelope, store: Store, t: T): [string, string][] {
  const rows: [string, string][] = [
    [t('pdf.document'), env.doc.kind === 'upload' ? `${env.doc.fileName ?? ''}${env.doc.size ? ` (${fmtBytes(env.doc.size, store.loc)})` : ''}` : store.envTitle(env)],
    ['SHA-256', env.doc.hash],
  ];
  return rows;
}

export async function downloadCertificate(env: Envelope, store: Store, t: T) {
  const { loc } = store;
  const chain = verifyChain(env.doc.hash, env.events);
  await buildReportPdf({
    filename: `${t('pdf.certFile')}-${env.id}.pdf`,
    title: t('pdf.certTitle'),
    note: t('pdf.note'),
    watermark: t('pdf.watermark'),
    sections: [
      { heading: t('pdf.envelopeSection'), rows: baseRows(env, store, t) },
      { heading: t('pdf.documentSection'), rows: docRows(env, store, t) },
      {
        heading: t('pdf.chainSection'),
        rows: [
          [t('pdf.chainResult'), chain.ok ? t('evidence.chainOk', { n: chain.checked }) : t('evidence.chainBroken', { n: (chain.brokenAt ?? 0) + 1 })],
          [t('pdf.lastHash'), env.events.length ? env.events[env.events.length - 1].hash : env.doc.hash],
        ],
      },
    ],
    table: {
      heading: t('pdf.signersSection'),
      headers: [t('pdf.cols.name'), t('pdf.cols.role'), t('pdf.cols.contact'), t('pdf.cols.state'), t('pdf.cols.when')],
      widths: [42, 24, 54, 26, 39],
      rows: env.signers.map((s) => [
        s.name,
        t(`roles.${s.role}`),
        `${s.email}${s.phone ? ` · ${s.phone}` : ''}`,
        acts(s) ? t(`signerStates.${s.state}`) : t('signerStates.copy'),
        s.signedAt ? fmtDateTime(s.signedAt, loc) : '—',
      ]),
    },
    events: {
      heading: t('pdf.eventsSection'),
      rows: env.events.map((e) => ({
        when: fmtDateTime(e.at, loc, true),
        what: eventText(t, e),
        who: actorLabel(t, e.actor),
        where: whereLabel(e),
        hash: e.hash,
      })),
    },
    footer: t('pdf.footer'),
  });
}

export async function downloadSignedPdf(env: Envelope, store: Store, t: T) {
  const { loc, docText } = store;
  const text = env.doc.kind === 'template' ? docText(env) : t('pdf.uploadNote', { file: env.doc.fileName ?? '' });
  await buildReportPdf({
    filename: `${t('pdf.signedFile')}-${env.id}.pdf`,
    title: store.envTitle(env),
    note: t('pdf.note'),
    watermark: t('pdf.watermark'),
    sections: [{ heading: t('pdf.documentSection'), rows: [[t('pdf.envelope'), env.id], ...docRows(env, store, t)] }],
    paragraphs: { heading: t('pdf.contentSection'), text },
    signatures: {
      heading: t('pdf.signaturesSection'),
      items: env.signers
        .filter((s) => acts(s) && s.state === 'signed')
        .map((s) => ({
          name: s.name,
          role: t(`roles.${s.role}`),
          when: s.signedAt ? fmtDateTime(s.signedAt, loc) : '',
          image: s.signature?.image,
          text: s.signature?.image ? undefined : s.signature?.kind === 'approve' ? t('pdf.approved') : s.signature?.text ?? s.name,
        })),
    },
    footer: t('pdf.footer'),
  });
}
