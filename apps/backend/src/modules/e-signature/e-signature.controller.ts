import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { ESignatureService } from './e-signature.service';

export class ESignatureController {
  constructor(private readonly service: ESignatureService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'e-signature');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'e-signature');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['title', 'senderEmail', 'documentUrl']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'e-signature');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'e-signature');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'e-signature');
  signers = handle(async (req: Request) => this.service.listSigners(req.params.id), 'e-signature');
  sign = handle(async (req: Request) => this.service.sign(req.params.signerId, (req.ip ?? '0.0.0.0')), 'e-signature');
}
