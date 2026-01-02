// graphql/user.ts
import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation RegisterUser($input: CreateUserInput!) {
    registerUser(input: $input) {
      success
      errors {
        field
        message
      }
      data {
        accessToken
        refreshToken
        user {
          id
          email
          bedTime
          breakfastTime
          lunchTime
          dinnerTime
          exerciseTime
        }
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      success
      errors {
        field
        message
      }
      data {
        accessToken
        refreshToken
        user {
          id
          email
          bedTime
          breakfastTime
          lunchTime
          dinnerTime
          exerciseTime
        }
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      errors {
        field
        message
      }
      data {
        accessToken
      }
    }
  }
`;

export const GET_VIEWER = gql`
  query GetUser {
    getUser {
      success
      errors {
        field
        message
      }
      data {
        id
        email
        name
        gender
        dob
        phoneNumber
        prefersPush
        prefersSms
        timezone
        bedTime
        breakfastTime
        lunchTime
        dinnerTime
        exerciseTime
        lastSignInAt
        emailVerified
        phoneVerified
        emailConfirmedAt
        confirmationSentAt
        phoneConfirmedAt
        phoneConfirmationSentAt
        appMetadata
        createdAt
        updatedAt
      }
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      errors {
        field
        message
      }
      data {
        message
      }
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      success
      errors {
        field
        message
      }
      data {
        message
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
      errors {
        field
        message
      }
      data {
        message
      }
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      errors {
        field
        message
      }
      data {
        message
      }
    }
  }
`;

export const RESEND_VERIFICATION_EMAIL = gql`
  mutation ResendVerificationEmail($token: String!) {
    resendVerificationEmail(token: $token) {
      success
      errors {
        field
        message
      }
      data {
        message
      }
    }
  }
`;

export const UPDATE_USER_PREFERENCES = gql`
  mutation UpdateUserPreferences(
 $input: UpdateUserPreferencesInput!
  ) {
    updateUserPreferences(
      input: $input
    ) {
      success
      errors {
        field
        message
      }
      data {
        id
        bedTime
        breakfastTime
        lunchTime
        dinnerTime
        exerciseTime
      }
    }
  }
`;
