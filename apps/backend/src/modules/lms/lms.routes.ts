import { Router } from 'express';
import { LmsController } from './lms.controller';
import { lmsService } from './lms.service';

const router = Router();
const c = new LmsController(lmsService);

router.get('/enrollments', c.enrollments);
router.post('/:id/enroll', c.enroll);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
