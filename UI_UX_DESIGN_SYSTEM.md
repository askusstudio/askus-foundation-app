# UI/UX DESIGN SYSTEM & INTERFACE SPECIFICATIONS (GATE 4)
## Project: AskUs Foundation Mobile & Operations Platform
**Document Version:** 4.0.0-FROZEN  
**Phase:** Gate 4 (UI/UX Wireframing, Atomic Component Tokens & Lovable Real-Time Binding)  
**Status:** FROZEN & READY FOR PRODUCTION SCAFFOLDING  

---

## 1. DESIGN SYSTEM & VISUAL DESIGN TOKENS

### 1.1 Typography Hierarchy (Google Fonts `Inter`)
- **Display / Header:** `24px` / Semi-Bold (`font-semibold`, 600) / Line height `1.25`
- **Section Subtitle:** `16px` / Medium (`font-medium`, 500) / Line height `1.4`
- **Body Text:** `14px` / Regular (`font-normal`, 400) / Line height `1.5`
- **Caption / Meta:** `12px` / Regular (`font-normal`, 400) / Line height `1.4`

### 1.2 Strict Color Palette (Tailwind & CSS Tokens)
| Color Token | Hex Code | Purpose & Semantic Role |
| :--- | :--- | :--- |
| `canvas.default` | `#FFFFFF` | Primary screen canvas background |
| `canvas.subtle` | `#F9FAFB` | Subtle off-white background for feeds and cards |
| `surface.default`| `#FFFFFF` | Card, container, and input backgrounds |
| `surface.border` | `#E5E7EB` | Hairline divider & card outline borders (1px) |
| `content.primary`| `#111827` | Deep charcoal primary text (90% black) |
| `content.secondary`| `#6B7280`| Muted neutral slate for descriptions and labels |
| `primary.default`| `#0F766E` | Deep Teal Accent / Primary action buttons |
| `primary.focus`  | `#14B8A6` | Focus state and active highlights |
| `destructive`    | `#DC2626` | Crimson for alerts, errors, and rejections |
| `success`        | `#16A34A` | Emerald for verified badges and confirmations |
| `warning`        | `#D97706` | Amber for pending verification banners |
| `wing.kaksha`    | `#2563EB` | Blue accent for AskUs Kaksha / Education |
| `wing.nari`      | `#DB2777` | Pink accent for Revolution नारी |
| `wing.pawer`     | `#EA580C` | Orange accent for Pawer Rangers |
| `wing.green`     | `#059669` | Emerald accent for Green Squad |

### 1.3 Corner Radii & Elevation
- **Standard Radius:** `8px` (`rounded-standard` / `rounded-lg`) for inputs, buttons, and cards.
- **Modal Radius:** `12px` (`rounded-modal` / `rounded-xl`) for bottom sheets, drawers, and dialogs.
- **Card Shadow:** Flat default with micro-elevation `0 1px 3px 0 rgba(0, 0, 0, 0.05)` (`shadow-card`).

---

## 2. CORE SCREEN WIREFRAMES & DATA BINDINGS

### Screen 1: Mobile Auth & Onboarding Flow
- **State 1 (Phone Input):**
  - Minimal country prefix selector (`+91` pre-selected).
  - 10-digit numeric input with real-time length validation (`isValidLength === true`).
  - Primary Action: `Send Verification Code` (triggers `supabase.auth.signInWithOtp`).
- **State 2 (OTP Confirmation):**
  - 6-box segmented OTP field with autofocus and auto-advance across inputs.
  - Resend OTP countdown timer (locked to 60s).
  - On verification success: Evaluates `profiles.role` and redirects to corresponding persona group.

### Screen 2: Volunteer KYC Verification Screen
- **Context:** Rendered if `profiles.kyc_status` is `not_submitted` or `rejected`.
- **Elements:**
  - Segmented Pill Tabs: `Aadhaar Card` (`aadhaar`), `Student ID` (`student_id`), `Govt ID` (`pan`).
  - Upload Target: `DocumentUploader` accepting JPEG, PNG, PDF (Max 5MB).
  - Preview State: Renders selected file name, size in KB/MB, and remove button.
  - Empty State: "No verification document submitted. Upload an ID to access field operations."
  - Pending State: "Your documents are under review by the AskUs Operations Team."

