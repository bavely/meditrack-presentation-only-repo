import { ObjectType, Field } from '@nestjs/graphql';
import { DoseTime } from '../../schedule/models/dose-time.model';
import { DoseAction } from './dose-action.model';

@ObjectType()
export class DoseTimeWithActions extends DoseTime {
  @Field(() => [DoseAction])
  doseActions: DoseAction[];
}
