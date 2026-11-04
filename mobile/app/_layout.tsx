import '../src/polyfills';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePalette } from '../src/core/theme';
import { useAuth } from '../src/state/auth';
import { LockGate } from '../src/ui/LockGate';
import { ToastHost } from '../src/ui/Toast';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AuthRedirect() {
  const status = useAuth((s) => s.status);
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => { useAuth.getState().restore(); }, []);
  useEffect(() => {
    if (status === 'restoring') return;
    const onLogin = segments[0] === 'login';
    if (status === 'signedOut' && !onLogin) router.replace('/login');
    if (status === 'signedIn' && onLogin) router.replace('/');
  }, [status, segments, router]);
  return null;
}

export default function RootLayout() {
  const p = usePalette();
  const [loaded, error] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Manrope-Medium': require('../assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
    'Manrope-ExtraBold': require('../assets/fonts/Manrope-ExtraBold.ttf'),
  });
  const status = useAuth((s) => s.status);
  useEffect(() => { if ((loaded || error) && status !== 'restoring') SplashScreen.hideAsync().catch(() => undefined); }, [loaded, error, status]);
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: p.bg }}>
      <SafeAreaProvider>
        <StatusBar style={p.dark ? 'light' : 'dark'} />
        <LockGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="compose" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
          </Stack>
          <ToastHost />
        </LockGate>
        <AuthRedirect />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
