import { registerEnumType } from '@nestjs/graphql';

export enum RepeatPattern {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

registerEnumType(RepeatPattern, {
  name: 'RepeatPattern',
  description: 'Repeat pattern for medication schedule',
});
