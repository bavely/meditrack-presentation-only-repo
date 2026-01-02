import {
  CREATE_SCHEDULE,
  DELETE_SCHEDULE,
  DOSE_TIMES_BY_DATE,
  DOSE_TIMES_BY_DATE_RANGE,
  GET_SCHEDULE,
  UPDATE_SCHEDULE
} from '../graphql/schedule';
import { apolloClient as client } from '../utils/apollo';

export const getSchedule = async (medicationId: string) => {
  const { data } = await client.query({
    query: GET_SCHEDULE,
    variables: { medicationId },
    fetchPolicy: 'no-cache',
  });
  return data.schedule;
};

export const createSchedule = async (input: any) => {
  const { data } = await client.mutate({
    mutation: CREATE_SCHEDULE,
    variables: { input },
  });
  try {
    const { scheduleUpcomingDoseAlarms } = await import('./notificationScheduler');
    await scheduleUpcomingDoseAlarms();
  } catch (error) {
    console.warn('Failed to reschedule dose alarms', error);
  }
  return data.createSchedule;
};

export const updateSchedule = async (input: any) => {
  const { data } = await client.mutate({
    mutation: UPDATE_SCHEDULE,
    variables: { input },
  });
  try {
    const { scheduleUpcomingDoseAlarms } = await import('./notificationScheduler');
    await scheduleUpcomingDoseAlarms();
  } catch (error) {
    console.warn('Failed to reschedule dose alarms', error);
  }
  return data.updateSchedule;
};

export const deleteSchedule = async (id: string) => {
  const { data } = await client.mutate({
    mutation: DELETE_SCHEDULE,
    variables: { id },
  });
  try {
    const { scheduleUpcomingDoseAlarms } = await import('./notificationScheduler');
    await scheduleUpcomingDoseAlarms();
  } catch (error) {
    console.warn('Failed to reschedule dose alarms', error);
  }
  return data.deleteSchedule;
};

export const getDoseTimesByDate = async (date: string) => {
  const { data } = await client.mutate({
    mutation: DOSE_TIMES_BY_DATE,
    variables: { date },
  });
  return data.doseTimesByDate;
};

export const getDoseTimesByDateRange = async (startDate: string, endDate: string) => {
  const { data } = await client.mutate({
    mutation: DOSE_TIMES_BY_DATE_RANGE,
    variables: { startDate, endDate },
  });
  return data.doseTimesByDateRange;
};
