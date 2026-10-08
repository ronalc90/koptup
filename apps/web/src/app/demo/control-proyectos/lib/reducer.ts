/**
 * Todas las acciones de la demo como un reducer puro (fácil de probar). Las
 * fechas "hoy" y "ahora" llegan en la acción desde el navegador.
 */
import { addDays } from './dates';
import { isOverdue, me } from './engine';
import { buildState, buildWorkspaceFor, findMentions } from './seed';
import type {
  AppNotification,
  AppState,
  Automations,
  ISODate,
  ISODateTime,
  Milestone,
  NotificationKind,
  Prefs,
  Priority,
  Project,
  SectorId,
  StatusId,
  Task,
  Workspace,
} from './types';

export interface TaskDraft {
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  assigneeId: string | null;
  start: ISODate;
  due: ISODate;
  priority: Priority;
  status: StatusId;
  estimate: number;
  clientVisible: boolean;
  tags?: string[];
  /** Índices (dentro del mismo lote) de las tareas de las que depende. */
  depIdx?: number[];
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'assigneeId' | 'start' | 'due' | 'priority' | 'milestoneId' | 'estimate' | 'clientVisible' | 'dependsOn' | 'tags'>
>;

type Stamp = { now: ISODateTime; today: ISODate };

export type Action =
  | { type: 'reset'; base: ISODate; sector?: SectorId }
  | { type: 'load'; state: AppState }
  | ({ type: 'sector'; sector: SectorId } & Stamp)
  | ({ type: 'workspace.reset'; base: ISODate } & Stamp)
  | { type: 'project.select'; id: string }
  | ({
      type: 'project.create';
      project: Omit<Project, 'id' | 'favorite'>;
      milestones: Omit<Milestone, 'id' | 'projectId'>[];
      tasks: (Omit<TaskDraft, 'projectId' | 'milestoneId'> & { msIdx: number })[];
    } & Stamp)
  | { type: 'project.update'; id: string; patch: Partial<Omit<Project, 'id'>> }
  | { type: 'project.delete'; id: string }
  | { type: 'project.favorite'; id: string }
  | { type: 'milestone.add'; projectId: string; milestone: Omit<Milestone, 'id' | 'projectId'> }
  | { type: 'milestone.update'; id: string; patch: Partial<Pick<Milestone, 'name' | 'start' | 'end' | 'budget' | 'billing'>> }
  | ({ type: 'sprint.close'; id: string; nextName: string } & Stamp)
  | ({ type: 'milestone.invoice'; id: string; number: string } & Stamp)
  | ({ type: 'task.create'; task: TaskDraft } & Stamp)
  | ({ type: 'task.update'; id: string; patch: TaskPatch } & Stamp)
  | ({ type: 'task.move'; id: string; status: StatusId } & Stamp)
  | { type: 'task.delete'; id: string }
  | ({ type: 'task.duplicate'; id: string; suffix: string } & Stamp)
  | { type: 'check.toggle'; taskId: string; itemId: string }
  | { type: 'check.add'; taskId: string; text: string }
  | { type: 'check.remove'; taskId: string; itemId: string }
  | ({ type: 'comment.add'; taskId: string; text: string } & Stamp)
  | ({ type: 'attach.add'; taskId: string; id: string; name: string; size: number } & Stamp)
  | { type: 'attach.remove'; taskId: string; id: string }
  | ({ type: 'time.add'; taskId: string; memberId: string; date: ISODate; hours: number; note: string } & Stamp)
  | { type: 'time.remove'; id: string }
  | { type: 'expense.add'; projectId: string; milestoneId: string; date: ISODate; concept: string; amount: number }
  | ({ type: 'client.approve'; taskId: string; comment: string } & Stamp)
  | ({ type: 'client.changes'; taskId: string; comment: string } & Stamp)
  | ({ type: 'client.comment'; taskId: string; text: string } & Stamp)
  | { type: 'notif.read'; id: string }
  | { type: 'notif.readAll' }
  | ({ type: 'outbox.weekly'; projectId: string; channels: ('email' | 'whatsapp')[] } & Stamp)
  | ({ type: 'automation.set'; key: keyof Automations; value: boolean } & Stamp)
  | ({ type: 'automation.tick' } & Stamp)
  | { type: 'prefs.set'; prefs: Partial<Prefs> };

/* ------------------------------------------------------------------ */

function nextId(ws: Workspace, prefix: string): [string, Workspace] {
  const seq = ws.seq + 1;
  return [`${prefix}${seq}`, { ...ws, seq }];
}

function withWs(state: AppState, fn: (ws: Workspace) => Workspace): AppState {
  const ws = state.workspaces[state.sector];
  const next = fn(ws);
  if (next === ws) return state;
  return { ...state, workspaces: { ...state.workspaces, [state.sector]: next } };
}

function mapTask(ws: Workspace, id: string, fn: (t: Task) => Task): Workspace {
  return { ...ws, tasks: ws.tasks.map((t) => (t.id === id ? fn(t) : t)) };
}

function pushNotif(
  ws: Workspace,
  prefs: Prefs,
  n: Omit<AppNotification, 'id' | 'read'> & { kind: NotificationKind },
): Workspace {
  if ((n.kind === 'client' || n.kind === 'due' || n.kind === 'sent') && !prefs.notify[n.kind]) return ws;
  const [id, w] = nextId(ws, 'n');
  return { ...w, notifications: [{ ...n, id, read: false }, ...w.notifications] };
}

/** Automatización "tarea vencida → prioridad alta + aviso" (una vez por vencimiento). */
function raiseOverdue(ws: Workspace, prefs: Prefs, today: ISODate, now: ISODateTime): Workspace {
  if (!ws.automations.overdueRaise) return ws;
  let out = ws;
  for (const t of ws.tasks) {
    if (!isOverdue(t, today) || t.autoRaisedDue === t.due) continue;
    const raise = t.priority !== 'high';
    out = mapTask(out, t.id, (x) => ({
      ...x,
      priority: 'high',
      autoRaisedDue: x.due,
      history: raise ? [...x.history, { at: now, actor: '', key: 'autoRaised' }] : x.history,
    }));
    if (raise) {
      out = pushNotif(out, prefs, { kind: 'due', at: now, key: 'overdueRaised', params: { task: t.title }, projectId: t.projectId, taskId: t.id });
    }
  }
  return out;
}

function projectOf(ws: Workspace, task: Task): Project | undefined {
  return ws.projects.find((p) => p.id === task.projectId);
}

function moveTask(ws: Workspace, prefs: Prefs, id: string, status: StatusId, actor: string, now: ISODateTime, today: ISODate): Workspace {
  const t = ws.tasks.find((x) => x.id === id);
  if (!t || t.status === status) return ws;
  const project = projectOf(ws, t);
  let out = mapTask(ws, id, (x) => ({
    ...x,
    status,
    clientVisible: status === 'client' ? true : x.clientVisible,
    completedAt: status === 'done' ? (x.completedAt ?? today) : undefined,
    clientApproved: status === 'client' || status === 'done' ? x.clientApproved : false,
    history: [...x.history, { at: now, actor, key: 'moved', params: { status }, client: x.clientVisible && (status === 'done' || status === 'client') }],
  }));
  if (status === 'client' && project && ws.automations.notifyClient) {
    for (const channel of ['email', 'whatsapp'] as const) {
      const [oid, w] = nextId(out, 'o');
      out = { ...w, outbox: [{ id: oid, at: now, projectId: project.id, channel, to: project.clientContact, key: 'review', params: { task: t.title, project: project.name } }, ...w.outbox] };
    }
    out = mapTask(out, id, (x) => ({ ...x, history: [...x.history, { at: now, actor: '', key: 'sentToClient', client: true }] }));
    out = pushNotif(out, prefs, { kind: 'sent', at: now, key: 'sentToClient', params: { task: t.title, who: project.clientContact }, projectId: project.id, taskId: id });
  }
  return out;
}

function createTasks(ws: Workspace, drafts: TaskDraft[], actor: string, now: ISODateTime): [Workspace, string[]] {
  let out = ws;
  const ids: string[] = [];
  for (const d of drafts) {
    const [tid, w] = nextId(out, 't');
    out = w;
    ids.push(tid);
    const task: Task = {
      id: tid,
      projectId: d.projectId,
      milestoneId: d.milestoneId,
      title: d.title,
      description: d.description,
      assigneeId: d.assigneeId,
      start: d.start,
      due: d.due,
      priority: d.priority,
      status: d.status,
      estimate: d.estimate,
      tags: d.tags ?? [],
      checklist: [],
      comments: [],
      attachments: [],
      history: [{ at: now, actor, key: 'created' }],
      dependsOn: [],
      clientVisible: d.clientVisible || d.status === 'client',
      completedAt: d.status === 'done' ? now.slice(0, 10) : undefined,
    };
    out = { ...out, tasks: [...out.tasks, task] };
  }
  // Dependencias dentro del lote (plantillas)
  drafts.forEach((d, i) => {
    if (d.depIdx?.length) {
      const deps = d.depIdx.map((j) => ids[j]).filter(Boolean);
      out = mapTask(out, ids[i], (x) => ({ ...x, dependsOn: deps }));
    }
  });
  return [out, ids];
}

/* ------------------------------------------------------------------ */

export function reducer(state: AppState | null, a: Action): AppState | null {
  if (a.type === 'reset') return buildState(a.base, a.sector ?? state?.sector ?? 'construccion');
  if (a.type === 'load') return a.state;
  if (!state) return state;
  const prefs = state.prefs;

  switch (a.type) {
    case 'sector': {
      const next = { ...state, sector: a.sector };
      return withWs(next, (ws) => raiseOverdue(ws, prefs, a.today, a.now));
    }
    case 'workspace.reset':
      return { ...state, workspaces: { ...state.workspaces, [state.sector]: raiseOverdue(buildWorkspaceFor(state.sector, a.base), prefs, a.today, a.now) } };
    case 'prefs.set':
      return { ...state, prefs: { ...state.prefs, ...a.prefs, notify: { ...state.prefs.notify, ...(a.prefs.notify ?? {}) } } };
    default:
      return withWs(state, (ws) => wsReducer(ws, prefs, a));
  }
}

function wsReducer(ws: Workspace, prefs: Prefs, a: Action): Workspace {
  const actor = me(ws).name;
  switch (a.type) {
    case 'project.select':
      return ws.projects.some((p) => p.id === a.id) ? { ...ws, currentProjectId: a.id } : ws;

    case 'project.create': {
      const [pid, w0] = nextId(ws, 'p');
      let out: Workspace = { ...w0, projects: [...w0.projects, { ...a.project, id: pid, favorite: false }], currentProjectId: pid };
      const msIds: string[] = [];
      for (const m of a.milestones) {
        const [mid, w] = nextId(out, 'ms');
        out = { ...w, milestones: [...w.milestones, { ...m, id: mid, projectId: pid }] };
        msIds.push(mid);
      }
      const drafts: TaskDraft[] = a.tasks.map(({ msIdx, ...d }) => ({ ...d, projectId: pid, milestoneId: msIds[msIdx] ?? null }));
      [out] = createTasks(out, drafts, actor, a.now);
      return raiseOverdue(out, prefs, a.today, a.now);
    }

    case 'project.update':
      return { ...ws, projects: ws.projects.map((p) => (p.id === a.id ? { ...p, ...a.patch } : p)) };

    case 'project.delete': {
      if (ws.projects.length <= 1) return ws;
      const taskIds = new Set(ws.tasks.filter((t) => t.projectId === a.id).map((t) => t.id));
      const projects = ws.projects.filter((p) => p.id !== a.id);
      return {
        ...ws,
        projects,
        milestones: ws.milestones.filter((m) => m.projectId !== a.id),
        tasks: ws.tasks.filter((t) => t.projectId !== a.id),
        time: ws.time.filter((e) => !taskIds.has(e.taskId)),
        expenses: ws.expenses.filter((x) => x.projectId !== a.id),
        notifications: ws.notifications.filter((n) => n.projectId !== a.id),
        outbox: ws.outbox.filter((o) => o.projectId !== a.id),
        currentProjectId: ws.currentProjectId === a.id ? projects[0].id : ws.currentProjectId,
      };
    }

    case 'project.favorite':
      return { ...ws, projects: ws.projects.map((p) => (p.id === a.id ? { ...p, favorite: !p.favorite } : p)) };

    case 'milestone.add': {
      const [mid, w] = nextId(ws, 'ms');
      return { ...w, milestones: [...w.milestones, { ...a.milestone, id: mid, projectId: a.projectId }] };
    }

    case 'milestone.update':
      return { ...ws, milestones: ws.milestones.map((m) => (m.id === a.id ? { ...m, ...a.patch } : m)) };

    case 'sprint.close': {
      const m = ws.milestones.find((x) => x.id === a.id);
      if (!m || m.closed) return ws;
      let out = ws;
      let next = ws.milestones
        .filter((x) => x.projectId === m.projectId && !x.closed && x.id !== m.id && x.start > m.start)
        .sort((x, y) => x.start.localeCompare(y.start))[0];
      if (!next) {
        const [mid, w] = nextId(out, 'ms');
        const start = addDays(m.end, 1);
        next = { id: mid, projectId: m.projectId, name: a.nextName, kind: m.kind, start, end: addDays(start, 13), budget: m.budget, billing: m.billing };
        out = { ...w, milestones: [...w.milestones, next] };
      }
      const target = next;
      out = {
        ...out,
        milestones: out.milestones.map((x) => (x.id === m.id ? { ...x, closed: true } : x)),
        tasks: out.tasks.map((t) =>
          t.milestoneId === m.id && t.status !== 'done'
            ? { ...t, milestoneId: target.id, history: [...t.history, { at: a.now, actor, key: 'sprintMoved', params: { sprint: target.name } }] }
            : t,
        ),
      };
      return out;
    }

    case 'milestone.invoice': {
      const m = ws.milestones.find((x) => x.id === a.id);
      const project = m && ws.projects.find((p) => p.id === m.projectId);
      if (!m || !project || m.invoice) return ws;
      let out: Workspace = { ...ws, milestones: ws.milestones.map((x) => (x.id === m.id ? { ...x, invoice: { number: a.number, on: a.today } } : x)) };
      const [oid, w] = nextId(out, 'o');
      out = { ...w, outbox: [{ id: oid, at: a.now, projectId: project.id, channel: 'email', to: project.clientContact, key: 'invoice', params: { number: a.number, milestone: m.name } }, ...w.outbox] };
      return pushNotif(out, prefs, { kind: 'sent', at: a.now, key: 'invoiceSent', params: { number: a.number, who: project.clientContact }, projectId: project.id });
    }

    case 'task.create': {
      const [out, [tid]] = createTasks(ws, [a.task], actor, a.now);
      let w = out;
      if (a.task.status === 'client') {
        // Se reutiliza la lógica de mover para avisar al cliente.
        w = mapTask(w, tid, (x) => ({ ...x, status: 'review' }));
        w = moveTask(w, prefs, tid, 'client', actor, a.now, a.today);
      }
      return raiseOverdue(w, prefs, a.today, a.now);
    }

    case 'task.update': {
      const t = ws.tasks.find((x) => x.id === a.id);
      if (!t) return ws;
      const p = a.patch;
      const hist = [...t.history];
      if (p.assigneeId !== undefined && p.assigneeId !== t.assigneeId) {
        const who = ws.members.find((m) => m.id === p.assigneeId)?.name ?? '';
        hist.push({ at: a.now, actor, key: p.assigneeId ? 'assigned' : 'unassigned', params: { who } });
      }
      if (p.due !== undefined && p.due !== t.due) hist.push({ at: a.now, actor, key: 'dueChanged', params: { date: p.due } });
      if (p.priority !== undefined && p.priority !== t.priority) hist.push({ at: a.now, actor, key: 'priorityChanged', params: { priority: p.priority } });
      if (p.clientVisible !== undefined && p.clientVisible !== t.clientVisible) hist.push({ at: a.now, actor, key: p.clientVisible ? 'madeVisible' : 'madeHidden' });
      if (p.dependsOn !== undefined && p.dependsOn.length !== t.dependsOn.length) hist.push({ at: a.now, actor, key: 'depsChanged' });
      if ((p.title !== undefined && p.title !== t.title) || (p.description !== undefined && p.description !== t.description) || (p.estimate !== undefined && p.estimate !== t.estimate) || (p.start !== undefined && p.start !== t.start) || (p.milestoneId !== undefined && p.milestoneId !== t.milestoneId)) {
        hist.push({ at: a.now, actor, key: 'edited' });
      }
      const out = mapTask(ws, a.id, (x) => ({ ...x, ...p, history: hist }));
      return raiseOverdue(out, prefs, a.today, a.now);
    }

    case 'task.move':
      return raiseOverdue(moveTask(ws, prefs, a.id, a.status, actor, a.now, a.today), prefs, a.today, a.now);

    case 'task.delete':
      return {
        ...ws,
        tasks: ws.tasks.filter((t) => t.id !== a.id).map((t) => (t.dependsOn.includes(a.id) ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== a.id) } : t)),
        time: ws.time.filter((e) => e.taskId !== a.id),
      };

