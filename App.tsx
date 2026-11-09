import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { TeacherNavigator } from './src/navigation/TeacherNavigator';
import { ThemeProvider, useTheme } from './src/shared/theme/ThemeContext';
import { LanguageProvider } from './src/shared/i18n/LanguageContext';

function TeacherAppContent() {
  const { isDark } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TeacherNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <TeacherAppContent />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}