import { Router } from 'express';
import { PosController } from './pos.controller';
import { posService } from './pos.service';

const router = Router();
const c = new PosController(posService);

router.get('/payments', c.payments);
router.post('/:id/charge', c.charge);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
