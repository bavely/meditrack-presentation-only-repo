// utils/env.ts
import Constants from 'expo-constants';

export const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GRAPHQL_API_URL,
} = Constants.expoConfig?.extra || {};
