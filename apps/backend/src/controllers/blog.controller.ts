import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { db } from '../config/database';

export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, locale = 'es' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const titleField = locale === 'en' ? 'title_en' : 'title_es';
  const excerptField = locale === 'en' ? 'excerpt_en' : 'excerpt_es';

  const result = await db.query(
    `SELECT id, slug, ${titleField} as title, ${excerptField} as excerpt,
            category, tags, featured_image, published_at
     FROM blog_posts
     WHERE is_published = true
     ORDER BY published_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await db.query(
    'SELECT COUNT(*) FROM blog_posts WHERE is_published = true'
  );

  res.json({
    success: true,
    data: {
      posts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    },
  });
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { locale = 'es' } = req.query;

  const titleField = locale === 'en' ? 'title_en' : 'title_es';
  const contentField = locale === 'en' ? 'content_en' : 'content_es';

  const result = await db.query(
    `SELECT id, slug, ${titleField} as title, ${contentField} as content,
            category, tags, featured_image, published_at
     FROM blog_posts
     WHERE slug = $1 AND is_published = true`,
    [slug]
  );

  if (result.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});
