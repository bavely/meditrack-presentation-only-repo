import { CreateMedicationInput } from './add-medication.input';

/**
 * Extended input for creating a medication with additional optional fields
 * used internally by the service.
 */
export interface CreateMedicationExtendedInput extends CreateMedicationInput {
  /**
   * Total number of doses available. Falls back to `quantity` if not provided.
   */
  totalCount?: number;

  /**
   * Remaining quantity of doses.
   */
  quantityLeft?: number;

  /**
   * ISO 8601 timestamp estimating when the medication will run out.
   */
  estimatedEndDate?: string;
}
