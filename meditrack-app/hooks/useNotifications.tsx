// useNotifications.ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { JSX, useCallback, useEffect, useRef, useState } from 'react';

import AlarmModal from '@/components/AlarmModal';
import notifee, { EventType } from '@notifee/react-native';
import { SNOOZE_OPTIONS, SNOOZE_THRESHOLD } from '@/constants/notifications';
import { getDoseActionsByDoseTimeId, updateDoseAction } from '@/services/doseActionService';
import { scheduleDoseAlarm } from '@/services/notificationScheduler';
import { sendMissedDoseAlert } from '@/services/notificationService';
import { isCriticalMedication } from '@/utils/isCriticalMedication';
import dayjs from 'dayjs';
import { router } from 'expo-router';

// Foreground behavior (show alert, play sound, set badge)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  // Ask permission with Android 13+ specific config
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowDisplayInCarPlay: true,
      allowCriticalAlerts: false,
      allowProvisional: false,
    },
    android: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  
  if (status !== 'granted') {
    console.warn('Notification permissions not granted:', status);
    return null;
  }

  // Important: pass projectId
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn('Missing EAS project ID for push notifications');
    return null;
  }

  let token: string | null = null;
  try {
    token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
  } catch (error) {
    console.warn('Failed to get Expo push token', error);
    return null;
  }

  // Android channel for heads-up notifications
  if (Device.osName === 'Android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

const normalizeNotificationPayload = (raw: any) => {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse notification data', error);
      return {};
    }
  }

  return raw;
};

export async function unregisterForPushAsync(): Promise<void> {
  try {
    await Notifications.unregisterForNotificationsAsync();
    // If your backend stores push tokens, remove the token there as well
    // await api.deletePushToken();
  } catch (error) {
    console.warn('Failed to unregister push notifications', error);
  }
}

