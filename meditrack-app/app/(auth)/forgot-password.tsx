import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ApolloError } from "@apollo/client";
import { Link } from "expo-router";
import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback
} from "react-native";
import { spacing } from "../../constants/Theme";
import { Button, TextInput } from 'react-native-paper';
import { resetPassword } from "../../services/userService";

const ForgotPassword = () => {
  const colorScheme = useColorScheme();
  const bgcolor =
    colorScheme === "light" ? Colors.light.background : Colors.dark.background;
  const textcolor =
    colorScheme === "light" ? Colors.light.text : Colors.dark.text;

  const [email, setEmail] = React.useState("");
  const [userMsg, setUserMsg] = React.useState({ type: "", message: "" });
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const handleResetPassword = async () => {
    setSubmitLoading(true);
    if (!email.trim()) {
      setUserMsg({
        type: "error",
        message: "Please enter an email address.",
      });
      return;
    }

    try {
      const res = await resetPassword(email);
      setUserMsg({
        type: "success",
        message: res.data.message,
      });
      setSubmitLoading(false);
    } catch (err) {
      if (err instanceof ApolloError && err.graphQLErrors.length > 0) {
        setUserMsg({
          type: "error",
          message: err.graphQLErrors[0].message,
        });
      }
      setSubmitLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -50 : -100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { backgroundColor: bgcolor }]}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
          {userMsg.type !== "" && (
            <Text
              style={{
                color: userMsg.type === "success" ? "green" : "red",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              {userMsg.message}
            </Text>
          )}
          <Text style={[styles.title, { color: textcolor }]}>Enter your email:</Text>
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
          <Button           disabled={submitLoading}
            loading={submitLoading}
            className="mt-4"
            style={styles.btn}
            labelStyle={{ color: "rgba(8, 145, 178, 1)" }} onPress={handleResetPassword}   mode="contained" > 
            Reset Password
          </Button>
          <Link href="/(auth)/login" className="mt-4">
            <Text style={[styles.link, { color: textcolor }]}>Login</Text>
          </Link>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: spacing.sm + spacing.xs,
    marginBottom: spacing.sm + spacing.xs,
    color: "#000",
  },
  link: {
    marginTop: spacing.md,
    textAlign: "center",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 30,
    marginTop: 30,
  },
    btn:{
   backgroundColor: "#ECEDEE"
  }
});

