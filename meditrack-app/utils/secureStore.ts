import AsyncStorage from '@react-native-async-storage/async-storage';

// Attempt to require expo-secure-store if available.
let ExpoSecureStore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoSecureStore = require('expo-secure-store');
} catch {
  // Module not available; fallback will be used.
}

export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const secureStore: SecureStoreLike = {
  async getItemAsync(key: string) {
    if (ExpoSecureStore?.getItemAsync) {
      return ExpoSecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  async setItemAsync(key: string, value: string) {
    if (ExpoSecureStore?.setItemAsync) {
      return ExpoSecureStore.setItemAsync(key, value);
    }
    await AsyncStorage.setItem(key, value);
  },

  async deleteItemAsync(key: string) {
    if (ExpoSecureStore?.deleteItemAsync) {
      return ExpoSecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.removeItem(key);
  },
};

export default secureStore;
