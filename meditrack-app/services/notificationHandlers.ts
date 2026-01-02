import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';
import notifee, { EventType } from '@notifee/react-native';

import { SNOOZE_THRESHOLD } from '@/constants/notifications';
import { isCriticalMedication } from '@/utils/isCriticalMedication';
import { getDoseActionsByDoseTimeId, updateDoseAction } from './doseActionService';
import { scheduleDoseAlarm } from './notificationScheduler';
import { sendMissedDoseAlert } from './notificationService';

const handleDoseNotificationAction = async (action: string | undefined, data: any) => {
  if (!action || action === Notifications.DEFAULT_ACTION_IDENTIFIER || action === 'default') {
    return;
  }

  const payload = data || {};

  const doseTimeIdRaw = payload.doseTimeId;
  const doseTimeId = typeof doseTimeIdRaw === 'string' ? doseTimeIdRaw : doseTimeIdRaw ? String(doseTimeIdRaw) : undefined;
  const medicationIdRaw = payload.medicationId;
  const medicationId = typeof medicationIdRaw === 'string' ? medicationIdRaw : medicationIdRaw ? String(medicationIdRaw) : undefined;
  const medicationName = typeof payload.medicationName === 'string' ? payload.medicationName : undefined;
  const instructions = typeof payload.instructions === 'string' ? payload.instructions : undefined;
  const isCritical = typeof payload.isCritical === 'string' ? payload.isCritical === 'true' : Boolean(payload.isCritical);
  const snoozeRaw = payload.snoozeCount;
  const currentSnoozeCount = typeof snoozeRaw === 'string' ? Number(snoozeRaw) || 0 : Number.isFinite(snoozeRaw) ? Number(snoozeRaw) : 0;

  console.log('[NotificationHandler] Action received:', action, 'for dose:', doseTimeId);

  if (!doseTimeId) {
    console.warn('[NotificationHandler] No doseTimeId in notification data');
    return;
  }

  try {
    const doseActions = await getDoseActionsByDoseTimeId(doseTimeId);
    const existingAction = doseActions?.data?.[0];

    if (!existingAction) {
      console.warn('[NotificationHandler] No existing dose action found for doseTimeId:', doseTimeId);
      return;
    }

    if (action === 'TAKEN') {
      console.log('[NotificationHandler] Processing TAKEN action');
      await updateDoseAction({
        id: existingAction.id,
        actionType: 'TAKEN',
        actionTime: new Date().toISOString(),
        snoozeCount: currentSnoozeCount,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Taken',
          body: 'Dose recorded successfully',
          sound: false,
          badge: 0,
        },
        trigger: null,
      });

    } else if (action === 'SKIP') {
      console.log('[NotificationHandler] Processing SKIP action');
      await updateDoseAction({
        id: existingAction.id,
        actionType: 'SKIPPED',
        actionTime: new Date().toISOString(),
        snoozeCount: currentSnoozeCount,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Skipped',
          body: 'Dose marked as skipped',
          sound: false,
          badge: 0,
        },
        trigger: null,
      });

    } else if (action === 'SNOOZE_5' || action === 'SNOOZE_15') {
      const snoozeMinutes = action === 'SNOOZE_15' ? 15 : 5;
      const snoozedUntil = dayjs().add(snoozeMinutes, 'minute').toISOString();
      const newSnoozeCount = currentSnoozeCount + 1;

      console.log('[NotificationHandler] Processing ' + action + ' action, snooze count: ' + newSnoozeCount);

      if (newSnoozeCount > SNOOZE_THRESHOLD) {
        console.log('[NotificationHandler] Snooze threshold exceeded, marking as missed');
        await sendMissedDoseAlert(doseTimeId);
        await updateDoseAction({
          id: existingAction.id,
          actionType: 'MISSED',
          actionTime: new Date().toISOString(),
          snoozeCount: newSnoozeCount,
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Medication Missed',
            body: 'Please review your medication schedule',
            sound: false,
            badge: 0,
          },
          trigger: null,
        });

      } else {
        const criticalMedication = isCriticalMedication({
          name: medicationName,
          instructions,
          isCritical,
        });

        console.log('[NotificationHandler] Rescheduling notification for ' + snoozedUntil + ', critical: ' + criticalMedication);

        await scheduleDoseAlarm({
          doseTimeId,
          scheduledTime: snoozedUntil,
          medicationId,
          snoozeCount: newSnoozeCount,
          isCritical: criticalMedication,
        });

        await updateDoseAction({
          id: existingAction.id,
          actionType: 'SNOOZED',
          snoozedUntil,
          snoozeCount: newSnoozeCount,
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Reminder Snoozed',
            body: 'Will remind again in ' + snoozeMinutes + ' minutes',
            sound: false,
            badge: 1,
          },
          trigger: null,
        });
      }
    }
  } catch (error) {
    console.warn('Failed to handle notification response', error);
  }
};

let notifeeForegroundUnsubscribe: (() => void) | null = null;

export const initNotificationHandlers = () => {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data: any = response.notification.request.content.data || {};
    await handleDoseNotificationAction(response.actionIdentifier, data);
  });

  if (!notifeeForegroundUnsubscribe) {
    notifeeForegroundUnsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS) {
        await handleDoseNotificationAction(detail.pressAction?.id, detail.notification?.data);
      }
    });
  }
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    await handleDoseNotificationAction(detail.pressAction?.id, detail.notification?.data);
  }
});

export default initNotificationHandlers;
