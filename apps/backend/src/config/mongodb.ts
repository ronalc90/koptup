import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || '';

  if (!MONGODB_URI) {
    logger.warn('MONGODB_URI not configured - MongoDB features disabled');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Aumentar timeout a 30 segundos
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    });
    logger.info('✅ MongoDB connected successfully');
    logger.info(`📊 MongoDB host: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    logger.warn('⚠️  Will retry connection automatically...');
    // No lanzar error para permitir que el servidor continúe
    // Mongoose intentará reconectar automáticamente
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
  logger.warn('MongoDB disconnected - attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
});

export default mongoose;
