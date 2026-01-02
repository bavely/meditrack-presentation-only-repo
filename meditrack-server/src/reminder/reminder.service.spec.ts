import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationService } from '../medication/medication.service';
import { UserService } from '../user/user.service';
import { NotificationsService } from '../notification/notifications.service';
import { RepeatPattern, NotificationChannel, DoseActionType } from '@prisma/client';

const createLoggerMock = () =>
  ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  }) as unknown as Logger;

describe('ReminderService', () => {
  let service: ReminderService;

  beforeEach(async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderService,
        PrismaService,
        { provide: MedicationService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: Logger, useValue: createLoggerMock() },
      ],
    }).compile();

    service = module.get<ReminderService>(ReminderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('computes reminder times for daily pattern', () => {
    const scheduledAt = new Date('2025-01-01T12:00:00Z');
    const times = service.computeReminderTimes(
      scheduledAt,
      RepeatPattern.DAILY,
    );
    expect(times.map((t) => t.toISOString())).toEqual([
      '2025-01-01T11:00:00.000Z',
      '2025-01-01T11:30:00.000Z',
      '2025-01-01T12:00:00.000Z',
    ]);
  });

  it('computes reminder times for hourly pattern', () => {
    const scheduledAt = new Date('2025-01-01T12:00:00Z');
    const times = service.computeReminderTimes(
      scheduledAt,
      RepeatPattern.HOURLY,
    );
    expect(times.map((t) => t.toISOString())).toEqual([
      '2025-01-01T11:30:00.000Z',
      '2025-01-01T11:50:00.000Z',
      '2025-01-01T12:00:00.000Z',
    ]);
  });

  it('computes reminder times for weekly pattern', () => {
    const scheduledAt = new Date('2025-01-01T12:00:00Z');
    const times = service.computeReminderTimes(
      scheduledAt,
      RepeatPattern.WEEKLY,
    );
    expect(times.map((t) => t.toISOString())).toEqual([
      '2024-12-31T12:00:00.000Z',
      '2025-01-01T11:00:00.000Z',
      '2025-01-01T11:30:00.000Z',
      '2025-01-01T12:00:00.000Z',
    ]);
  });

  it('computes reminder times for monthly pattern', () => {
    const scheduledAt = new Date('2025-01-15T12:00:00Z');
    const times = service.computeReminderTimes(
      scheduledAt,
      RepeatPattern.MONTHLY,
    );
    expect(times.map((t) => t.toISOString())).toEqual([
      '2025-01-13T12:00:00.000Z',
      '2025-01-14T12:00:00.000Z',
      '2025-01-15T11:00:00.000Z',
      '2025-01-15T11:30:00.000Z',
      '2025-01-15T12:00:00.000Z',
    ]);
  });

  it('computes reminder times for custom pattern', () => {
    const scheduledAt = new Date('2025-02-01T12:00:00Z');
    const times = service.computeReminderTimes(
      scheduledAt,
      RepeatPattern.CUSTOM,
    );
    expect(times.map((t) => t.toISOString())).toEqual([
      '2025-01-31T12:00:00.000Z',
      '2025-02-01T11:00:00.000Z',
      '2025-02-01T11:30:00.000Z',
      '2025-02-01T12:00:00.000Z',
    ]);
  });

  it('sends notifications with payload metadata', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T11:00:00Z'));

    const prisma = {
      doseTime: { findMany: jest.fn() },
      doseAction: {
        create: jest.fn().mockResolvedValue({ id: 'a1', actionType: DoseActionType.PENDING }),
        update: jest.fn(),
      },
      notificationLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      jobState: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
    } as any;

    const notifications = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    } as any;

    const service = new ReminderService(
      prisma,
      notifications,
      createLoggerMock(),
    );

    const dt = {
      id: 'dt1',
      scheduledAt: new Date('2025-01-01T12:00:00Z'),
      schedule: {
        repeatPattern: RepeatPattern.DAILY,
        medication: {
          id: 'med1',
          name: 'Med',
          userId: 'user1',
          isArchived: false,
          isReminderOn: true,
          user: { id: 'user1', prefersPush: true, prefersSms: false },
        },
      },
      doseActions: [],
    };

    prisma.doseTime.findMany.mockResolvedValue([dt]);

    await service.generateReminders();

    expect(notifications.sendNotification).toHaveBeenCalledWith(
      NotificationChannel.PUSH,
      dt.schedule.medication.user,
      expect.any(String),
      {
        doseTimeId: dt.id,
        medicationId: dt.schedule.medication.id,
        scheduledTime: dt.scheduledAt.toISOString(),
      },
    );

    jest.useRealTimers();
  });

  it('skips reminders for archived or disabled medications', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2025-01-01T11:00:00Z'));

    const prisma = {
      doseTime: { findMany: jest.fn() },
      doseAction: {
        create: jest.fn(),
        update: jest.fn(),
      },
      notificationLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      jobState: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
    } as any;

    const notifications = {
      sendNotification: jest.fn(),
    } as any;

    const service = new ReminderService(
      prisma,
      notifications,
      createLoggerMock(),
    );

    const dt = {
      id: 'dt1',
      scheduledAt: new Date('2025-01-01T12:00:00Z'),
      schedule: {
        repeatPattern: RepeatPattern.DAILY,
        medication: {
          id: 'med1',
          name: 'Med',
          userId: 'user1',
          isArchived: false,
          isReminderOn: false,
          user: { id: 'user1', prefersPush: true, prefersSms: true },
        },
      },
      doseActions: [],
    };

    prisma.doseTime.findMany.mockResolvedValue([dt]);

    await service.generateReminders();

    expect(prisma.doseTime.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schedule: expect.objectContaining({
            medication: expect.objectContaining({
              isArchived: false,
              isReminderOn: true,
            }),
          }),
        }),
      }),
    );
    expect(prisma.doseAction.create).not.toHaveBeenCalled();
    expect(notifications.sendNotification).not.toHaveBeenCalled();
    expect(prisma.notificationLog.create).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('logs missed reminders when offline', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2025-01-01T12:10:00Z'));

    const prisma = {
      doseTime: { findMany: jest.fn() },
      doseAction: {
        create: jest.fn().mockResolvedValue({
          id: 'a1',
          actionType: DoseActionType.PENDING,
        }),
        update: jest.fn(),
      },
      notificationLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      jobState: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            jobName: 'generateReminders',
            lastRunAt: new Date('2025-01-01T10:00:00Z'),
          }),
        upsert: jest.fn(),
      },
    } as any;

    const service = new ReminderService(
      prisma,
      {
        sendNotification: jest.fn(),
      } as any,
      createLoggerMock(),
    );

    const dt = {
      id: 'dt1',
      scheduledAt: new Date('2025-01-01T12:00:00Z'),
      schedule: {
        repeatPattern: RepeatPattern.DAILY,
        medication: {
          id: 'med1',
          name: 'Med',
          userId: 'user1',
          isArchived: false,
          isReminderOn: true,
          user: { id: 'user1', prefersPush: true, prefersSms: false },
        },
      },
      doseActions: [],
    };

    prisma.doseTime.findMany.mockResolvedValue([dt]);

    await service.generateReminders();

    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1',
          medicationId: 'med1',
          doseTimeId: 'dt1',
          channel: NotificationChannel.PUSH,
          successful: false,
          errorMessage: 'MISSED',
        }),
      }),
    );

    jest.useRealTimers();
  });

  it('skips duplicate notifications within a minute', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2025-01-01T11:00:00Z'));

    const prisma = {
      doseTime: { findMany: jest.fn() },
      doseAction: {
        create: jest.fn().mockResolvedValue({
          id: 'a1',
          actionType: DoseActionType.PENDING,
        }),
        update: jest.fn(),
      },
      notificationLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue({ id: 'log1' }),
      },
      jobState: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
    } as any;

    const notifications = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    } as any;

    const service = new ReminderService(
      prisma,
      notifications,
      createLoggerMock(),
    );

    const dt = {
      id: 'dt1',
      scheduledAt: new Date('2025-01-01T12:00:00Z'),
      schedule: {
        repeatPattern: RepeatPattern.DAILY,
        medication: {
          id: 'med1',
          name: 'Med',
          userId: 'user1',
          isArchived: false,
          isReminderOn: true,
          user: { id: 'user1', prefersPush: true, prefersSms: false },
        },
      },
      doseActions: [],
    };

    prisma.doseTime.findMany.mockResolvedValue([dt]);

    await service.generateReminders();

    expect(notifications.sendNotification).not.toHaveBeenCalled();
    expect(prisma.notificationLog.create).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
