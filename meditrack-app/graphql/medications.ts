import { gql } from '@apollo/client';

export const CREATE_MEDICATION = gql`
  mutation CreateMedication($input: CreateMedicationInput!) {
    createMedication(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        id
        name
        strength
        quantity
        quantityLeft
        instructions
        medicationStartDate
        estimatedEndDate
        therapy
        userId
        isArchived
        archivedAt
        isReminderOn
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_MEDICATION = gql`
  mutation UpdateMedication($input: UpdateMedicationInput!) {
    updateMedication(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        id
        name
        strength
        quantity
        quantityLeft
        instructions
        medicationStartDate
        estimatedEndDate
        therapy
        userId
        isArchived
        archivedAt
        isReminderOn
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_MEDICATION = gql`
  mutation DeleteMedication($id: String!) {
    deleteMedication(id: $id) {
      success
      errors {
        field
        message
      }
      data {
        id
        name
        strength
        quantity
        quantityLeft
        instructions
        medicationStartDate
        estimatedEndDate
        therapy
        userId
        isArchived
        archivedAt
        isReminderOn
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_MEDICATIONS = gql`
  query Medications {
    medications {
      success
      errors {
        field
        message
      }
      data {
        id
        name
        strength
        quantity
        quantityLeft
        instructions
        medicationStartDate
        estimatedEndDate
        therapy
        userId
        color
        isArchived
        archivedAt
        isReminderOn
        createdAt
        updatedAt
        schedule {
          id
          medicationId
          repeatPattern
          interval
          frequency
          startDate
          durationDays
          doseTimes {
            
            dosageUnit

        }
      }
    }
    }
  }
`;

export const GET_MEDICATION = gql`
  query Medication($id: String!) {
    medication(id: $id) {
      success
      errors {
        field
        message
      }
      data {
        id
        name
        strength
        quantity
        quantityLeft
        instructions
        medicationStartDate
        estimatedEndDate
        therapy
        userId
        color
        isArchived
        archivedAt
        isReminderOn
        createdAt
        updatedAt
      }
    }
  }
`;

export const PARSE_MED_LABEL = gql`
  mutation ParseMedicationLabel($label: String!) {
    parseMedicationLabel(label: $label) {
      success
      errors {
        field
        message
      }
      data {
        name
        strength
        quantity
        instructions
        therapy
      }
    }
  }
`;

export const REGISTER_MEDICATION_AI = gql`
  mutation RegisterMedicationAI($input: RegisterMedicationAiInput!) {
    registerMedicationWithAi(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        medication {
          id
          name
          strength
          quantity
          quantityLeft
          instructions
          medicationStartDate
          estimatedEndDate
          therapy
          userId
          isArchived
          archivedAt
          isReminderOn
          createdAt
          updatedAt
        }
        schedule {
          id
          medicationId
          repeatPattern
          interval
          frequency
          startDate
          durationDays
          doseTimes {
            id
            scheduleId
            time
            scheduledAt
            dosageQty
            dosageUnit
          }
          createdAt
          updatedAt
        }
        doseTimes
      }
    }
  }
`;

export const STRUCTURE_MEDICATION_INSTRUCTION = gql`
  mutation StructureMedicationInstruction(
    $instruction: String!
    $medicationName: String
  ) {
    structureMedicationInstruction(
      instruction: $instruction
      medicationName: $medicationName
    ) {
      success
      errors {
        field
        message
      }
      data {
        medicationName
        action
        doseQuantity
        doseUnit
        route
        patientInstruction
        indication
        timing {
          frequency
          frequencyMax
          period
          periodMax
          periodUnit
          timeOfDay
          dayOfWeek
          when
          offset
          bounds {
            start
            end
            count
          }
        }
        asNeeded {
          boolean
          reason
        }
        maxDosePerPeriod {
          numerator
          denominator {
            value
            unit
          }
        }
      }
    }
  }
`;

