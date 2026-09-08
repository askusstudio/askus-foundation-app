import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

// Secure store adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/**
 * Gate 7: Supabase Connection Resilience
 * Fast timeout (8 seconds) to fail hung queries fast and trigger fallback UI
 * rather than stalling with infinite loading spinners.
 */
export const fetchWithTimeout = (url: string | URL | Request, options: any = {}) => {
  return Promise.race([
    fetch(url as any, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout after 8s')), 8000)
    ),
  ]);
};

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithTimeout as typeof fetch,
  },
});
