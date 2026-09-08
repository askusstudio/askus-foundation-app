import React from 'react';
import { Stack } from 'expo-router';

export default function SupporterLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#16a34a',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'AskUs Initiatives' }} />
    </Stack>
  );
}
