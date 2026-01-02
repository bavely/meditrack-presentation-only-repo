import { InputType, Field } from '@nestjs/graphql';
import { DoseActionType } from '../../common/enums/dose-action-type.enum';
import { IsUUID, IsDateString, IsOptional } from 'class-validator';

@InputType()
export class CreateDoseActionInput {
  @Field()
  @IsUUID()
  medicationId: string;

  @Field()
  @IsUUID()
  doseTimeId: string;

  @Field(() => DoseActionType)
  actionType: DoseActionType;

  @Field()
  @IsDateString()
  actionTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  snoozedUntil?: string;

  @Field({ nullable: true })
  @IsOptional()
  snoozeCount?: number;
}
