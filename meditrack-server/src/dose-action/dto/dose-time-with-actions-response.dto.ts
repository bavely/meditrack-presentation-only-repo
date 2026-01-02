import { ObjectType, Field } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { FieldError } from '../../common/dto/field-error.dto';
import { DoseTimeWithActions } from '../models/dose-time-with-actions.model';

@ObjectType()
export class DoseTimeWithActionsResponse extends ResponseType(DoseTimeWithActions) {}

@ObjectType()
export class DoseTimeWithActionsListResponse {
  @Field()
  success: boolean;

  @Field(() => [FieldError])
  errors: FieldError[];

  @Field(() => [DoseTimeWithActions], { nullable: true })
  data?: DoseTimeWithActions[];
}
