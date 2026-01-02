import { Stack } from "expo-router";
import { Colors } from "../../constants/Colors";
import "../../global.css";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: {
        backgroundColor: Colors.light.background,
      },
    }}>
      <Stack.Screen name="login" options={{ title: "Log In" }} />
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Forgot Password" }} />
    </Stack>
  );
}