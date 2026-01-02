import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsUUID,
  IsDateString,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  Min,
  IsString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RepeatPattern } from '../../common/enums/repeat-pattern.enum';

@InputType()
export class DoseTimeInput {
  @Field()
  @IsDateString()
  scheduledAt: string; // ISO datetime string

  @Field(() => Int)
  @IsInt()
  @Min(1)
  dosageQty: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  dosageUnit: string;
}

@InputType()
export class CreateScheduleInput {
  @Field()
  @IsUUID()
  medicationId: string;

  @Field(() => RepeatPattern)
  repeatPattern: RepeatPattern;

  @Field()
  @IsDateString()
  startDate: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  durationDays: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  interval?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @Field(() => [DoseTimeInput])
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DoseTimeInput)
  times: DoseTimeInput[];

  @Field(() => Int)
  @IsInt()
  @Min(1)
  frequency: number;
}
