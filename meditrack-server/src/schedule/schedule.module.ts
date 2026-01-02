import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleService } from './schedule.service';
import { ScheduleResolver } from './schedule.resolver';

@Module({
  imports: [PrismaModule],
  providers: [ScheduleService, ScheduleResolver],
  exports: [ScheduleService],
})
export class MedicationScheduleModule {}
