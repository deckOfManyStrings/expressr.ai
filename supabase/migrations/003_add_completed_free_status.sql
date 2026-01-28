-- Add missing status values to the constraint

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
CHECK (status IN (
    'validating',
    'training', 
    'generating',
    'generating_free',
    'generating_premium',
    'complete',
    'complete_free',
    'completed_free',  -- Used by generate-free endpoint
    'failed'
));
