import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import ChatSession from '../models/ChatSession';
import ChatMessage from '../models/ChatMessage';
import { logger } from '../utils/logger';

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const session = await ChatSession.create({
    session_token: sessionToken,
    is_anonymous: true,
    expires_at: expiresAt,
  });

  res.json({
    success: true,
    data: {
      sessionId: session._id,
      sessionToken,
      expiresAt,
    },
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, message } = req.body;

  // Verify session exists
  const session = await ChatSession.findOne({
    _id: sessionId,
    expires_at: { $gt: new Date() },
  });

  if (!session) {
    throw new AppError('Invalid or expired session', 400);
  }

  // Save user message
  const userMessage = await ChatMessage.create({
    session_id: sessionId,
    role: 'user',
    content: message,
  });

  // Generate AI response (placeholder - integrate with OpenAI)
  const aiResponse = `Echo: ${message}`;

  // Save AI response
  const aiMessage = await ChatMessage.create({
    session_id: sessionId,
    role: 'assistant',
    content: aiResponse,
  });

  res.json({
    success: true,
    data: {
      messageId: aiMessage._id,
      response: aiResponse,
    },
  });
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const messages = await ChatMessage.find({ session_id: sessionId })
    .select('_id role content created_at')
    .sort({ created_at: 1 });

  res.json({
    success: true,
    data: messages.map(msg => ({
      id: msg._id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
    })),
  });
});
