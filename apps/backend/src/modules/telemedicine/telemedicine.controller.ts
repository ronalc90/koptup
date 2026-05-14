import { Request } from 'express';
import { handle, requireFields } from '../_shared/crud';
import { DomainError } from '../_shared/types';
import { TelemedicineService } from './telemedicine.service';

export class TelemedicineController {
  constructor(private readonly service: TelemedicineService) {}
  list = handle(async (req: Request) => this.service.list(req.query as Record<string, string>), 'telemedicine');
  get = handle(async (req: Request) => this.service.get(req.params.id), 'telemedicine');
  create = handle(async (req: Request) => {
    const err = requireFields(req.body, ['patientName', 'doctorName']);
    if (err) throw new DomainError('VALIDATION', err);
    return this.service.create(req.body);
  }, 'telemedicine');
  update = handle(async (req: Request) => this.service.update(req.params.id, req.body), 'telemedicine');
  remove = handle(async (req: Request) => this.service.remove(req.params.id), 'telemedicine');
  prescriptions = handle(async (req: Request) => this.service.listPrescriptions(req.query as Record<string, string>), 'telemedicine');
  start = handle(async (req: Request) => this.service.startSession(req.params.id), 'telemedicine');
}
