
// src/common/dto/response.interface.ts
import { FieldError } from './field-error.dto';

export interface IResponse<T> {
  success: boolean;
  errors: FieldError[];
  data?: T;
}