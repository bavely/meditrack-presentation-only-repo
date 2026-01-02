import { ObjectType, Field } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { ParsedLabel } from '../models/ai-label-response';

@ObjectType()
export class ParselabelResponse extends ResponseType<ParsedLabel>(ParsedLabel) {}
