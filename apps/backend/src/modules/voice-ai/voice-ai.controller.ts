import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { VoiceAiService } from './voice-ai.service';

export class VoiceAiController {
  constructor(private readonly service: VoiceAiService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'voice-ai');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'voice-ai');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['from', 'to']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'voice-ai');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'voice-ai');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'voice-ai');
  transcripts = handle(async (req: Request) => this.service.listTranscripts(req.query as Record<string, string>), 'voice-ai');
  startCall = handle(async (req: Request) => {
    const err = requireFields(req.body, ['from', 'to']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.startCall({ from: req.body.from, to: req.body.to });
  }, 'voice-ai');
}
