import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse({
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    RAZORPAY_KEY_ID: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
  });

  if (!result.success) {
    console.error('CRITICAL: Missing or invalid environment variables:', result.error.format());
    throw new Error('Invalid app environment configuration.');
  }

  return result.data;
};

export const ENV = parseEnv();
