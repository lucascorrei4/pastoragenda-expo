import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomSplashScreen } from '../src/components/CustomSplashScreen';
import { TokenNotificationProvider } from '../src/context/TokenNotificationContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide native splash screen immediately to prevent double splash
    SplashScreen.hideAsync();
    
    // Show custom splash for 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return <CustomSplashScreen visible={true} />;
  }

  return (
    <SafeAreaProvider>
      <TokenNotificationProvider>
        <StatusBar style="light" backgroundColor="#000000" translucent />
        <CustomSplashScreen visible={showSplash} />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </TokenNotificationProvider>
    </SafeAreaProvider>
  );
}
