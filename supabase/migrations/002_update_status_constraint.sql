-- Update the status check constraint to allow all statuses used in the application

-- First, drop the old constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
CHECK (status IN (
    'validating',
    'training', 
    'generating',
    'generating_free',
    'generating_premium',
    'complete',
    'complete_free',
    'failed'
));
