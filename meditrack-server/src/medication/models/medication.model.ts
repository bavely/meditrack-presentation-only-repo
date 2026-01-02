import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Schedule } from '../../schedule/models/schedule.model';

@ObjectType()
export class Medication {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  strength: string;

  @Field()
  quantity: number;

  @Field()
  quantityLeft: number;

  @Field(() => String, { nullable: true })
  instructions?: string | null;

  @Field(() => Date, { nullable: true })
  medicationStartDate?: Date | null;

  @Field(() => Date, { nullable: true })
  estimatedEndDate?: Date | null;

  @Field(() => String, { nullable: true })
  therapy?: string | null;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => Boolean, { defaultValue: false })
  isArchived: boolean;

  @Field(() => Date, { nullable: true })
  archivedAt?: Date | null;

  @Field(() => Boolean, { defaultValue: true })
  isReminderOn: boolean;

  @Field()
  userId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Schedule, { nullable: true })
  schedule?: Schedule | null;
}
