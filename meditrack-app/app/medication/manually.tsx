import { useColorScheme } from "@/hooks/useColorScheme";
import { useMedicationStore } from "@/store/medication-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Button from "../../components/ui/Button";
import { Colors } from "../../constants/Colors";
import { borderRadius } from "../../constants/Theme";
import { type ParsedMedication } from "../../types/medication";
const Manually = () => {
  const router = useRouter();
  const { setParsedMedication } = useMedicationStore();
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);

  const [name, setName] = useState("");
  const [strength, setStrength] = useState("");
  const [instructions, setInstructions] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [selectedType, setSelectedType] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const progress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const [userMsg, setUserMsg] = useState({
    type: "",
    message: "",
  });
  const TOTAL_STEPS = 3;

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / TOTAL_STEPS, {
      duration: 300,
    });
    translateX.value = withTiming(0, { duration: 300 });
  }, [currentStep, progress, translateX]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleNext = () => {
    setUserMsg({ type: "", message: "" });
    if (currentStep === 0 && (!name.trim() || !strength.trim())) {
      setUserMsg({ type: "error", message: "Please fill in all fields." });
      return;
    }

    if (currentStep === 1 && quantity <= 0) {
      setUserMsg({ type: "error", message: "Please fill in all fields." });
      return;
    }
    translateX.value = screenWidth;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      translateX.value = -screenWidth;
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSave = () => {
    if (currentStep !== TOTAL_STEPS - 1) {
      return;
    }
    if (!name || !strength || !instructions || !quantity) {
      setUserMsg({ type: "error", message: "Please fill in all fields." });
      return;
    }

    const newMedication: ParsedMedication = {
      name,
      strength,
      instructions,
      quantity: quantity || undefined,
      therapy: selectedType,
    };

    setParsedMedication(newMedication);
    router.push("/medication/confirmation");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View>
  
            <View style={styles.formGroup}>
              <Text style={styles.label}>Medication Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter medication name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Strength</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10mg, 500mg, etc."
                value={strength}
                onChangeText={setStrength}
              />
            </View>

            <View style={styles.navigationButtons}>
              <Button title="Next" onPress={handleNext} style={styles.navButton} />
            </View>
          </View>
        );
      case 1:
        return (
          <View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="Total number of pills/doses on the bottle"
                value={quantity === 0 ? "" : quantity.toString()}
                onChangeText={text => setQuantity(Number(text.replace(/[^0-9]/g, "")))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Therapy Type / Medication For</Text>
              <TextInput
                style={styles.input}
                placeholder="Select therapy type"
                onChangeText={setSelectedType}
                value={selectedType}
              />
            </View>

            <View style={styles.navigationButtons}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.navButton}
              />
              <Button title="Next" onPress={handleNext} style={styles.navButton} />
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special instructions for taking this medication"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.navigationButtons}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.navButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                style={styles.navButton}
                disabled={!instructions}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -50 : -100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View style={[styles.progressBar, progressStyle]} />
              </View>
              <Text style={styles.progressText}>
                Step {currentStep + 1} of {TOTAL_STEPS}
              </Text>
            </View>
            {userMsg.message ? (
              <Text style={{ color: userMsg.type === "error" ? "red" : "green" }}>
                {userMsg.message}
              </Text>
            ) : null}
            <Animated.View style={stepStyle}>{renderStep()}</Animated.View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Manually;

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: 24,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      padding: 16,
      fontSize: 16,
      color: Colors[colorScheme].text,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
    },
    inputText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    inputPlaceholder: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
    },
    helperText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginTop: 4,
    },
    typeSelector: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
    },
    selectedType: {
      flexDirection: "row",
      alignItems: "center",
    },
    typeIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    selectedTypeText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    typeOptions: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
      overflow: "hidden",
    },
    typeOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].secondary,
    },
    typeOptionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    frequencyOptions: {
      backgroundColor: Colors[colorScheme].input,
      borderRadius: borderRadius.md,
      marginTop: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].secondary,
      overflow: "hidden",
    },
    frequencyOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].secondary,
    },
    frequencyOptionText: {
      fontSize: 16,
      color: Colors[colorScheme].text,
    },
    scanButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: `${Colors[colorScheme].tint}10`,
      borderRadius: borderRadius.md,
      padding: 16,
      marginBottom: 24,
    },
    scanButtonText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
      marginLeft: 12,
    },
    navigationButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
      marginTop: 16,
    },
    navButton: {
      flex: 1,
    },
    progressContainer: {
      marginBottom: 24,
    },
    progressBackground: {
      height: 4,
      backgroundColor: Colors[colorScheme].secondary,
      borderRadius: 2,
      marginBottom: 8,
    },
    progressBar: {
      height: "100%",
      backgroundColor: Colors[colorScheme].tint,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      textAlign: "center",
    },
  });
}
