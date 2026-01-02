import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ApolloProvider } from "@apollo/client";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { useAuthStore } from "../store/auth-store";
import { apolloClient } from "../utils/apollo";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { init, isAuthenticated } = useAuthStore();
  const [ready, setReady] = useState(false);



  useEffect(() => {
    init().finally(() => setReady(true));
  }, [init]);

  if (!ready) {
    return null;
  }

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <PaperProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor:
                    colorScheme === "dark"
                      ? Colors.dark.background
                      : Colors.light.background,
                },
              }}
            >
              {isAuthenticated ? (
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              ) : (
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              )}
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
