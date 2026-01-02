// app/(auth)/login.tsx
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ApolloError } from "@apollo/client";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Button, Text, TextInput } from 'react-native-paper';
import { loginUser } from "../../services/userService";
import { useAuthStore } from "../../store/auth-store";

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const router = useRouter();
  const { login } = useAuthStore();
  const [hidePassword, setHidePassword] = useState(true);
  const bgcolor = Colors[colorScheme].background;
  const textcolor = Colors[colorScheme].text;

  const [userMsg, setUserMsg] = useState({ type: "", message: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleLogin = async () => {
    console.log("Attempting login with:", email, password);
    setSubmitLoading(true);
    if (!email.trim() || !password) {
      setUserMsg({ type: "error", message: "Please fill in all fields." });
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await loginUser(email, password);
      console.log("Login response:", response);
      const { accessToken, refreshToken } = response.data;
      console.log(
        "Login response:",
        accessToken,
        "====================================and==============================",
        refreshToken
      );
      if (!accessToken || !refreshToken || !response.success) {
        setUserMsg({
          type: "error",
          message: "Login failed. Please try again.",
        });
        setSubmitLoading(false);
        return;
      }
      await login(accessToken, refreshToken);
      setUserMsg({ type: "success", message: "Login successful!" });
      setSubmitLoading(false);

      router.push("/(tabs)");
    } catch (err) {
      if (err instanceof ApolloError) {
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          setUserMsg({
            type: "error",
            message: err.graphQLErrors[0].message,
          });
        }
      } else if (err instanceof Error) {
        setUserMsg({
          type: "error",
          message: err.message,
        });
      } else {
        setUserMsg({
          type: "error",
          message: "An unexpected error occurred. Please try again.",
        });
      }
      setSubmitLoading(false);
    }
  };
  console.log("userMsg:", userMsg);
  return (
   <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" :  "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -50 : -100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: bgcolor },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
          {userMsg.type !== "" && (
            <Text
              className={`${
                userMsg.type === "success" ? "text-[green]" : "text-[red]"
              }`}
            >
              {userMsg.message}
            </Text>
          )}
          <Text style={[styles.title, { color: textcolor }]}>Welcome back</Text>
          <TextInput
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            right={<TextInput.Icon icon="email" />}
            activeOutlineColor="gray"
          />
          <TextInput
            label="Password"
            secureTextEntry = {hidePassword}
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            right={ hidePassword ? <TextInput.Icon icon="eye-off" onPress={() => setHidePassword(false)} /> : <TextInput.Icon onPress={() => setHidePassword(true)}  icon="eye" />}
            activeOutlineColor="gray"
          />
          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={submitLoading}
            loading={submitLoading}
            className="mt-4"
            style={styles.btn}
            labelStyle={{ color: Colors[colorScheme].tint }}
          >
            {submitLoading ? "Loading..." : "Login"}
          </Button>
          <Text
            style={[styles.link, { color: textcolor }]}
            onPress={() => router.push("/(auth)/signup")}
          >
            Don&apos;t have an account? Sign up
          </Text>
          <Text
            style={[styles.link, { color: textcolor }]}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            Forgot password?
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: { padding: 24, flex: 1, justifyContent: "center" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
    link: { marginTop: 16, textAlign: "center" },
    logo: {
      width: 100,
      height: 100,
      alignSelf: "center",
      marginBottom: 30,
      marginTop: 30,
    },
    btn: {
      backgroundColor: Colors[colorScheme].surface
    }
  });
}
