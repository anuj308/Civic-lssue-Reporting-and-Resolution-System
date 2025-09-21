import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';

import { store, persistor, useAppDispatch } from './src/store/store';
import { initializeAuth } from './src/store/slices/authSlice';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';
import LoadingScreen from './src/components/LoadingScreen';

// Check if notifications are enabled
const NOTIFICATIONS_ENABLED = process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';

// Configure notifications only if enabled
if (NOTIFICATIONS_ENABLED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// App content component that has access to store after provider
const AppContent = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state from stored tokens
    console.log('🔧 Initializing auth state from stored tokens...');
    dispatch(initializeAuth());

    // Request notification permissions only if notifications are enabled
    if (NOTIFICATIONS_ENABLED) {
      const requestPermissions = async () => {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('Notification permissions not granted');
          }
        } catch (error) {
          console.warn('Notification setup failed (Expo Go limitation):', error);
        }
      };

      requestPermissions();
    } else {
      console.log('Push notifications disabled in development mode');
    }
  }, [dispatch]);

  return (
    <>
      <AppNavigator />
      <Toast />
    </>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.container}>
              <StatusBar style="auto" />
              <AppContent />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