### Screen 3: Field Drives & Initiatives Hub
- **Elements:**
  - Wing Filter Chips: `All`, `AskUs Kaksha`, `Revolution नारी`, `Pawer Rangers`, `Green Squad`.
  - Drive List: Bound directly to `public.drives` where `status in ('upcoming', 'in_progress')`.
  - Card Structure: `DriveCard` displaying Wing Badge, Title, Date/Time, Location with map coordinates, and Capacity counter (`X slots remaining`).
  - Action: Single-tap `RSVP to Drive` button (disables if capacity is reached or user is already registered in `public.drive_attendees`).
  - Zero-Data Empty State: `EmptyStateContainer` rendering "No active field drives scheduled in this area. Check back soon."

### Screen 4: Real-time AskUs AI Assistant Drawer
- **Interface:** Bottom sheet modal accessible globally via `AIAssistantDrawer`.
- **Header:** "AskUs Foundation Guide" with indicator badge `Direct Operational Knowledge`.
- **Chat Feed:** Clean alternating bubbles (Left: Assistant, Right: User).
- **Behavior:** Real-time token streaming via Server-Sent Events (SSE) bound to `POST /api/askus-agent`.
- **Suggested Topic Chips (Zero state):**
  - "What are the timings for AskUs Kaksha?"
  - "How do I log field attendance?"
  - "Where are the active animal feeding spots?"

### Screen 5: Admin Operational Console
- **Module A: KYC Verification Queue:**
  - Table displaying pending records from `public.volunteer_kyc` joined with `public.profiles`.
  - Columns: Submitter Name, Phone, Document Type, Submission Timestamp, Actions (`Approve`, `Reject with reason`).
  - Empty State: `EmptyStateContainer` rendering "Zero pending verifications. All volunteer documents reviewed."
- **Module B: Threat & Bug Incident Monitor:**
  - Real-time stream bound to `public.threat_logs`.
  - Severity Tag (`CRITICAL`, `HIGH`, `MEDIUM`), Client IP, Triggered Endpoint, Timestamp.
  - Empty State: `EmptyStateContainer` rendering "System status healthy. No anomalies or security alerts detected."

---

## 3. ATOMIC COMPONENT CONTRACTS

| Component | Level | Props Contract | File Reference |
| :--- | :--- | :--- | :--- |
| **`Button`** | Atom | `label: string`, `onPress: () => void`, `variant: 'primary' \| 'secondary' \| 'danger' \| 'ghost'`, `size: 'sm' \| 'md' \| 'lg'`, `isLoading?: boolean`, `disabled?: boolean` | [`src/components/Button.tsx`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/components/Button.tsx) |
| **`EmptyStateContainer`** | Molecule | `title: string`, `description: string`, `actionLabel?: string`, `onAction?: () => void` | [`src/components/EmptyStateContainer.tsx`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/components/EmptyStateContainer.tsx) |
| **`DocumentUploader`** | Molecule | `acceptedTypes?: string[]`, `maxSizeMb?: number`, `onFileSelected: (file: SelectedDocument) => void`, `isUploading?: boolean`, `selectedFile?: SelectedDocument \| null`, `onClear?: () => void` | [`src/components/DocumentUploader.tsx`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/components/DocumentUploader.tsx) |
| **`DriveCard`** | Organism | `drive: Drive`, `userRegistrationStatus: 'registered' \| 'none'`, `onRsvp: (driveId: string) => void`, `isRsvping?: boolean`, `registeredCount?: number` | [`src/components/DriveCard.tsx`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/components/DriveCard.tsx) |
| **`AIAssistantDrawer`** | Organism | `isVisible: boolean`, `onClose: () => void` | [`src/components/AIAssistantDrawer.tsx`](file:///c:/Users/anany/OneDrive/Desktop/AskUs/src/components/AIAssistantDrawer.tsx) |

---

## 4. CRITICAL DATA INTEGRITY COMPLIANCE
- **Zero Synthetic Mock Data:** Zero hardcoded names, mock profiles, or dummy arrays exist in screen components.
- **Empty State Fallbacks:** When `public.drives`, `public.volunteer_kyc`, or `public.threat_logs` return empty arrays, clean `EmptyStateContainer` molecules render with actionable refresh triggers.
- **Supabase Real-Time Binding:** All inputs, file uploads, and RSVP triggers connect to verified Supabase tables and Edge Functions.
