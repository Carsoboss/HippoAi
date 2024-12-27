import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@/lib/auth';

// 1. Import Sentry and initialize it
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
Sentry.init({
  dsn: 'https://a66e127171dd7d095e8cf8dbe31f18e1@o4508541690642432.ingest.us.sentry.io/4508541799366656',
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  // debug: true, // (Optional) enable debug logs for development
});

// We want to prevent the splash screen from auto-hiding:
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

function RootLayout() {
  // 2. Load any fonts you need
  const [fontsLoaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "Jakarta-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  // 3. Check your Clerk publishable key
  if (!publishableKey) {
    throw new Error(
      'Missing Clerk publishable key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env'
    );
  }

  // 4. Hide the splash screen after fonts load
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // 5. If not ready yet, return null (so no UI flash)
  if (!fontsLoaded) {
    return null;
  }

  // 6. Wrap your app with Clerk and your Router
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="(root)"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

// 7. Export the layout with Sentry wrapping
export default Sentry.wrap(RootLayout);
