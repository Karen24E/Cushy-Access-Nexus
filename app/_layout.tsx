import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { Colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="email-test"
          options={{
            title: 'Email Monitoring',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: Colors.white,
          }}
        />
        <Stack.Screen
          name="qcommerce"
          options={{ title: 'Q-Commerce', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="healthtech"
          options={{ title: 'HealthTech', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="foodtech"
          options={{ title: 'FoodTech', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="logistics"
          options={{ title: 'Logistics', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="operations"
          options={{ title: 'Command & Operations', headerBackTitle: 'Back' }}
        />
      </Stack>
    </AuthProvider>
  );
}
