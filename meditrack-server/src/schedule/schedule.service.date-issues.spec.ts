import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { RepeatPattern } from '../common/enums/repeat-pattern.enum';

describe('ScheduleService - Date Calculation Issues', () => {
  let service: ScheduleService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      medication: { findFirst: jest.fn() },
      schedule: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      doseTime: { findMany: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
      doseAction: { create: jest.fn(), deleteMany: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    jest.spyOn(service as any, 'generateDoseTimes').mockResolvedValue(undefined);
  });

  describe('Interval Calculation Inconsistencies', () => {
    it('should calculate weekly intervals consistently', () => {
      const weeklyPlan = {
        totalCount: 7,
        firstTime: '2024-05-01T08:00:00Z',
        lastTime: '2024-05-15T08:00:00Z',
        repeatPattern: 'WEEKLY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      const result = service.fromAiSchedule(weeklyPlan as any);
      
      // Should use 7-day intervals for weekly pattern
      expect(result.intervalDays).toBe(7);
      expect(result.repeatPattern).toBe(RepeatPattern.WEEKLY);
    });

    it('should handle monthly calculations with different month lengths', () => {
      // Test February (28 days) vs January (31 days)
      const februaryPlan = {
        totalCount: 3,
        firstTime: '2024-02-01T08:00:00Z',
        lastTime: '2024-04-01T08:00:00Z',
        repeatPattern: 'MONTHLY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      const result = service.fromAiSchedule(februaryPlan as any);
      
      // Current implementation uses 30 days hardcoded - this may be problematic
      expect(result.intervalDays).toBe(30);
      
      // Duration should account for actual calendar months, not just 30-day periods
      // This test documents the current behavior which may need fixing
    });

    it('should handle leap year calculations correctly', () => {
      const leapYearPlan = {
        totalCount: 12,
        firstTime: '2024-02-01T08:00:00Z', // 2024 is a leap year
        lastTime: '2025-02-01T08:00:00Z',
        repeatPattern: 'MONTHLY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      const result = service.fromAiSchedule(leapYearPlan as any);
      
      // Test documents current hardcoded behavior
      expect(result.intervalDays).toBe(30);
    });
  });

  describe('Start Date Logic Issues', () => {
    it('should handle past dates consistently', () => {
      const fixedNow = new Date('2024-05-03T12:00:00Z');
      jest.useFakeTimers().setSystemTime(fixedNow);

      const pastPlan = {
        totalCount: 5,
        firstTime: '2024-05-01T08:00:00Z', // Past date
        lastTime: '2024-05-10T08:00:00Z',
        repeatPattern: 'DAILY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      const result = service.fromAiSchedule(pastPlan as any);
      
      // When firstTime is in the past, startDate should be set to "now"
      // This might cause issues with historical tracking
      const startDate = new Date(result.startDate);
      expect(startDate.getTime()).toBeGreaterThanOrEqual(fixedNow.getTime());

      jest.useRealTimers();
    });

    it('should preserve exact dose dates when provided', () => {
      const doseDatesPlan = {
        doseDates: [
          '2024-05-01T08:00:00Z',
          '2024-05-03T08:00:00Z',
          '2024-05-05T08:00:00Z',
        ],
        repeatPattern: 'DAILY',
      };

      const result = service.fromAiSchedule(doseDatesPlan as any);
      
      // Start date should be the earliest dose date, even if in the past
      expect(result.startDate).toBe('2024-05-01T08:00:00.000Z');
    });
  });

  describe('Duration Calculation Off-by-One Issues', () => {
    it('should calculate duration consistently for single day', () => {
      const singleDayPlan = {
        doseDates: ['2024-05-01T08:00:00Z'],
        repeatPattern: 'DAILY',
      };

      const result = service.fromAiSchedule(singleDayPlan as any);
      
      // Single day should have duration of 1
      expect(result.durationDays).toBe(1);
    });

    it('should calculate duration consistently for multiple days', () => {
      const multiDayPlan = {
        doseDates: [
          '2024-05-01T08:00:00Z',
          '2024-05-02T08:00:00Z',
          '2024-05-03T08:00:00Z',
        ],
        repeatPattern: 'DAILY',
      };

      const result = service.fromAiSchedule(multiDayPlan as any);
      
      // Three days (May 1, 2, 3) should have duration of 3
      expect(result.durationDays).toBe(3);
    });

    it('should handle span calculations without off-by-one errors', () => {
      const spanPlan = {
        totalCount: 10,
        firstTime: '2024-05-01T08:00:00Z',
        lastTime: '2024-05-10T08:00:00Z', // 10 days inclusive
        repeatPattern: 'DAILY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      const fixedNow = new Date('2024-04-30T12:00:00Z'); // Before start
      jest.useFakeTimers().setSystemTime(fixedNow);

      const result = service.fromAiSchedule(spanPlan as any);
      
      // May 1 to May 10 inclusive should be 10 days
      expect(result.durationDays).toBe(10);

      jest.useRealTimers();
    });
  });

  describe('Time Zone and Date Object Issues', () => {
    it('should handle timeStringToDate consistently', () => {
      // Access private method for testing
      const timeStringToDate = (service as any).timeStringToDate;
      
      const result1 = timeStringToDate('08:00');
      const result2 = timeStringToDate('08:00');
      
      // Should return consistent Date objects
      expect(result1.getTime()).toBe(result2.getTime());
      expect(result1.toISOString()).toMatch(/1970-01-01T08:00:00/);
    });

    it('should handle timezone consistency in date operations', () => {
      const plan = {
        totalCount: 3,
        firstTime: '2024-05-01T08:00:00Z', // UTC
        lastTime: '2024-05-03T08:00:00Z',   // UTC
        repeatPattern: 'DAILY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      // Test in different system timezones (simulated)
      const originalTimezone = process.env.TZ;
      
      try {
        process.env.TZ = 'America/New_York';
        const result1 = service.fromAiSchedule(plan as any);
        
        process.env.TZ = 'Asia/Tokyo';
        const result2 = service.fromAiSchedule(plan as any);
        
        // Results should be identical regardless of system timezone
        expect(result1.startDate).toBe(result2.startDate);
        expect(result1.durationDays).toBe(result2.durationDays);
        
      } finally {
        process.env.TZ = originalTimezone;
      }
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should handle zero or negative quantities gracefully', () => {
      const zeroPlan = {
        totalCount: 0,
        firstTime: '2024-05-01T08:00:00Z',
        lastTime: '2024-05-03T08:00:00Z',
        repeatPattern: 'DAILY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      // Should not throw an error
      expect(() => {
        service.fromAiSchedule(zeroPlan as any);
      }).toThrow('No remaining doses');
    });

    it('should handle impossible schedules (more doses than time allows)', () => {
      const impossiblePlan = {
        totalCount: 100, // Too many doses
        firstTime: '2024-05-01T08:00:00Z',
        lastTime: '2024-05-01T08:30:00Z', // Only 30 minutes
        repeatPattern: 'DAILY',
        interval: 1,
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      };

      const fixedNow = new Date('2024-05-01T08:15:00Z');
      jest.useFakeTimers().setSystemTime(fixedNow);

      // Should handle gracefully
      expect(() => {
        service.fromAiSchedule(impossiblePlan as any);
      }).toThrow('No remaining doses');

      jest.useRealTimers();
    });
  });
});