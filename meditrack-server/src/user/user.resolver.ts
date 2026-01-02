import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './models/user.model';
import { UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {GqlAuthGuard } from "../common/guards/gql-auth-guard"
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserResponse } from './dto/user-response';
import { UpdateUserPreferencesInput } from './dto/update-user-preferences.input';
@Resolver(() => User)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);
  constructor(private readonly userService: UserService) {}

  @Query(() => UserResponse, { name: 'getUser' })
  @UseGuards(GqlAuthGuard)
  async getUser(@CurrentUser() user) {
    this.logger.debug(`Fetching data for user ${user?.sub}`);
    if (!user) {
      throw new Error('User not found');
    }

    

    const userData = await this.userService.findById(user.sub);
    this.logger.debug(`Fetched user data for user ${userData?.id}`);
     return {
        success: true,
        errors: [],
        data: userData,

      };
    
  }


  @Mutation(() => UserResponse, { name: 'updateUserPreferences' })
  @UseGuards(GqlAuthGuard)
  async UpdateUserPreferences(
    @Args('input') input: UpdateUserPreferencesInput,
    @CurrentUser() user,
  ) {
console.log('Input received for updating preferences:', input);
    // Select only the fields that are provided in the input with value not null
    const updatedInput = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== null && v !== undefined),
    );

    this.logger.debug(`Updating preferences for user ${user?.sub}`);
    if (!user) {
      throw new Error('User not found');
    }

    const updated = await this.userService.updatePreferences(user.sub, updatedInput);
    return {
      success: true,
      errors: [],
      data: updated,
    };
  }
}