    case 'task.duplicate': {
      const t = ws.tasks.find((x) => x.id === a.id);
      if (!t) return ws;
      const [tid, w0] = nextId(ws, 't');
      let w = w0;
      const checklist = t.checklist.map((c) => {
        const [kid, ww] = nextId(w, 'k');
        w = ww;
        return { ...c, id: kid, done: false };
      });
      const copy: Task = {
        ...t,
        id: tid,
        title: `${t.title} ${a.suffix}`,
        status: 'todo',
        checklist,
        comments: [],
        attachments: [],
        completedAt: undefined,
        clientApproved: false,
        autoRaisedDue: undefined,
        history: [{ at: a.now, actor, key: 'duplicated', params: { from: t.title } }],
      };
      const idx = w.tasks.findIndex((x) => x.id === t.id);
      const tasks = [...w.tasks];
      tasks.splice(idx + 1, 0, copy);
      return raiseOverdue({ ...w, tasks }, prefs, a.today, a.now);
    }

    case 'check.toggle':
      return mapTask(ws, a.taskId, (t) => ({ ...t, checklist: t.checklist.map((c) => (c.id === a.itemId ? { ...c, done: !c.done } : c)) }));

    case 'check.add': {
      const text = a.text.trim();
      if (!text) return ws;
      const [kid, w] = nextId(ws, 'k');
      return mapTask(w, a.taskId, (t) => ({ ...t, checklist: [...t.checklist, { id: kid, text, done: false }] }));
    }

