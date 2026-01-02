import { ObjectType, Field } from '@nestjs/graphql';
import { Medication } from '../models/medication.model';

@ObjectType()
export class RefillAlert {
  @Field()
  name: string;

  @Field()
  status: string;
}

@ObjectType()
export class DashboardOutput {
  @Field(() => [Medication])
  upcomingDoses: Medication[];

  @Field(() => [Medication])
  missedDoses: Medication[];

  @Field(() => [RefillAlert])
  refillAlerts: RefillAlert[];
}
