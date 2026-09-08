import React from 'react';
import { Stack } from 'expo-router';

export default function VolunteerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0F766E',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Field Volunteer Operations' }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="kyc" options={{ title: 'Volunteer KYC Verification' }} />
    </Stack>
  );
}
