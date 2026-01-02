import { Test, TestingModule } from '@nestjs/testing';
import { MedicationService } from './medication.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MedicationService', () => {
  let service: MedicationService;

  beforeEach(async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicationService, PrismaService],
    }).compile();

    service = module.get<MedicationService>(MedicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
