import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

type Target = '/disclaimer' | '/onboarding' | '/(tabs)' | null;

function useTarget(): Target {
  const hydrated = useAppStore((s) => s.hydrated);
  const accepted = useAppStore((s) => s.disclaimerAccepted);
  const onboarded = useAppStore((s) => s.onboarded);
  const hasPlan = useAppStore((s) => !!s.plan);
  if (!hydrated) return null;
  if (!accepted) return '/disclaimer';
  if (!onboarded || !hasPlan) return '/onboarding';
  return '/(tabs)';
}

/** Перенаправляет пользователя: дисклеймер → анкета → приложение. */
function Gate() {
  const target = useTarget();
  const segments = useSegments();
  const navReady = !!useRootNavigationState()?.key;
  const first = segments[0] as string | undefined;

  useEffect(() => {
    if (target === null || !navReady) return;
    SplashScreen.hideAsync().catch(() => undefined);
    const ok =
      target === '/disclaimer'
        ? first === 'disclaimer'
        : target === '/onboarding'
          ? first === 'onboarding'
          : first !== 'disclaimer' && first !== 'onboarding' && first !== undefined;
    if (!ok) router.replace(target);
  }, [target, first, navReady]);

  return null;
}

export default function RootLayout() {
  const t = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Gate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerShadowVisible: false,
          headerBackTitle: 'Назад',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="disclaimer" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="about" options={{ headerShown: true, title: 'О приложении' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
