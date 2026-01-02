import { Test, TestingModule } from '@nestjs/testing';
import { MedicationResolver } from './medication.resolver';
import { MedicationService } from './medication.service';
import { ScheduleService } from '../schedule/schedule.service';
import { AiService } from '../ai/ai.service';

describe('MedicationResolver - Quantity Calculation Issues', () => {
  let resolver: MedicationResolver;
  let medicationService: jest.Mocked<MedicationService>;
  let scheduleService: jest.Mocked<ScheduleService>;
  let aiService: jest.Mocked<AiService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationResolver,
        {
          provide: MedicationService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: ScheduleService,
          useValue: {
            fromAiSchedule: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            analyzeMedicationPlan: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<MedicationResolver>(MedicationResolver);
    medicationService = module.get(MedicationService);
    scheduleService = module.get(ScheduleService);
    aiService = module.get(AiService);
  });

  describe('Dose Counting Logic Issues', () => {
    it('should calculate doses taken consistently for doseDates vs times', async () => {
      // Set a fixed time for consistent testing
      const fixedNow = new Date('2024-05-03T12:00:00Z');
      jest.useFakeTimers().setSystemTime(fixedNow);

      // Test case 1: Using doseDates
      const aiResultWithDoseDates = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 5,
          doseDates: [
            '2024-05-01T08:00:00Z', // Past
            '2024-05-02T08:00:00Z', // Past  
            '2024-05-04T08:00:00Z', // Future
            '2024-05-05T08:00:00Z', // Future
            '2024-05-06T08:00:00Z', // Future
          ],
        },
      };

      // Test case 2: Using times with equivalent schedule
      const aiResultWithTimes = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 5,
          firstTime: '2024-05-01T08:00:00Z',
          lastTime: '2024-05-06T08:00:00Z',
          repeatPattern: 'DAILY',
          interval: 1,
          times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
        },
      };

      scheduleService.fromAiSchedule.mockReturnValue({
        repeatPattern: 'DAILY' as any,
        startDate: '2024-05-04T08:00:00Z',
        estimatedEndDate: '2024-05-06T08:00:00Z',
        durationDays: 3,
        interval: 1,
        intervalDays: 1,
        times: [{ scheduledAt: '2024-05-04T08:00:00Z', dosageQty: 1, dosageUnit: 'unit' }],
      });

      medicationService.create.mockResolvedValue({ id: 'med1' } as any);
      scheduleService.create.mockResolvedValue({ id: 'sched1', doseTimes: [] } as any);

      // Mock AI service responses
      aiService.analyzeMedicationPlan
        .mockResolvedValueOnce(aiResultWithDoseDates as any)
        .mockResolvedValueOnce(aiResultWithTimes as any);

      const input1 = { name: 'Test Med', strength: '10mg' } as any;
      const input2 = { name: 'Test Med', strength: '10mg' } as any;
      const user = { sub: 'user1' };

      const result1 = await resolver.registerMedicationWithAi(input1, user);
      const result2 = await resolver.registerMedicationWithAi(input2, user);

      // Both methods should calculate the same quantityLeft (3 remaining doses)
      const createCall1 = medicationService.create.mock.calls[0][1];
      const createCall2 = medicationService.create.mock.calls[1][1];

      expect(createCall1.quantityLeft).toBe(createCall2.quantityLeft);
      
      jest.useRealTimers();
    });

    it('should handle edge case where all doses are in the past', async () => {
      const fixedNow = new Date('2024-05-10T12:00:00Z');
      jest.useFakeTimers().setSystemTime(fixedNow);

      const aiResult = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 3,
          doseDates: [
            '2024-05-01T08:00:00Z', // Past
            '2024-05-02T08:00:00Z', // Past  
            '2024-05-03T08:00:00Z', // Past
          ],
        },
      };

      aiService.analyzeMedicationPlan.mockResolvedValue(aiResult as any);
      scheduleService.fromAiSchedule.mockReturnValue({
        repeatPattern: 'DAILY' as any,
        startDate: '2024-05-10T12:00:00Z',
        estimatedEndDate: '2024-05-03T08:00:00Z',
        durationDays: 1,
        interval: 1,
        intervalDays: 1,
        times: [],
      });

      medicationService.create.mockResolvedValue({ id: 'med1' } as any);
      scheduleService.create.mockResolvedValue({ id: 'sched1', doseTimes: [] } as any);

      const input = { name: 'Test Med', strength: '10mg' } as any;
      const user = { sub: 'user1' };

      const result = await resolver.registerMedicationWithAi(input, user);

      // Should have 0 doses remaining (all were in the past)
      const createCall = medicationService.create.mock.calls[0][1];
      expect(createCall.quantityLeft).toBe(0);
      
      jest.useRealTimers();
    });

    it('should handle fractional doses and rounding correctly', async () => {
      const fixedNow = new Date('2024-05-03T12:00:00Z');
      jest.useFakeTimers().setSystemTime(fixedNow);

      const aiResult = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 10,
          firstTime: '2024-05-01T08:00:00Z',
          lastTime: '2024-05-05T20:00:00Z',
          repeatPattern: 'DAILY',
          interval: 1,
          times: [
            { time: '08:00', dosageQty: 1.5, dosageUnit: 'unit' }, // Fractional dose
            { time: '20:00', dosageQty: 0.5, dosageUnit: 'unit' }, // Fractional dose
          ],
        },
      };

      aiService.analyzeMedicationPlan.mockResolvedValue(aiResult as any);
      scheduleService.fromAiSchedule.mockReturnValue({
        repeatPattern: 'DAILY' as any,
        startDate: '2024-05-03T12:00:00Z',
        estimatedEndDate: '2024-05-05T20:00:00Z',
        durationDays: 3,
        interval: 1,
        intervalDays: 1,
        times: [
          { scheduledAt: '2024-05-03T08:00:00Z', dosageQty: 1.5, dosageUnit: 'unit' },
          { scheduledAt: '2024-05-03T20:00:00Z', dosageQty: 0.5, dosageUnit: 'unit' },
        ],
      });

      medicationService.create.mockResolvedValue({ id: 'med1' } as any);
      scheduleService.create.mockResolvedValue({ id: 'sched1', doseTimes: [] } as any);

      const input = { name: 'Test Med', strength: '10mg' } as any;
      const user = { sub: 'user1' };

      const result = await resolver.registerMedicationWithAi(input, user);

      // Should handle fractional doses properly
      const createCall = medicationService.create.mock.calls[0][1];
      expect(createCall.quantityLeft).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(createCall.quantityLeft)).toBe(true);
      
      jest.useRealTimers();
    });
  });

  describe('Date Boundary Edge Cases', () => {
    it('should handle midnight boundary crossings correctly', async () => {
      const fixedNow = new Date('2024-05-02T00:01:00Z'); // Just after midnight
      jest.useFakeTimers().setSystemTime(fixedNow);

      const aiResult = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 4,
          firstTime: '2024-05-01T23:59:00Z', // Just before midnight
          lastTime: '2024-05-02T00:01:00Z',   // Just after midnight
          repeatPattern: 'DAILY',
          interval: 1,
          times: [{ time: '23:59', dosageQty: 1, dosageUnit: 'unit' }],
        },
      };

      aiService.analyzeMedicationPlan.mockResolvedValue(aiResult as any);
      scheduleService.fromAiSchedule.mockReturnValue({
        repeatPattern: 'DAILY' as any,
        startDate: '2024-05-02T00:01:00Z',
        estimatedEndDate: '2024-05-02T23:59:00Z',
        durationDays: 1,
        interval: 1,
        intervalDays: 1,
        times: [{ scheduledAt: '2024-05-02T23:59:00Z', dosageQty: 1, dosageUnit: 'unit' }],
      });

      medicationService.create.mockResolvedValue({ id: 'med1' } as any);
      scheduleService.create.mockResolvedValue({ id: 'sched1', doseTimes: [] } as any);

      const input = { name: 'Test Med', strength: '10mg' } as any;
      const user = { sub: 'user1' };

      const result = await resolver.registerMedicationWithAi(input, user);

      // Should handle midnight boundary correctly
      const createCall = medicationService.create.mock.calls[0][1];
      expect(createCall.quantityLeft).toBeGreaterThanOrEqual(0);
      
      jest.useRealTimers();
    });
  });
});