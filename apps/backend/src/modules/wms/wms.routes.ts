import { Router } from 'express';
import { WmsController } from './wms.controller';
import { wmsService } from './wms.service';

const router = Router();
const c = new WmsController(wmsService);

router.get('/warehouses', c.warehouses);
router.post('/:id/complete', c.complete);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
