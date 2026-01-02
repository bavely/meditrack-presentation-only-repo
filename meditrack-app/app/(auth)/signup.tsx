import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ApolloError } from "@apollo/client";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import {
  DatePickerInput,
  en,
  registerTranslation,
} from "react-native-paper-dates";
import { Dropdown } from "react-native-paper-dropdown";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TimeInput } from "../../components/ui/TimeInput";
import {
  createUser,
  updateUserPreferences as updateUserPreferencesService,
} from "../../services/userService";
import { useAuthStore } from "../../store/auth-store";

const toIsoTime = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return dayjs(date).toISOString();
};

export default function SignupScreen() {
  registerTranslation("en", en);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { signup, updateUserPreferences: setUserPreferences } = useAuthStore();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const TOTAL_STEPS = 6;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState<Date | undefined>(new Date());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [userMsg, setUserMsg] = useState({ type: "", message: "" });
  const [gender, setGender] = useState("");
  const [bedTime, setBedTime] = useState<string | null>(null);
  const [breakfastTime, setBreakfastTime] = useState<string | null>(null);
  const [lunchTime, setLunchTime] = useState<string | null>(null);
  const [dinnerTime, setDinnerTime] = useState<string | null>(null);
  const [exerciseTime, setExerciseTime] = useState<string | null>(null);
  const progress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const OPTIONS = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];
  const bgcolor =
    colorScheme === "light" ? Colors.light.background : Colors.dark.background;
  const textcolor =
    colorScheme === "light" ? Colors.light.text : Colors.dark.text;

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / TOTAL_STEPS, {
      duration: 300,
    });
    translateX.value = withTiming(0, { duration: 300 });
  }, [currentStep, progress, TOTAL_STEPS, translateX]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleNext = () => {
    if (currentStep === 0 && (!name.trim() || !email.trim())) {
      setUserMsg({ type: "error", message: "Name and Email are required." });
      return;
    }
    if (currentStep === 1 && (!dob || !phoneNumber.trim())) {
      setUserMsg({
        type: "error",
        message: "Age and Phone number are required.",
      });
      return;
    }
    if (currentStep === 2) {
      if (!password.trim() || !confirmPassword.trim()) {
        setUserMsg({
          type: "error",
          message: "Both password fields are required.",
        });
        return;
      }
      if (password.trim() !== confirmPassword.trim()) {
        setUserMsg({ type: "error", message: "Passwords do not match." });
        return;
      }
    }
    if (
      currentStep === 3 &&
      (!bedTime || !breakfastTime || !lunchTime || !dinnerTime)
    ) {
      setUserMsg({ type: "error", message: "All times are required." });
      return;
    }

    if (currentStep === 4 && !exerciseTime) {
      setUserMsg({
        type: "error",
        message: "Exercise time is required.",
      });
      return;
    }

    setUserMsg({ type: "", message: "" });
    translateX.value = screenWidth;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      translateX.value = -screenWidth;
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSignup = async () => {
    setSubmitLoading(true);
    try {
      const response = await createUser({
        email,
        password,
        name,
        phoneNumber,
        gender,
        dob,
      });
      const { accessToken, refreshToken } = response.data;

      if (
        !accessToken ||
        !refreshToken ||
        !response.success
      ) {
        setUserMsg({
          type: "error",
          message: "Registration failed. Please try again.",
        });
        setSubmitLoading(false);
        return;
      }

      await signup(accessToken, refreshToken);

      try {
        const prefs = {
          bedTime: toIsoTime(bedTime!),
          breakfastTime: toIsoTime(breakfastTime!),
          lunchTime: toIsoTime(lunchTime!),
          dinnerTime: toIsoTime(dinnerTime!),
          exerciseTime: toIsoTime(exerciseTime!),
        };
        await updateUserPreferencesService(prefs);
        setUserPreferences(prefs);
      } catch (err) {
        console.error(err);
      }

      setUserMsg({
        type: "warning",
        message:
          "Account created! Please verify your email. Redirecting to login in 5s...",
      });
      setTimeout(() => {
        router.push("/(auth)/login");
      }, 5000);
    } catch (err) {
      if (err instanceof ApolloError && err.graphQLErrors.length > 0) {
        setUserMsg({
          type: "error",
          message: err.graphQLErrors[0].message,
        });
      } else if (err instanceof Error) {
        setUserMsg({ type: "error", message: err.message });
      } else {
        setUserMsg({
          type: "error",
          message: "Unexpected error. Please try again.",
        });
      }
    }
    setSubmitLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View className="gap-2">
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Name"
              value={name}
              onChangeText={setName}
              outlineStyle={{
                borderColor: "gray",
                borderWidth: 2,
                padding: 20,
              }}
            />
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 1:
        return (
          <View className="gap-2">
            <DatePickerInput
              locale="en"
              label="Date of Birth"
              value={dob}
              onChange={(d) => setDob(d)}
              inputMode="start"
              style={{ width: 200 }}
              mode="outlined"
              keyboardType="numeric"
              activeOutlineColor="gray"
            />
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <Dropdown
              label="Gender"
              placeholder="Select Gender"
              options={OPTIONS}
              value={gender}
              onSelect={(value) => setGender(value ?? "")}
              mode="outlined"
            />

            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 2:
        return (
          <View className="gap-2">
            <TextInput
              mode="outlined"
              activeOutlineColor="gray"
              label="Password"
              secureTextEntry={hidePassword}
              value={password}
              onChangeText={setPassword}
              right={
                hidePassword ? (
                  <TextInput.Icon
                    icon="eye"
                    onPress={() => setHidePassword(!hidePassword)}
                  />
                ) : (
                  <TextInput.Icon
                    icon="eye-off"
                    onPress={() => setHidePassword(!hidePassword)}
                  />
                )
              }
            />
            <TextInput
              // mode="outlined"
              activeOutlineColor="gray"
              label="Confirm Password"
              secureTextEntry={hideConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              right={
                hideConfirmPassword ? (
                  <TextInput.Icon
                    icon="eye"
                    onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                  />
                ) : (
                  <TextInput.Icon
                    icon="eye-off"
                    onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                  />
                )
              }
            />

            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 3:
        return (
          <View className="gap-2">
            <TimeInput
              label="Bed Time"
              value={bedTime}
              onChange={setBedTime}
            />
            <TimeInput
              label="Breakfast Time"
              value={breakfastTime}
              onChange={setBreakfastTime}
            />
            <TimeInput
              label="Lunch Time"
              value={lunchTime}
              onChange={setLunchTime}
            />
            <TimeInput
              label="Dinner Time"
              value={dinnerTime}
              onChange={setDinnerTime}
            />
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 4:
        return (
          <View className="gap-2">
            <TimeInput
              label="Exercise Time"
              value={exerciseTime}
              onChange={setExerciseTime}
            />
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
              mode="contained"
              onPress={handleNext}
            >
              {" "}
              Next
            </Button>
          </View>
        );
      case 5:
        return (
          <>
            <Text style={[styles.confirm, { color: textcolor }]}> 
              Ready to create your account?
            </Text>
            <Button
              style={styles.btn}
              labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
              mode="contained"
              onPress={handleSignup}
              disabled={submitLoading}
              loading={submitLoading}
            >
              {" "}
              Sign Up
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -50 : -100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { backgroundColor: bgcolor, flexGrow: 1 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
            />
            {/* Header */}
            <View style={styles.header}>
              {currentStep > 0 && currentStep < TOTAL_STEPS && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View style={[styles.progressBar, progressStyle]} />
              </View>
              <Text style={styles.progressText}>
                Step {currentStep + 1} of {TOTAL_STEPS}
              </Text>
            </View>
            {/* <Text style={styles.title}>
            Sign Up — Step {currentStep + 1} of {TOTAL_STEPS}
          </Text> */}
            {userMsg.type !== "" && (
              <Text
                className={`${
                  userMsg.type === "success"
                    ? "text-[green]"
                    : userMsg.type === "error"
                      ? "text-[red]"
                      : "text-[orange]"
                }`}
              >
                {userMsg.message}
              </Text>
            )}
            <Animated.View style={stepStyle}>{renderStep()}</Animated.View>
            <Text
              style={[styles.link, { color: textcolor }]}
              onPress={() => router.push("/(auth)/login")}
            >
              Already have an account? Log in
            </Text>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  link: {
    marginTop: 20,
    textAlign: "center",
  },
  confirm: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#ECEDEE",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBackground: {
    height: 4,
    backgroundColor: "rgb(67, 170, 176)",
    borderRadius: 2,
    marginBottom: 8,
    borderColor: "#E3F2FD",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: "#E3F2FD",
    textAlign: "center",
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#E3F2FD",
    textAlign: "center",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 30,
    marginTop: 30,
  },
});
