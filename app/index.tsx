import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../src/services/supabase';
import { UserRole } from '../src/types/database';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuthAndRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Fetch user role from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          setUserRole('supporter');
        } else {
          setUserRole(profile.role as UserRole);
        }
      } catch (e) {
        console.error('[Router] Auth check failed:', e);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthAndRole();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-4 text-gray-600 font-medium">Loading AskUs Foundation...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Mutually exclusive role-based routing
  switch (userRole) {
    case 'admin':
      return <Redirect href="/(admin)" />;
    case 'volunteer':
      return <Redirect href="/(volunteer)" />;
    case 'supporter':
    default:
      return <Redirect href="/(supporter)" />;
  }
}
