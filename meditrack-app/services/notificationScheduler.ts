import { useMedicationStore } from '@/store/medication-store';
import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { isCriticalMedication } from '@/utils/isCriticalMedication';
import { getDoseTimesByDateRange } from './scheduleService';
import { ensureNotificationSystemInitialized } from './setupNotifications';

export type ScheduleDoseAlarmInput = {
  doseTimeId: string;
  scheduledTime: string;
  medicationId?: string;
  snoozeCount?: number;
  isCritical?: boolean;
};

type NormalizedScheduledNotification = {
  identifier: string;
  doseTimeId?: string;
  triggerTime?: number;
};


export const scheduleDoseAlarm = async ({
  doseTimeId,
  scheduledTime,
  medicationId,
  snoozeCount = 0,
  isCritical = false,
}: ScheduleDoseAlarmInput) => {

  // Ensure notification system is initialized first
  const isInitialized = await ensureNotificationSystemInitialized();
  if (!isInitialized) {
    console.error('[scheduleDoseAlarm] Notification system not initialized');
    return null;
  }

  // Validate inputs
  if (!doseTimeId || !scheduledTime) {
    console.warn('[scheduleDoseAlarm] Missing required parameters:', { doseTimeId, scheduledTime });
    return null;
  }

  const date = new Date(scheduledTime);
  
  // Validate the date is valid and in the future
  if (isNaN(date.getTime())) {
    console.warn('[scheduleDoseAlarm] Invalid date:', scheduledTime);
    return null;
  }
  
  if (date.getTime() <= Date.now()) {
    console.warn('[scheduleDoseAlarm] Date is in the past:', scheduledTime);
    return null;
  }
  const medications = useMedicationStore
    .getState()
    .medications.filter((med) => med.id === medicationId);
  
  const medication = medications[0];
  const cancelExistingAndroidTriggerNotification = async (context: string) => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await notifee.cancelTriggerNotification(doseTimeId);
      console.log(
        '[scheduleDoseAlarm] Cancelled precise Android trigger for dose ' +
          doseTimeId +
          ' (' +
          context +
          ')'
      );
    } catch (cancelError) {
      const cancelErrorMessage = (cancelError as any)?.message || cancelError;
      console.log(
        '[scheduleDoseAlarm] No existing precise trigger to cancel for dose ' +
          doseTimeId +
          ' (' +
          context +
          ')',
        cancelErrorMessage
      );
    }
  };

  if (!medication) {
    await cancelExistingAndroidTriggerNotification('medication missing');
    console.log(
      '[scheduleDoseAlarm] Skipping dose ' +
        doseTimeId +
        ': medication ' +
        (medicationId || 'unknown') +
        ' not found'
    );
    return null;
  }

  const isArchived = medication.isArchived === true || (medication as any)?.archived === true;
  if (isArchived) {
    await cancelExistingAndroidTriggerNotification('medication archived');
    console.log(
      '[scheduleDoseAlarm] Skipping dose ' +
        doseTimeId +
        ' for medication ' +
        (medication.name || medicationId || 'unknown') +
        ' because it is archived'
    );
    return null;
  }

  if (medication.isReminderOn === false) {
    await cancelExistingAndroidTriggerNotification('reminders disabled');
    console.log(
      '[scheduleDoseAlarm] Skipping dose ' +
        doseTimeId +
        ' for medication ' +
        (medication.name || medicationId || 'unknown') +
        ' because reminders are disabled'
    );
    return null;
  }

  const medicationName = medication?.name || 'Your medication';
  const dosage = medication?.strength || '';
  const instructions = medication?.instructions || '';

  // Format time for display
  const formattedTime = dayjs(scheduledTime).format('h:mm A');
  
  // Create HIPAA-safe notification content for lock screen
  // Keep medication names generic for privacy
  const safeTitle = isCritical ? 'Important Medication Reminder' : 'Medication Reminder';
  const safeBody = 'Scheduled for ' + formattedTime + ' - Tap to view details';
  
  // Full details are available in the app when opened
  const detailedTitle = medicationName + ' - ' + formattedTime;
  const detailedBody = dosage
    ? 'Time to take ' + dosage + (instructions ? ' - ' + instructions : '')
    : 'Time to take your medication' + (instructions ? ' - ' + instructions : '');

  const notificationData = {
    doseTimeId,
    scheduledTime,
    medicationId,
    snoozeCount,
    medicationName,
    dosage,
    instructions,
    color: medication?.color,
    isCritical,
    // Include detailed content for in-app display
    detailedTitle,
    detailedBody,
  };

  const notifeeData = Object.entries(notificationData).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    acc[key] = String(value);
    return acc;
  }, {});

  // Platform-specific sound and configuration
  const soundFile = isCritical ? 'med_critical.wav' : 'med_alarm.wav';
  
  try {
    if (Platform.OS === 'android') {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      const channelId = isCritical ? 'med_critical' : 'med_alarm';
      const androidActions = isCritical
        ? [
            { title: 'Taken', pressAction: { id: 'TAKEN' } },
            { title: '5min', pressAction: { id: 'SNOOZE_5' } },
            { title: '15min', pressAction: { id: 'SNOOZE_15' } },
          ]
        : [
            { title: 'Taken', pressAction: { id: 'TAKEN' } },
            { title: 'Snooze', pressAction: { id: 'SNOOZE_5' } },
            { title: 'Skip', pressAction: { id: 'SKIP' }, destructive: true },
          ];

      await cancelExistingAndroidTriggerNotification('before scheduling');

      const notificationId = await notifee.createTriggerNotification(
        {
          id: doseTimeId,
          title: safeTitle,
          body: safeBody,
          data: notifeeData,
          android: {
            channelId,
            sound: isCritical ? 'med_critical' : 'med_alarm',
            importance: AndroidImportance.HIGH,
            color: isCritical ? '#DC2626' : '#4F46E5',
            pressAction: { id: 'default' },
            actions: androidActions,
            autoCancel: !isCritical,
            ongoing: isCritical,
          },
        },
        trigger
      );

      console.log('[scheduleDoseAlarm] Scheduled precise Android notification ' + notificationId + ' for dose ' + doseTimeId + ' at ' + scheduledTime);
      return notificationId;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: safeTitle,
        body: safeBody,
        data: notifeeData,
        sound: soundFile,
        categoryIdentifier: isCritical ? 'MED_CRITICAL' : 'MED_DOSE',
        priority: Notifications.AndroidNotificationPriority.MAX,
        badge: 1,
        
        // iOS-specific configurations
        ...(Platform.OS === 'ios' && {
          subtitle: formattedTime,
          // iOS critical alert settings (requires entitlement)
          ...(isCritical && {
            interruptionLevel: 'timeSensitive', // Use 'critical' when entitlement is approved
            relevanceScore: 1.0,
          }),
        }),
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(scheduledTime),
        channelId: isCritical ? 'med_critical' : 'med_alarm',
      },
    });

    console.log('[scheduleDoseAlarm] Scheduled notification ' + notificationId + ' for dose ' + doseTimeId + ' at ' + scheduledTime);
    return notificationId;
  } catch (error) {
    console.error('[scheduleDoseAlarm] Failed to schedule notification:', error);
    return null;
  }
};

