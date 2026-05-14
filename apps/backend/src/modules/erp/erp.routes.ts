import { Router } from 'express';
import { ErpController } from './erp.controller';
import { erpService } from './erp.service';

const router = Router();
const c = new ErpController(erpService);

router.get('/accounts', c.accounts);
router.get('/aging', c.aging);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
