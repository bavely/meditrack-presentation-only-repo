import { Colors } from "@/constants/Colors";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing } from "../constants/Theme";

export default function ModalScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>About MediTrack</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What is MediTrack?</Text>
        <Text style={styles.paragraph}>
          MediTrack is a comprehensive medication management app designed to help you
          keep track of your medications, dosages, and schedules. With MediTrack,
          you can easily manage your prescriptions, set reminders, and monitor your
          medication adherence.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Medication Tracking</Text>
          <Text style={styles.featureDescription}>
            Keep track of all your medications in one place, including dosages,
            frequencies, and special instructions.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Dose Reminders</Text>
          <Text style={styles.featureDescription}>
            Receive timely reminders for your medication doses to ensure you never
            miss a dose.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Refill Alerts</Text>
          <Text style={styles.featureDescription}>
            Get notified when your medications are running low and need to be refilled.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Medication Scanner</Text>
          <Text style={styles.featureDescription}>
            Scan prescription labels to automatically add medications to your list.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>AI Assistant</Text>
          <Text style={styles.featureDescription}>
            Get answers to your medication-related questions from our AI assistant.
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <Text style={styles.paragraph}>
          MediTrack takes your privacy and security seriously. All your medication
          data is stored securely on your device and is not shared with third parties
          without your explicit consent.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disclaimer</Text>
        <Text style={styles.paragraph}>
          MediTrack is not a substitute for professional medical advice, diagnosis,
          or treatment. Always seek the advice of your physician or other qualified
          health provider with any questions you may have regarding a medical condition.
        </Text>
      </View>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  section: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: spacing.sm + spacing.xs,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
  featureItem: {
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  versionText: {
    textAlign: "center",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
});