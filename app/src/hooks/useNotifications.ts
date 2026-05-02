import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { updateProfile } from '../api/profile';
import { useAuthStore } from '../store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const { session } = useAuthStore();

  useEffect(() => {
    if (!session) return;

    async function setup() {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Create Android notification channel
      await Notifications.setNotificationChannelAsync('revise_reminders', {
        name: 'Revision Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });

      // Get FCM token
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await updateProfile({ fcm_token: fcmToken }).catch(() => undefined);
      }

      // Handle token refresh
      const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
        await updateProfile({ fcm_token: newToken }).catch(() => undefined);
      });

      return unsubscribe;
    }

    const cleanup = setup().catch(() => undefined);
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [session]);
}
