import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Toast } from '../components/ui/Toast';

// Keep the splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          SpaceGrotesk: 'https://fonts.gstatic.com/s/spacegrotesk/v15/V8mQoQDjQSkFJVnqq3Nn733sgb65-g15tM0vBw.ttf',
          Nunito: 'https://fonts.gstatic.com/s/nunito/v26/XRXX3I6Li01BKofIMN5MZHI.ttf',
        });
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Failed to load fonts from web, falling back to system fonts:', error);
        // Fallback: mark as loaded to let user use system fonts
        setFontsLoaded(true);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)/splash" />
        <Stack.Screen name="(auth)/onboarding" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="expense/add" />
        <Stack.Screen name="expense/split" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="group/settle" />
        <Stack.Screen name="payment/success" />
      </Stack>
      <Toast />
    </SafeAreaProvider>
  );
}
