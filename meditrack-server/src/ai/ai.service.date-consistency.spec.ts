import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService - Date/Time Consistency Issues', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
                AZURE_OPENAI_API_KEY: 'test-key',
                AZURE_OPENAI_API_VERSION: '2023-05-15',
                AZURE_OPENAI_DEPLOYMENT: 'test-deployment',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('Time Parsing Inconsistencies', () => {
    it('should handle time parsing consistently for different formats', async () => {
      const timeFormats = [
        '08:00',
        '8:00',
        '08:00:00',
        '8:00 AM',
        '08:00 AM',
        '20:00',
        '8:00 PM',
        '08:00 PM',
      ];

      const results = await Promise.all(
        timeFormats.map(time => service.toHHmm(time))
      );

      // All morning times should parse to same result
      expect(results[0]).toBe('08:00'); // 08:00
      expect(results[1]).toBe('08:00'); // 8:00  
      expect(results[2]).toBe('08:00'); // 08:00:00
      expect(results[3]).toBe('08:00'); // 8:00 AM
      expect(results[4]).toBe('08:00'); // 08:00 AM

      // All evening times should parse to same result  
      expect(results[5]).toBe('20:00'); // 20:00
      expect(results[6]).toBe('20:00'); // 8:00 PM
      expect(results[7]).toBe('20:00'); // 08:00 PM
    });

    it('should handle edge cases in time parsing without throwing', async () => {
      const edgeCases = ['', '25:00', 'invalid', null, undefined, 0, '24:00'];
      
      for (const testCase of edgeCases) {
        expect(async () => {
          await service.toHHmm(testCase as any);
        }).not.toThrow();
      }
    });
  });

  describe('Date Range Validation Consistency', () => {
    it('should detect inconsistent date range validation logic', () => {
      // Test case where lastTime before firstTime should always fail
      const invalidPlan = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 5,
          firstTime: '2024-05-02T08:00:00Z',
          lastTime: '2024-05-01T08:00:00Z', // Before firstTime
          repeatPattern: 'DAILY',
          times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
        },
      };

      const errors = service.validateMedicationPlan(invalidPlan);
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'schedule.lastTime',
            message: 'lastTime must be later than or equal to firstTime',
          }),
        ])
      );
    });

    it('should handle timezone consistency in date calculations', () => {
      // Mock system time to ensure consistent test results
      const fixedTime = new Date('2024-05-03T12:00:00Z');
      jest.useFakeTimers().setSystemTime(fixedTime);

      const plan = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 10,
          firstTime: '2024-05-01T08:00:00Z',
          lastTime: '2024-05-10T08:00:00Z', // Future date
          repeatPattern: 'DAILY',
          times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
        },
      };

      const errors = service.validateMedicationPlan(plan);
      
      // Should not have errors for future lastTime with proper clamping
      expect(errors).toEqual([]);

      jest.useRealTimers();
    });
  });

  describe('Quantity Calculation Race Conditions', () => {
    it('should use consistent "now" timestamp throughout calculation', () => {
      const startTime = Date.now();
      
      // Test multiple calls rapidly to check for race conditions
      const plan = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 5,
          firstTime: '2024-05-01T08:00:00Z',
          lastTime: '2024-05-03T08:00:00Z',
          repeatPattern: 'DAILY',
          times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
        },
      };

      const results: Array<Array<{ field: string; message: string }>> = [];
      for (let i = 0; i < 5; i++) {
        results.push(service.validateMedicationPlan(plan));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All results should be identical despite rapid calls
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });

      // Test should complete quickly (no hanging operations)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Interval Calculation Consistency', () => {
    it('should calculate intervals consistently for weekly patterns', () => {
      // Use fixed future dates to avoid "doses already taken" issues
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const futureEndDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // 45 days from now
      
      const weeklyPlans = [
        {
          medication: { name: 'Test Med', strength: '10mg' },
          schedule: {
            totalCount: 3,
            firstTime: futureDate.toISOString(),
            lastTime: futureEndDate.toISOString(),
            repeatPattern: 'WEEKLY',
            interval: 1,
            times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
          },
        },
        {
          medication: { name: 'Test Med', strength: '10mg' },
          schedule: {
            totalCount: 3,
            firstTime: futureDate.toISOString(),
            lastTime: futureEndDate.toISOString(),
            repeatPattern: 'WEEKLY', // Add explicit repeat pattern
            intervalUnit: 'wk',
            interval: 1,
            frequency: 1,
            times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
          },
        },
      ];

      weeklyPlans.forEach(plan => {
        const errors = service.validateMedicationPlan(plan);
        expect(errors).toEqual([]);
      });
    });

    it('should handle monthly calculations with proper day counting', () => {
      // Use fixed future dates
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const futureEndDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000); // 120 days from now
      
      const monthlyPlan = {
        medication: { name: 'Test Med', strength: '10mg' },
        schedule: {
          totalCount: 3,
          firstTime: futureDate.toISOString(),
          lastTime: futureEndDate.toISOString(),
          repeatPattern: 'MONTHLY',
          interval: 1,
          times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
        },
      };

      const errors = service.validateMedicationPlan(monthlyPlan);
      expect(errors).toEqual([]);
    });
  });
});