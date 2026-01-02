// Medication types
export interface Medication {
  id: string;
  name: string;
  strength: string;
  frequency: string;
  time: string | string[];
  instructions?: string;
  color: string;
  icon: string;
  refillDate?: string;
  quantity?: number;
  remainingDoses?: number;
  notes?: string;
  image?: string;
  quantityLeft?: number;
  isArchived?: boolean;
  archivedAt?: string;
  isReminderOn?: boolean;
  schedule:{
    doseTimes: {

      dosageUnit: string;
    }[];
    frequency: string;
    daysOfWeek?: string[];
    interval?: number;
    specificDates?: string[];
    repeatPattern?: string;
  }
  estimatedEndDate?: string;
}

export interface MedicationDose {
  id: string;
  medicationId: string;
  name: string;
  strength: string;
  time: string;
  color: string;
  icon: string;
  status?: "pending" | "taken" | "missed" | "skipped";
}

export interface MedicationHistory {
  id: string;
  medicationId: string;
  date: string;
  time: string;
  status: string; // "taken" | "missed" | "skipped"
}

export interface MedicationType {
  id: string;
  name: string;
  icon: string;
}

export interface FrequencyOption {
  id: string;
  name: string;
  value: string;
}

export interface ParsedMedication {
  quantity: any;
  name: string;
  strength: string;
  instructions: string;
  therapy: string | null;

}

export interface ExtractedMedication {
  medicationName: string;
}