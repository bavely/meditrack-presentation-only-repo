import {
  DELETE_DOSE_ACTION,
  GET_DOSE_ACTIONS,
  GET_DOSE_ACTIONS_BY_DOSE_TIME_ID,
  LOG_DOSE_ACTION,
  UPDATE_DOSE_ACTION
} from '../graphql/doseActions';
import { apolloClient as client } from '../utils/apollo';

export const getDoseActions = async (medicationId: string) => {
  const { data } = await client.query({
    query: GET_DOSE_ACTIONS,
    variables: { medicationId },
    fetchPolicy: 'no-cache',
  });
  return data.doseActions;
};

export const logDoseAction = async (input: any) => {
  const { data } = await client.mutate({
    mutation: LOG_DOSE_ACTION,
    variables: { input },
  });
  return data.logDoseAction;
};

export const updateDoseAction = async (input: any) => {
  const { data } = await client.mutate({
    mutation: UPDATE_DOSE_ACTION,
    variables: { input },
  });
  return data.updateDoseAction;
};

export const deleteDoseAction = async (id: string) => {
  const { data } = await client.mutate({
    mutation: DELETE_DOSE_ACTION,
    variables: { id },
  });
  return data.deleteDoseAction;
};

export const getDoseActionsByDoseTimeId = async (doseTimeId: string) => {
  const { data } = await client.mutate({
    mutation: GET_DOSE_ACTIONS_BY_DOSE_TIME_ID,
    variables: { doseTimeId },
  });
  return data.doseActionsByDoseTime;
};
