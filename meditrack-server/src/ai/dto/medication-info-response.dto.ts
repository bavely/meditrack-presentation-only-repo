import { Field, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { FieldError } from '../../common/dto/field-error.dto';

@ObjectType()
export class AiMessage {
  @Field()
  id!: string;

  @Field()
  role!: string;

  @Field()
  content!: string;

  @Field(() => GraphQLISODateTime)
  timestamp!: Date;
}

@ObjectType()
export class AiConversation {
  @Field()
  conversationId!: string;

  @Field({ nullable: true })
  title?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;

  @Field(() => [AiMessage])
  messages!: AiMessage[];
}

@ObjectType()
export class AiConversationSummary {
  @Field()
  conversationId!: string;

  @Field({ nullable: true })
  title?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class AiConversationResponse extends ResponseType(AiConversation) {}

@ObjectType()
export class MedicationInfoResponse extends ResponseType(AiConversation) {}

@ObjectType()
export class AiConversationListResponse {
  @Field()
  success!: boolean;

  @Field(() => [FieldError])
  errors!: FieldError[];

  @Field(() => [AiConversationSummary], { nullable: true })
  data?: AiConversationSummary[];
}

@ObjectType()
export class DeleteConversationData {
  @Field()
  conversationId!: string;
}

@ObjectType()
export class DeleteConversationResponse {
  @Field()
  success!: boolean;

  @Field(() => [FieldError])
  errors!: FieldError[];

  @Field(() => DeleteConversationData, { nullable: true })
  data?: DeleteConversationData;
}
