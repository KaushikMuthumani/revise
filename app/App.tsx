import 'react-native-reanimated';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useProfileStore } from './src/store/useProfileStore';

export default function App() {
  const { profile } = useProfileStore();
  const isDark = profile?.dark_mode ?? false;

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
