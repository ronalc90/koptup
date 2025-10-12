import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { db } from '../config/database';
import { logger } from '../utils/logger';

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = uuidv4();
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.query(
    'INSERT INTO chat_sessions (id, session_token, is_anonymous, expires_at) VALUES ($1, $2, $3, $4)',
    [sessionId, sessionToken, true, expiresAt]
  );

  res.json({
    success: true,
    data: {
      sessionId,
      sessionToken,
      expiresAt,
    },
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, message, documentIds } = req.body;

  // Verify session exists
  const sessionResult = await db.query(
    'SELECT id FROM chat_sessions WHERE id = $1 AND expires_at > NOW()',
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Invalid or expired session', 400);
  }

  // Save user message
  const messageId = uuidv4();
  await db.query(
    'INSERT INTO chat_messages (id, session_id, role, content, document_ids) VALUES ($1, $2, $3, $4, $5)',
    [messageId, sessionId, 'user', message, JSON.stringify(documentIds || [])]
  );

  // Generate AI response (placeholder - integrate with OpenAI)
  const aiResponse = `Echo: ${message}`;

  // Save AI response
  const aiMessageId = uuidv4();
  await db.query(
    'INSERT INTO chat_messages (id, session_id, role, content) VALUES ($1, $2, $3, $4)',
    [aiMessageId, sessionId, 'assistant', aiResponse]
  );

  res.json({
    success: true,
    data: {
      messageId: aiMessageId,
      response: aiResponse,
    },
  });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const result = await db.query(
    'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );

  res.json({
    success: true,
    data: result.rows,
  });
});
