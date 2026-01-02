import {
  CREATE_MEDICATION,
  UPDATE_MEDICATION,
  DELETE_MEDICATION,
  GET_MEDICATIONS,
  GET_MEDICATION,
  PARSE_MED_LABEL,
  REGISTER_MEDICATION_AI,
  STRUCTURE_MEDICATION_INSTRUCTION,
} from '../graphql/medications';
import { apolloClient as client } from '../utils/apollo';

interface UpdateMedicationInput {
  id: string;
  isArchived?: boolean;
  archivedAt?: string;
  isReminderOn?: boolean;
  [key: string]: any;
}

export const createMedication = async (input: any) => {
  const { data } = await client.mutate({
    mutation: CREATE_MEDICATION,
    variables: { input },
  });
  return data.createMedication;
};

export const updateMedication = async (input: UpdateMedicationInput) => {
  const { data } = await client.mutate({
    mutation: UPDATE_MEDICATION,
    variables: {
      input: {
        ...input,
        isArchived: input.isArchived,
        archivedAt: input.archivedAt,
        isReminderOn: input.isReminderOn,
      },
    },
  });
  return data.updateMedication;
};

export const deleteMedication = async (id: string) => {
  const { data } = await client.mutate({
    mutation: DELETE_MEDICATION,
    variables: { id },
  });
  return data.deleteMedication;
};

export const getMedications = async () => {
  const { data } = await client.query({
    query: GET_MEDICATIONS,
    fetchPolicy: 'no-cache',
  });
  return data.medications;
};

export const getMedication = async (id: string) => {
  const { data } = await client.query({
    query: GET_MEDICATION,
    variables: { id },
    fetchPolicy: 'no-cache',
  });
  return data.medication;
};

export const handleParsedText = async (scannedText: string) => {
  return await client.mutate({
    mutation: PARSE_MED_LABEL,
    variables: { label: scannedText },
  });
};

export const registerMedicationAI = async (input: any) => {
  return await client.mutate({
    mutation: REGISTER_MEDICATION_AI,
    variables: { input },
  });
};

export const structureMedicationInstruction = async (
  instruction: string,
  medicationName?: string,
) => {
  return await client.mutate({
    mutation: STRUCTURE_MEDICATION_INSTRUCTION,
    variables: { instruction, medicationName },
  });
};

