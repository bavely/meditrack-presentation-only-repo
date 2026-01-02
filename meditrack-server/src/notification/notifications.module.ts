import { Module, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module'; // ✅ import

@Module({
  imports: [PrismaModule], // ✅ required for PrismaService injection
  providers: [NotificationsService, Logger],
  exports: [NotificationsService],
})
export class NotificationsModule {}
