import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateUserPreferencesInput {
  @Field(() => Date, { nullable: true })
  bedTime?: Date | null;

  @Field(() => Date, { nullable: true })
  breakfastTime?: Date | null;

  @Field(() => Date, { nullable: true })
  lunchTime?: Date | null;

  @Field(() => Date, { nullable: true })
  dinnerTime?: Date | null;

  @Field(() => Date, { nullable: true })
  exerciseTime?: Date | null;
}

