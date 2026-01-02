import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { RepeatPattern } from '../../common/enums/repeat-pattern.enum';
import { DoseTime } from './dose-time.model';

@ObjectType()
export class Schedule {
  @Field(() => ID)
  id: string;

  @Field()
  medicationId: string;

  @Field(() => RepeatPattern)
  repeatPattern: RepeatPattern;

  @Field(() => Int)
  interval: number;

  @Field(() => Int)
  frequency: number;

  @Field()
  startDate: Date;

  @Field(() => Int)
  durationDays: number;

  @Field(() => [DoseTime])
  doseTimes: DoseTime[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
