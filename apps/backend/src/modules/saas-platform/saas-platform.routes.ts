import { Router } from 'express';
import { SaasPlatformController } from './saas-platform.controller';
import { saasPlatformService } from './saas-platform.service';

const router = Router();
const c = new SaasPlatformController(saasPlatformService);

router.get('/plans', c.plans);
router.post('/:id/change-plan', c.changePlan);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
