import { InputType, Field } from '@nestjs/graphql';
import {UpdateUserPreferencesInput } from './update-user-preferences.input';
@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  confirmationSentAt?: Date;

  @Field()
  gender: string;

  @Field()
  dob: Date;

  @Field(() => UpdateUserPreferencesInput, { nullable: true })
  preferences?: UpdateUserPreferencesInput;

}
