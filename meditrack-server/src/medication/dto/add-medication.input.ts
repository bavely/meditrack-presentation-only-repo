import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsInt, Min, IsOptional, IsDateString, IsBoolean } from 'class-validator';

@InputType()
export class CreateMedicationInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  strength: string;

  @Field()
  @IsInt()
  @Min(1)
  quantity: number; // total pills provided

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  instructions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  medicationStartDate?: string; // ISO string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  therapy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: string; // ISO string

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isReminderOn?: boolean;
}
