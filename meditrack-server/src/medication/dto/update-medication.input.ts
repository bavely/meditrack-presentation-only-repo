import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateMedicationInput } from './add-medication.input';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateMedicationInput extends PartialType(CreateMedicationInput) {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
