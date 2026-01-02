import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { MedicationInfoService } from './medication-info.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AiService, AiResolver, MedicationInfoService],
  exports: [MedicationInfoService],
})
export class AiModule {}
