import { Router } from 'express';
import { LoyaltyController } from './loyalty.controller';
import { loyaltyService } from './loyalty.service';

const router = Router();
const c = new LoyaltyController(loyaltyService);

router.get('/rewards', c.rewards);
router.post('/:id/redeem', c.redeem);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
