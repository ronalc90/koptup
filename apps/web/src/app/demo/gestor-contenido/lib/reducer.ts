/**
 * Reducer de la demo. Cada acción revisa el permiso del rol activo (como lo
 * haría el servidor del CMS) y deja rastro en el historial de versiones, el
 * registro de actividad y las entregas de webhooks (simuladas).
 */
import { missingRequired, pathOf, revalidatePaths, sameContent, titleOf, typeOf } from './models';
import { can, canDelete, canEdit } from './permissions';
import { SLUG_RE } from './text';
import type {
  Activity,
  ActivityKind,
  AppState,
  ContentType,
  Delivery,
  Entry,
  EntryContent,
  FieldDef,
  Media,
  Person,
  TourStep,
  TypeId,
  Version,
  VersionReason,
  WebhookEvent,
  WebhookTargetId,
} from './types';

const MAX_VERSIONS = 20;
const MAX_ACTIVITY = 80;
const MAX_DELIVERIES = 60;

export type Action =
  | { type: 'state.replace'; state: AppState }
  | { type: 'user.switch'; userId: string }
  | { type: 'tour.mark'; step: TourStep }
  | { type: 'entry.create'; id: string; entryType: TypeId; title: string; slug: string; now: string }
  | { type: 'entry.edit'; id: string; content: EntryContent; now: string }
  | { type: 'entry.save'; id: string; now: string }
  | { type: 'entry.submit'; id: string; now: string }
  | { type: 'entry.approve'; id: string; now: string }
  | { type: 'entry.requestChanges'; id: string; note: string; now: string }
  | { type: 'entry.publish'; id: string; now: string }
  | { type: 'entry.schedule'; id: string; at: string; now: string }
  | { type: 'entry.unschedule'; id: string; now: string }
  | { type: 'entry.unpublish'; id: string; now: string }
  | { type: 'entry.discard'; id: string; now: string }
  | { type: 'entry.restore'; id: string; versionId: string; now: string }
  | { type: 'entry.duplicate'; id: string; newId: string; now: string }
  | { type: 'entry.delete'; id: string; now: string }
  | { type: 'scheduler.tick'; now: string }
  | { type: 'model.addField'; typeId: TypeId; field: FieldDef; now: string }
  | { type: 'model.removeField'; typeId: TypeId; fieldId: string; now: string }
  | { type: 'media.add'; media: Media; now: string }
  | { type: 'media.update'; id: string; patch: Partial<Pick<Media, 'alt' | 'focal' | 'name'>> }
  | { type: 'media.remove'; id: string; now: string }
  | { type: 'webhook.toggle'; id: WebhookTargetId; now: string }
  | { type: 'webhook.resend'; deliveryId: string; deliveryNewId: string; now: string };

