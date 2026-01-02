import { Test, TestingModule } from '@nestjs/testing';
import { MedicationResolver } from './medication.resolver';
import { MedicationService } from './medication.service';
import { ScheduleService } from '../schedule/schedule.service';
import { AiService } from '../ai/ai.service';

describe('MedicationResolver', () => {
  let resolver: MedicationResolver;
  let medicationService: any;
  let scheduleService: any;
  let aiService: any;

  beforeEach(async () => {
    medicationService = { create: jest.fn() };
    scheduleService = { fromAiSchedule: jest.fn(), create: jest.fn() };
    aiService = { analyzeMedicationPlan: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationResolver,
        { provide: MedicationService, useValue: medicationService },
        { provide: ScheduleService, useValue: scheduleService },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    resolver = module.get<MedicationResolver>(MedicationResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should register medication and compute quantityLeft from doseDates', async () => {
    const firstDose = new Date('2024-05-01T08:00:00Z').toISOString();
    const secondDose = new Date('2024-05-02T08:00:00Z').toISOString();
    const aiFirstTime = new Date('2024-05-03T08:00:00Z').toISOString();
    const scheduleStart = new Date('2024-05-04T08:00:00Z').toISOString();
    const last = new Date('2024-05-05T20:00:00Z').toISOString();
    const input = {
      name: 'Med',
      strength: '10mg',
      totalCount: 5,
      firstTime: aiFirstTime,
      lastTime: last,
    } as any;

    aiService.analyzeMedicationPlan.mockResolvedValue({
      medication: { name: 'Med', strength: '10mg', quantity: 5 },
      schedule: {
        totalCount: 5,
        doseDates: [firstDose, secondDose],
        firstTime: aiFirstTime,
        lastTime: last,
        times: [],
      },
    });

    scheduleService.fromAiSchedule.mockReturnValue({
      repeatPattern: 0,
      startDate: scheduleStart,
      estimatedEndDate: last,
      durationDays: 1,
      interval: 1,
      intervalDays: 1,
      times: [],
    });

    medicationService.create.mockResolvedValue({ id: 'med1' });
    scheduleService.create.mockResolvedValue({ id: 'sched1' });

    const result = await resolver.registerMedicationWithAi(input, { sub: 'user1' } as any);

    expect(aiService.analyzeMedicationPlan).toHaveBeenCalledWith(input);
    expect(medicationService.create).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({
        medicationStartDate: firstDose,
        estimatedEndDate: last,
        quantityLeft: 3,
      }),
    );
    expect(scheduleService.create).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({ medicationId: 'med1', startDate: scheduleStart, interval: 1 }),
    );
    expect(result.success).toBe(true);
  });

  it('should compute quantityLeft from times when doseDates absent', async () => {
    const aiFirstTime = new Date('2024-05-01T08:00:00Z').toISOString();
    const scheduleStart = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-03T20:00:00Z').toISOString();
    const input = {
      name: 'Med',
      strength: '10mg',
      totalCount: 10,
      firstTime: aiFirstTime,
      lastTime: last,
    } as any;

    aiService.analyzeMedicationPlan.mockResolvedValue({
      medication: { name: 'Med', strength: '10mg', quantity: 10 },
      schedule: {
        totalCount: 10,
        firstTime: aiFirstTime,
        lastTime: last,
        times: ['08:00', '20:00'],
      },
    });

    scheduleService.fromAiSchedule.mockReturnValue({
      repeatPattern: 0,
      startDate: scheduleStart,
      estimatedEndDate: last,
      durationDays: 3,
      interval: 1,
      intervalDays: 1,
      times: ['08:00', '20:00'],
    });

    medicationService.create.mockResolvedValue({ id: 'med1' });
    scheduleService.create.mockResolvedValue({ id: 'sched1' });

    const result = await resolver.registerMedicationWithAi(input, { sub: 'user1' } as any);

    expect(aiService.analyzeMedicationPlan).toHaveBeenCalledWith(input);
    expect(medicationService.create).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({
        medicationStartDate: aiFirstTime,
        estimatedEndDate: last,
        quantityLeft: 4,
      }),
    );
    expect(scheduleService.create).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({ medicationId: 'med1', startDate: scheduleStart, interval: 1 }),
    );
    expect(result.success).toBe(true);
  });

  it('creates doseTime and doseAction records even when quantityLeft is zero', async () => {
    const meds: any[] = [];
    const schedules: any[] = [];
    const doseTimes: any[] = [];
    const doseActions: any[] = [];

    const prisma: any = {
      medication: {
        create: jest.fn(async ({ data }) => {
          const med = { id: `med${meds.length + 1}`, ...data };
          meds.push(med);
          return med;
        }),
        findFirst: jest.fn(async ({ where }) =>
          meds.find((m) => m.id === where.id && m.userId === where.userId) || null,
        ),
      },
      schedule: {
        create: jest.fn(async ({ data }) => {
          const sched = { id: `sched${schedules.length + 1}`, ...data };
          schedules.push(sched);
          return sched;
        }),
        findFirst: jest.fn(async ({ where }) =>
          schedules.find((s) => s.medicationId === where.medicationId) || null,
        ),
      },
      doseTime: {
        create: jest.fn(async ({ data }) => {
          const dt = { id: `dt${doseTimes.length + 1}`, ...data };
          doseTimes.push(dt);
          return dt;
        }),
        findMany: jest.fn(async ({ where }) =>
          doseTimes.filter((dt) => dt.scheduleId === where.scheduleId),
        ),
      },
      doseAction: {
        create: jest.fn(async ({ data }) => {
          const da = { id: `da${doseActions.length + 1}`, ...data };
          doseActions.push(da);
          return da;
        }),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const medService = new MedicationService(prisma);
    const schedService = new ScheduleService(prisma);
    const aiSvc = {
      analyzeMedicationPlan: jest.fn().mockResolvedValue({
        medication: { name: 'Med', strength: '10mg', quantity: 2 },
        schedule: {
          totalCount: 2,
          firstTime: new Date('2030-01-01T08:00:00Z').toISOString(),
          lastTime: new Date('2030-01-02T08:00:00Z').toISOString(),
          times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
          repeatPattern: 'daily',
          interval: 1,
        },
      }),
    };

    const localResolver = new MedicationResolver(
      medService as any,
      schedService as any,
      aiSvc as any,
    );

    await localResolver.registerMedicationWithAi({} as any, { sub: 'user1' } as any);

    expect(doseTimes.length).toBeGreaterThan(0);
    expect(doseActions.length).toBeGreaterThan(0);
  });
});
