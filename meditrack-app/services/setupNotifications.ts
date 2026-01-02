import notifee, { AndroidImportance } from '@notifee/react-native';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ensureAndroidExactAlarmPermission, ensureAndroidNotificationsAuthorized } from './androidAlarmPermissions';

let isNotificationSystemInitialized = false;

export const ensureNotificationSystemInitialized = async (): Promise<boolean> => {
  if (isNotificationSystemInitialized) {
    return true;
  }

  try {
    await initNotifications();
    isNotificationSystemInitialized = true;
    console.log('[SetupNotifications] Notification system initialized successfully');
    return true;
  } catch (error) {
    console.error('[SetupNotifications] Failed to initialize notification system:', error);
    return false;
  }
};

export const initNotifications = async () => {
  if (Platform.OS === 'android') {
    await ensureAndroidNotificationsAuthorized();
    await ensureAndroidExactAlarmPermission();

    // High priority channel for regular medication alarms
    await Notifications.setNotificationChannelAsync('med_alarm', {
      name: 'Medication Reminders',
      description: 'Reminders for scheduled medications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'med_alarm.wav',
      vibrationPattern: [250, 250, 250, 250],
      enableLights: true,
      lightColor: '#4F46E5',
      showBadge: true,
    });

    // Critical channel for important medications
    await Notifications.setNotificationChannelAsync('med_critical', {
      name: 'Critical Medication Alarms',
      description: 'High priority medication alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'med_critical.wav',
      vibrationPattern: [500, 250, 500, 250, 500, 250],
      enableLights: true,
      lightColor: '#DC2626',
      showBadge: true,
      bypassDnd: true, // Attempts to bypass Do Not Disturb (may require user permission)
    });

    await notifee.createChannel({
      id: 'med_alarm',
      name: 'Medication Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'med_alarm',
      vibration: true,
      vibrationPattern: [250, 250, 250, 250],
      lights: true,
      lightColor: '#4F46E5',
    });

    await notifee.createChannel({
      id: 'med_critical',
      name: 'Critical Medication Alarms',
      importance: AndroidImportance.HIGH,
      sound: 'med_critical',
      vibration: true,
      vibrationPattern: [500, 250, 500, 250, 500, 250],
      lights: true,
      lightColor: '#DC2626',
      bypassDnd: true,
    });
  }

  // Enhanced notification actions for dose management
  // Regular medication category with essential actions
  await Notifications.setNotificationCategoryAsync('MED_DOSE', [
    {
      identifier: 'TAKEN',
      buttonTitle: 'Taken',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'SNOOZE_5',
      buttonTitle: 'Snooze',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'SKIP',
      buttonTitle: 'Skip',
      options: {
        opensAppToForeground: false,
        isDestructive: true,
        isAuthenticationRequired: false,
      },
    },
  ]);

  // Category for critical medications with enhanced snooze options
  await Notifications.setNotificationCategoryAsync('MED_CRITICAL', [
    {
      identifier: 'TAKEN',
      buttonTitle: 'Taken',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'SNOOZE_5',
      buttonTitle: '5min',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'SNOOZE_15',
      buttonTitle: '15min',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  // iOS: Request permission for critical alerts if available
  if (Platform.OS === 'ios') {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: false, // Set to true when you have Apple entitlement
          allowProvisional: false,
        },
      });
      console.log('[Notifications] iOS permission status:', status);
    } catch (error) {
      console.warn('[Notifications] Failed to request iOS permissions:', error);
    }
  }
};