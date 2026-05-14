import { Router } from 'express';
import { HelpdeskController } from './helpdesk.controller';
import { helpdeskService } from './helpdesk.service';

const router = Router();
const c = new HelpdeskController(helpdeskService);

router.get('/agents', c.agents);
router.post('/:id/assign', c.assign);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
