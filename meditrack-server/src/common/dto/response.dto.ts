import { ObjectType, Field } from '@nestjs/graphql';
import { FieldError } from './field-error.dto';
import { IResponse } from './response.interface';
import { ClassType } from './types';
export function ResponseType<TItem>(TClass: ClassType<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class ResponseClass implements IResponse<TItem> {
    @Field()                  success!: boolean;
    @Field(() => [FieldError]) errors!: FieldError[];
    @Field(() => TClass, { nullable: true }) data?: TItem;
  }
  return ResponseClass;
}