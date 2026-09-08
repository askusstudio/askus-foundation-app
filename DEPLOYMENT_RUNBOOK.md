# PRODUCTION DEPLOYMENT & OPERATIONS RUNBOOK (GATE 5)
## Project: AskUs Foundation Mobile & Operations Platform
**Document Version:** 5.0.0-FINAL  
**Phase:** Gate 5 (Deployment Verification & Runbook Execution)  
**Status:** PRODUCTION READY  

---

## 1. PRE-DEPLOYMENT PREREQUISITES & SECRETS INVENTORY

Ensure the following infrastructure resources and API keys are provisioned before triggering production deployments:

| Secret Key | Target Service | Purpose / Scope | Location |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Project | Client API endpoint | `.env` / EAS Secrets |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project | Client public access key | `.env` / EAS Secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project | Admin Edge Function execution | Supabase Vault |
| `OPENAI_API_KEY` | OpenAI Platform | `gpt-4o-mini` & `text-embedding-3-small` | Supabase Vault |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis | Token-bucket rate limiter | Supabase Vault |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | Redis REST auth token | Supabase Vault |
| `ADMIN_SLACK_WEBHOOK_URL` | Slack App | Security incident notification | Supabase Vault |
| `ADMIN_TELEGRAM_BOT_TOKEN` | Telegram Bot API | Security incident notification | Supabase Vault |
| `ADMIN_TELEGRAM_CHAT_ID` | Telegram Chat/Channel| Admin security group target | Supabase Vault |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry.io | Crash telemetry & error trapping | `.env` / EAS Secrets |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Razorpay India | Payment checkout sheets | `.env` / EAS Secrets |

---

## 2. DATABASE MIGRATION & RLS ENFORCEMENT

Execute the unified core schema migration in your managed Supabase PostgreSQL instance:

### Option A: Using Supabase CLI (Recommended)
```bash
# Link local repository to production project ref
npx supabase link --project-ref <your-project-ref>

# Apply core schema, ENUMs, RLS policies, and vector indexes
npx supabase db push
```

### Option B: Using Supabase Dashboard SQL Editor
1. Open your **Supabase Project Dashboard** -> **SQL Editor**.
2. Paste the contents of [`supabase/migrations/20260908000000_askus_core_schema.sql`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/supabase/migrations/20260908000000_askus_core_schema.sql).
3. Execute the script.
4. Verify table creation under **Table Editor**:
   - `profiles`
   - `volunteer_kyc`
   - `drives`
   - `drive_attendees`
   - `donations`
   - `foundation_knowledge`
   - `threat_logs`

---

## 3. STORAGE QUARANTINE BUCKET CONFIGURATION

1. In Supabase Dashboard, navigate to **Storage** -> **New Bucket**.
2. Name the bucket: `kyc-documents`.
3. **CRITICAL SECURITY RULE:** Toggle **Public bucket** to **OFF** (Private).
4. Save the bucket.
5. Verify that signed upload URLs and signed read URLs function via Edge Functions.

---

## 4. EDGE FUNCTIONS DEPLOYMENT

Deploy all serverless functions to the Supabase Edge network:

```bash
# 1. Set environment secrets in Supabase Vault
npx supabase secrets set OPENAI_API_KEY=sk-... \
  UPSTASH_REDIS_REST_URL=https://... \
  UPSTASH_REDIS_REST_TOKEN=... \
  ADMIN_SLACK_WEBHOOK_URL=https://hooks.slack.com/... \
  ADMIN_TELEGRAM_BOT_TOKEN=... \
  ADMIN_TELEGRAM_CHAT_ID=...

# 2. Deploy Grounded RAG Assistant
npx supabase functions deploy askus-agent

# 3. Deploy Threat Watchdog & Alert Dispatcher
npx supabase functions deploy verify-threat

# 4. Deploy Signed KYC Upload URL Generator
npx supabase functions deploy get-kyc-upload-url
```

---

## 5. LOVABLE UI INTEGRATION & REAL-TIME BINDING

1. In your **Lovable** project settings, connect your **Supabase** backend using your project URL and public Anon key.
2. Ensure Lovable syncs with [`src/types/database.types.ts`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/types/database.types.ts).
3. Connect the atomic components from [`src/components/index.ts`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/components/index.ts):
   - `Button` for primary forms and actions
   - `DocumentUploader` for volunteer KYC document onboarding
   - `DriveCard` for real-time field drives display
   - `EmptyStateContainer` for zero-data resilience
   - `AIAssistantDrawer` for grounded interactive help

---

## 6. MOBILE CLIENT BUILD & APP STORE DISTRIBUTION (EAS)

Build production binaries using Expo Application Services (EAS):

```bash
# 1. Configure EAS project
npx eas-cli login
npx eas-cli project:init

# 2. Build production Android APK / AAB
npx eas-cli build --platform android --profile production

# 3. Build production iOS IPA (TestFlight / App Store)
npx eas-cli build --platform ios --profile production
```

---

## 7. POST-DEPLOYMENT SMOKE TEST CHECKLIST

- [ ] **SMS OTP Authentication:** Request OTP for an E.164 number; confirm 6-digit code entry; verify automatic profile row in `public.profiles`.
- [ ] **KYC Upload:** Upload a valid sample PDF/JPEG identity document; verify encrypted file presence in `kyc-documents/{user_id}/` and status change to `pending`.
- [ ] **Admin Approval Flow:** Open Admin Console, approve pending document, and verify profile transition to `volunteer` with `kyc_status = 'verified'`.
- [ ] **Drive RSVP & Capacity:** Confirm a drive slot; observe real-time decrement in available slots; confirm double-registration is prevented by unique constraint.
- [ ] **RAG Grounded Refusal:** Ask out-of-domain query (e.g. "Write Python code"); confirm immediate fallback response without hallucination.
- [ ] **Threat Escalation:** Simulate 6 rapid OTP requests from single IP; confirm Upstash 429 lockout and Telegram/Slack alert dispatch.
