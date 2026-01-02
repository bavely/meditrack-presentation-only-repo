import { ObjectType, Field, ID } from '@nestjs/graphql';
import { DoseActionType } from '../../common/enums/dose-action-type.enum';

@ObjectType()
export class DoseAction {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  medicationId: string;

  @Field(() => DoseActionType)
  actionType: DoseActionType;

  @Field()
  actionTime: Date;

  @Field({ nullable: true })
  scheduledTime?: Date;

  @Field({ nullable: true })
  snoozedUntil?: Date;

  @Field({ nullable: true })
  snoozeCount?: number;

  @Field()
  createdAt: Date;
}
