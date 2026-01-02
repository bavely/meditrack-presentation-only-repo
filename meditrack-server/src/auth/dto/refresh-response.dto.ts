// src/auth/dto/refresh-response.dto.ts
import { ObjectType } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { RefreshPayload } from './refresh-payload.dto';

@ObjectType()
export class RefreshResponse extends ResponseType(RefreshPayload) {}