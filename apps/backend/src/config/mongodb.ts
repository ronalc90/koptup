import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || '';

  if (!MONGODB_URI) {
    logger.warn('MONGODB_URI not configured - MongoDB features disabled');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    logger.warn('⚠️  Continuing without MongoDB - database operations will fail');
    // No lanzar error para permitir que el servidor continúe
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});

export default mongoose;
