import { z } from 'zod';

/**
 * Gate 7: Defensive Sanitization & Input Validation Layer
 */

// Strict Indian mobile phone: +91 followed by 10 digits starting with 6-9
export const PhoneSchema = z
  .string()
  .regex(
    /^\+91[6-9]\d{9}$/,
    'Invalid Indian mobile number (+91 followed by 10 digits)'
  );

// Strict 6-digit numeric OTP
export const OtpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 numeric digits')
  .regex(/^\d+$/, 'OTP must contain numbers only');

// Strict volunteer KYC submission schema
export const KycSubmissionSchema = z.object({
  userId: z.string().uuid('Invalid user UUID'),
  documentType: z.enum(['aadhaar', 'student_id', 'pan']),
  fileExtension: z.enum(['jpg', 'png', 'pdf']),
  mimeType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
  base64Data: z.string().min(100, 'File buffer is corrupted or empty'),
});

// Drive RSVP mutation schema
export const DriveRsvpSchema = z.object({
  driveId: z.string().uuid('Invalid drive UUID'),
  userId: z.string().uuid('Invalid user UUID'),
});

// Geo-attendance check-in mutation schema
export const GeoCheckInSchema = z.object({
  driveId: z.string().uuid('Invalid drive UUID'),
  userId: z.string().uuid('Invalid user UUID'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// PAN format schema (10 alphanumeric)
export const PanSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)',
  });

// Donation submission schema
export const DonationSchema = z.object({
  amountInr: z.number().min(50, 'Minimum donation amount is ₹50'),
  donorName: z.string().min(2, 'Name is required for receipt'),
  donorEmail: z.string().email('Valid email is required for 80G receipt delivery'),
  donorPhone: PhoneSchema,
  donorPan: PanSchema.optional().or(z.literal('')),
});

// SOS emergency report schema
export const SosSubmissionSchema = z.object({
  category: z.enum([
    'ANIMAL_DISTRESS',
    'CHILD_EDUCATION_DEFICIT',
    'WOMEN_HEALTH_EMERGENCY',
    'ENVIRONMENTAL_HAZARD',
  ]),
  description: z
    .string()
    .min(10, 'Please describe the emergency in at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  landmark: z.string().min(3, 'Nearest landmark is required for rescue teams'),
});
