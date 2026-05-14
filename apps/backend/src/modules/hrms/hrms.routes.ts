import { Router } from 'express';
import { HrmsController } from './hrms.controller';
import { hrmsService } from './hrms.service';

const router = Router();
const c = new HrmsController(hrmsService);

router.get('/candidates', c.candidates);
router.post('/candidates/:id/advance', c.advance);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
