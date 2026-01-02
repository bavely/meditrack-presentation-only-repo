import { ObjectType, Field } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { FieldError } from '../../common/dto/field-error.dto';
import { DoseAction } from '../models/dose-action.model';

@ObjectType()
export class DoseActionResponse extends ResponseType(DoseAction) {}

@ObjectType()
export class DoseActionListResponse {
  @Field()
  success: boolean;

  @Field(() => [FieldError])
  errors: FieldError[];

  @Field(() => [DoseAction], { nullable: true })
  data?: DoseAction[];
}
