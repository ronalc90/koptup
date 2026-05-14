import { Router } from 'express';
import { AutomationController } from './automation.controller';
import { automationService } from './automation.service';

const router = Router();
const c = new AutomationController(automationService);

router.get('/runs', c.runs);
router.post('/:id/trigger', c.trigger);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
