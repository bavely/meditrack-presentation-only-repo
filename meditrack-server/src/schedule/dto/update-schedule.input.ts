import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateScheduleInput } from './create-schedule.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateScheduleInput extends PartialType(CreateScheduleInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
