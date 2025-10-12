-- Add columns for Google OAuth to users table
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(500),
  ALTER COLUMN password DROP NOT NULL;

-- Create index for google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Create index for provider
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

-- Update existing users to have 'local' provider if NULL
UPDATE users SET provider = 'local' WHERE provider IS NULL;

COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID';
COMMENT ON COLUMN users.provider IS 'Authentication provider: local, google, github, etc.';
COMMENT ON COLUMN users.avatar IS 'User profile picture URL';