// Debug helper
// Debug helper function to check scheduled notifications
export const debugScheduledNotifications = async () => {
  try {
    if (Platform.OS === 'android') {
      const notifications = await notifee.getTriggerNotifications();
      console.log('[Debug] Found ' + notifications.length + ' scheduled Android trigger notifications:');

      notifications.forEach((item, index) => {
        const data: any = item.notification.data || {};
        const triggerTimestamp =
          item.trigger && item.trigger.type === TriggerType.TIMESTAMP
            ? new Date(item.trigger.timestamp).toISOString()
            : 'Unknown';

        console.log('  ' + (index + 1) + '. Dose ' + (data.doseTimeId || 'unknown') + ' - ' + (item.notification.title || ''));
        console.log('     Scheduled: ' + triggerTimestamp);
        console.log('     Channel: ' + (item.notification.android?.channelId || 'default'));
      });

      const settings = await notifee.getNotificationSettings();
      console.log('[Debug] Android notification settings:', settings);

      return notifications;
    }

    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[Debug] Found ' + notifications.length + ' scheduled notifications:');
    
    notifications.forEach((notification, index) => {
      const data = notification.content.data as any;
      const triggerDate =
        notification.trigger && 'timestamp' in notification.trigger
          ? new Date(Number((notification?.trigger as { timestamp?: unknown })?.timestamp) * 1000).toISOString()
          : notification.trigger && 'date' in notification.trigger
          ? new Date(notification.trigger.date).toISOString()
          : 'Unknown';
      
      console.log('  ' + (index + 1) + '. Dose ' + data.doseTimeId + ' - ' + notification.content.title);
      console.log('     Scheduled: ' + triggerDate);
      console.log('     Sound: ' + notification.content.sound);
      console.log('     Category: ' + notification.content.categoryIdentifier);
      console.log('     Channel: ' + ((notification.trigger as any)?.channelId || 'default'));
    });
    
    // Also check permissions
    const { status } = await Notifications.getPermissionsAsync();
    console.log('[Debug] Notification permissions:', status);
    
    return notifications;
  } catch (error) {
    console.warn('[Debug] Failed to get scheduled notifications', error);
    return [];
  }
};