export function currentUser(state: AppState): Person {
  return state.people.find((p) => p.id === state.currentUserId) ?? state.people[0];
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function entryTitle(state: AppState, e: Entry): string {
  return titleOf(e, e.content, 'es') || e.content.slug;
}

function log(state: AppState, kind: ActivityKind, now: string, e?: Entry, detail?: string): Activity[] {
  const item: Activity = {
    id: `act-${kind}-${e?.id ?? detail ?? 'x'}-${now}`,
    at: now,
    by: state.currentUserId,
    kind,
    entryId: e?.id,
    entryTitle: e ? entryTitle(state, e) : undefined,
    detail,
  };
  return [item, ...state.activity].slice(0, MAX_ACTIVITY);
}

function version(e: Entry, reason: VersionReason, now: string, by: string): Version[] {
  const v: Version = { id: `${e.id}-v${e.versions.length + 1}-${now}`, at: now, by, reason, content: clone(e.content) };
  return [...e.versions, v].slice(-MAX_VERSIONS);
}

function replaceEntry(state: AppState, e: Entry): AppState {
  return { ...state, entries: state.entries.map((x) => (x.id === e.id ? e : x)) };
}

/** Entregas de webhook simuladas (sitio, app y asistente) para un cambio publicado. */
function deliveries(state: AppState, e: Entry, event: WebhookEvent, now: string, auto: boolean): Delivery[] {
  const slug = (e.live ?? e.content).slug;
  const isAssistantSource = e.type === 'faq';
  const out: Delivery[] = [];
  for (const w of state.webhooks) {
    if (!w.enabled) continue;
    if (w.id === 'assistant' && !isAssistantSource) continue;
    out.push({
      id: `dlv-${event}-${w.id}-${e.id}-${now}`,
      at: now,
      event,
      target: w.id,
      entryId: e.id,
      entryTitle: entryTitle(state, e),
      paths: w.id === 'site' ? revalidatePaths(e.type, slug) : [pathOf(e.type, slug)],
      auto,
      resent: false,
    });
  }
  return [...out, ...state.deliveries].slice(0, MAX_DELIVERIES);
}

function find(state: AppState, id: string): Entry | undefined {
  return state.entries.find((e) => e.id === id);
}

/** Problemas que impiden enviar a revisión, aprobar o publicar. */
export function blockingIssues(state: AppState, e: Entry): string[] {
  const out = missingRequired(typeOf(state.types, e.type), e.content);
  if (!SLUG_RE.test(e.content.slug)) out.push('slug.invalid');
  else if (slugTaken(state, e)) out.push('slug.taken');
  return out;
}

export function slugTaken(state: AppState, e: Pick<Entry, 'id' | 'type' | 'content'>): boolean {
  return state.entries.some((x) => x.id !== e.id && x.type === e.type && (x.content.slug === e.content.slug || x.live?.slug === e.content.slug));
}

function publish(state: AppState, e: Entry, now: string, auto: boolean): AppState {
  if (blockingIssues(state, e).length > 0) return state;
  const by = auto ? (e.versions.find((v) => v.reason === 'approved')?.by ?? state.currentUserId) : state.currentUserId;
  const published: Entry = {
    ...e,
    status: 'published',
    live: clone(e.content),
    publishedAt: now,
    scheduledAt: null,
    reviewNote: null,
    updatedAt: now,
    updatedBy: by,
    versions: version(e, 'published', now, by),
  };
  const next = replaceEntry(state, published);
  return {
    ...next,
    deliveries: deliveries(next, published, 'entry.published', now, auto),
    activity: log(next, auto ? 'autoPublished' : 'published', now, published),
    tour: !auto ? { ...next.tour, publish: true } : next.tour,
  };
}

/** Slug sin repetir dentro del mismo tipo de contenido. */
function uniqueSlug(state: AppState, type: TypeId, base: string): string {
  const taken = new Set(state.entries.filter((e) => e.type === type).flatMap((e) => [e.content.slug, e.live?.slug ?? '']));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function reducer(state: AppState, action: Action): AppState {
  const role = currentUser(state).role;
  switch (action.type) {
    case 'state.replace':
      return action.state;

    case 'user.switch':
      return state.people.some((p) => p.id === action.userId) ? { ...state, currentUserId: action.userId } : state;

    case 'tour.mark':
      return state.tour[action.step] ? state : { ...state, tour: { ...state.tour, [action.step]: true } };

    case 'entry.create': {
      if (!can(role, 'entry.create') || find(state, action.id)) return state;
      const type = typeOf(state.types, action.entryType);
      const fields: EntryContent['fields'] = {};
      for (const def of type.fields) {
        if (def.kind === 'blocks') continue;
        if (def.localized && (def.kind === 'text' || def.kind === 'longText')) fields[def.id] = { es: '', en: '' };
        else if (def.kind === 'boolean') fields[def.id] = false;
        else if (def.kind === 'references') fields[def.id] = [];
        else if (def.kind === 'number' || def.kind === 'image' || def.kind === 'reference') fields[def.id] = null;
        else fields[def.id] = '';
      }
      const titleField = type.fields[0];
      fields[titleField.id] = { es: action.title, en: '' };
      const content: EntryContent = {
        slug: uniqueSlug(state, action.entryType, action.slug || 'nueva-entrada'),
        fields,
        blocks: [],
        seo: { title: { es: '', en: '' }, description: { es: '', en: '' } },
      };
      const e: Entry = {
        id: action.id,
        type: action.entryType,
        status: 'draft',
        content,
        live: null,
        authorId: state.currentUserId,
        createdAt: action.now,
        updatedAt: action.now,
        updatedBy: state.currentUserId,
        publishedAt: null,
        scheduledAt: null,
        reviewNote: null,
        versions: [],
      };
      e.versions = version(e, 'created', action.now, state.currentUserId);
      const next = { ...state, entries: [e, ...state.entries] };
      return { ...next, activity: log(next, 'created', action.now, e) };
    }

    case 'entry.edit': {
      const e = find(state, action.id);
      if (!e || !canEdit(role, e) || sameContent(e.content, action.content)) return state;
      // Editar algo aprobado, programado o publicado lo devuelve a borrador.
      const resets = e.status === 'approved' || e.status === 'scheduled' || e.status === 'published';
      const edited: Entry = {
        ...e,
        content: action.content,
        status: resets ? 'draft' : e.status,
        scheduledAt: resets ? null : e.scheduledAt,
        updatedAt: action.now,
        updatedBy: state.currentUserId,
      };
      let next = replaceEntry(state, edited);
      if (resets) next = { ...next, activity: log(next, e.status === 'scheduled' ? 'unscheduled' : 'edited', action.now, edited) };
      if (e.id === 'loc-chapinero' && !next.tour.edit) next = { ...next, tour: { ...next.tour, edit: true } };
      return next;
    }

    case 'entry.save': {
      const e = find(state, action.id);
      if (!e || !canEdit(role, e)) return state;
      const last = e.versions[e.versions.length - 1];
      if (last && sameContent(last.content, e.content)) return state;
      const saved = { ...e, versions: version(e, 'saved', action.now, state.currentUserId) };
      const next = replaceEntry(state, saved);
      return { ...next, activity: log(next, 'saved', action.now, saved) };
    }

    case 'entry.submit': {
      const e = find(state, action.id);
      if (!e || e.status !== 'draft' || !can(role, 'entry.submit')) return state;
      if (blockingIssues(state, e).length > 0) return state;
      const s: Entry = { ...e, status: 'review', reviewNote: null, updatedAt: action.now, updatedBy: state.currentUserId, versions: version(e, 'submitted', action.now, state.currentUserId) };
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'submitted', action.now, s) };
    }

    case 'entry.approve': {
      const e = find(state, action.id);
      if (!e || e.status !== 'review' || !can(role, 'entry.approve')) return state;
      if (blockingIssues(state, e).length > 0) return state;
      const s: Entry = { ...e, status: 'approved', reviewNote: null, updatedAt: action.now, updatedBy: state.currentUserId, versions: version(e, 'approved', action.now, state.currentUserId) };
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'approved', action.now, s) };
    }

    case 'entry.requestChanges': {
      const e = find(state, action.id);
      if (!e || e.status !== 'review' || !can(role, 'entry.approve')) return state;
      const s: Entry = { ...e, status: 'draft', reviewNote: action.note.trim() || null, updatedAt: action.now, updatedBy: state.currentUserId };
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'changesRequested', action.now, s, action.note.trim() || undefined) };
    }

    case 'entry.publish': {
      const e = find(state, action.id);
      if (!e || !can(role, 'entry.publish') || (e.status !== 'approved' && e.status !== 'scheduled')) return state;
      return publish(state, e, action.now, false);
    }

    case 'entry.schedule': {
      const e = find(state, action.id);
      if (!e || !can(role, 'entry.publish') || (e.status !== 'approved' && e.status !== 'scheduled')) return state;
      if (Date.parse(action.at) <= Date.parse(action.now)) return state;
      const s: Entry = { ...e, status: 'scheduled', scheduledAt: action.at, updatedAt: action.now, updatedBy: state.currentUserId };
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'scheduled', action.now, s, action.at) };
    }

    case 'entry.unschedule': {
      const e = find(state, action.id);
      if (!e || e.status !== 'scheduled' || !can(role, 'entry.publish')) return state;
      const s: Entry = { ...e, status: 'approved', scheduledAt: null, updatedAt: action.now, updatedBy: state.currentUserId };
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'unscheduled', action.now, s) };
    }

    case 'entry.unpublish': {
      const e = find(state, action.id);
      if (!e || !e.live || !can(role, 'entry.unpublish')) return state;
      const s: Entry = { ...e, status: 'draft', live: null, publishedAt: null, scheduledAt: null, updatedAt: action.now, updatedBy: state.currentUserId };
      const withDeliveries = { ...state, deliveries: deliveries(state, e, 'entry.unpublished', action.now, false) };
      const next = replaceEntry(withDeliveries, s);
      return { ...next, activity: log(next, 'unpublished', action.now, s) };
    }

    case 'entry.discard': {
      // Descarta los cambios sin publicar y vuelve a la versión publicada.
      const e = find(state, action.id);
      if (!e || !e.live || !canEdit(role, e) || sameContent(e.live, e.content)) return state;
      const s: Entry = { ...e, content: clone(e.live), status: 'published', scheduledAt: null, reviewNote: null, updatedAt: action.now, updatedBy: state.currentUserId };
      s.versions = version(s, 'discarded', action.now, state.currentUserId);
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'discarded', action.now, s) };
    }

    case 'entry.restore': {
      const e = find(state, action.id);
      const v = e?.versions.find((x) => x.id === action.versionId);
      if (!e || !v || !canEdit(role, e) || sameContent(v.content, e.content)) return state;
      const resets = e.status !== 'draft' && e.status !== 'review';
      const s: Entry = {
        ...e,
        content: clone(v.content),
        status: resets ? 'draft' : e.status,
        scheduledAt: resets ? null : e.scheduledAt,
        updatedAt: action.now,
        updatedBy: state.currentUserId,
      };
      s.versions = version(s, 'restored', action.now, state.currentUserId);
      const next = replaceEntry(state, s);
      return { ...next, activity: log(next, 'restored', action.now, s) };
    }

    case 'entry.duplicate': {
      const e = find(state, action.id);
      if (!e || !can(role, 'entry.create') || find(state, action.newId)) return state;
      const content = clone(e.content);
      content.slug = uniqueSlug(state, e.type, `${content.slug}-copia`);
      const tf = typeOf(state.types, e.type).fields[0].id;
      const title = content.fields[tf];
      if (title && typeof title === 'object' && !Array.isArray(title)) {
        content.fields[tf] = { es: title.es ? `${title.es} (copia)` : '', en: title.en ? `${title.en} (copy)` : '' };
      }
      const d: Entry = {
        ...e,
        id: action.newId,
        status: 'draft',
        content,
        live: null,
        authorId: state.currentUserId,
        createdAt: action.now,
        updatedAt: action.now,
        updatedBy: state.currentUserId,
        publishedAt: null,
        scheduledAt: null,
        reviewNote: null,
        versions: [],
      };
      d.versions = version(d, 'created', action.now, state.currentUserId);
      const idx = state.entries.findIndex((x) => x.id === e.id);
      const entries = [...state.entries];
      entries.splice(idx + 1, 0, d);
      const next = { ...state, entries };
      return { ...next, activity: log(next, 'duplicated', action.now, d, entryTitle(state, e)) };
    }

    case 'entry.delete': {
      const e = find(state, action.id);
      if (!e || !canDelete(role, e, state.currentUserId)) return state;
      // Las referencias a la entrada borrada se limpian en las demás entradas.
      const entries = state.entries
        .filter((x) => x.id !== e.id)
        .map((x) => {
          let changed = false;
          const fields = { ...x.content.fields };
          for (const [k, v] of Object.entries(fields)) {
            if (v === e.id) {
              fields[k] = null;
              changed = true;
            } else if (Array.isArray(v) && v.includes(e.id)) {
              fields[k] = v.filter((id) => id !== e.id);
              changed = true;
            }
          }
          return changed ? { ...x, content: { ...x.content, fields } } : x;
        });
      const base = e.live ? { ...state, deliveries: deliveries(state, e, 'entry.deleted', action.now, false) } : state;
      const next = { ...base, entries };
      return { ...next, activity: log(next, 'deleted', action.now, e) };
    }

    case 'scheduler.tick': {
      const due = state.entries.filter((e) => e.status === 'scheduled' && e.scheduledAt && Date.parse(e.scheduledAt) <= Date.parse(action.now));
      if (due.length === 0) return state;
      return due.reduce<AppState>((s, e) => {
        const fresh = find(s, e.id);
        // Se publica con la fecha programada (así lo habría hecho el servidor aunque la pestaña estuviera cerrada).
        return fresh ? publish(s, fresh, e.scheduledAt ?? action.now, true) : s;
      }, state);
    }

    case 'model.addField': {
      if (!can(role, 'models.manage')) return state;
      const t = typeOf(state.types, action.typeId);
      if (t.fields.some((f) => f.id === action.field.id)) return state;
      const field: FieldDef = { ...action.field, custom: action.field.custom ?? { label: { es: action.field.id, en: action.field.id } } };
      const types: ContentType[] = state.types.map((x) => (x.id === t.id ? { ...x, fields: [...x.fields, field] } : x));
      const empty = field.localized && (field.kind === 'text' || field.kind === 'longText') ? { es: '', en: '' } : field.kind === 'boolean' ? false : field.kind === 'number' ? null : '';
      const entries = state.entries.map((e) => (e.type === t.id ? { ...e, content: { ...e.content, fields: { ...e.content.fields, [field.id]: empty } } } : e));
      const next = { ...state, types, entries, tour: { ...state.tour, model: true } };
      return { ...next, activity: log(next, 'fieldAdded', action.now, undefined, `${t.id}.${field.custom?.label.es ?? field.id}`) };
    }

    case 'model.removeField': {
      if (!can(role, 'models.manage')) return state;
      const t = typeOf(state.types, action.typeId);
      const field = t.fields.find((f) => f.id === action.fieldId);
      if (!field || !field.custom) return state; // los campos base no se borran en la demo
      const types = state.types.map((x) => (x.id === t.id ? { ...x, fields: x.fields.filter((f) => f.id !== field.id) } : x));
      const strip = (c: EntryContent): EntryContent => {
        const fields = { ...c.fields };
        delete fields[field.id];
        return { ...c, fields };
      };
      const entries = state.entries.map((e) => (e.type === t.id ? { ...e, content: strip(e.content), live: e.live ? strip(e.live) : null } : e));
      const next = { ...state, types, entries };
      return { ...next, activity: log(next, 'fieldRemoved', action.now, undefined, `${t.id}.${field.custom.label.es}`) };
    }

    case 'media.add': {
      if (!can(role, 'media.upload') || state.media.some((m) => m.id === action.media.id)) return state;
      const next = { ...state, media: [action.media, ...state.media] };
      return { ...next, activity: log(next, 'mediaAdded', action.now, undefined, action.media.name) };
    }

    case 'media.update': {
      if (!can(role, 'media.upload')) return state;
      return { ...state, media: state.media.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) };
    }

    case 'media.remove': {
      const m = state.media.find((x) => x.id === action.id);
      if (!m || !can(role, 'media.delete') || mediaUsage(state, m.id).length > 0) return state;
      const next = { ...state, media: state.media.filter((x) => x.id !== m.id) };
      return { ...next, activity: log(next, 'mediaRemoved', action.now, undefined, m.name) };
    }

    case 'webhook.toggle': {
      if (!can(role, 'webhooks.manage')) return state;
      const next = { ...state, webhooks: state.webhooks.map((w) => (w.id === action.id ? { ...w, enabled: !w.enabled } : w)) };
      return { ...next, activity: log(next, 'webhookToggled', action.now, undefined, action.id) };
    }

    case 'webhook.resend': {
      if (!can(role, 'webhooks.manage')) return state;
      const d = state.deliveries.find((x) => x.id === action.deliveryId);
      if (!d) return state;
      const copy: Delivery = { ...d, id: action.deliveryNewId, at: action.now, resent: true, auto: false };
      const next = { ...state, deliveries: [copy, ...state.deliveries].slice(0, MAX_DELIVERIES) };
      return { ...next, activity: log(next, 'webhookResent', action.now, undefined, d.target) };
    }
  }
}

/** Entradas que usan una imagen (no se puede borrar mientras esté en uso). */
export function mediaUsage(state: AppState, mediaId: string): Entry[] {
  return state.entries.filter((e) => {
    const inFields = (c: EntryContent) => Object.values(c.fields).some((v) => v === mediaId);
    const inBlocks = (c: EntryContent) => c.blocks.some((b) => b.kind === 'image' && b.mediaId === mediaId);
    return inFields(e.content) || inBlocks(e.content) || (!!e.live && (inFields(e.live) || inBlocks(e.live)));
  });
}
