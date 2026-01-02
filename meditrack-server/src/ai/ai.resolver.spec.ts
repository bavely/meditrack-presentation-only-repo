import { Test, TestingModule } from '@nestjs/testing';
import { AiResolver } from './ai.resolver';
import { AiService } from './ai.service';
import { MedicationInfoService } from './medication-info.service';

describe('AiResolver', () => {
  let resolver: AiResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiResolver,
        { provide: AiService, useValue: {} },
        { provide: MedicationInfoService, useValue: { getMedicationInfo: jest.fn() } },
      ],
    }).compile();

    resolver = module.get<AiResolver>(AiResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
