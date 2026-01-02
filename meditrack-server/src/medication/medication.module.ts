import { Module } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { MedicationResolver } from './medication.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { MedicationScheduleModule } from '../schedule/schedule.module';
import { AiService } from '../ai/ai.service';
import { UserService } from 'src/user/user.service';


@Module({
  imports: [PrismaModule, MedicationScheduleModule],
  providers: [MedicationService, MedicationResolver, AiService, UserService],
  exports: [MedicationService],
})
export class MedicationModule {}
