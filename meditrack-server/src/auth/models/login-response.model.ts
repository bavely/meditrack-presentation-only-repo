// src/auth/models/login-response.model.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => User, { nullable: true, description: 'Logged-in user object' })
  user!: User | null;
}
