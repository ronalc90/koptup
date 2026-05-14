import { Router } from 'express';
import { TelemedicineController } from './telemedicine.controller';
import { telemedicineService } from './telemedicine.service';

const router = Router();
const c = new TelemedicineController(telemedicineService);

router.get('/prescriptions', c.prescriptions);
router.post('/:id/start', c.start);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
