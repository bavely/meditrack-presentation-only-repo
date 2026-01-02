import { registerEnumType } from '@nestjs/graphql';

export enum DoseActionType {
  TAKEN = 'TAKEN',
  SNOOZED = 'SNOOZED',
  SKIPPED = 'SKIPPED',
  PENDING = 'PENDING',
  MISSED = 'MISSED',
}

registerEnumType(DoseActionType, {
  name: 'DoseActionType',
  description: 'Status of a scheduled dose',
});
