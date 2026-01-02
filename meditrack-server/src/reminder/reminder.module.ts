import { Module, Logger } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { MedicationModule } from '../medication/medication.module';
import { NotificationsModule } from '../notification/notifications.module';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    MedicationModule,
    NotificationsModule,
    UserModule,
    PrismaModule,
  ],
  providers: [ReminderService, Logger],
})
export class ReminderModule {}
