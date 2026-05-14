import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { calls as seedCalls, transcripts as seedTranscripts } from './voice-ai.data';
import { Call, Transcript } from './voice-ai.types';

export interface VoiceAiService {
  list(q: Filterable): ListResult<Call>;
  get(id: string): Call;
  create(input: Partial<Call>): Call;
  update(id: string, patch: Partial<Call>): Call;
  remove(id: string): { id: string };
  listTranscripts(q: Filterable): ListResult<Transcript>;
  startCall(input: { to: string; from: string }): Call;
}

export class InMemoryVoiceAiService implements VoiceAiService {
  private calls: Call[] = [...seedCalls];
  private transcripts: Transcript[] = [...seedTranscripts];

  list(q: Filterable): ListResult<Call> {
    return paginate(this.calls, q, (c, n) => c.from.toLowerCase().includes(n) || c.to.toLowerCase().includes(n));
  }
  get(id: string): Call { return findOrThrow(this.calls, id, 'Call'); }

  create(input: Partial<Call>): Call {
    if (!input.from || !input.to) throw new DomainError('VALIDATION', 'from y to requeridos');
    const c: Call = {
      id: nextId('call'),
      from: input.from,
      to: input.to,
      direction: input.direction ?? 'outbound',
      status: 'queued',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.calls.push(c);
    return c;
  }

  update(id: string, patch: Partial<Call>): Call {
    const idx = this.calls.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Call ${id}`);
    this.calls[idx] = applyPatch(this.calls[idx], patch);
    return this.calls[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.calls.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Call ${id}`);
    this.calls[idx] = softDelete(this.calls[idx]);
    return { id };
  }

  listTranscripts(q: Filterable): ListResult<Transcript> {
    return paginate(this.transcripts, q, (t, n) => t.summary.toLowerCase().includes(n));
  }

  startCall(input: { to: string; from: string }): Call {
    const call = this.create({ from: input.from, to: input.to, direction: 'outbound' });
    return this.update(call.id, { status: 'ringing', startedAt: nowIso() });
  }
}

export const voiceAiService: VoiceAiService = new InMemoryVoiceAiService();