    case 'check.remove':
      return mapTask(ws, a.taskId, (t) => ({ ...t, checklist: t.checklist.filter((c) => c.id !== a.itemId) }));

    case 'comment.add': {
      const text = a.text.trim();
      if (!text) return ws;
      const [cid, w] = nextId(ws, 'c');
      const mentions = findMentions(text, ws.members);
      return mapTask(w, a.taskId, (t) => ({
        ...t,
        comments: [...t.comments, { id: cid, author: actor, text, at: a.now, mentions }],
        history: [...t.history, { at: a.now, actor, key: 'commented' }],
      }));
    }

    case 'attach.add':
      return mapTask(ws, a.taskId, (t) => ({
        ...t,
        attachments: [...t.attachments, { id: a.id, name: a.name, size: a.size, source: 'upload' }],
        history: [...t.history, { at: a.now, actor, key: 'attached', params: { name: a.name } }],
      }));

    case 'attach.remove':
      return mapTask(ws, a.taskId, (t) => ({ ...t, attachments: t.attachments.filter((f) => f.id !== a.id) }));

    case 'time.add': {
      if (!(a.hours > 0)) return ws;
      const [hid, w] = nextId(ws, 'h');
      const who = ws.members.find((m) => m.id === a.memberId)?.name ?? '';
      const out = { ...w, time: [...w.time, { id: hid, taskId: a.taskId, memberId: a.memberId, date: a.date, hours: a.hours, note: a.note.trim() }] };
      return mapTask(out, a.taskId, (t) => ({ ...t, history: [...t.history, { at: a.now, actor, key: 'hoursLogged', params: { hours: String(a.hours), who } }] }));
    }

