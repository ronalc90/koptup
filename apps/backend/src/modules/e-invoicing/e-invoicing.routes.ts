import { Router } from 'express';
import { EInvoicingController } from './e-invoicing.controller';
import { eInvoicingService } from './e-invoicing.service';

const router = Router();
const c = new EInvoicingController(eInvoicingService);

router.get('/countries', c.countries);
router.post('/:id/emit', c.emit);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
