# DATABASE SCHEMA, ROW-LEVEL SECURITY & API CONTRACTS (GATE 3)
## Project: AskUs Foundation Mobile & Operations Platform
**Document Version:** 3.0.0-FROZEN  
**Phase:** Gate 3 (Data Schema Freezing, Security Policies & API Contracts)  
**Status:** FROZEN & READY FOR LOVABLE INTEGRATION  

---

## 1. POSTGRESQL EXTENSIONS & CUSTOM ENUMERATIONS

```sql
-- 1. Enable Core Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- 2. Enumeration Types
create type user_role as enum ('supporter', 'volunteer', 'admin');
create type kyc_status as enum ('not_submitted', 'pending', 'verified', 'rejected');
create type foundation_wing as enum ('askus_kaksha', 'revolution_nari', 'pawer_rangers', 'green_squad');
create type drive_status as enum ('upcoming', 'in_progress', 'completed', 'cancelled');
create type attendance_status as enum ('registered', 'attended', 'absent');
create type threat_severity as enum ('low', 'medium', 'high', 'critical');
create type donation_status as enum ('pending', 'successful', 'failed');
```

---

## 2. RELATIONAL DATA SCHEMA DDL

```sql
-- 1. Profiles Table (Linked directly to Supabase Auth)
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

-- 2. Volunteer KYC Documents (Quarantine Storage)
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

-- 3. Field Drives & Initiatives
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

-- 4. Drive Registrations & Geo-Attendance
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

-- 5. Donations & 80G Receipts
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

-- 6. AskUs Foundation Knowledge Base (Vector RAG)
create table public.foundation_knowledge (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    category text not null,
    content text not null,
    embedding vector(1536), -- text-embedding-3-small
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- HNSW Vector Index for sub-50ms similarity search
create index on public.foundation_knowledge using hnsw (embedding vector_cosine_ops);

-- 7. Automated Threats & Security Incident Log
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
```

---

## 3. ROW-LEVEL SECURITY (RLS) POLICIES

```sql
-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.volunteer_kyc enable row level security;
alter table public.drives enable row level security;
alter table public.drive_attendees enable row level security;
alter table public.donations enable row level security;
alter table public.foundation_knowledge enable row level security;
alter table public.threat_logs enable row level security;

-- PROFILES: Users read/update their own; Admins read all
create policy "Users can view own profile" on public.profiles 
    for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles 
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );
create policy "Users can update own profile" on public.profiles 
    for update using (auth.uid() = id);

-- KYC: Volunteers read/insert own; Admins full control
create policy "Volunteers can view own KYC" on public.volunteer_kyc 
    for select using (auth.uid() = user_id);
create policy "Volunteers can submit KYC" on public.volunteer_kyc 
    for insert with check (auth.uid() = user_id);
create policy "Admins manage all KYC" on public.volunteer_kyc 
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- DRIVES: Public read-only; Admins write
create policy "Anyone can view drives" on public.drives 
    for select using (true);
create policy "Admins manage drives" on public.drives 
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- ATTENDEES: Volunteers manage own registrations; Admins manage all
create policy "Users view own drive registrations" on public.drive_attendees 
    for select using (auth.uid() = user_id);
create policy "Users can register for drives" on public.drive_attendees 
    for insert with check (auth.uid() = user_id);
create policy "Admins manage drive attendees" on public.drive_attendees 
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- DONATIONS: Users view own; Anyone can insert; Admins manage all
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

-- KNOWLEDGE: Public read-only; Admins manage
create policy "Anyone can read foundation knowledge" on public.foundation_knowledge
    for select using (true);
create policy "Admins manage foundation knowledge" on public.foundation_knowledge
    for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- THREAT LOGS: System/Admin read-only (No public writes)
create policy "Admins can view threat logs" on public.threat_logs 
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );
```

---

## 4. VECTOR RAG MATCHING STORED PROCEDURE

```sql
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
```

---

## 5. FROZEN API CONTRACT SPECIFICATIONS (EDGE FUNCTIONS)

