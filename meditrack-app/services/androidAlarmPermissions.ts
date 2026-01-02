import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
  NotificationSettings,
} from '@notifee/react-native';

const EXACT_ALARM_ACTION = 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM';
const IGNORE_BATTERY_OPTIMIZATIONS_ACTION =
  'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS';

const getPackageId = () =>
  Constants.android?.package || Constants.expoConfig?.android?.package || '';

const isAndroid = Platform.OS === 'android';

export const ensureAndroidNotificationsAuthorized = async (): Promise<NotificationSettings | null> => {
  if (!isAndroid) {
    return null;
  }

  const settings = await notifee.getNotificationSettings();

  if (
    settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED &&
    settings.authorizationStatus !== AuthorizationStatus.PROVISIONAL
  ) {
    const updated = await notifee.requestPermission({
      android: {
        alert: true,
        sound: true,
        badge: true,
      },
    });
    return updated;
  }

  return settings;
};

export const ensureAndroidExactAlarmPermission = async (): Promise<boolean> => {
  if (!isAndroid) {
    return true;
  }

  const settings = await notifee.getNotificationSettings();
  if (settings.android?.alarm === AndroidNotificationSetting.ENABLED) {
    return true;
  }

  const requested = await notifee.requestPermission({
    android: {
      alarm: true,
    },
  });

  if (requested.android?.alarm === AndroidNotificationSetting.ENABLED) {
    return true;
  }

  await launchSettingsIntent(EXACT_ALARM_ACTION);
  return false;
};

export const openBatteryOptimizationSettings = async (): Promise<void> => {
  if (!isAndroid) {
    return;
  }
  await launchSettingsIntent(IGNORE_BATTERY_OPTIMIZATIONS_ACTION);
};

const launchSettingsIntent = async (action: string) => {
  if (!isAndroid) {
    return;
  }

  const appPackage = getPackageId();
  const data = appPackage ? 'package:' + appPackage : undefined;

  try {
    await IntentLauncher.startActivityAsync(action, data ? { data } : undefined);
  } catch (error) {
    console.warn('[AndroidAlarmPermissions] Failed to launch settings intent', {
      action,
      error,
    });
  }
};
