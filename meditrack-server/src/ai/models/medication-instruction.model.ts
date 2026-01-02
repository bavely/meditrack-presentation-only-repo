import { ObjectType, Field, Int, Float, GraphQLISODateTime  } from '@nestjs/graphql';

@ObjectType()
export class TimingBounds {
  @Field(() => GraphQLISODateTime, { nullable: true })
  start?: string | null; // ISO 8601

  @Field(() => GraphQLISODateTime, { nullable: true })
  end?: string | null; // ISO 8601

  @Field(() => Int, { nullable: true })
  count?: number | null; // total number of doses
}

@ObjectType()
export class Timing {
  @Field(() => Int, { nullable: true })
  frequency?: number | null;

  @Field(() => Int, { nullable: true })
  frequencyMax?: number | null;

  @Field(() => Float, { nullable: true })
  period?: number | null;

  @Field(() => Float, { nullable: true })
  periodMax?: number | null;

  @Field(() => String, { nullable: true })
  periodUnit?: string | null; // "s" | "min" | "h" | "d" | "wk" | "mo" | "a"

  @Field(() => [String], { nullable: true })
  timeOfDay?: string[] | null; // e.g., ["morning", "bedtime"] or explicit times "08:00"

  @Field(() => [String], { nullable: true })
  dayOfWeek?: string[] | null; // e.g., ["mon", "thu"]

  @Field(() => [String], { nullable: true })
  when?: string[] | null; // event-based codes (e.g., ["AC"], ["HS"]) 

  @Field(() => Int, { nullable: true })
  offset?: number | null; // minutes offset from event

  @Field(() => TimingBounds, { nullable: true })
  bounds?: TimingBounds | null;
}

@ObjectType()
export class AsNeeded {
  @Field()
  boolean: boolean;

  @Field(() => String, { nullable: true })
  reason?: string | null;
}

@ObjectType()
export class MaxDosePerPeriodDenominator {
  @Field(() => Float, { nullable: true })
  value?: number | null;

  @Field(() => String, { nullable: true })
  unit?: string | null; // time unit, e.g., "24 h"
}

@ObjectType()
export class MaxDosePerPeriod {
  @Field(() => Float, { nullable: true })
  numerator?: number | null; // max total dose

  @Field(() => MaxDosePerPeriodDenominator, { nullable: true })
  denominator?: MaxDosePerPeriodDenominator | null;
}

@ObjectType()
export class MedicationInstruction {
  @Field(() => String)
  medicationName: string; // name or code of the medication

  @Field(() => String)
  action: string; // e.g., "take", "apply", "inject", "inhale"

  @Field(() => Float)
  doseQuantity: number; // numeric dose

  @Field(() => String)
  doseUnit: string; // unit of the dose (tablet, capsule, mL, etc.)

  @Field(() => String)
  route: string; // route of administration (oral, intramuscular, topical, etc.)

  @Field(() => Timing)
  timing: Timing;

  @Field(() => AsNeeded)
  asNeeded: AsNeeded;

  @Field(() => MaxDosePerPeriod, { nullable: true })
  maxDosePerPeriod?: MaxDosePerPeriod | null;

  @Field(() => String, { nullable: true })
  patientInstruction?: string | null;

  @Field(() => String, { nullable: true })
  indication?: string | null;
}
