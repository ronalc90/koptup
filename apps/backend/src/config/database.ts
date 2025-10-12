// This file is deprecated - using MongoDB Atlas instead
// See config/mongodb.ts for MongoDB connection

import { logger } from '../utils/logger';

logger.info('PostgreSQL support has been removed - using MongoDB Atlas exclusively');

export const db = null;
export default db;
