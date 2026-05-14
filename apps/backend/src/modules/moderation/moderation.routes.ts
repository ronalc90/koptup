import { Router } from 'express';
import { ModerationController } from './moderation.controller';
import { moderationService } from './moderation.service';

const router = Router();
const c = new ModerationController(moderationService);

router.get('/decisions', c.decisions);
router.post('/:id/decide', c.decide);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
