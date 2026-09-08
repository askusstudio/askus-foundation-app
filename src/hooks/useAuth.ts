import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Session } from '@supabase/supabase-js';
import { PhoneSchema, OtpSchema } from '@/utils/validators';

export interface Profile {
  id: string;
  phone: string;
  full_name: string | null;
  role: 'supporter' | 'volunteer' | 'admin';
  kyc_status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  avatar_url: string | null;
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (phone: string) => {
    // Gate 7: Strict input sanitization before dispatch
    const validatedPhone = PhoneSchema.parse(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: validatedPhone });
    if (error) throw error;
  };

  const verifyOtp = async (phone: string, token: string) => {
    // Gate 7: Strict input sanitization before dispatch
    const validatedPhone = PhoneSchema.parse(phone);
    const validatedToken = OtpSchema.parse(token);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: validatedPhone,
      token: validatedToken,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    profile,
    loading,
    sendOtp,
    verifyOtp,
    signOut,
    refreshProfile: () => session?.user && fetchProfile(session.user.id),
  };
};
