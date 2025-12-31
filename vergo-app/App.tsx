/**
 * VERGO Events Mobile App
 * Main entry point
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation';
import { LoadingScreen } from './src/components';
import { useAuthStore } from './src/store';
import { colors } from './src/theme';

function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    async function initialize() {
      try {
        await checkAuth();
      } catch (error) {
        console.warn('Auth check failed:', error);
      } finally {
        setIsInitializing(false);
      }
    }
    
    initialize();
  }, []);
  
  if (isInitializing || isLoading) {
    return <LoadingScreen message="Loading VERGO..." />;
  }
  
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={styles.container}>
        <AppContent />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
