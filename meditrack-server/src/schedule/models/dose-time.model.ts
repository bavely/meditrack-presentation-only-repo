import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class DoseTime {
  @Field(() => ID)
  id: string;

  @Field()
  scheduleId: string;

  @Field()
  time: Date;

  @Field()
  scheduledAt: Date;

  @Field(() => Int)
  dosageQty: number;

  @Field()
  dosageUnit: string;
}
