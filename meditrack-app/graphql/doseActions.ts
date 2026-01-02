import { gql } from '@apollo/client';

export const GET_DOSE_ACTIONS = gql`
  query DoseActions($medicationId: String!) {
    doseActions(medicationId: $medicationId) {
      success
      errors {
        field
        message
      }
      data {
        id
        userId
        medicationId
        actionType
        actionTime
        scheduledTime
        snoozedUntil
        snoozeCount
        createdAt
      }
    }
  }
`;

export const LOG_DOSE_ACTION = gql`
  mutation LogDoseAction($input: CreateDoseActionInput!) {
    logDoseAction(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        id
        userId
        medicationId
        actionType
        actionTime
        scheduledTime
        snoozedUntil
        snoozeCount
        createdAt
      }
    }
  }
`;

export const UPDATE_DOSE_ACTION = gql`
  mutation UpdateDoseAction($input: UpdateDoseActionInput!) {
    updateDoseAction(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        id
        userId
        medicationId
        actionType
        actionTime
        scheduledTime
        snoozedUntil
        snoozeCount
        createdAt
      }
    }
  }
`;

export const DELETE_DOSE_ACTION = gql`
  mutation DeleteDoseAction($id: String!) {
    deleteDoseAction(id: $id) {
      success
      errors {
        field
        message
      }
      data {
        id
        userId
        medicationId
        actionType
        actionTime
        scheduledTime
        snoozedUntil
        snoozeCount
        createdAt
      }
    }
  }
`;

export const GET_DOSE_ACTIONS_BY_DOSE_TIME_ID = gql`
  mutation DoseActionsByDoseTime($doseTimeId: String!) {
    doseActionsByDoseTime(doseTimeId: $doseTimeId) {
      success
      errors {
        field
        message
      }
      data {
        id
        userId
        medicationId
        actionType
        actionTime
        scheduledTime
        snoozedUntil
        snoozeCount
        createdAt
      }
    }
  }
`;
