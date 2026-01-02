import { ScheduleService } from './schedule.service';
import { RepeatPattern } from '../common/enums/repeat-pattern.enum';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      medication: { findFirst: jest.fn() },
      schedule: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      doseTime: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
      doseAction: { create: jest.fn(), deleteMany: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };
    service = new ScheduleService(prisma as any);
    jest.spyOn(service as any, 'generateDoseTimes').mockResolvedValue(undefined);
  });

  it('stores repeatPattern as WEEKLY when plan uses "weekly"', async () => {
    const plan = {
      totalCount: 7,
      firstTime: new Date('2024-05-01T08:00:00Z').toISOString(),
      lastTime: new Date('2024-05-07T08:00:00Z').toISOString(),
      repeatPattern: 'weekly',
      interval: 1,
      times: ['08:00'],
    } as any;

    const scheduleInput = service.fromAiSchedule(plan);
    expect(scheduleInput.repeatPattern).toBe(RepeatPattern.WEEKLY);
    expect(scheduleInput.interval).toBe(1);
    expect(scheduleInput.intervalDays).toBe(7);

    prisma.medication.findFirst.mockResolvedValue({ id: 'med1', userId: 'user1', quantityLeft: 7 });
    prisma.schedule.create.mockResolvedValue({ id: 'sched1' });
    prisma.schedule.findFirst.mockResolvedValue({
      id: 'sched1',
      medicationId: 'med1',
      repeatPattern: RepeatPattern.WEEKLY,
      interval: scheduleInput.interval,
      startDate: new Date(scheduleInput.startDate),
      durationDays: scheduleInput.durationDays,
    });
    prisma.doseTime.findMany.mockResolvedValue([]);

    const result = await service.create('user1', { medicationId: 'med1', ...scheduleInput });

    expect(prisma.schedule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ repeatPattern: RepeatPattern.WEEKLY, interval: 1 }),
    });
    expect((service as any).generateDoseTimes).toHaveBeenCalledWith(
      prisma,
      'sched1',
      'med1',
      'user1',
      scheduleInput.times,
      scheduleInput.startDate,
      scheduleInput.repeatPattern,
      scheduleInput.durationDays,
      scheduleInput.intervalDays,
      7,
    );
    expect(result.repeatPattern).toBe(RepeatPattern.WEEKLY);
  });

  it('preserves earliest doseDate as startDate even when in the past', () => {
    const plan = {
      doseDates: [
        new Date('2020-01-02T08:00:00Z').toISOString(),
        new Date('2020-01-01T08:00:00Z').toISOString(),
      ],
      repeatPattern: 'daily',
      interval: 1,
    } as any;

    const scheduleInput = service.fromAiSchedule(plan);
    expect(scheduleInput.startDate).toBe(
      new Date('2020-01-01T08:00:00Z').toISOString(),
    );
  });

  it('generates times from frequency when times are absent', () => {
    const plan = {
      totalCount: 10,
      firstTime: new Date('2024-05-01T08:00:00Z').toISOString(),
      lastTime: new Date('2024-05-03T08:00:00Z').toISOString(),
      frequency: 2,
      intervalUnit: 'd',
    } as any;

    const scheduleInput = service.fromAiSchedule(plan);
    expect(scheduleInput.times).toHaveLength(2);
    expect(scheduleInput.repeatPattern).toBe(RepeatPattern.DAILY);
  });

  it('removes dose actions tied to old dose times on update', async () => {
    const doseTimes: any[] = [
      {
        id: 'dt1',
        scheduleId: 'sched1',
        time: new Date(),
        scheduledAt: new Date(),
        dosageQty: 1,
        dosageUnit: 'unit',
      },
    ];
    let doseActions: any[] = [
      { id: 'da1', doseTimeId: 'dt1', userId: 'user1', medicationId: 'med1' },
    ];

    prisma.schedule.findFirst.mockResolvedValue({ id: 'sched1', medicationId: 'med1' });
    prisma.medication.findFirst.mockResolvedValue({ id: 'med1', userId: 'user1', quantityLeft: 10 });
    prisma.doseTime.findMany.mockImplementation(async (args: any) => {
      return doseTimes
        .filter((dt) => dt.scheduleId === args.where.scheduleId)
        .map((dt) => (args.select?.id ? { id: dt.id } : dt));
    });
    prisma.doseAction.deleteMany.mockImplementation(async ({ where }) => {
      doseActions = doseActions.filter(
        (da) => !where.doseTimeId.in.includes(da.doseTimeId),
      );
      return { count: 1 };
    });
    prisma.doseTime.deleteMany.mockImplementation(async ({ where }) => {
      for (let i = doseTimes.length - 1; i >= 0; i--) {
        if (doseTimes[i].scheduleId === where.scheduleId) doseTimes.splice(i, 1);
      }
      return { count: 1 };
    });
    prisma.schedule.update.mockImplementation(async ({ where, data }) => ({
      id: where.id,
      medicationId: 'med1',
      ...data,
    }));

    await service.update('user1', {
      id: 'sched1',
      repeatPattern: RepeatPattern.DAILY,
      durationDays: 5,
    } as any);

    expect(doseActions).toHaveLength(0);
    expect(doseTimes).toHaveLength(0);
  });
});
