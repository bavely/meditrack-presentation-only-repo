import { REGISTER_PUSH_TOKEN, SEND_MISSED_DOSE_ALERT } from '../graphql/notifications';
import { apolloClient as client } from '../utils/apollo';

type RegisterPushTokenInput = {
  token: string;
  platform: string;
  appVersion: string;
};

export const registerPushToken = async ({
  token,
  platform,
  appVersion,
}: RegisterPushTokenInput) => {
  const { data } = await client.mutate({
    mutation: REGISTER_PUSH_TOKEN,
    variables: { input: { token, platform, appVersion } },
  });
  return data.registerPushToken;
};

export const sendMissedDoseAlert = async (doseTimeId: string) => {
  const { data } = await client.mutate({
    mutation: SEND_MISSED_DOSE_ALERT,
    variables: { doseTimeId },
  });
  return data.sendMissedDoseAlert;
};

