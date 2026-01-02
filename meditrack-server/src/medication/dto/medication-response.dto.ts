import { ObjectType, Field } from '@nestjs/graphql';
import { Medication } from '../models/medication.model';
import { ResponseType } from '../../common/dto/response.dto';
import { FieldError } from '../../common/dto/field-error.dto';

@ObjectType()
export class MedicationResponse extends ResponseType(Medication) {}

@ObjectType()
export class MedicationListResponse {
  @Field()
  success: boolean;

  @Field(() => [FieldError])
  errors: FieldError[];

  @Field(() => [Medication], { nullable: true })
  data?: Medication[];
}
