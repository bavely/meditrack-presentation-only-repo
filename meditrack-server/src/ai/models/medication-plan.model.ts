import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { RepeatPattern } from '../../common/enums/repeat-pattern.enum';

@ObjectType()
export class PlannedDoseTime {
  @Field()
  time: string; // HH:mm (24h)

  @Field(() => Int)
  dosageQty: number;

  @Field()
  dosageUnit: string;
}

@ObjectType()
export class PlannedMedication {
  @Field()
  name: string;

  @Field()
  strength: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int, { nullable: true })
  doseQuantity?: number;

  @Field({ nullable: true })
  doseUnit?: string;

  @Field({ nullable: true })
  route?: string;

  @Field({ nullable: true })
  instructions?: string;

  @Field({ nullable: true })
  therapy?: string;
}

@ObjectType()
export class PlannedBounds {
  @Field({ nullable: true })
  firstTime?: string;

  @Field({ nullable: true })
  lastTime?: string;

  @Field(() => Int, { nullable: true })
  count?: number;
}

@ObjectType()
export class MaxDosePerIntervalDenominator {
  @Field(() => Float, { nullable: true })
  value?: number | null;

  @Field(() => String, { nullable: true })
  unit?: string | null;
}

@ObjectType()
export class MaxDosePerInterval {
  @Field(() => Float, { nullable: true })
  numerator?: number | null;

  @Field(() => MaxDosePerIntervalDenominator, { nullable: true })
  denominator?: MaxDosePerIntervalDenominator | null;
}

@ObjectType()
export class PlannedSchedule {
  @Field(() => Int)
  totalCount: number;

  @Field()
  firstTime: string;

  @Field()
  lastTime: string;

  @Field(() => RepeatPattern, { nullable: true })
  repeatPattern?: RepeatPattern;

  @Field(() => Int, { nullable: true })
  interval?: number;

   @Field(() => Int, { nullable: true })
   frequency?: number;

   @Field(() => Int, { nullable: true })
   frequencyMax?: number;

   @Field(() => Int, { nullable: true })
   intervalMax?: number;

   @Field({ nullable: true })
   intervalUnit?: string;

   @Field(() => [String], { nullable: true })
   timeOfDay?: string[];

   @Field(() => [String], { nullable: true })
   dayOfWeek?: string[];

   @Field(() => [String], { nullable: true })
   when?: string[];

   @Field(() => Int, { nullable: true })
   offset?: number;

   @Field(() => Int, { nullable: true })
   quantityLeft?: number;

  @Field(() => [PlannedDoseTime], { nullable: true })
  // Times during each dosing day with optional per-time dosage
  times?: PlannedDoseTime[];

  @Field(() => [String], { nullable: true })
  doseDates?: string[];

  @Field(() => PlannedBounds, {
    nullable: true,
    description:
      'Optional raw bounds returned by AI; normalized into top-level fields and removed after parsing.',
  })
  bounds?: PlannedBounds | null;
}

@ObjectType()
export class MedicationPlan {
  @Field(() => PlannedMedication)
  medication: PlannedMedication;

  @Field(() => PlannedSchedule)
  schedule: PlannedSchedule;

  @Field(() => MaxDosePerInterval, { nullable: true })
  maxDosePerInterval?: MaxDosePerInterval | null;
}

