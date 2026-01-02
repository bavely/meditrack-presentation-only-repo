// utils/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { getViewerProfile } from '../services/userService';
import { LocalUser } from '../types/user';
import secureStore from '../utils/secureStore';

const formatUser = (user: any): LocalUser => ({
  ...user,
  bedTime: user?.bedTime ?? null,
  breakfastTime: user?.breakfastTime ?? null,
  lunchTime: user?.lunchTime ?? null,
  dinnerTime: user?.dinnerTime ?? null,
  exerciseTime: user?.exerciseTime ?? null,
});

const sanitizePersistedAuthState = (value: string): string => {
  try {
    const parsed = JSON.parse(value);

    if (parsed?.state && typeof parsed.state === 'object') {
      let mutated = false;

      if ('accessToken' in parsed.state) {
        delete parsed.state.accessToken;
        mutated = true;
      }

      if ('refreshToken' in parsed.state) {
        delete parsed.state.refreshToken;
        mutated = true;
      }

      return mutated ? JSON.stringify(parsed) : value;
    }
  } catch {
    // noop - value is not JSON we recognize
  }

  return value;
};

const tokenSafeAsyncStorage: StateStorage = {
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name);
    if (value === null) {
      return null;
    }

    const sanitized = sanitizePersistedAuthState(value);

    if (sanitized !== value) {
      await AsyncStorage.setItem(name, sanitized);
    }

    return sanitized;
  },
  setItem: async (name: string, value: string) => {
    const sanitized = sanitizePersistedAuthState(value);
    await AsyncStorage.setItem(name, sanitized);
  },
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

interface AuthState {
  /**
   * Load any persisted authentication state from storage and validate
   * existing tokens. This should be called once on app start before any
   * protected routes are rendered.
   */
  init: () => Promise<void>
  user: LocalUser | null
  // isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null

  /**
   * Complete login using pre-issued auth tokens.
   * Stores tokens and loads the current user; throws on failure.
   */
  login: (accessToken: string, refreshToken: string) => Promise<void>
  signup: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: LocalUser | null) => void
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>
  updateUserPreferences: (
    prefs: Pick<
      LocalUser,
      'bedTime' | 'breakfastTime' | 'lunchTime' | 'dinnerTime' | 'exerciseTime'
    >
  ) => void

}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      init: async () => {
        const accessToken = await secureStore.getItemAsync('accessToken');
        const refreshToken = await secureStore.getItemAsync('refreshToken');

        if (!accessToken || !refreshToken) {
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
          });
          return;
        }

        // Validate token expiry
        try {
          const payload = JSON.parse(
            Buffer.from(accessToken.split('.')[1], 'base64').toString('utf-8')
          );
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            await secureStore.deleteItemAsync('accessToken');
            await secureStore.deleteItemAsync('refreshToken');
            set({
              accessToken: null,
              refreshToken: null,
              user: null,
              isAuthenticated: false,
            });
            return;
          }
        } catch (err) {
          // invalid token format; treat as logged out
          await secureStore.deleteItemAsync('accessToken');
          await secureStore.deleteItemAsync('refreshToken');
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
          });
          return;
        }


        try {
          const userResponse = await getViewerProfile();
          const user = userResponse.data;

          if (!userResponse.success || !user || !user.emailVerified) {
            set({
              accessToken,
              refreshToken,
              user: null,
              isAuthenticated: false,
            });
            return;
          }

          set({
            accessToken,
            refreshToken,
            user: formatUser(user),
            isAuthenticated: true,
          });
        } catch {
          set({
            accessToken,
            refreshToken,
            user: null,
            isAuthenticated: false,
          });

        }
      },

      login: async (
        accessToken: string,
        refreshToken: string
      ): Promise<void> => {
        await secureStore.setItemAsync('accessToken', accessToken);
        await secureStore.setItemAsync('refreshToken', refreshToken);

        const userResponse = await getViewerProfile();
        const user = userResponse.data;

        if (!userResponse.success || !user) {
          throw new Error('Could not load your profile. Please try again.');
        }
        if (!user.emailVerified) {
          throw new Error(
            'Please verify your email before signing in. Check your inbox for a verification link.'
          );
        }

        const formattedUser = formatUser(user);

        set({
          user: formattedUser,
          accessToken,
          refreshToken,
          isAuthenticated:
            !!accessToken && !!refreshToken && formattedUser.emailVerified,
        });
      },

      signup: async (accessToken: string, refreshToken: string) => {
        try {
          await secureStore.setItemAsync('accessToken', accessToken);
          await secureStore.setItemAsync('refreshToken', refreshToken);

          const userResponse = await getViewerProfile();
          const user = userResponse.data;

          if (!user || !accessToken || !refreshToken) {
            throw new Error('Login failed, Please try again later.');
          }

          const formattedUser = formatUser(user);

          set({
            user: formattedUser,
            accessToken,
            refreshToken,
            isAuthenticated: !!formattedUser.emailVerified,
          });
        } finally {
        }
      },
      logout: async () => {
        try {
          await secureStore.deleteItemAsync('accessToken');
          await secureStore.deleteItemAsync('refreshToken');
          await AsyncStorage.clear();
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
          });
        } finally {
        }
      },
      setUser: (user: LocalUser | null) => {
        set({ user });
        set({ isAuthenticated: !!user?.emailVerified });
      },
      updateTokens: async (accessToken: string, refreshToken: string) => {
        await secureStore.setItemAsync('accessToken', accessToken);
        await secureStore.setItemAsync('refreshToken', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },
      updateUserPreferences: (
        prefs: Pick<
          LocalUser,
          | 'bedTime'
          | 'breakfastTime'
          | 'lunchTime'
          | 'dinnerTime'
          | 'exerciseTime'
        >
      ) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...prefs } : state.user,
        }));
      }

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => tokenSafeAsyncStorage),
      version: 2,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: async (persistedState) => {
        if (!persistedState) {
          return { user: null, isAuthenticated: false } as Partial<AuthState>;
        }

        const state = persistedState as Partial<AuthState>;
        const { accessToken: _ignoredAccessToken, refreshToken: _ignoredRefreshToken, ...rest } =
          state;

        const sanitized: Partial<AuthState> = {
          ...rest,
          user: state.user ?? null,
          isAuthenticated: state.isAuthenticated ?? false,
        };

        return sanitized;
      },
    }

  ),

)

// Auto-init on load
useAuthStore.getState().init();
