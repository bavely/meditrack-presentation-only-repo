import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User as PrismaUser } from '@prisma/client';
import { GraphQLJSONObject } from 'graphql-type-json';
@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  aud: string;

  @Field()
  role: string;

  @Field()
  email: string;

  // omit password from GraphQL for security

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field()
  prefersPush: boolean;

  @Field()
  prefersSms: boolean;

  @Field()
  timezone: string;

  @Field(() => Date, { nullable: true })
  lastSignInAt?: Date;

  @Field()
  emailVerified: boolean;

  @Field()
  phoneVerified: boolean;

  @Field(() => Date, { nullable: true })
  emailConfirmedAt?: Date;

  @Field(() => Date, { nullable: true })
  confirmationSentAt?: Date;

  @Field(() => Date, { nullable: true })
  phoneConfirmedAt?: Date;

  @Field(() => Date, { nullable: true })
  phoneConfirmationSentAt?: Date;

  @Field(() => Date, { nullable: true })
  bedTime?: Date | null;

  @Field(() => Date, { nullable: true })
  breakfastTime?: Date | null;

  @Field(() => Date, { nullable: true })
  lunchTime?: Date | null;

  @Field(() => Date, { nullable: true })
  dinnerTime?: Date | null;

  @Field(() => Date, { nullable: true })
  exerciseTime?: Date | null;

  @Field()
  gender: string;

  @Field(() => Date)
  dob: Date;

  @Field(() => GraphQLJSONObject, { nullable: true })
  appMetadata?: Record<string, any>;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  constructor(prismaUser: PrismaUser) {
    Object.assign(this, prismaUser);
  }
}
