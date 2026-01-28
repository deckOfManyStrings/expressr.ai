-- Jobs table to track training and generation progress
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('training', 'generating', 'complete', 'failed')),
  training_id TEXT,
  model_version TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_jobs_user_email ON jobs(user_email);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Index for faster lookups by training_id
CREATE INDEX IF NOT EXISTS idx_jobs_training_id ON jobs(training_id);
