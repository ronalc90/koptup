import { Router } from 'express';
import { CodeReviewController } from './code-review.controller';
import { codeReviewService } from './code-review.service';

const router = Router();
const c = new CodeReviewController(codeReviewService);

router.get('/:id/reviews', c.reviews);
router.post('/:id/ai-review', c.runAi);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
