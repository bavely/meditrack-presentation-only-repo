// src/common/guards/gql-auth.guard.ts
import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(GqlAuthGuard.name);
  getRequest(context: ExecutionContext) {
    this.logger.debug('GqlAuthGuard getRequest called');
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req; // critical: returns request object for Passport
  }
}

