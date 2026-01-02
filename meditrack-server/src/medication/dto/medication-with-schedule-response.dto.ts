import { ObjectType, Field } from '@nestjs/graphql';
import { ResponseType } from '../../common/dto/response.dto';
import { Medication } from '../models/medication.model';
import { Schedule } from '../../schedule/models/schedule.model';

@ObjectType()
export class MedicationWithSchedule {
  @Field(() => Medication)
  medication: Medication;

  @Field(() => Schedule)
  schedule: Schedule;

  @Field(() => [String], { nullable: true })
  doseTimes?: string[];
}

@ObjectType()
export class MedicationWithScheduleResponse extends ResponseType(MedicationWithSchedule) {}
