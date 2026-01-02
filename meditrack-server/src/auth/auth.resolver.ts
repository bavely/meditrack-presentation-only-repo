// src/auth/auth.resolver.ts
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserInput } from '../user/dto/register-user.input';
import {RefreshResponse} from './dto/refresh-response.dto';
import { GqlAuthGuard } from '../common/guards/gql-auth-guard';
import { AuthResponse } from './dto/auth-response.dto';
import {VerificationsResponse} from './dto/verificatins-response';
@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => AuthResponse, { name: 'registerUser' })
  async registerUser(
    @Args('input') input: CreateUserInput,
  ): Promise<AuthResponse> {
    this.logger.debug(`Registering user with email: ${input.email}`);
    // First create the user in your DB:
    await this.auth.register(input);

    // Log the user in using plain email and password arguments
    const { accessToken, refreshToken, user } = await this.auth.login(
      input.email,
      input.password,
    );

    return {
      success: true,
      errors: [],
      data: {
        accessToken,
        refreshToken,
        user,
      },
    };

   
  }

  @Mutation(() => AuthResponse, { name: 'login' })
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthResponse> {
    console.log(`Logging in user with email: ${email}`);
     const { accessToken, refreshToken, user } = await this.auth.login(email, password);

    return {
      success: true,
      errors: [],
      data: {
        accessToken,
        refreshToken,
        user,
      },
    };
  }

  @Mutation(() => RefreshResponse, { name: 'refreshToken' })
  @UseGuards(GqlAuthGuard)
  async refresh(
    @Args('refreshToken') refreshToken: string,
    @Context('req') req: any,
  ): Promise<RefreshResponse> {
    // req.user was populated by your JWT guard → contains { sub, email }
    const { accessToken } = await this.auth.refresh(req.user.sub, refreshToken);

    return {
      success: true,
      errors: [],
      data: {
        accessToken,
      },
    };

  }

  @Mutation(() => VerificationsResponse, { name: 'logout' })
  @UseGuards(GqlAuthGuard)
  async logout(@Context('req') req: any): Promise<VerificationsResponse> {
    await this.auth.logout(req.user.sub);
    return {
      success: true,
      errors: [],
      data: { message: 'Logged out' },
    };
  }

  @Mutation(() => VerificationsResponse, { name: 'verifyEmail' })
  async verifyEmail(@Args('token') token: string) : Promise<VerificationsResponse> {
    const result = await this.auth.verifyEmail(token);

return {
  success: true,
  errors: [],
  data: {
    message: result,
  },
};
  }

  @Mutation(() => VerificationsResponse, { name: 'resendVerificationEmail' })
  async resendVerificationEmail(@Args('token') token: string) : Promise<VerificationsResponse>  { 
    const result = await this.auth.requestNewEmailVerification(token);
  
    return {
      success: true,
      errors: [],
      data: {
        message: result,
      },
    };
  }

  @Mutation(() => VerificationsResponse, { name: 'forgotPassword' })
  async forgotPassword(@Args('email') email: string): Promise<VerificationsResponse> {
    const result = await this.auth.requestPasswordReset(email);

    return {
      success: true,
      errors: [],
      data: {
        message: result,
      },
    };
  }

  @Mutation(() => VerificationsResponse, { name: 'resetPassword' })
  async resetPassword(
    @Args('token') token: string,
    @Args('password') password: string,
  ): Promise<VerificationsResponse> {
    const result = await this.auth.resetPassword(token, password);

    return {
      success: true,
      errors: [],
      data: {
        message: result,
      },
    };
  }


}
