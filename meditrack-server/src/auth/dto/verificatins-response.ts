import { ObjectType, Field } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
@ObjectType()
export class VerificationsPayload {
  @Field() 
  message!: string;
}

@ObjectType()
export class VerificationsResponse extends ResponseType(VerificationsPayload) {}

