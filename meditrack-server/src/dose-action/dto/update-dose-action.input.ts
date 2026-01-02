import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateDoseActionInput } from './create-dose-action.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateDoseActionInput extends PartialType(CreateDoseActionInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
