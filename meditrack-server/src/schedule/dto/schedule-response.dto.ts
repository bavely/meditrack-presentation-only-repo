import { ObjectType, Field } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { FieldError } from '../../common/dto/field-error.dto';
import { Schedule } from '../models/schedule.model';

@ObjectType()
export class ScheduleResponse extends ResponseType(Schedule) {}

@ObjectType()
export class ScheduleListResponse {
  @Field()
  success: boolean;

  @Field(() => [FieldError])
  errors: FieldError[];

  @Field(() => [Schedule], { nullable: true })
  data?: Schedule[];
}