    case 'time.remove':
      return { ...ws, time: ws.time.filter((e) => e.id !== a.id) };

    case 'expense.add': {
      if (!(a.amount > 0) || !a.concept.trim()) return ws;
      const [xid, w] = nextId(ws, 'x');
      return { ...w, expenses: [...w.expenses, { id: xid, projectId: a.projectId, milestoneId: a.milestoneId, date: a.date, concept: a.concept.trim(), amount: a.amount }] };
    }

    case 'client.comment':
    case 'client.approve':
    case 'client.changes': {
      const t = ws.tasks.find((x) => x.id === a.taskId);
      const project = t && projectOf(ws, t);
      if (!t || !project) return ws;
      const text = (a.type === 'client.comment' ? a.text : a.comment).trim();
      if ((a.type === 'client.comment' || a.type === 'client.changes') && !text) return ws;
      const contact = project.clientContact;
      let out = ws;
      if (text) {
        const [cid, w] = nextId(out, 'c');
        out = mapTask(w, t.id, (x) => ({ ...x, comments: [...x.comments, { id: cid, author: contact, text, at: a.now, fromClient: true }] }));
      }
      const key = a.type === 'client.approve' ? 'clientApproved' : a.type === 'client.changes' ? 'clientChanges' : 'clientCommented';
      out = mapTask(out, t.id, (x) => ({ ...x, history: [...x.history, { at: a.now, actor: contact, key, client: true }] }));
      out = pushNotif(out, prefs, { kind: 'client', at: a.now, key, params: { who: contact, task: t.title }, projectId: project.id, taskId: t.id });
      if (a.type === 'client.approve') {
        if (ws.automations.clientApproval) {
          out = mapTask(out, t.id, (x) => ({
            ...x,
            status: 'done',
            clientApproved: true,
            completedAt: x.completedAt ?? a.today,
            history: [...x.history, { at: a.now, actor: '', key: 'autoDone', client: true }],
          }));
        } else {
          out = mapTask(out, t.id, (x) => ({ ...x, clientApproved: true }));
        }
      }
      if (a.type === 'client.changes') {
        out = mapTask(out, t.id, (x) => ({ ...x, status: 'doing', clientApproved: false, completedAt: undefined }));
      }
      return out;
    }

    case 'notif.read':
      return { ...ws, notifications: ws.notifications.map((n) => (n.id === a.id ? { ...n, read: true } : n)) };

    case 'notif.readAll':
      return { ...ws, notifications: ws.notifications.map((n) => ({ ...n, read: true })) };

    case 'outbox.weekly': {
      const project = ws.projects.find((p) => p.id === a.projectId);
      if (!project || a.channels.length === 0) return ws;
      let out = ws;
      for (const channel of a.channels) {
        const [oid, w] = nextId(out, 'o');
        out = { ...w, outbox: [{ id: oid, at: a.now, projectId: project.id, channel, to: project.clientContact, key: 'weekly', params: { project: project.name } }, ...w.outbox] };
      }
      return pushNotif(out, prefs, { kind: 'sent', at: a.now, key: 'weeklySent', params: { who: project.clientContact }, projectId: project.id });
    }

    case 'automation.set': {
      const out = { ...ws, automations: { ...ws.automations, [a.key]: a.value } };
      return a.key === 'overdueRaise' && a.value ? raiseOverdue(out, prefs, a.today, a.now) : out;
    }

    case 'automation.tick':
      return raiseOverdue(ws, prefs, a.today, a.now);

    default:
      return ws;
  }
}
