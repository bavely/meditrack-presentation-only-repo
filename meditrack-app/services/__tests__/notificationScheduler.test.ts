import { beforeEach, describe, expect, it, vi } from 'vitest';

const cancelTriggerNotificationMock = vi.fn();
const createTriggerNotificationMock = vi.fn();
const getTriggerNotificationsMock = vi.fn();
const getDoseTimesByDateRangeMock = vi.fn();
const ensureNotificationSystemInitializedMock = vi.fn();

let medicationStoreState: { medications: any[] } = { medications: [] };

const notificationsModuleMock = {
  scheduleNotificationAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  AndroidNotificationPriority: { MAX: 'max' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
};

vi.mock('react-native', () => ({
  Platform: { OS: 'android', select: (options: any) => options.android },
}));

vi.mock('expo-notifications', () => notificationsModuleMock);

vi.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getTriggerNotifications: getTriggerNotificationsMock,
    cancelTriggerNotification: cancelTriggerNotificationMock,
    createTriggerNotification: createTriggerNotificationMock,
  },
  AndroidImportance: { MAX: 2, HIGH: 1 },
  TriggerType: { TIMESTAMP: 'timestamp' },
}));

vi.mock('../setupNotifications', () => ({
  ensureNotificationSystemInitialized: ensureNotificationSystemInitializedMock,
}));

vi.mock('../scheduleService', () => ({
  getDoseTimesByDateRange: getDoseTimesByDateRangeMock,
}));

vi.mock('@/utils/isCriticalMedication', () => ({
  isCriticalMedication: vi.fn(() => false),
}));

vi.mock('@/store/medication-store', () => ({
  useMedicationStore: {
    getState: vi.fn(() => medicationStoreState),
  },
}));

describe('scheduleUpcomingDoseAlarms', () => {
  beforeEach(() => {
    vi.resetModules();
    getDoseTimesByDateRangeMock.mockReset();
    getTriggerNotificationsMock.mockReset();
    cancelTriggerNotificationMock.mockReset();
    createTriggerNotificationMock.mockReset();
    ensureNotificationSystemInitializedMock.mockReset();
    notificationsModuleMock.scheduleNotificationAsync.mockReset();
    notificationsModuleMock.cancelScheduledNotificationAsync.mockReset();
    notificationsModuleMock.getAllScheduledNotificationsAsync.mockReset();
    notificationsModuleMock.getPermissionsAsync.mockReset();
    cancelTriggerNotificationMock.mockResolvedValue(undefined);
    createTriggerNotificationMock.mockResolvedValue('notification-id');
    ensureNotificationSystemInitializedMock.mockResolvedValue(true);
    medicationStoreState = { medications: [] };
  });

  it('cancels existing notifications when medication reminders are disabled', async () => {
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    medicationStoreState = {
      medications: [
        {
          id: 'med-1',
          name: 'Flagged Med',
          strength: '10mg',
          frequency: 'daily',
          time: '08:00',
          color: '#ffffff',
          icon: 'pill',
          isReminderOn: false,
        },
      ],
    };

    getDoseTimesByDateRangeMock.mockResolvedValue({
      data: [
        {
          id: 'dose-1',
          scheduledAt: futureTime,
          doseActions: [
            {
              medicationId: 'med-1',
              actionType: 'PENDING',
              snoozedUntil: null,
              snoozeCount: 0,
            },
          ],
        },
      ],
    });

    getTriggerNotificationsMock.mockResolvedValue([
      {
        notification: {
          id: 'dose-1',
          data: { doseTimeId: 'dose-1' },
        },
        trigger: { type: 'timestamp', timestamp: new Date(futureTime).getTime() },
      },
    ]);

    const schedulerModule = await import('../notificationScheduler');
    const scheduleDoseAlarmSpy = vi.spyOn(schedulerModule, 'scheduleDoseAlarm');

    await schedulerModule.scheduleUpcomingDoseAlarms();

    expect(cancelTriggerNotificationMock).toHaveBeenCalledTimes(1);
    expect(cancelTriggerNotificationMock).toHaveBeenCalledWith('dose-1');
    expect(scheduleDoseAlarmSpy).not.toHaveBeenCalled();

    scheduleDoseAlarmSpy.mockRestore();
  });

  it('skips scheduling flagged medications and cancels existing trigger alarms', async () => {
    const futureTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    medicationStoreState = {
      medications: [
        {
          id: 'med-flagged',
          name: 'Flagged Med',
          strength: '5mg',
          isReminderOn: false,
        },
      ],
    };

    const schedulerModule = await import('../notificationScheduler');

    const result = await schedulerModule.scheduleDoseAlarm({
      doseTimeId: 'dose-flagged',
      scheduledTime: futureTime,
      medicationId: 'med-flagged',
      snoozeCount: 0,
      isCritical: false,
    });

    expect(result).toBeNull();
    expect(cancelTriggerNotificationMock).toHaveBeenCalledWith('dose-flagged');
    expect(createTriggerNotificationMock).not.toHaveBeenCalled();
    expect(notificationsModuleMock.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
