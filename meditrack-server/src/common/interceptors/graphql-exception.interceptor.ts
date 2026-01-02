import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GraphQLError } from 'graphql';
import { FieldError } from '../dto/field-error.dto';

@Injectable()
export class GraphqlExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<GqlContextType>() !== 'graphql') {
      return next.handle();
    }
    return next.handle().pipe(
      map((result) => {
        if (
          result != null &&
          typeof result === 'object' &&
          'success' in result &&
          'errors' in result
        ) {
          return result;
        }
        return { success: true, errors: [], data: result };
      }),
      catchError((err) => {
        // build your envelope
        const envelope = {
          success: false,
          errors: [
            {
              field: err.extensions?.field || 'unknown',
              message: err.message || 'Internal server error',
            } as FieldError,
          ],
          data: null,
        };
        // throw a real GraphQLError with your envelope in extensions
        throw new GraphQLError(envelope.errors[0].message, {
          extensions: envelope,
        });
      }),
    );
  }
}
