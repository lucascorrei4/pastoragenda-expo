import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomSplashScreen } from '../src/components/CustomSplashScreen';
import { TokenNotificationProvider } from '../src/context/TokenNotificationContext';
import { WebViewReadyProvider } from '../src/context/WebViewReadyContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);
  const [maxSplashTimeout, setMaxSplashTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Hide native splash screen immediately to prevent double splash
    SplashScreen.hideAsync();
    
    // Set maximum timeout as fallback (8 seconds)
    const timeout = setTimeout(() => {
      console.log('Maximum splash timeout reached - hiding splash');
      setShowSplash(false);
    }, 8000);
    setMaxSplashTimeout(timeout);

    return () => {
      if (maxSplashTimeout) {
        clearTimeout(maxSplashTimeout);
      }
    };
  }, []);

  // Handle WebView ready signal
  const handleWebViewReady = () => {
    console.log('WebView ready signal received - hiding splash');
    setShowSplash(false);
    
    // Clear the maximum timeout since WebView is ready
    if (maxSplashTimeout) {
      clearTimeout(maxSplashTimeout);
      setMaxSplashTimeout(null);
    }
  };

  if (!loaded) {
    return <CustomSplashScreen visible={true} />;
  }

  return (
    <SafeAreaProvider>
      <TokenNotificationProvider>
        <WebViewReadyProvider onReady={handleWebViewReady}>
          <StatusBar style="light" backgroundColor="#000000" translucent />
          <CustomSplashScreen visible={showSplash} />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </WebViewReadyProvider>
      </TokenNotificationProvider>
    </SafeAreaProvider>
  );
}
