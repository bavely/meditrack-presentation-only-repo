import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth-guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Device, RegisterPushTokenInput } from './models/device.model';
import { DeviceResponse } from './dto/device-response.dto';

@Resolver(() => Device)
export class DeviceResolver {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => DeviceResponse)
  async registerPushToken(
    @CurrentUser() user: { sub?: string } | undefined,
    @Args('input') input: RegisterPushTokenInput,
  ): Promise<DeviceResponse> {
    if (!user?.sub) {
      return {
        success: false,
        errors: [
          {
            field: 'user',
            message: 'Authenticated user not found',
          },
        ],
      };
    }

    try {
      const deviceRecord = await this.prisma.device.upsert({
        where: { expoPushToken: input.token },
        update: {
          userId: user.sub,
          platform: input.platform,
          appVersion: input.appVersion,
        },
        create: {
          userId: user.sub,
          expoPushToken: input.token,
          platform: input.platform,
          appVersion: input.appVersion,
        },
      });

      const responseDevice: Device = {
        ...deviceRecord,
        appVersion: deviceRecord.appVersion ?? undefined,
      };

      return {
        success: true,
        errors: [],
        data: responseDevice,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: 'registerPushToken',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to register push token',
          },
        ],
      };
    }
  }
}

