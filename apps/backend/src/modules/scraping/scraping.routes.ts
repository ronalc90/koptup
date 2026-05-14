import { Router } from 'express';
import { ScrapingController } from './scraping.controller';
import { scrapingService } from './scraping.service';

const router = Router();
const c = new ScrapingController(scrapingService);

router.get('/jobs', c.jobs);
router.post('/:id/run', c.run);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
