import {
  PhoneSchema,
  OtpSchema,
  KycSubmissionSchema,
  DriveRsvpSchema,
  GeoCheckInSchema,
} from '../src/utils/validators';

describe('AskUs Foundation Security & Sanity Validation', () => {
  test('Strict Mobile Phone Format Validation', () => {
    expect(PhoneSchema.safeParse('+919876543210').success).toBe(true);
    expect(PhoneSchema.safeParse('9876543210').success).toBe(false); // Missing country code
    expect(PhoneSchema.safeParse('+911234567890').success).toBe(false); // Invalid Indian carrier digit
    expect(PhoneSchema.safeParse('+9198765abcde').success).toBe(false); // Non-numeric
  });

  test('OTP Format Validation', () => {
    expect(OtpSchema.safeParse('123456').success).toBe(true);
    expect(OtpSchema.safeParse('12345').success).toBe(false); // Too short
    expect(OtpSchema.safeParse('1234567').success).toBe(false); // Too long
    expect(OtpSchema.safeParse('12a456').success).toBe(false); // Non-digit
  });

  test('KYC Document Payload Rejection on Forbidden Types', () => {
    const invalidDoc = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'passport', // Not accepted for this tier
      fileExtension: 'exe', // Forbidden filetype
      mimeType: 'application/x-msdownload',
      base64Data: 'dummy_buffer',
    };
    const result = KycSubmissionSchema.safeParse(invalidDoc);
    expect(result.success).toBe(false);
  });

  test('KYC Document Valid Payload Acceptance', () => {
    const validDoc = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      documentType: 'aadhaar',
      fileExtension: 'pdf',
      mimeType: 'application/pdf',
      base64Data: 'a'.repeat(120),
    };
    const result = KycSubmissionSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
  });

  test('Drive RSVP Mutation Validation', () => {
    expect(
      DriveRsvpSchema.safeParse({
        driveId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174000',
      }).success
    ).toBe(true);

    expect(
      DriveRsvpSchema.safeParse({
        driveId: 'invalid-id',
        userId: '223e4567-e89b-12d3-a456-426614174000',
      }).success
    ).toBe(false);
  });

  test('Geo-Attendance Check-In Validation', () => {
    expect(
      GeoCheckInSchema.safeParse({
        driveId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174000',
        latitude: 28.6139,
        longitude: 77.209,
      }).success
    ).toBe(true);

    // Out of bounds coordinates
    expect(
      GeoCheckInSchema.safeParse({
        driveId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174000',
        latitude: 105.0,
        longitude: 77.209,
      }).success
    ).toBe(false);
  });
});
