import { Router, RequestHandler } from 'express';
import { getPosts, getPost } from '../controllers/blog.controller';

const router = Router();

router.get('/posts', getPosts as RequestHandler);
router.get('/posts/:slug', getPost as RequestHandler);

export default router;
