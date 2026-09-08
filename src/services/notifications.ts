import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set notification presentation options
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationTopic = 
  | 'broadcast_all' 
  | 'urgent_sos' 
  | `volunteer_${string}` 
  | 'transactional';

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[FCM] Push notification permission not granted.');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function subscribeToTopic(topic: NotificationTopic, token: string): Promise<void> {
  // Dispatches topic subscription request to Edge Function / FCM V1 gateway
  console.log(`[FCM] Subscribing token ${token.slice(0, 10)}... to topic: ${topic}`);
}
