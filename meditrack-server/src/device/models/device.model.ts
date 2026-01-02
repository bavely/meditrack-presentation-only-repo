import { ObjectType, Field, InputType } from '@nestjs/graphql';

@ObjectType() export class Device {
  @Field() id: string;
  @Field() expoPushToken: string;
  @Field() platform: string;
  @Field({ nullable: true }) appVersion?: string;
  @Field() notificationsOn: boolean;
  @Field() createdAt: Date;
  @Field() lastSeenAt: Date;
}

@InputType() export class RegisterPushTokenInput {
  @Field() token: string;
  @Field() platform: string; // "ios" | "android"
  @Field({ nullable: true }) appVersion?: string;
}