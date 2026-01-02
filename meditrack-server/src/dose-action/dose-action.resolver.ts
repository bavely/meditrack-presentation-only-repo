import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DoseActionService } from './dose-action.service';
import { DoseAction } from './models/dose-action.model';
import { CreateDoseActionInput } from './dto/create-dose-action.input';
import { UpdateDoseActionInput } from './dto/update-dose-action.input';
import {
  DoseActionResponse,
  DoseActionListResponse,
} from './dto/dose-action-response.dto';
import { DoseTimeWithActionsListResponse } from './dto/dose-time-with-actions-response.dto';
import { GqlAuthGuard } from '../common/guards/gql-auth-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver(() => DoseAction)
export class DoseActionResolver {
  constructor(private readonly doseActionService: DoseActionService) {}

  @Query(() => DoseActionListResponse, { name: 'doseActions' })
  @UseGuards(GqlAuthGuard)
  async getDoseActions(
    @Args('medicationId') medicationId: string,
    @CurrentUser() user,
  ): Promise<DoseAction[]> {
    return (await this.doseActionService.findByMedication(
      medicationId,
      user.sub,
    )) as any;
  }

  @Mutation(() => DoseActionResponse)
  @UseGuards(GqlAuthGuard)
  async logDoseAction(
    @Args('input') input: CreateDoseActionInput,
    @CurrentUser() user,
  ): Promise<DoseAction> {
    return (await this.doseActionService.create(user.sub, input)) as any;
  }

  @Mutation(() => DoseActionResponse)
  @UseGuards(GqlAuthGuard)
  async updateDoseAction(
    @Args('input') input: UpdateDoseActionInput,
    @CurrentUser() user,
  ): Promise<DoseAction> {
    return (await this.doseActionService.update(user.sub, input)) as any;
  }

  @Mutation(() => DoseActionResponse)
  @UseGuards(GqlAuthGuard)
  async deleteDoseAction(
    @Args('id') id: string,
    @CurrentUser() user,
  ): Promise<DoseAction> {
    return (await this.doseActionService.remove(id, user.sub)) as any;
  }

  @Mutation(() => DoseTimeWithActionsListResponse, { name: 'doseTimesByDate' })
  @UseGuards(GqlAuthGuard)
  async doseTimesByDate(
    @Args('date') date: string,
    @CurrentUser() user,
  ) {
    return (await this.doseActionService.findDoseTimesByDate(
      user.sub,
      date,
    )) as any;
  }


  @Mutation(() => DoseTimeWithActionsListResponse, { name: 'doseTimesByDateRange' })
  @UseGuards(GqlAuthGuard)
  async doseTimesByDateRange(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @CurrentUser() user,
  ) {
    return (await this.doseActionService.findDoseTimesByDateRange(
      user.sub,
      startDate,
      endDate,
    )) as any;
  }

  @Mutation(() => DoseActionListResponse, { name: 'doseActionsByDoseTime' })
  @UseGuards(GqlAuthGuard)
  async doseActionsByDoseTime(
    @Args('doseTimeId') doseTimeId: string,
    @CurrentUser() user,
  ) {
    return (await this.doseActionService.findDoseActionByDoseTime(
      doseTimeId,
      user.sub,
    )) as any;
    }
  }
