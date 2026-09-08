-- =============================================================================
-- AskUs Foundation: Core Database DDL, Vector Indexing & RLS Policies
-- Target: PostgreSQL 15+ / Supabase
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. CUSTOM ENUMS
CREATE TYPE user_role_enum AS ENUM (
  'SUPPORTER',
  'FIELD_VOLUNTEER',
  'COORDINATOR_ADMIN'
);

CREATE TYPE kyc_status_enum AS ENUM (
  'NOT_SUBMITTED',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED'
);

CREATE TYPE foundation_wing_enum AS ENUM (
  'EDUCATION',
  'WOMEN_EMPOWERMENT',
  'ANIMAL_WELFARE',
  'ENVIRONMENT'
);

CREATE TYPE drive_status_enum AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE rsvp_status_enum AS ENUM (
  'CONFIRMED',
  'WAITLISTED',
  'CANCELLED'
);

CREATE TYPE sos_category_enum AS ENUM (
  'ANIMAL_DISTRESS',
  'CHILD_EDUCATION_DEFICIT',
  'WOMEN_HEALTH_EMERGENCY',
  'ENVIRONMENTAL_HAZARD'
);

CREATE TYPE sos_status_enum AS ENUM (
  'OPEN_TRIAGE',
  'ASSIGNED',
  'RESOLVED',
  'FALSE_ALARM'
);

CREATE TYPE threat_severity_enum AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

-- 3. USER PROFILES
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role_enum NOT NULL DEFAULT 'SUPPORTER',
  kyc_status kyc_status_enum NOT NULL DEFAULT 'NOT_SUBMITTED',
  city TEXT,
  primary_centre_id UUID,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CENTRES
CREATE TABLE centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  coordinator_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key reference to primary_centre_id
ALTER TABLE user_profiles 
  ADD CONSTRAINT fk_user_centre 
  FOREIGN KEY (primary_centre_id) REFERENCES centres(id) ON DELETE SET NULL;

-- 5. KYC DOCUMENTS (QUARANTINED)
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status kyc_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION',
  reviewed_by UUID REFERENCES user_profiles(id),
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 6. FIELD DRIVES
CREATE TABLE drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  wing foundation_wing_enum NOT NULL,
  centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  coordinator_id UUID NOT NULL REFERENCES user_profiles(id),
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geofence_radius_meters INT NOT NULL DEFAULT 200,
  landmark TEXT NOT NULL,
  slot_capacity INT NOT NULL DEFAULT 20,
  confirmed_rsvp_count INT NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status drive_status_enum NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DRIVE RSVPS
CREATE TABLE drive_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status rsvp_status_enum NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(drive_id, user_id)
);

-- 8. ATTENDANCE LOGS
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_lat DOUBLE PRECISION NOT NULL,
  check_in_lng DOUBLE PRECISION NOT NULL,
  distance_from_target_meters DOUBLE PRECISION NOT NULL,
  is_mock_location BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(drive_id, user_id)
);

-- 9. FIELD IMPACT REPORTS
CREATE TABLE impact_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  students_taught_count INT DEFAULT 0,
  animals_fed_or_rescued_count INT DEFAULT 0,
  trees_planted_count INT DEFAULT 0,
  summary_notes TEXT NOT NULL,
  photo_storage_paths TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PUBLIC SOS & BENEFICIARY REPORTS
CREATE TABLE sos_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_phone TEXT NOT NULL,
  reporter_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  category sos_category_enum NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  landmark TEXT NOT NULL,
  photo_paths TEXT[] NOT NULL DEFAULT '{}',
  status sos_status_enum NOT NULL DEFAULT 'OPEN_TRIAGE',
  assigned_to_user_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DONATIONS & 80G LEDGER
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_phone TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_pan TEXT,
  amount_inr NUMERIC(10, 2) NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'INITIATED',
  receipt_80g_number TEXT UNIQUE,
  receipt_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. THREAT & WATCHDOG INCIDENTS
CREATE TABLE threat_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_triggered TEXT NOT NULL,
  severity threat_severity_enum NOT NULL,
  actor_ip TEXT NOT NULL,
  actor_phone_masked TEXT,
  actor_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  device_fingerprint TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_taken TEXT NOT NULL,
  sentry_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. GROUNDED RAG KNOWLEDGE CORPUS & HNSW VECTOR INDEX
CREATE TABLE foundation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  wing foundation_wing_enum,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create HNSW index using cosine distance operator
CREATE INDEX foundation_documents_embedding_hnsw_idx 
  ON foundation_documents 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 14. VECTOR COSINE SIMILARITY RPC FUNCTION
CREATE OR REPLACE FUNCTION match_foundation_docs (
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fd.id,
    fd.title,
    fd.content,
    1 - (fd.embedding <=> query_embedding) AS similarity
  FROM foundation_documents fd
  WHERE 1 - (fd.embedding <=> query_embedding) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 15. ROW-LEVEL SECURITY (RLS) POLICIES

-- Helper: Check if active user is Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'COORDINATOR_ADMIN'
  );
$$;

-- Helper: Check if active user is a Verified Volunteer
CREATE OR REPLACE FUNCTION is_verified_volunteer()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() 
      AND role = 'FIELD_VOLUNTEER' 
      AND kyc_status = 'VERIFIED'
  );
$$;

-- Enable RLS across all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_documents ENABLE ROW LEVEL SECURITY;

-- User Profiles: Read/Update own; Admin read all
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Centres: Public read; Admin write
CREATE POLICY "Centres are publicly readable" ON centres
  FOR SELECT USING (true);

CREATE POLICY "Admin can modify centres" ON centres
  FOR ALL USING (is_admin());

-- KYC Documents: Users can see own; Admin can see/update all
CREATE POLICY "Users can view own KYC records" ON kyc_documents
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admin can update KYC records" ON kyc_documents
  FOR UPDATE USING (is_admin());

-- Drives: Public read for published; Admin full access
CREATE POLICY "Drives publicly readable when published" ON drives
  FOR SELECT USING (status != 'DRAFT' OR is_admin());

CREATE POLICY "Admin can modify drives" ON drives
  FOR ALL USING (is_admin());

-- Drive RSVPs: Strictly VERIFIED volunteers can insert/cancel own RSVP
CREATE POLICY "Verified volunteers can RSVP" ON drive_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_verified_volunteer());

CREATE POLICY "Users can view own RSVPs" ON drive_rsvps
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Attendance Logs: Verified volunteers check-in; Admin audit
CREATE POLICY "Verified volunteers can check in" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_verified_volunteer());

CREATE POLICY "Attendance visible to user and admin" ON attendance_logs
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Threat Incidents: Only Admin can read
CREATE POLICY "Threat incidents restricted to admin" ON threat_incidents
  FOR SELECT USING (is_admin());

-- Foundation Documents: Public read
CREATE POLICY "Foundation knowledge docs are publicly readable" ON foundation_documents
  FOR SELECT USING (true);
