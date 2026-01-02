import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { ResponseType } from '../../common/dto/response.dto';

@ObjectType()
export class UserResponse extends ResponseType(User) {}

