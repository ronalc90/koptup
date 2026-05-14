import { Router } from 'express';
import { DeliveryController } from './delivery.controller';
import { deliveryService } from './delivery.service';

const router = Router();
const c = new DeliveryController(deliveryService);

router.get('/drivers', c.drivers);
router.post('/:id/assign', c.assign);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
