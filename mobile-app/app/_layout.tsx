/**
 * Root layout — theme-aware ambient backdrop with auth gate.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/state/AppContext';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const segments = useSegments();
  const { isSignedIn, hydrated, mode, isProvider } = useApp();

  useEffect(() => {
    if (!hydrated) return;
    const current = segments[0] || '';
    const onAuthFlow = current === 'onboarding' || current === 'signin';
    if (!isSignedIn && !onAuthFlow) {
      router.replace('/onboarding');
    } else if (isSignedIn && onAuthFlow) {
      router.replace(mode === 'provider' && isProvider ? '/provider-home' : '/');
    }
  }, [isSignedIn, hydrated, segments, router, mode, isProvider]);

  return <>{children}</>;
};

const ThemedShell = ({ children }: { children: React.ReactNode }) => {
  const { colors, theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate>{children}</AuthGate>
    </View>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemedShell>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </ThemedShell>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
