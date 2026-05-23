import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { Toast } from '../components/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          SpaceGrotesk:
            'https://fonts.gstatic.com/s/spacegrotesk/v15/V8mQoQDjQSkFJVnqq3Nn733sgb65-g15tM0vBw.ttf',
          Nunito:
            'https://fonts.gstatic.com/s/nunito/v26/XRXX3I6Li01BKofIMN5MZHI.ttf',
        });
      } catch (error) {
        console.warn('Font load failed, using system fonts:', error);
      } finally {
        setFontsLoaded(true);
        SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

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
        <Stack.Screen name="expense/scan" />
        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="group/settle" />
        <Stack.Screen name="group/invite" />
        <Stack.Screen name="payment/success" />
        <Stack.Screen name="payment/methods" />
      </Stack>
      <Toast />
    </SafeAreaProvider>
  );
}
