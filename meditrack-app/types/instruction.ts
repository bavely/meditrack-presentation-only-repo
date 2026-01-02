// Medication instruction types

export interface TimingBounds {
  start?: string;
  end?: string;
  count?: number;
}

export interface Timing {
  frequency?: number;
  frequencyMax?: number;
  period?: number;
  periodMax?: number;
  periodUnit?: string;
  timeOfDay?: string[];
  dayOfWeek?: string[];
  when?: string[];
  offset?: number;
  bounds?: TimingBounds;
}

export interface AsNeeded {
  boolean?: boolean;
  reason?: string;
}

interface DoseQuantity {
  value?: number;
  unit?: string;
}

export interface MaxDosePerPeriod {
  numerator?: number;
  denominator?: DoseQuantity;
}

export interface MedicationInstruction {
  medicationName?: string;
  action?: string;
  doseQuantity?: number;
  doseUnit?: string;
  route?: string;
  patientInstruction?: string;
  indication?: string;
  timing?: Timing;
  asNeeded?: AsNeeded;
  maxDosePerPeriod?: MaxDosePerPeriod;
}

