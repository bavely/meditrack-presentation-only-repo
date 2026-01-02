import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { Medication } from './models/medication.model';
import { CreateMedicationInput } from './dto/add-medication.input';
import { CreateMedicationExtendedInput } from './dto/create-medication-extended.input';
import { UpdateMedicationInput } from './dto/update-medication.input';
import {
  MedicationResponse,
  MedicationListResponse,
} from './dto/medication-response.dto';
import { MedicationWithScheduleResponse } from './dto/medication-with-schedule-response.dto';
import { RegisterMedicationAiInput } from './dto/register-medication-ai.input';
import { ScheduleService } from '../schedule/schedule.service';
import { AiService } from '../ai/ai.service';
import { GqlAuthGuard } from '../common/guards/gql-auth-guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserService } from 'src/user/user.service';

@Resolver(() => Medication)
export class MedicationResolver {
  private readonly logger = new Logger(MedicationResolver.name);
  
  constructor(
    private readonly medicationService: MedicationService,
    private readonly scheduleService: ScheduleService,
    private readonly aiService: AiService,
    private readonly userService: UserService,
  ) {}

  @Query(() => MedicationListResponse, { name: 'medications' })
  @UseGuards(GqlAuthGuard)
  async getMedications(@CurrentUser() user): Promise<Medication[]> {
    const medications = await this.medicationService.findAll(user.sub);
    console.log('Retrieved medications:', medications);
    return (medications) as any;
  }

  @Query(() => MedicationResponse, { name: 'medication' })
  @UseGuards(GqlAuthGuard)
  async getMedication(
    @Args('id') id: string,
    @CurrentUser() user,
  ): Promise<Medication> {
    return (await this.medicationService.findOne(id, user.sub)) as any;
  }

  @Mutation(() => MedicationResponse)
  @UseGuards(GqlAuthGuard)
  async createMedication(
    @Args('input') input: CreateMedicationInput,
    @CurrentUser() user,
  ): Promise<Medication> {
    return (await this.medicationService.create(user.sub, input)) as any;
  }

  @Mutation(() => MedicationResponse)
  @UseGuards(GqlAuthGuard)
  async updateMedication(
    @Args('input') input: UpdateMedicationInput,
    @CurrentUser() user,
  ): Promise<Medication> {
    return (await this.medicationService.update(input.id, user.sub, input)) as any;
  }

  @Mutation(() => MedicationResponse)
  @UseGuards(GqlAuthGuard)
  async deleteMedication(
    @Args('id') id: string,
    @CurrentUser() user,
  ): Promise<Medication> {
    return (await this.medicationService.remove(id, user.sub)) as any;
  }

  @Mutation(() => MedicationWithScheduleResponse)
  @UseGuards(GqlAuthGuard)
  async registerMedicationWithAi(
    @Args('input') input: RegisterMedicationAiInput,
    @CurrentUser() user,
  ) {

    let userFromDb = await this.userService.findById(user.sub);

    if (!userFromDb) {
      throw new Error('User not found');
    }

    let payload = {
      userBedTime: userFromDb.bedTime,
      userBreakfastTime: userFromDb.breakfastTime,
      userLunchTime: userFromDb.lunchTime,
      userDinnerTime: userFromDb.dinnerTime,
      userExerciseTime: userFromDb.exerciseTime,
      ...input
    };

    const { medication: medInput, schedule: schedInput } =
      await this.aiService.analyzeMedicationPlan(payload);
 this.logger.debug('Registering medication with AI', { medication: medInput, schedule: schedInput });
    schedInput.lastTime = input.lastTime || schedInput.lastTime;
    const firstDoseDate =  schedInput.lastTime || schedInput.firstTime;
    const quantityLeft = schedInput.quantityLeft || 0;
    const medicationStartDate = firstDoseDate
      ? new Date(firstDoseDate).toISOString()
      : undefined;

    const scheduleInput = this.scheduleService.fromAiSchedule(schedInput);
    const { estimatedEndDate, ...scheduleData } = scheduleInput;


    const medicationInput: CreateMedicationExtendedInput = {
      ...medInput,
      quantity: schedInput.totalCount,
      totalCount: schedInput.totalCount,
      quantityLeft,
      medicationStartDate,
      estimatedEndDate,
    };
    const medication = await this.medicationService.create(
      user.sub,
      medicationInput,
    );
    this.logger.debug('Schedule input', scheduleInput);
    const schedule = await this.scheduleService.create(user.sub, {
      medicationId: medication.id,
      ...scheduleData,
    });
    this.logger.debug('Created schedule', schedule);
    // Return the actual persisted upcoming doseTimes (as ISO strings) for convenience
    const createdDoseTimes = (schedule as any).doseTimes?.map((dt: any) => new Date(dt.scheduledAt).toISOString());
    this.logger.debug('Created dose times', createdDoseTimes);
    return { success: true, errors: [], data: { medication, schedule, doseTimes: createdDoseTimes } } as any;
  }
}
