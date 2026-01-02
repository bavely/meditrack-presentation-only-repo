import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { Schedule } from './models/schedule.model';
import { CreateScheduleInput } from './dto/create-schedule.input';
import { UpdateScheduleInput } from './dto/update-schedule.input';
import { ScheduleResponse } from './dto/schedule-response.dto';
import { GqlAuthGuard } from '../common/guards/gql-auth-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => Schedule)
export class ScheduleResolver {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Query(() => ScheduleResponse, { name: 'schedule' })
  @UseGuards(GqlAuthGuard)
  async getSchedule(
    @Args('medicationId') medicationId: string,
    @CurrentUser() user,
  ): Promise<Schedule> {
    return (await this.scheduleService.findByMedication(
      medicationId,
      user.sub,
    )) as any;
  }

  @Mutation(() => ScheduleResponse)
  @UseGuards(GqlAuthGuard)
  async createSchedule(
    @Args('input') input: CreateScheduleInput,
    @CurrentUser() user,
  ): Promise<Schedule> {
    return (await this.scheduleService.create(user.sub, input)) as any;
  }

  @Mutation(() => ScheduleResponse)
  @UseGuards(GqlAuthGuard)
  async updateSchedule(
    @Args('input') input: UpdateScheduleInput,
    @CurrentUser() user,
  ): Promise<Schedule> {
    return (await this.scheduleService.update(user.sub, input)) as any;
  }

  @Mutation(() => ScheduleResponse)
  @UseGuards(GqlAuthGuard)
  async deleteSchedule(
    @Args('id') id: string,
    @CurrentUser() user,
  ): Promise<Schedule> {
    return (await this.scheduleService.remove(id, user.sub)) as any;
  }
}
