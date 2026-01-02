import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { MedicationPlanDto } from './dto/medication-plan.dto';
import { RepeatPattern } from '../common/enums/repeat-pattern.enum';

describe('AiService', () => {
  let service: AiService;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    process.env.AZURE_OPENAI_ENDPOINT = 'https://example.com';
    process.env.AZURE_OPENAI_API_KEY = 'key';
    process.env.AZURE_OPENAI_API_VERSION = '2024-02-15';
    process.env.AZURE_OPENAI_DEPLOYMENT = 'deployment';

    const configService = new ConfigService();
    service = new AiService(configService);
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'test response' } }],
    });

    (service as any).openai = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };
  });

  it('should call OpenAI with system and user messages', async () => {
    const result = await service.askAi('sys', 'usr');

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'usr' },
      ],
    });
    expect(result).toBe('test response');
  });

  it('should analyze medication plan and return structured data', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 4,
      firstTime: first,
      lastTime: last,
    };

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        totalCount: 4,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: [
          { time: '08:00', dosageQty: 1, dosageUnit: 'unit' },
          { time: '20:00', dosageQty: 1, dosageUnit: 'unit' },
        ],
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.medication.name).toBe('Med');
    expect(result.medication.dosage).toBe('10mg');
    expect(result.schedule.totalCount).toBe(4);
    expect(result.schedule.repeatPattern).toBe(RepeatPattern.DAILY);
    expect(Array.isArray((result.schedule as any).times)).toBe(true);
    expect((result.schedule as any).times).toEqual([
      { time: '08:00', dosageQty: 1, dosageUnit: 'unit' },
      { time: '20:00', dosageQty: 1, dosageUnit: 'unit' },
    ]);
  });

  it('parses natural language repeatPattern to enum and interval', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 4,
      firstTime: first,
      lastTime: last,
    };

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        totalCount: 4,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'every 2 weeks',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.schedule.repeatPattern).toBe(RepeatPattern.WEEKLY);
    expect(result.schedule.interval).toBe(2);
  });

  it('defaults to DAILY when repeatPattern cannot be parsed', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 4,
      firstTime: first,
      lastTime: last,
    };

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        totalCount: 4,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'foo',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.schedule.repeatPattern).toBe(RepeatPattern.DAILY);
    expect(result.schedule.interval).toBeUndefined();
  });

  it('replaces invalid firstTime/lastTime with original input values', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 4,
      firstTime: first,
      lastTime: last,
    };

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        totalCount: 4,
        firstTime: '08:00',
        lastTime: '20:00',
        repeatPattern: 'DAILY',
        times: [
          { time: '08:00', dosageQty: 1, dosageUnit: 'unit' },
          { time: '20:00', dosageQty: 1, dosageUnit: 'unit' },
        ],
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.schedule.firstTime).toBe(first);
    expect(result.schedule.lastTime).toBe(last);
  });

  it('coerces Date inputs to ISO strings when AI returns HH:mm', async () => {
    const firstDate = new Date('2024-05-01T08:00:00Z');
    const lastDate = new Date('2024-05-01T20:00:00Z');

    const plan: any = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 4,
      firstTime: firstDate,
      lastTime: lastDate,
    };

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        totalCount: 4,
        firstTime: '08:00',
        lastTime: '20:00',
        repeatPattern: 'DAILY',
        times: [
          { time: '08:00', dosageQty: 1, dosageUnit: 'unit' },
          { time: '20:00', dosageQty: 1, dosageUnit: 'unit' },
        ],
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan as MedicationPlanDto);

    expect(result.schedule.firstTime).toBe(firstDate.toISOString());
    expect(result.schedule.lastTime).toBe(lastDate.toISOString());
    expect(service.validateMedicationPlan(result)).toEqual([]);
  });

  it('handles optional fields and frequency without times', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-03T08:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 10,
      firstTime: first,
      lastTime: last,
    } as any;

    const aiResult = {
      medication: { name: 'Med', doseQuantity: 1, doseUnit: 'tablet', route: 'oral' },
      schedule: {
        totalCount: 10,
        firstTime: first,
        lastTime: last,
        frequency: 3,
        intervalUnit: 'd',
        quantityLeft: 5,
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.medication.doseQuantity).toBe(1);
    expect(result.medication.doseUnit).toBe('tablet');
    expect(result.medication.route).toBe('oral');
    expect(result.medication.dosage).toBe('1 tablet');
    expect(result.medication.quantity).toBe(10);
    expect(result.schedule.frequency).toBe(3);
    expect(result.schedule.intervalUnit).toBe('d');
    expect(result.schedule.quantityLeft).toBe(5);
    expect(result.schedule.times).toBeUndefined();
  });

  it('promotes bounds to top-level schedule fields', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-02T08:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 99,
      firstTime: '2024-04-01T00:00:00Z',
      lastTime: '2024-04-02T00:00:00Z',
    } as any;

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        bounds: { firstTime: first, lastTime: last, count: 4 },
        repeatPattern: 'DAILY',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.schedule.firstTime).toBe(first);
    expect(result.schedule.lastTime).toBe(last);
    expect(result.schedule.totalCount).toBe(4);
    expect((result.schedule as any).bounds).toBeUndefined();
  });

  it('parses maxDosePerInterval from AI result', async () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const plan: MedicationPlanDto = {
      name: 'Med',
      dosage: '10mg',
      totalCount: 4,
      firstTime: first,
      lastTime: last,
    };

    const aiResult = {
      medication: { name: 'Med', dosage: '10mg', quantity: 4 },
      schedule: {
        totalCount: 4,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
      maxDosePerInterval: { numerator: '2', denominator: { value: '1', unit: 'd' } },
    } as any;

    service.askAi = jest.fn().mockResolvedValue(JSON.stringify(aiResult));

    const result = await service.analyzeMedicationPlan(plan);

    expect(result.maxDosePerInterval).toEqual({
      numerator: 2,
      denominator: { value: 1, unit: 'd' },
    });
    expect(service.validateMedicationPlan(result)).toEqual([]);
  });

  it('validateMedicationPlan detects lastTime before firstTime', () => {
    const first = new Date('2024-05-02T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T08:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg' },
      schedule: {
        totalCount: 2,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        {
          field: 'schedule.lastTime',
          message: 'lastTime must be later than or equal to firstTime',
        },
      ]),
    );
  });

  it('validateMedicationPlan detects insufficient totalCount', () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-03T08:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg' },
      schedule: {
        totalCount: 2,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'schedule.totalCount' }),
      ]),
    );
  });

  it('validateMedicationPlan allows future lastTime and clamps doses', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-03T12:00:00Z'));
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-05T08:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg' },
      schedule: {
        totalCount: 5,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    });
    jest.useRealTimers();

    expect(errors).toEqual([]);
  });

  it('validateMedicationPlan reports error when no remaining doses', () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-05-03T12:00:00Z'));
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-05T08:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg' },
      schedule: {
        totalCount: 3,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }],
      },
    });
    jest.useRealTimers();

    expect(errors).toEqual(
      expect.arrayContaining([
        {
          field: 'schedule.totalCount',
          message: 'totalCount leaves no remaining doses',
        },
      ]),
    );
  });

  it('validateMedicationData skips schedule inference when schedule provided', () => {
    const med = {
      name: 'Med',
      instructions: 'take daily',
      schedule: { repeatPattern: 'WEEKLY', times: [{ time: '08:00', dosageQty: 1, dosageUnit: 'unit' }] },
    } as any;

    const errors = service.validateMedicationData(med);

    expect(errors).toEqual([]);
    expect(med.schedule.repeatPattern).toBe('WEEKLY');
    expect(med.schedule.interval).toBeUndefined();
  });

  it('validateMedicationPlan passes with schedule times at plan level', () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-02T08:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg', instructions: 'take daily' },
      schedule: {
        totalCount: 3,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        times: ['08:00'],
      },
    });

    expect(errors).toEqual([]);
  });

  it('validateMedicationPlan allows PRN plan with maxDosePerInterval and frequency info', () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg', instructions: 'take as needed' },
      asNeeded: { boolean: true, reason: 'pain' },
      maxDosePerInterval: { numerator: 2, denominator: { value: 1, unit: 'd' } },
      schedule: {
        totalCount: 10,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
        frequency: 2,
        intervalUnit: 'd',
      },
    });

    expect(errors).toEqual([]);
  });

  it('validateMedicationPlan errors for PRN plan missing frequency/intervalUnit', () => {
    const first = new Date('2024-05-01T08:00:00Z').toISOString();
    const last = new Date('2024-05-01T20:00:00Z').toISOString();

    const errors = service.validateMedicationPlan({
      medication: { name: 'Med', dosage: '10mg', instructions: 'take as needed' },
      asNeeded: { boolean: true, reason: 'pain' },
      maxDosePerInterval: { numerator: 2, denominator: { value: 1, unit: 'd' } },
      schedule: {
        totalCount: 10,
        firstTime: first,
        lastTime: last,
        repeatPattern: 'DAILY',
      },
    });

    expect(errors).toEqual([
      {
        field: 'schedule.times',
        message: 'times must be provided or frequency/intervalUnit specified',
      },
    ]);
  });
});