// Test function to schedule a test notification 
export const testNotificationSound = async (isCritical: boolean = false) => {
  try {
    const isInitialized = await ensureNotificationSystemInitialized();
    if (!isInitialized) {
      console.error('[testNotificationSound] Notification system not initialized');
      return null;
    }

    const testTime = new Date(Date.now() + 5000); // 5 seconds from now
    const soundFile = isCritical ? 'med_critical.wav' : 'med_alarm.wav';
    
    if (Platform.OS === 'android') {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: testTime.getTime(),
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      const channelId = isCritical ? 'med_critical' : 'med_alarm';

      const notificationId = await notifee.createTriggerNotification(
        {
          id: 'test-' + channelId,
          title: isCritical ? 'Test Critical Notification' : 'Test Regular Notification',
          body: 'This is a test notification to verify sound playback',
          android: {
            channelId,
            sound: isCritical ? 'med_critical' : 'med_alarm',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            autoCancel: true,
          },
        },
        trigger
      );

      console.log('[testNotificationSound] Scheduled Android test notification ' + notificationId + ' for ' + testTime.toISOString());
      return notificationId;
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: (isCritical ? 'Test Critical Notification' : 'Test Regular Notification'),
        body: 'This is a test notification to verify sound playback',
        sound: soundFile,
        categoryIdentifier: isCritical ? 'MED_CRITICAL' : 'MED_DOSE',
        priority: Notifications.AndroidNotificationPriority.MAX,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: testTime,
        channelId: isCritical ? 'med_critical' : 'med_alarm',
      },
    });

    console.log('[testNotificationSound] Scheduled test notification ' + notificationId + ' for ' + testTime.toISOString());
    return notificationId;
  } catch (error) {
    console.error('[testNotificationSound] Failed to schedule test notification:', error);
    return null;
  }
};

