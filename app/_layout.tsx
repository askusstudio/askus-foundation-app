import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import { initSentry } from '@/services/sentry';
import '../global.css';

initSentry();

function RootLayout() {
  useEffect(() => {
    // Service listeners (Push notification routing, deep links) mount here
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(volunteer)" />
        <Stack.Screen name="(supporter)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}

export default Sentry.wrap(RootLayout);