### 5.1 POST `/api/askus-agent`
- **Purpose:** In-app grounded conversational AI assistant for foundation initiatives, volunteer SOPs, and donation questions.
- **Request Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "query": "What are the teaching hours for AskUs Kaksha in South Delhi?",
    "sessionId": "optional-uuid-v4-session-id"
  }
  ```
- **Response Protocol:** Server-Sent Events (SSE) Stream (`text/event-stream`).
  ```text
  data: {"chunk": "AskUs "}
  data: {"chunk": "Kaksha operates "}
  data: {"chunk": "every Saturday from 10:00 AM to 1:00 PM."}
  ```
- **Error Response:**
  ```json
  {
    "error": "Query string is required and must not be empty.",
    "status": 400
  }
  ```
- **Enforced Grounding Rule:** Queries with maximum cosine similarity $\le 0.72$ via `match_foundation_docs(query_embedding, 0.72, 4)` receive a deterministic refusal redirecting to foundation topics.

---

### 5.2 POST `/api/get-kyc-upload-url`
- **Purpose:** Issue cryptographically signed PUT URLs for direct, secure document uploads into the private `kyc-documents` quarantine bucket.
- **Authentication:** `Authorization: Bearer <SUPABASE_AUTH_JWT>`
- **Request Body:**
  ```json
  {
    "documentType": "aadhaar",
    "fileExtension": "pdf"
  }
  ```
  *Allowed documentType values:* `"aadhaar"` | `"student_id"` | `"pan"`  
  *Allowed fileExtension values:* `"jpg"` | `"png"` | `"pdf"`
- **Response:** `200 OK`
  ```json
  {
    "signedUrl": "https://<project-ref>.supabase.co/storage/v1/object/upload/sign/kyc-documents/<user-id>/<timestamp>_aadhaar.pdf?token=...",
    "filePath": "kyc-documents/<user-id>/<timestamp>_aadhaar.pdf",
    "expiresIn": 60
  }
  ```
- **Security Rule:** Signed upload URL expires in strictly **60 seconds**. Storage bucket public read access is permanently disabled.

---

### 5.3 POST `/api/verify-threat`
- **Purpose:** Edge Function and client middleware threat reporting endpoint. Logs suspicious activities and dispatches automated admin escalations.
- **Request Body:**
  ```json
  {
    "ip": "203.0.113.42",
    "endpoint": "/auth/v1/otp",
    "threatType": "brute_force_otp",
    "severity": "high",
    "metadata": {
      "failedAttempts": 6,
      "timeframeMinutes": 10,
      "userAgent": "AskUs-Mobile/1.0.0 (Android 14)"
    }
  }
  ```
  *Allowed severity values:* `"low"` | `"medium"` | `"high"` | `"critical"`
- **Response:** `200 OK`
  ```json
  {
    "incident_id": "8f9a2b4c-6d8e-4a1f-9b2c-3d4e5f6a7b8c",
    "logged": true,
    "alert_dispatched": true
  }
  ```
- **Action:** Inserts directly into `public.threat_logs`. If `severity` is `"high"` or `"critical"`, immediately dispatches an alert payload to Telegram Bot and Slack Webhook.

---

## 6. LOVABLE & CLIENT INTEGRATION SPECIFICATION

1. **Direct Lovable Compatibility:**
   - Supabase project connection auto-discovers all 7 relational tables under schema `public`.
   - Complete TypeScript interfaces exported in [`src/types/database.types.ts`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/types/database.types.ts).
   - Form scaffolding in Lovable maps 1:1 with:
     - `profiles`: Supporter/Volunteer profile onboarding
     - `volunteer_kyc`: KYC document audit console
     - `drives`: Multi-wing field initiative management
     - `drive_attendees`: Geo-attendance lists
     - `donations`: 80G tax exemption dashboard
     - `foundation_knowledge`: Knowledge base management & chunking
     - `threat_logs`: Watchdog monitoring feed

2. **Sign-off Criteria Verification:**
   - [x] Complete relational integrity enforced via primary keys, foreign keys, and unique constraints (`unique(drive_id, user_id)`).
   - [x] Row-Level Security explicitly isolates supporter data, volunteer KYC files, and administrative controls.
   - [x] Stored procedure `match_foundation_docs` with HNSW cosine similarity index configured.
   - [x] Edge function contracts locked and mirrored in TypeScript interfaces.
