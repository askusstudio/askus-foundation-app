import { ThreatSeverity } from './database.types';

// =============================================================================
// API CONTRACT 1: POST /api/askus-agent
// =============================================================================
export interface AskUsAgentRequest {
  query: string;
  sessionId?: string;
}

export type AskUsAgentStreamEvent = 
  | { chunk: string }
  | { error: string; status: 400 | 429 | 500 };

// =============================================================================
// API CONTRACT 2: POST /api/get-kyc-upload-url
// =============================================================================
export interface GetKycUploadUrlRequest {
  documentType: 'aadhaar' | 'student_id' | 'pan';
  fileExtension: 'jpg' | 'png' | 'pdf';
}

export interface GetKycUploadUrlResponse {
  signedUrl: string;
  filePath: string;
  expiresIn: 60; // strictly 60 seconds TTL
}

// =============================================================================
// API CONTRACT 3: POST /api/verify-threat (Internal Watchdog Trigger)
// =============================================================================
export interface VerifyThreatRequest {
  ip: string;
  endpoint: string;
  threatType: string; // 'brute_force_otp', 'upload_flood', 'malformed_payload'
  severity: ThreatSeverity; // 'low' | 'medium' | 'high' | 'critical'
  metadata: Record<string, unknown>;
}

export interface VerifyThreatResponse {
  incident_id: string;
  logged: boolean;
  alert_dispatched: boolean;
}

// Standardized Error Response
export interface ApiErrorResponse {
  error: string;
  status: number;
  details?: Record<string, unknown>;
}
