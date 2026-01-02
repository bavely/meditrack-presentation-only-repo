import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client/link/utils';
import { createUploadLink } from 'apollo-upload-client';
import secureStore from './secureStore';
import { GRAPHQL_API_URL } from './env';
import { refreshAccessToken } from '../services/userService';
import { useAuthStore } from '../store/auth-store';
const uploadLink = createUploadLink({
  uri: GRAPHQL_API_URL,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await secureStore.getItemAsync('accessToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'apollo-require-preflight': 'true',
    },
  };
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

const errorLink = onError(({ networkError, operation, forward }) => {
  if (operation.operationName === 'RefreshToken') {
    return;
  }
  const { logout, updateTokens } = useAuthStore.getState();
  if (networkError && 'statusCode' in networkError && networkError.statusCode === 401) {
    if (!isRefreshing) {
      isRefreshing = true;

      return fromPromise(
        refreshAccessToken()
          .then(async (response) => {
            if (!response?.success || !response.data) {
              throw new Error('Refresh token failed');
            }
            const { accessToken, refreshToken } = response.data;
            await updateTokens(accessToken, refreshToken);
            resolvePendingRequests();
          })
          .catch(async () => {
            pendingRequests = [];
            await logout();
          })
          .finally(() => {
            isRefreshing = false;
          })
      ).flatMap(() => forward(operation));
    }

    return fromPromise(
      new Promise<void>((resolve) => {
        pendingRequests.push(() => resolve());
      })
    ).flatMap(() => forward(operation));
  }
});

const link = from([errorLink, authLink, uploadLink]);

export const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

