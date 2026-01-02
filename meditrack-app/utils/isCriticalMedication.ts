export interface MedicationLike {
  name?: string;
  instructions?: string;
  isCritical?: boolean;
  critical?: boolean;
}

const NAME_KEYWORDS = ['heart', 'insulin'];
const INSTRUCTION_KEYWORDS = ['critical', 'urgent'];

export function isCriticalMedication(med?: MedicationLike | null): boolean {
  if (!med) return false;
  if (med.isCritical || med.critical) return true;

  const name = med.name?.toLowerCase() || '';
  const instructions = med.instructions?.toLowerCase() || '';

  return (
    NAME_KEYWORDS.some((k) => name.includes(k)) ||
    INSTRUCTION_KEYWORDS.some((k) => instructions.includes(k))
  );
}

export default isCriticalMedication;
