import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RecordingIndicator from "../../components/RecordingIndicator";
import { handleParsedText } from "../../services/medicationService";
import { useMedicationStore } from "../../store/medication-store";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export default function MedicationVoiceScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = useMemo(() => createStyles(colorScheme), [colorScheme]);
  const router = useRouter();
  const { setParsedMedication } = useMedicationStore();

  // SR state
  const [recognizing, setRecognizing] = useState(false);
  const [finalText, setFinalText] = useState("");   // accumulated final chunks
  const [interimText, setInterimText] = useState(""); // current live chunk
  const [isProcessing, setIsProcessing] = useState(false);

  // debounce to prevent double taps
  const lastPressRef = useRef(0);
  const debouncePress = (ms = 300) => {
    const now = Date.now();
    if (now - lastPressRef.current < ms) return false;
    lastPressRef.current = now;
    return true;
  };

  // === SR event wiring ===
  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("error", (event: any) => {
    const msg = event?.message || "Speech recognition error";
    setRecognizing(false);
    setInterimText("");
    console.error("SR error:", event);
    Alert.alert("Speech recognition error", msg);
  });

  // Real-time text
  useSpeechRecognitionEvent("result", (event: any) => {
    const t = event?.results?.[0]?.transcript ?? "";
    if (!t) return;
    if (event?.isFinal) {
      setFinalText((prev) => (prev ? `${prev} ${t}` : t));
      setInterimText("");
    } else {
      setInterimText(t);
    }
  });

  const displayedText = useMemo(() => {
    return interimText ? (finalText ? `${finalText} ${interimText}` : interimText) : finalText;
  }, [finalText, interimText]);

  // === Controls ===
  const startSR = async () => {
    if (!debouncePress()) return;
    try {
      // Ask for permission
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert("Microphone/Speech permission required");
        return;
      }
      // Ensure a clean slate
      try { await ExpoSpeechRecognitionModule.stop(); } catch {}
      setFinalText("");
      setInterimText("");

      // Start SR (continuous + interim)
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        // contextualStrings: ["acetaminophen", "ibuprofen"], // optional
      });
    } catch (e) {
      console.error("SR start error:", e);
      Alert.alert("Could not start speech recognition");
      setRecognizing(false);
    }
  };

  const stopSR = async () => {
    if (!debouncePress()) return;
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch {
      // no-op
    }
  };

  const clearText = () => {
    setFinalText("");
    setInterimText("");
  };

  // Submit the confirmed text
  const handleSubmit = async () => {
    if (isProcessing) return;
    const text = displayedText.trim();
    if (!text) {
      Alert.alert("Nothing to submit", "Please dictate some text first.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await handleParsedText(text);
      if (res?.data?.parseMedicationLabel?.data) {
        setParsedMedication(res.data.parseMedicationLabel.data);
        router.push("/medication/confirmation");
      } else {
        Alert.alert("Unable to parse medication. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("An error occurred while processing your request");
    } finally {
      setIsProcessing(false);
    }
  };

  // stop SR on unmount
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Listening indicator */}
        {recognizing && (
          <View style={styles.indicator}>
            <ActivityIndicator color={Colors[colorScheme].tint} />
            <RecordingIndicator active />
            <Text style={styles.indicatorText}>Listening…</Text>
          </View>
        )}

        {/* Real-time transcript */}
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Transcript (live):</Text>
          <Text style={styles.transcriptText}>{displayedText || "—"}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {!recognizing ? (
            <Pressable style={styles.circularButton} onPress={startSR}>
              <Ionicons name="mic" size={32} color={Colors[colorScheme].background} />
            </Pressable>
          ) : (
            <Pressable style={styles.circularButton} onPress={stopSR}>
              <Ionicons name="square" size={28} color={Colors[colorScheme].background} />
            </Pressable>
          )}

          <Pressable
            style={styles.circularButton}
            disabled={isProcessing || !displayedText.trim()}
            onPress={handleSubmit}
          >
            {isProcessing ? (
              <ActivityIndicator color={Colors[colorScheme].background} />
            ) : (
              <Ionicons name="checkmark" size={32} color={Colors[colorScheme].background} />
            )}
          </Pressable>

          <Pressable style={styles.circularButton} onPress={clearText}>
            <Ionicons name="trash" size={24} color={Colors[colorScheme].background} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      width: "100%",
      alignItems: "center",
      gap: 24,
    },
    indicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    indicatorText: {
      color: Colors[colorScheme].text,
      fontSize: 16,
    },
    controlsRow: {
      flexDirection: "row",
      gap: 20,
      marginTop: 8,
    },
    circularButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
    },
    transcriptContainer: {
      width: "100%",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
      padding: 16,
      backgroundColor: Colors[colorScheme].background,
      minHeight: 120,
    },
    transcriptLabel: {
      fontWeight: "600",
      marginBottom: 6,
      color: Colors[colorScheme].tint,
    },
    transcriptText: {
      color: Colors[colorScheme].text,
      fontSize: 16,
      lineHeight: 22,
    },
  });
}
