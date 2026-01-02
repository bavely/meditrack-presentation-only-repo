import {
  CREATE_USER,
  FORGOT_PASSWORD,
  GET_VIEWER,
  LOGIN_USER,
  LOGOUT,
  REFRESH_TOKEN,
  RESEND_VERIFICATION_EMAIL,
  RESET_PASSWORD,
  UPDATE_USER_PREFERENCES,
  VERIFY_EMAIL,
} from '../graphql/user';
import { CreateUserInput } from '../types/user';
import { apolloClient as client } from '../utils/apollo';
import secureStore from '../utils/secureStore';

export const createUser = async (input: CreateUserInput): Promise<any> => {
  try {
    const toTimeStringOrNull = (
      time?: string | Date | null
    ): string | null => {
      if (!time) return null;
      if (typeof time === 'string') {
        // already formatted as HH:mm
        return time;
      }
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const formattedInput: any = {
      email: input.email,
      password: input.password,
      name: input.name,
      phoneNumber: input.phoneNumber,
      gender: input.gender,
      dob: input.dob,
    };

    if (input.bedTime) formattedInput.bedTime = toTimeStringOrNull(input.bedTime);
    if (input.breakfastTime)
      formattedInput.breakfastTime = toTimeStringOrNull(input.breakfastTime);
    if (input.lunchTime)
      formattedInput.lunchTime = toTimeStringOrNull(input.lunchTime);
    if (input.dinnerTime)
      formattedInput.dinnerTime = toTimeStringOrNull(input.dinnerTime);
    if (input.exerciseTime)
      formattedInput.exerciseTime = toTimeStringOrNull(input.exerciseTime);
    const { data } = await client.mutate({
      mutation: CREATE_USER,
      variables: { input: formattedInput },
      context: {
        headers: {
          authorization: '',
        },
      },
    });
    return data.registerUser;
  } catch (error) {
    throw new Error(
      `Failed to create user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const loginUser = async (email: string, password: string): Promise<any> => {
  
  try {
    const { data } = await client.mutate({
      mutation: LOGIN_USER,
      variables: { email, password },
      context: {
        headers: {
          authorization: '',
        },
      },
    });
    return data.login;
  } catch (error) {
    throw new Error(
      `Failed to login: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const refreshAccessToken = async (): Promise<any> => {
  try {
    const refreshToken = await secureStore.getItemAsync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const { data } = await client.mutate({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken },
    });
    const result = data.refreshToken;
    return {
      ...result,
      data: {
        accessToken: result.data.accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to refresh access token: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const getViewerProfile = async (): Promise<any> => {
  try {
    const { data } = await client.query({
      query: GET_VIEWER,
      fetchPolicy: 'network-only',
    });
    return data.getUser;
  } catch (error) {
    throw new Error(
      `Failed to fetch viewer profile: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const updateUserPreferences = async (
  input: Pick<
    CreateUserInput,
    'bedTime' | 'breakfastTime' | 'lunchTime' | 'dinnerTime' | 'exerciseTime'
  >,
): Promise<any> => {
  try {
    // const toTimeStringOrNull = (
    //   time?: string | Date | null
    // ): string | null => {
    //   if (!time) return null;
    //   // if (typeof time === 'string') return time;
    //   // console.log("Date from service", time);
    //   // const hours = String(time).padStart(2, '0');
    //   // const minutes = String(time).padStart(2, '0');
    //   // const [hours, minutes] = (typeof time === 'string' ? time : '').split(':');
    //   // console.log("Hours and Minutes", Number(hours) + 7, Number(minutes));
    //   return time;
    // };

    // const formattedInput: any = {};
    // if (input.bedTime)
    //   formattedInput.bedTime = toTimeStringOrNull(input.bedTime);
    // if (input.breakfastTime)
    //   formattedInput.breakfastTime = toTimeStringOrNull(input.breakfastTime);
    // if (input.lunchTime)
    //   formattedInput.lunchTime = toTimeStringOrNull(input.lunchTime);
    // if (input.dinnerTime)
    //   formattedInput.dinnerTime = toTimeStringOrNull(input.dinnerTime);
    // if (input.exerciseTime)
    //   formattedInput.exerciseTime = toTimeStringOrNull(input.exerciseTime);
    console.log("Formatted Input", input);
    const { data } = await client.mutate({
      mutation: UPDATE_USER_PREFERENCES,
      variables: { input },
    });
    return data.updateUserPreferences;
  } catch (error) {
    throw new Error(
      `Failed to update user preferences: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};


export const resetPassword = async (email: string): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: FORGOT_PASSWORD,
      variables: { email },
    });
    return data.forgotPassword;
  } catch (error) {
    throw new Error(
      `Failed to reset password: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const completePasswordReset = async (
  token: string,
  password: string
): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: RESET_PASSWORD,
      variables: { token, password },
    });
    return data.resetPassword;
  } catch (error) {
    throw new Error(
      `Failed to complete password reset: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const logoutUser = async (): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: LOGOUT,
    });
    return data.logout;
  } catch (error) {
    throw new Error(
      `Failed to logout: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const verifyEmail = async (token: string): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: VERIFY_EMAIL,
      variables: { token },
    });
    return data.verifyEmail;
  } catch (error) {
    throw new Error(
      `Failed to verify email: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const resendVerificationEmail = async (token: string): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: RESEND_VERIFICATION_EMAIL,
      variables: { token },
    });
    return data.resendVerificationEmail;
  } catch (error) {
    throw new Error(
      `Failed to resend verification email: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

