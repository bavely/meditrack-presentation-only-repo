import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsISO8601,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RepeatPattern } from '../../common/enums/repeat-pattern.enum';

@InputType()
export class MedicationPlanDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  strength: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  doseQuantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  doseUnit?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  route?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  therapy?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  totalCount: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  quantityLeft?: number;

  @Field(() => Date)
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @IsNotEmpty()
  @IsISO8601()
  firstTime: string;

  @Field(() => Date)
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @IsNotEmpty()
  @IsISO8601()
  lastTime: string;

  @Field(() => RepeatPattern, { nullable: true })
  @IsOptional()
  @IsEnum(RepeatPattern)
  repeatPattern?: RepeatPattern;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  frequency?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  frequencyMax?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  intervalMax?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  intervalUnit?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeOfDay?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dayOfWeek?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  when?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offset?: number;

  @Field(() => [Date], { nullable: true })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => (v instanceof Date ? v.toISOString() : v))
      : value,
  )
  @IsISO8601({}, { each: true })
  doseDates?: string[];
}

