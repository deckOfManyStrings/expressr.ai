-- Create jobs table
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'uploading', -- 'uploading', 'training', 'generating_free', 'completed_free', 'generating_full', 'completed_full', 'failed'
  photos_urls text[],
  model_url text,
  training_id text,
  expressions_urls jsonb, -- Array of {name, emoji, url, isPaid}
  pdf_url text,
  paid boolean default false,
  stripe_session_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  failed_at timestamp with time zone,
  error_message text
);

-- Enable RLS
alter table public.jobs enable row level security;

-- Policy: Anyone can create a job (since we use email for access later)
create policy "Anyone can create jobs"
  on public.jobs for insert
  with check (true);

-- Policy: Users can view their own jobs (if we implement auth, otherwise public read by ID/UUID might be needed or secure token)
-- For now, allowing public read for demo/MVP simplicity, assuming UUID is secret enough or we use RLS with anon key and strict selection
create policy "Public read by ID"
  on public.jobs for select
  using (true);

-- Storage Buckets Setup (This usually needs to be done in Dashboard or via API, but here is SQL for it if using pg_net or extensions)
-- We will just document the need for 'uploads', 'expressions', 'pdfs' buckets.
