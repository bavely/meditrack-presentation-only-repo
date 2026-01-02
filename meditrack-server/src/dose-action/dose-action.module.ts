import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DoseActionService } from './dose-action.service';
import { DoseActionResolver } from './dose-action.resolver';

@Module({
  imports: [PrismaModule],
  providers: [DoseActionService, DoseActionResolver],
  exports: [DoseActionService],
})
export class DoseActionModule {}

export { DoseTimeWithActions } from './models/dose-time-with-actions.model';
export {
  DoseTimeWithActionsResponse,
  DoseTimeWithActionsListResponse,
} from './dto/dose-time-with-actions-response.dto';
