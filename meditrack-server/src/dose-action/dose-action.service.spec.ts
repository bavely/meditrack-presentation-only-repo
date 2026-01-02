import { ForbiddenException } from '@nestjs/common';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { DoseActionService } from './dose-action.service';

describe('DoseActionService', () => {
  let service: DoseActionService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      doseTime: { findMany: jest.fn(), create: jest.fn() },
      doseAction: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      medication: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };
    service = new DoseActionService(prisma as any);
  });

  it('returns dose times for the day with related actions', async () => {
    const date = '2024-01-01';
    const start = startOfDay(parseISO(date));
    const end = endOfDay(parseISO(date));

    const doseTimes = [
      { id: 'dt1', scheduledAt: start, doseActions: [{ id: 'da1' }] },
      { id: 'dt2', scheduledAt: end, doseActions: [] },
    ];
    prisma.doseTime.findMany.mockResolvedValue(doseTimes);

    const result = await service.findDoseTimesByDate('user1', date);

    expect(prisma.doseTime.findMany).toHaveBeenCalledWith({
      where: {
        scheduledAt: { gte: start, lte: end },
        schedule: {
          medication: {
            userId: 'user1',
            isArchived: false,
            isReminderOn: true,
          },
        },
      },
      include: { doseActions: true },
      orderBy: { scheduledAt: 'asc' },
    });
    expect(result).toEqual(doseTimes);
  });

  it('does not create additional dose times after a taken action', async () => {
    const now = new Date().toISOString();

    prisma.doseAction.findFirst.mockResolvedValue(null);
    prisma.doseAction.create.mockResolvedValue({ id: 'da1' });
    prisma.medication.findFirst
      .mockResolvedValueOnce({ id: 'med1', userId: 'user1' })
      .mockResolvedValueOnce({
        id: 'med1',
        userId: 'user1',
        schedule: { doseTimes: [{ dosageQty: 1, time: new Date() }] },
      });
    prisma.medication.updateMany.mockResolvedValue({ count: 1 });
    prisma.medication.findUnique.mockResolvedValue({ quantityLeft: 9 });
    prisma.medication.update.mockResolvedValue({});

    await service.create('user1', {
      medicationId: 'med1',
      actionType: 'TAKEN',
      actionTime: now,
    } as any);

    expect(prisma.doseTime.create).not.toHaveBeenCalled();
  });

  it('rejects creation for archived or muted medications', async () => {
    prisma.medication.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user1', {
        medicationId: 'med1',
        actionType: 'TAKEN',
        actionTime: new Date().toISOString(),
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.medication.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'med1',
        userId: 'user1',
        isArchived: false,
        isReminderOn: true,
      },
    });
  });

  it('returns empty dose actions for inactive medications', async () => {
    prisma.doseAction.findMany.mockResolvedValue([]);

    const result = await service.findByMedication('med1', 'user1');

    expect(prisma.doseAction.findMany).toHaveBeenCalledWith({
      where: {
        medicationId: 'med1',
        userId: 'user1',
        medication: {
          userId: 'user1',
          isArchived: false,
          isReminderOn: true,
        },
      },
      orderBy: { actionTime: 'desc' },
    });
    expect(result).toEqual([]);
  });

  it('returns empty dose times by date for inactive medications', async () => {
    const date = '2024-01-01';
    const start = startOfDay(parseISO(date));
    const end = endOfDay(parseISO(date));
    prisma.doseTime.findMany.mockResolvedValue([]);

    const result = await service.findDoseTimesByDate('user1', date);

    expect(prisma.doseTime.findMany).toHaveBeenCalledWith({
      where: {
        scheduledAt: { gte: start, lte: end },
        schedule: {
          medication: {
            userId: 'user1',
            isArchived: false,
            isReminderOn: true,
          },
        },
      },
      include: { doseActions: true },
      orderBy: { scheduledAt: 'asc' },
    });
    expect(result).toEqual([]);
  });

  it('returns empty dose times by date range for inactive medications', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-01-02';
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    prisma.doseTime.findMany.mockResolvedValue([]);

    const result = await service.findDoseTimesByDateRange(
      'user1',
      startDate,
      endDate,
    );

    expect(prisma.doseTime.findMany).toHaveBeenCalledWith({
      where: {
        scheduledAt: { gte: start, lte: end },
        schedule: {
          medication: {
            userId: 'user1',
            isArchived: false,
            isReminderOn: true,
          },
        },
      },
      include: { doseActions: true },
      orderBy: { scheduledAt: 'asc' },
    });
    expect(result).toEqual([]);
  });

  it('returns empty dose actions by dose time for inactive medications', async () => {
    prisma.doseAction.findMany.mockResolvedValue([]);

    const result = await service.findDoseActionByDoseTime('dt1', 'user1');

    expect(prisma.doseAction.findMany).toHaveBeenCalledWith({
      where: {
        doseTimeId: 'dt1',
        userId: 'user1',
        doseTime: {
          schedule: {
            medication: {
              userId: 'user1',
              isArchived: false,
              isReminderOn: true,
            },
          },
        },
      },
      orderBy: { actionTime: 'desc' },
    });
    expect(result).toEqual([]);
  });
});
