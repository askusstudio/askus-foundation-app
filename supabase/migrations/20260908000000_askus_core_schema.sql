-- =============================================================================
-- AskUs Foundation Mobile & Operations Platform: Core Database Schema (Gate 3)
-- Fully compatible with Supabase PostgreSQL 15+ and direct Lovable integration
-- =============================================================================

-- 1. POSTGRESQL EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- 2. SYSTEM ENUMERATIONS
create type user_role as enum ('supporter', 'volunteer', 'admin');
create type kyc_status as enum ('not_submitted', 'pending', 'verified', 'rejected');
create type foundation_wing as enum ('askus_kaksha', 'revolution_nari', 'pawer_rangers', 'green_squad');
create type drive_status as enum ('upcoming', 'in_progress', 'completed', 'cancelled');
create type attendance_status as enum ('registered', 'attended', 'absent');
create type threat_severity as enum ('low', 'medium', 'high', 'critical');
create type donation_status as enum ('pending', 'successful', 'failed');

-- 3. RELATIONAL DATA SCHEMA DDL

-- 3.1 Profiles Table (Linked directly to Supabase Auth)
create table public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    phone text unique not null,
    full_name text,
    role user_role default 'supporter'::user_role not null,
    kyc_status kyc_status default 'not_submitted'::kyc_status not null,
    avatar_url text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3.2 Volunteer KYC Documents (Quarantine Storage)
create table public.volunteer_kyc (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    document_type text not null, -- 'aadhaar', 'student_id', 'pan'
    file_path text not null,     -- Points to private 'kyc-documents' bucket
    rejection_reason text,
    verified_by uuid references public.profiles(id),
    submitted_at timestamptz default timezone('utc'::text, now()) not null,
    reviewed_at timestamptz
);

-- 3.3 Field Drives & Initiatives
create table public.drives (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text not null,
    wing foundation_wing not null,
    location_name text not null,
    latitude double precision not null,
    longitude double precision not null,
    capacity int default 20 not null,
    start_time timestamptz not null,
    end_time timestamptz not null,
    status drive_status default 'upcoming'::drive_status not null,
    coordinator_id uuid references public.profiles(id) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3.4 Drive Registrations & Geo-Attendance
create table public.drive_attendees (
    id uuid default uuid_generate_v4() primary key,
    drive_id uuid references public.drives(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    status attendance_status default 'registered'::attendance_status not null,
    check_in_time timestamptz,
    check_in_lat double precision,
    check_in_long double precision,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(drive_id, user_id)
);

-- 3.5 Donations & 80G Receipts
create table public.donations (
    id uuid default uuid_generate_v4() primary key,
    donor_id uuid references public.profiles(id) on delete set null,
    amount numeric(10,2) not null check (amount > 0),
    currency text default 'INR' not null,
    razorpay_order_id text unique not null,
    razorpay_payment_id text unique,
    wing foundation_wing,
    is_80g_required boolean default false not null,
    pan_number text,
    receipt_url text,
    status donation_status default 'pending'::donation_status not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3.6 AskUs Foundation Knowledge Base (Vector RAG)
create table public.foundation_knowledge (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    category text not null,
    content text not null,
    embedding vector(1536), -- text-embedding-3-small
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- HNSW Vector Index for sub-50ms similarity search
create index if not exists foundation_knowledge_embedding_hnsw_idx 
    on public.foundation_knowledge using hnsw (embedding vector_cosine_ops);

-- 3.7 Automated Threats & Security Incident Log
create table public.threat_logs (
    id uuid default uuid_generate_v4() primary key,
    ip_address text not null,
    user_id uuid references public.profiles(id) on delete set null,
    endpoint text not null,
    threat_type text not null, -- 'brute_force_otp', 'upload_flood', 'malformed_payload'
    severity threat_severity default 'medium'::threat_severity not null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.volunteer_kyc enable row level security;
alter table public.drives enable row level security;
alter table public.drive_attendees enable row level security;
alter table public.donations enable row level security;
alter table public.foundation_knowledge enable row level security;
alter table public.threat_logs enable row level security;

-- PROFILES POLICIES
create policy "Users can view own profile" on public.profiles 
    for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles 
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );
create policy "Users can update own profile" on public.profiles 
    for update using (auth.uid() = id);

-- KYC POLICIES
create policy "Volunteers can view own KYC" on public.volunteer_kyc 
    for select using (auth.uid() = user_id);
create policy "Volunteers can submit KYC" on public.volunteer_kyc 
    for insert with check (auth.uid() = user_id);
create policy "Admins manage all KYC" on public.volunteer_kyc 
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- DRIVES POLICIES
create policy "Anyone can view drives" on public.drives 
    for select using (true);
create policy "Admins manage drives" on public.drives 
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- ATTENDEES POLICIES
create policy "Users view own drive registrations" on public.drive_attendees 
    for select using (auth.uid() = user_id);
create policy "Users can register for drives" on public.drive_attendees 
    for insert with check (auth.uid() = user_id);
create policy "Admins manage drive attendees" on public.drive_attendees 
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- DONATIONS POLICIES
create policy "Users can view own donations" on public.donations
    for select using (
        auth.uid() = donor_id or 
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );
create policy "Anyone can create donation record" on public.donations
    for insert with check (true);
create policy "Admins can update donations" on public.donations
    for update using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- FOUNDATION KNOWLEDGE POLICIES
create policy "Anyone can read foundation knowledge" on public.foundation_knowledge
    for select using (true);
create policy "Admins manage foundation knowledge" on public.foundation_knowledge
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- THREAT LOGS POLICIES
create policy "Admins can view threat logs" on public.threat_logs 
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- 5. VECTOR RAG MATCHING FUNCTION
create or replace function match_foundation_docs(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language plpgsql stable
as $$
begin
  return query
  select
    foundation_knowledge.id,
    foundation_knowledge.title,
    foundation_knowledge.content,
    1 - (foundation_knowledge.embedding <=> query_embedding) as similarity
  from foundation_knowledge
  where 1 - (foundation_knowledge.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- 6. AUTOMATED USER PROFILE CREATION HOOK (SUPABASE AUTH)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name, role, kyc_status)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'supporter'::user_role,
    'not_submitted'::kyc_status
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
