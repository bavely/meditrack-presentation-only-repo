import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class RefreshPayload {
  @Field() 
  accessToken!: string;
}