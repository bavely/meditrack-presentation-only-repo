import { ScheduleService } from './schedule.service';
import { RepeatPattern } from '../common/enums/repeat-pattern.enum';

describe('ScheduleService generateDoseTimes', () => {
  let service: ScheduleService;
  let prisma: any;
  let doseTimes: any[];
  let doseActions: any[];

  beforeEach(() => {
    doseTimes = [];
    doseActions = [];
    prisma = {
      doseTime: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const record = { id: `dt${doseTimes.length + 1}`, ...data };
          doseTimes.push(record);
          return record;
        }),
      },
      doseAction: {
        create: jest.fn().mockImplementation(async ({ data }) => {
          const record = { id: `da${doseActions.length + 1}`, ...data };
          doseActions.push(record);
          return record;
        }),
      },
    };
    service = new ScheduleService(prisma as any);
  });

  it('persists a dose record for each supplied time when dates are unique', async () => {
    const base = new Date();
    base.setUTCDate(base.getUTCDate() + 1);
    const times = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + i);
      return {
        scheduledAt: d.toISOString(),
        dosageQty: 1,
        dosageUnit: 'unit',
      };
    });

    await (service as any).generateDoseTimes(
      prisma,
      'sched1',
      'med1',
      'user1',
      times,
      times[0].scheduledAt,
      RepeatPattern.DAILY,
      10,
      undefined,
      100,
    );

    expect(doseTimes).toHaveLength(times.length);
    expect(doseActions).toHaveLength(times.length);
    const storedTimes = doseTimes
      .map((dt) => dt.scheduledAt.toISOString())
      .sort();
    expect(storedTimes).toEqual(times.map((t) => t.scheduledAt).sort());
  });

  it('persists a dose record for each supplied time on a single day', async () => {
    const base = new Date();
    base.setUTCDate(base.getUTCDate() + 1);
    base.setUTCHours(0, 0, 0, 0);
    const times = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base);
      d.setUTCHours(8 + i, 0, 0, 0);
      return {
        scheduledAt: d.toISOString(),
        dosageQty: 1,
        dosageUnit: 'unit',
      };
    });

    await (service as any).generateDoseTimes(
      prisma,
      'sched1',
      'med1',
      'user1',
      times,
      base.toISOString(),
      RepeatPattern.DAILY,
      1,
      undefined,
      100,
    );

    expect(doseTimes).toHaveLength(times.length);
    expect(doseActions).toHaveLength(times.length);
    const storedTimes = doseTimes
      .map((dt) => dt.scheduledAt.toISOString())
      .sort();
    expect(storedTimes).toEqual(times.map((t) => t.scheduledAt).sort());
  });
});
