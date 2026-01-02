import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, Min, IsISO8601 } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType({ description: 'Payload for registering a medication with AI assistance.' })
export class RegisterMedicationAiInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  strength: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  therapy?: string;

  /**
   * Total number of doses available. Must be enough to cover all doses
   * between firstTime and lastTime based on the planned daily schedule.
   */
  @Field(() => Int, {
    description:
      'Total doses available. Must cover all scheduled doses (durationDays * times per day).',
  })
  @IsInt()
  @Min(1)
  totalCount: number;

  /**
   * ISO 8601 timestamp for the first scheduled dose.
   */
  @Field(() => Date, { description: 'ISO 8601 timestamp for the first scheduled dose.' })
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @IsISO8601()
  firstTime: string;

  /**
   * ISO 8601 timestamp for the last scheduled dose. Must be later than firstTime.
   */
  @Field(() => Date, {
    description: 'ISO 8601 timestamp for the last scheduled dose; must be later than firstTime.',
  })
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @IsISO8601()
  lastTime: string;
}
// * the two dates and time are entered by the user at the first time of registration a new medication and these two values are used to determine the remaining quantity of the medication and estimatedEndDate based on the user's input of the total count.