export const scheduleUpcomingDoseAlarms = async () => {
  // Ensure notification system is initialized
  const isInitialized = await ensureNotificationSystemInitialized();
  if (!isInitialized) {
    console.error('[scheduleUpcomingDoseAlarms] Cannot schedule alarms - notification system not initialized');
    return;
  }

  let existing: NormalizedScheduledNotification[] = [];
  try {
    if (Platform.OS === 'android') {
      const triggerNotifications = await notifee.getTriggerNotifications();
      existing = triggerNotifications.map((item) => {
        const data: any = item.notification.data || {};
        const isTimestamp = item.trigger && item.trigger.type === TriggerType.TIMESTAMP;
        return {
          identifier: item.notification.id || '',
          doseTimeId: data.doseTimeId,
          triggerTime: isTimestamp ? (item.trigger as TimestampTrigger).timestamp : undefined,
        } as NormalizedScheduledNotification;
      });
    } else {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      existing = scheduled.map((notification) => {
        const data: any = notification.content.data || {};
        const trigger: any = notification.trigger;
        let triggerTime: number | undefined;

        if (trigger && typeof trigger === 'object') {
          if ('date' in trigger) {
            triggerTime = new Date(trigger.date).getTime();
          } else if ('timestamp' in trigger) {
            const ts = Number(trigger.timestamp);
            triggerTime = isNaN(ts) ? undefined : ts * 1000;
          }
        }

        return {
          identifier: notification.identifier,
          doseTimeId: data.doseTimeId,
          triggerTime,
        } as NormalizedScheduledNotification;
      });
    }
  } catch (error) {
    console.warn('Failed to fetch scheduled notifications', error);
  }

  console.log('[Scheduling] Currently ' + existing.length + ' scheduled notifications');

  const existingByDose: Record<string, NormalizedScheduledNotification> = {};
  existing.forEach((item) => {
    if (item.doseTimeId) {
      existingByDose[item.doseTimeId] = item;
    }
  });

  const startDate = dayjs().format('YYYY-MM-DD');
  const endDate = dayjs().add(7, 'day').format('YYYY-MM-DD');
  const res = await getDoseTimesByDateRange(startDate, endDate);
  console.log('[Scheduling] Fetched ' + JSON.stringify(res?.data?.length) + ' dose times between ' + startDate + ' and ' + endDate);
  try {
    const doseTimes = res?.data ?? [];

    console.log('[Scheduling] Scheduling notifications for ' + doseTimes.length + ' dose times between ' + startDate + ' and ' + endDate);

    let pendingCount = existing.length;

    const medications = useMedicationStore.getState().medications;
    let scheduledCount = 0;
    let skippedCount = 0;
    let keptCount = 0;

    for (const dose of doseTimes) {
      if (Platform.OS === 'ios' && pendingCount >= 64) {
        console.warn('[Scheduling] Reached iOS notification limit (64), stopping');
        break;
      }

      const { id, scheduledAt, doseActions } = dose;
      const medicationId = doseActions[0]?.medicationId;
      const snoozedUntil = doseActions[0]?.snoozedUntil;
      const nextTrigger = snoozedUntil || scheduledAt;

      const actionType = doseActions[0]?.actionType?.toLowerCase();
      const isPending = !actionType || actionType === 'pending';

      const bufferTime = 30 * 1000; // 30 seconds in milliseconds
      const isInFuture = new Date(nextTrigger).getTime() > Date.now() + bufferTime;

      console.log('[Scheduling] Dose ' + id + ': nextTrigger=' + nextTrigger + ', action=' + actionType + ', isPending=' + isPending + ', isInFuture=' + isInFuture);

      const existingNotification = existingByDose[id];
      const existingTime = existingNotification ? existingNotification.triggerTime : undefined;
      const targetTime = new Date(nextTrigger).getTime();

      const cancelExistingNotification = async (reason: string) => {
        if (existingNotification && existingNotification.identifier) {
          try {
            if (Platform.OS === 'android') {
              await notifee.cancelTriggerNotification(existingNotification.identifier);
            } else {
              await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
            }
            pendingCount--;
            console.log('[Scheduling] Cancelled existing notification for dose ' + id + ' (' + reason + ')');
          } catch (cancelError) {
            console.warn('[Scheduling] Failed to cancel existing notification for dose ' + id, cancelError);
          }
        }
      };

      if (isInFuture && isPending) {
        const medication = medications.find((med) => med.id === medicationId);

        if (!medication) {
          await cancelExistingNotification('medication missing');
          skippedCount++;
          console.log('[Scheduling] Skipping dose ' + id + ': medication ' + (medicationId || 'unknown') + ' not found');
          continue;
        }

        const isArchived = medication.isArchived === true || (medication as any)?.archived === true;
        if (isArchived) {
          await cancelExistingNotification('medication archived');
          skippedCount++;
          console.log('[Scheduling] Skipping dose ' + id + ' for medication ' + medication.name + ' because it is archived');
          continue;
        }

        if (medication.isReminderOn === false) {
          await cancelExistingNotification('reminders disabled');
          skippedCount++;
          console.log('[Scheduling] Skipping dose ' + id + ' for medication ' + medication.name + ' because reminders are disabled');
          continue;
        }

        const critical = isCriticalMedication(medication);

        if (existingNotification && existingTime === targetTime) {
          keptCount++;
          console.log('[Scheduling] Keeping existing notification for dose ' + id);
        } else {
          if (existingNotification && existingNotification.identifier) {
            await cancelExistingNotification('rescheduling');
          }

          console.log('[Scheduling] Scheduling dose ' + id + ' for medication ' + (medication?.name || 'unknown') + ', critical=' + critical);

          try {
            const notificationId = await scheduleDoseAlarm({
              doseTimeId: id,
              scheduledTime: nextTrigger,
              medicationId,
              snoozeCount: doseActions[0]?.snoozeCount || 0,
              isCritical: critical,
            });
            
            if (notificationId) {
              pendingCount++;
              scheduledCount++;
              console.log('[Scheduling] Successfully scheduled notification ' + notificationId + ' for dose ' + id);
            } else {
              console.warn('[Scheduling] Failed to schedule notification for dose ' + id + ' - no notification ID returned');
            }
          } catch (scheduleError) {
            console.error('[Scheduling] Error scheduling notification for dose ' + id + ':', scheduleError);
          }
        }
      } else {
        if (existingNotification && existingNotification.identifier) {
          await cancelExistingNotification('dose no longer pending or in future');
        }
        skippedCount++;
        console.log('[Scheduling] Skipping dose ' + id + ': future=' + isInFuture + ', pending=' + isPending);
      }
    }

    console.log('[Scheduling] Completed scheduling for ' + doseTimes.length + ' dose times');
    console.log('[Scheduling] Scheduled ' + scheduledCount + ' notifications, skipped ' + skippedCount + ' doses, kept ' + keptCount);

    // Debug: Show all scheduled notifications
    if (scheduledCount > 0) {
      await debugScheduledNotifications();
    }
  } catch (error) {
    console.warn('Failed to schedule dose alarms', error);
  }
};