export function useNotifications(
  onOpen: (data: any) => any,
  onReceive?: (data: any) => void,
): JSX.Element | null {
  const responseListener = useRef<any>(null);
  const receiveListener = useRef<any>(null);
  const notifeeListener = useRef<(() => void) | null>(null);
  const [alarmData, setAlarmData] = useState<{ 
    doseActionId?: string;
    doseTimeId: string; 
    medicationId?: string; 
    snoozeCount?: number;
    medicationName?: string;
    dosage?: string;
    instructions?: string;
    color?: string;
    scheduledTime?: string;
  } | null>(null);

  const handleReminderPayload = useCallback(async (raw: any) => {
    const data = normalizeNotificationPayload(raw);
    onReceive?.(data);

    const {
      doseTimeId,
      scheduledTime,
      medicationId,
      snoozeCount: rawSnoozeCount = 0,
      medicationName,
      dosage,
      instructions,
      color,
    } = data || {};

    const snoozeCount = typeof rawSnoozeCount === 'string' ? Number(rawSnoozeCount) || 0 : rawSnoozeCount ?? 0;
    const normalizedScheduledTime = typeof scheduledTime === 'string' ? scheduledTime : String(scheduledTime || '');

    if (doseTimeId && normalizedScheduledTime && medicationId) {
      const scheduledDate = dayjs(normalizedScheduledTime);
      if (scheduledDate.isAfter(dayjs())) {
        scheduleDoseAlarm({
          doseTimeId,
          scheduledTime: normalizedScheduledTime,
          medicationId,
          snoozeCount,
        });
      }
    }

    if (doseTimeId) {
      try {
        const res = await getDoseActionsByDoseTimeId(doseTimeId);
        if (res?.data?.length) {
          setAlarmData({
            doseActionId: res.data[0].id,
            doseTimeId,
            medicationId,
            snoozeCount,
            medicationName,
            dosage,
            instructions,
            color,
            scheduledTime: normalizedScheduledTime || undefined,
          });
        }
      } catch (error) {
        console.log('Failed to fetch dose action by doseTimeId', JSON.stringify(error));
      }
    }
  }, [onReceive]);

  const handleNotificationOpen = useCallback((raw: any) => {
    const data = normalizeNotificationPayload(raw);
    console.log('Notification opened with data:', data);
    onOpen?.(data);
    void handleReminderPayload(data);
    const { doseTimeId, medicationId, scheduledTime } = data || {};
    const normalizedScheduledTime = typeof scheduledTime === 'string' ? scheduledTime : String(scheduledTime || '');
    if (doseTimeId && medicationId && normalizedScheduledTime) {
      const path = '/(tabs)?medicationId=' + encodeURIComponent(String(medicationId)) +
        '&doseTimeId=' + encodeURIComponent(String(doseTimeId)) +
        '&scheduledTime=' + encodeURIComponent(normalizedScheduledTime);
      router.push(path as any);
    }
  }, [handleReminderPayload, onOpen]);


  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((resp) => {
        handleNotificationOpen(resp.notification.request.content.data);
      });

    receiveListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        handleReminderPayload(notification.request.content.data);
      });

    if (!notifeeListener.current) {
      notifeeListener.current = notifee.onForegroundEvent(async ({ type, detail }) => {
        if (type === EventType.DELIVERED) {
          await handleReminderPayload(detail.notification?.data);
        } else if (type === EventType.PRESS) {
          handleNotificationOpen(detail.notification?.data);
        } else if (type === EventType.ACTION_PRESS) {
          if (!detail.pressAction || detail.pressAction.id === 'default') {
            handleNotificationOpen(detail.notification?.data);
          }
        }
      });
    }

    (async () => {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification?.notification) {
        const pressActionId = initialNotification.pressAction?.id;
        if (!pressActionId || pressActionId === 'default') {
          handleNotificationOpen(initialNotification.notification.data);
        }
      }
    })();

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = null;
      }
      if (receiveListener.current) {
        Notifications.removeNotificationSubscription(receiveListener.current);
        receiveListener.current = null;
      }
      if (notifeeListener.current) {
        notifeeListener.current?.();
        notifeeListener.current = null;
      }
    };
  }, [handleNotificationOpen, handleReminderPayload]);

  const handleTaken = async () => {
    if (!alarmData?.doseTimeId) {
      setAlarmData(null);
      return;
    }
    try {
      await updateDoseAction({
        id: alarmData.doseActionId,
        actionType: 'TAKEN',
        actionTime: new Date().toISOString(),
        snoozeCount: alarmData.snoozeCount,
      });
    } catch (error) {
      console.warn('Failed to handle taken action', error);
    } finally {
      setAlarmData(null);
    }
  };

  const handleSkip = async () => {
    if (!alarmData?.doseTimeId) {
      setAlarmData(null);
      return;
    }
    try {
      await updateDoseAction({
        id: alarmData.doseActionId,
        actionType: 'SKIPPED',
        actionTime: new Date().toISOString(),
        snoozeCount: alarmData.snoozeCount,
      });
    } catch (error) {
      console.warn('Failed to handle skip action', error);
    } finally {
      setAlarmData(null);
    }
  };

  const handleSnooze = async (minutes?: number) => {
    if (!alarmData?.doseTimeId) {
      setAlarmData(null);
      return;
    }
    
    const snoozeMinutes = minutes || SNOOZE_OPTIONS.SHORT;
    try {
      const snoozedUntil = dayjs().add(snoozeMinutes, 'minute').toISOString();
      const newSnoozeCount = (alarmData.snoozeCount ?? 0) + 1;
      if (newSnoozeCount > SNOOZE_THRESHOLD) {
        await sendMissedDoseAlert(alarmData.doseTimeId);
        await updateDoseAction({
          id: alarmData.doseActionId,
          actionType: 'MISSED',
          actionTime: new Date().toISOString(),
          snoozeCount: newSnoozeCount,
        });
      } else {
        const isCritical = isCriticalMedication({
          name: alarmData.medicationName,
          instructions: alarmData.instructions,
        });

        await scheduleDoseAlarm({
          doseTimeId: alarmData.doseTimeId,
          scheduledTime: snoozedUntil,
          medicationId: alarmData.medicationId,
          snoozeCount: newSnoozeCount,
          isCritical,
        });
        await updateDoseAction({
          id: alarmData.doseActionId,
          actionType: 'SNOOZED',
          snoozedUntil,
          snoozeCount: newSnoozeCount,
        });
      }
    } catch (error) {
      console.warn('Failed to handle snooze action', error);
    } finally {
      setAlarmData(null);
    }
  };

  return (
    <AlarmModal
      visible={!!alarmData}
      onTaken={handleTaken}
      onSkip={handleSkip}
      onSnooze={handleSnooze}
      medicationName={alarmData?.medicationName}
      dosage={alarmData?.dosage}
      instructions={alarmData?.instructions}
      color={alarmData?.color}
      scheduledTime={alarmData?.scheduledTime}
      snoozeCount={alarmData?.snoozeCount}
    />
  );
}
