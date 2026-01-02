import { gql } from '@apollo/client';

export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($input: RegisterPushTokenInput!) {
    registerPushToken(input: $input) {
      id
      expoPushToken
      platform
      appVersion
      notificationsOn
      createdAt
      lastSeenAt
    }
  }
`;

export const SEND_MISSED_DOSE_ALERT = gql`
  mutation SendMissedDoseAlert($doseTimeId: String!) {
    sendMissedDoseAlert(doseTimeId: $doseTimeId) {
      success
      errors {
        field
        message
      }
    }
  }
`;

