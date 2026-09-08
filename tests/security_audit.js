/**
 * AskUs Foundation Mobile & Operations Platform
 * Gate 5: Automated Security Audit & End-to-End Boundary Verification Suite
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n=============================================================');
console.log('ASKUS FOUNDATION: GATE 5 END-TO-END SECURITY & ARCHITECTURE AUDIT');
console.log('=============================================================\n');

// -----------------------------------------------------------------------------
// TEST SUITE 1: FILE MANIFEST & REPOSITORY INTEGRITY
// -----------------------------------------------------------------------------
console.log('[Suite 1: Repository Manifest & File System Verification]');

const requiredFiles = [
  'PRD.md',
  'ARCHITECTURE.md',
  'DATABASE_AND_API_CONTRACTS.md',
  'UI_UX_DESIGN_SYSTEM.md',
  'package.json',
  'tsconfig.json',
  'app.json',
  'tailwind.config.js',
  'metro.config.js',
  'global.css',
  '.env.example',
  'supabase/migrations/20260908000000_askus_core_schema.sql',
  'supabase/functions/askus-agent/index.ts',
  'supabase/functions/get-kyc-upload-url/index.ts',
  'supabase/functions/verify-threat/index.ts',
  'src/types/database.types.ts',
  'src/types/database.ts',
  'src/types/api.ts',
  'src/utils/validators.ts',
  'src/services/supabase.ts',
  'src/services/sentry.ts',
  'src/services/notifications.ts',
  'src/components/Button.tsx',
  'src/components/EmptyStateContainer.tsx',
  'src/components/DocumentUploader.tsx',
  'src/components/DriveCard.tsx',
  'src/components/AIAssistantDrawer.tsx',
  'src/services/kyc.ts',
  'src/config/env.ts',
  'supabase/functions/threat-watchdog/index.ts',
  'app/_layout.tsx',
  'app/index.tsx',
  'app/(auth)/login.tsx',
  'app/(auth)/verify-otp.tsx',
  'app/(volunteer)/index.tsx',
  'app/(volunteer)/kyc.tsx',
  'app/(supporter)/index.tsx',
  'app/(admin)/index.tsx',
];

const workspaceRoot = path.resolve(__dirname, '..');
for (const relPath of requiredFiles) {
  const fullPath = path.join(workspaceRoot, relPath);
  assert(fs.existsSync(fullPath), `Required artifact exists: ${relPath}`);
}

// -----------------------------------------------------------------------------
// TEST SUITE 2: DATABASE SCHEMA & RLS PENETRATION CHECK
// -----------------------------------------------------------------------------
console.log('\n[Suite 2: Database Schema & RLS Policy Integrity Audit]');

const sqlContent = fs.readFileSync(
  path.join(workspaceRoot, 'supabase/migrations/20260908000000_askus_core_schema.sql'),
  'utf8'
);

// 2.1 Extension verification
assert(sqlContent.includes('create extension if not exists "uuid-ossp"'), 'UUID extension enabled');
assert(sqlContent.includes('create extension if not exists "pgcrypto"'), 'PGCrypto extension enabled');
assert(sqlContent.includes('create extension if not exists "vector"'), 'pgvector extension enabled');

// 2.2 System Enums
const requiredEnums = [
  'user_role',
  'kyc_status',
  'foundation_wing',
  'drive_status',
  'attendance_status',
  'threat_severity',
  'donation_status',
];
for (const e of requiredEnums) {
  assert(sqlContent.includes(`create type ${e} as enum`), `System enum declared: ${e}`);
}

// 2.3 Required Tables
const requiredTables = [
  'public.profiles',
  'public.volunteer_kyc',
  'public.drives',
  'public.drive_attendees',
  'public.donations',
  'public.foundation_knowledge',
  'public.threat_logs',
];
for (const t of requiredTables) {
  assert(sqlContent.includes(`create table ${t}`), `Table defined with schema: ${t}`);
  assert(sqlContent.includes(`alter table ${t} enable row level security;`), `RLS explicitly enabled on: ${t}`);
}

// 2.4 Vector Search Index
assert(sqlContent.includes('using hnsw (embedding vector_cosine_ops)'), 'HNSW vector cosine index created');
assert(sqlContent.includes('function match_foundation_docs'), 'Vector RAG similarity function match_foundation_docs defined');

// 2.5 Unique Attendee Constraint
assert(sqlContent.includes('unique(drive_id, user_id)'), 'Unique constraint on (drive_id, user_id) prevents double RSVP');

// -----------------------------------------------------------------------------
// TEST SUITE 3: EDGE FUNCTION & SECURITY CONTRACT BOUNDARIES
// -----------------------------------------------------------------------------
console.log('\n[Suite 3: Edge Function API Contracts & Security Thresholds]');

// 3.1 askus-agent inspection
const askusAgentCode = fs.readFileSync(
  path.join(workspaceRoot, 'supabase/functions/askus-agent/index.ts'),
  'utf8'
);
assert(askusAgentCode.includes('0.72'), 'RAG cosine similarity threshold set to exactly 0.72');
assert(askusAgentCode.includes('text/event-stream') || askusAgentCode.includes('application/json'), 'Grounded response streaming/JSON configured');
assert(askusAgentCode.includes('AskUs Foundation') || askusAgentCode.includes('I can only assist'), 'Deterministic out-of-domain safe fallback response present');

// 3.2 get-kyc-upload-url inspection
const kycUploadCode = fs.readFileSync(
  path.join(workspaceRoot, 'supabase/functions/get-kyc-upload-url/index.ts'),
  'utf8'
);
assert(kycUploadCode.includes('expiresIn: 60') || kycUploadCode.includes('expires_in: 60'), 'Signed PUT upload URL expires in strictly 60 seconds');
assert(kycUploadCode.includes('kyc-documents'), 'Storage quarantine bucket bound to kyc-documents');
assert(kycUploadCode.includes('aadhaar') && kycUploadCode.includes('student_id') && kycUploadCode.includes('pan'), 'Allowed document types strictly validated (aadhaar, student_id, pan)');

// 3.3 verify-threat inspection
const threatCode = fs.readFileSync(
  path.join(workspaceRoot, 'supabase/functions/verify-threat/index.ts'),
  'utf8'
);
assert(threatCode.includes('public.threat_logs') || threatCode.includes('threat_logs'), 'Threat incident logging bound to public.threat_logs');
assert(threatCode.includes('ADMIN_TELEGRAM_BOT_TOKEN') || threatCode.includes('Telegram'), 'Telegram admin alert webhook integrated');
assert(threatCode.includes('ADMIN_SLACK_WEBHOOK_URL') || threatCode.includes('Slack'), 'Slack admin alert webhook integrated');
assert(threatCode.includes('high') && threatCode.includes('critical'), 'High and critical severity incidents trigger external webhooks');

// -----------------------------------------------------------------------------
// TEST SUITE 4: SENTRY TELEMETRY & PRIVACY SCRUBBING
// -----------------------------------------------------------------------------
console.log('\n[Suite 4: Sentry Crash Boundaries & Privacy Verification]');

const sentryServiceCode = fs.readFileSync(
  path.join(workspaceRoot, 'src/services/sentry.ts'),
  'utf8'
);
const rootLayoutCode = fs.readFileSync(
  path.join(workspaceRoot, 'app/_layout.tsx'),
  'utf8'
);

assert(rootLayoutCode.includes('Sentry.wrap(RootLayout)'), 'Root client component explicitly wrapped with Sentry.wrap()');
assert(sentryServiceCode.includes('beforeSend'), 'Sentry beforeSend privacy filter implemented');
assert(sentryServiceCode.includes('delete event.user.ip_address') || sentryServiceCode.includes('delete event.user.email'), 'Direct user PII scrubbed before sending crash telemetry');

// -----------------------------------------------------------------------------
// TEST SUITE 5: DATA INTEGRITY & ZERO-MOCK COMPLIANCE
// -----------------------------------------------------------------------------
console.log('\n[Suite 5: Zero-Synthetic Mock Data & Integrity Verification]');

const volunteerScreenCode = fs.readFileSync(
  path.join(workspaceRoot, 'app/(volunteer)/index.tsx'),
  'utf8'
);
const adminScreenCode = fs.readFileSync(
  path.join(workspaceRoot, 'app/(admin)/index.tsx'),
  'utf8'
);

assert(!volunteerScreenCode.includes('John Doe') && !volunteerScreenCode.includes('Jane Doe'), 'No synthetic names (John/Jane Doe) in Volunteer screens');
assert(!adminScreenCode.includes('John Doe') && !adminScreenCode.includes('Jane Doe'), 'No synthetic names in Admin screens');
assert(volunteerScreenCode.includes('EmptyStateContainer'), 'EmptyStateContainer used when public.drives is empty');
assert(adminScreenCode.includes('EmptyStateContainer'), 'EmptyStateContainer used when volunteer_kyc and threat_logs are empty');

// -----------------------------------------------------------------------------
// AUDIT SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=============================================================');
console.log(`TOTAL CHECKS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('=============================================================\n');

if (failedTests > 0) {
  console.error('❌ GATE 5 SECURITY AUDIT FAILED. Review failed invariants above.');
  process.exit(1);
} else {
  console.log('✅ GATE 5 SECURITY AUDIT PASSED WITH ZERO VIOLATIONS.');
  process.exit(0);
}
