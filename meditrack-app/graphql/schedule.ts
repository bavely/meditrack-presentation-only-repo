import { gql } from '@apollo/client';

export const GET_SCHEDULE = gql`
  query GetSchedule($medicationId: String!) {
    schedule(medicationId: $medicationId) {
      success
      errors {
        field
        message
      }
      data {
        id
        medicationId
        repeatPattern
        interval
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
    }
  }
`;

export const CREATE_SCHEDULE = gql`
  mutation CreateSchedule($input: CreateScheduleInput!) {
    createSchedule(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        id
        medicationId
        repeatPattern
        interval
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
    }
  }
`;

export const UPDATE_SCHEDULE = gql`
  mutation UpdateSchedule($input: UpdateScheduleInput!) {
    updateSchedule(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        id
        medicationId
        repeatPattern
        interval
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
    }
  }
`;

export const DELETE_SCHEDULE = gql`
  mutation DeleteSchedule($id: String!) {
    deleteSchedule(id: $id) {
      success
      errors {
        field
        message
      }
      data {
        id
        medicationId
        repeatPattern
        interval
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
    }
  }
`;

export const DOSE_TIMES_BY_DATE = gql`
  mutation DoseTimesByDate($date: String!) {
    doseTimesByDate(date: $date) {
      success
      errors {
        field
        message
      }
      data {
        id
        scheduleId
        time
        scheduledAt
        dosageQty
        dosageUnit
        doseActions {
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
  }
`;

export const DOSE_TIMES_BY_DATE_RANGE = gql`
  mutation DoseTimesByDateRange($startDate: String!, $endDate: String!) {
    doseTimesByDateRange(startDate: $startDate, endDate: $endDate) {
      success
      errors {
        field
        message
      }
      data {
        id
        scheduleId
        time
        scheduledAt
        dosageQty
        dosageUnit
        doseActions {
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
  }
`;

