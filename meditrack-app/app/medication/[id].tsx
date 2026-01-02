import ProgressCircle from "@/components/ProgressCircle";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useMedicationStore } from "@/store/medication-store";
import { updateMedication as updateMedicationService } from "@/services/medicationService";
import { scheduleUpcomingDoseAlarms } from "@/services/notificationScheduler";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Calendar, Clock, Edit, FileText, Trash2 } from "lucide-react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from "react-native";
import Button from "../../components/ui/Button";
import { sizes, spacing } from "../../constants/Theme";

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);

  const { medications, deleteMedication, toggleArchive, toggleReminder } = useMedicationStore();
  const medication = medications.find((med) => med.id === id);
  console.log("MedicationDetailScreen - medication:", medication);

 
  
  if (!medication) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Medication not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.goBackButton}
        />
      </SafeAreaView>
    );
  }

     let intervalUnit = "day";
  const repeatPattern = medication.schedule.repeatPattern?.toLocaleLowerCase();
  if (repeatPattern === "daily") {
    intervalUnit = "day";
  } else if (repeatPattern === "weekly") {
    intervalUnit = "week";
  } else if (repeatPattern === "monthly") {
    intervalUnit = "month";
  }else if (repeatPattern === "yearly") {
    intervalUnit = "year";
  }else if (repeatPattern === "hourly") {
    intervalUnit = "hour";
  }else{
    intervalUnit = "day";
  }
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Are you sure you want to delete ${medication.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMedication(medication.id);
            router.back();
          },
        },
      ]
    );
  };
  
  const handleEdit = () => {
    // In a real app, navigate to edit screen
    Alert.alert("Edit Medication", "This feature is coming soon!");
  };
  
  // Calculate remaining days until refill
  const calculateRemainingDays = () => {
    if (!medication.refillDate || !medication.estimatedEndDate) return null;
    
    const today = new Date();
    const refillDate = new Date(medication.estimatedEndDate);
    const diffTime = refillDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const remainingDays = calculateRemainingDays();
  const isLowStock = medication.quantityLeft && medication.quantityLeft <= 7;
  const refillSoon = remainingDays !== null && remainingDays <= 7;

  const rescheduleUpcomingDoseAlarmsSafely = async (context: string) => {
    try {
      await scheduleUpcomingDoseAlarms();
    } catch (scheduleError) {
      console.warn(context, scheduleError);
    }
  };

  const handleToggleArchive = async () => {
    try {
      const newValue = !(medication.isArchived ?? false);
      await updateMedicationService({ id: medication.id, isArchived: newValue });
      toggleArchive(medication.id, newValue);
      await rescheduleUpcomingDoseAlarmsSafely(
        "Failed to reschedule upcoming dose alarms after archiving toggle"
      );
    } catch (error) {
      console.error("Failed to update archive status", JSON.stringify(error));
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    try {
      await updateMedicationService({ id: medication.id, isReminderOn: value });
      toggleReminder(medication.id, value);
      await rescheduleUpcomingDoseAlarmsSafely(
        "Failed to reschedule upcoming dose alarms after reminder toggle"
      );
    } catch (error) {
      console.error("Failed to update reminder status", JSON.stringify(error));
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Medication header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: medication.color }]}>
          <Text style={styles.iconText}>{medication.name.charAt(0)}</Text>
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          <Text style={styles.medicationDosage}>{medication.strength}</Text>
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <Edit size={20} color={Colors[colorScheme].tint} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Trash2 size={20} color={Colors[colorScheme].tint} />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleToggleArchive}>
          <MaterialIcons
            name={medication.isArchived ? "unarchive" : "archive"}
            size={20}
            color={Colors[colorScheme].tint}
          />
          <Text style={styles.actionButtonText}>
            {medication.isArchived ? "Unarchive" : "Archive"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.reminderContainer}>
        <Text style={styles.reminderLabel}>Reminder</Text>
        <Switch
          value={medication.isReminderOn ?? false}
          onValueChange={handleToggleReminder}
          thumbColor={Colors[colorScheme].foreground}
          trackColor={{
            false: Colors[colorScheme].icon,
            true: Colors[colorScheme].tint,
          }}
        />
      </View>
      
      {/* Medication details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Clock size={20} color={Colors[colorScheme].tint} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{medication.schedule.frequency} time {medication.schedule.frequency  &&  Number(medication.schedule.frequency) > 1 ? `s` : ""} every {medication.schedule.interval} {medication?.schedule?.interval && medication?.schedule?.interval > 1 ? `${intervalUnit}s` : intervalUnit}</Text>
          </View>
        </View>
        
        {medication.refillDate && (
          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors[colorScheme].tint} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Next Refill</Text>
              <Text style={styles.detailValue}>
                {new Date(medication.refillDate).toLocaleDateString()}
                {remainingDays !== null && ` (${remainingDays} days)`}
              </Text>
            </View>
          </View>
        )}
        
        {medication.instructions && (
          <View style={styles.detailItem}>
            <FileText size={20} color={Colors[colorScheme].tint} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Instructions</Text>
              <Text style={styles.detailValue}>{medication.instructions}</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Warnings */}
      {(isLowStock || refillSoon) && (
        <View style={styles.warningsContainer}>
          {isLowStock && (
            <View style={styles.warningItem}>
              <AlertCircle size={20} color={Colors[colorScheme].tint} />
              <Text style={styles.warningText}>
                Low stock: {medication.remainingDoses} doses left
              </Text>
            </View>
          )}
          
          {refillSoon && (
            <View style={styles.warningItem}>
              <AlertCircle size={20} color={Colors[colorScheme].tint} />
              <Text style={styles.warningText}>
                Refill needed in {remainingDays} days
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Medication supply */}
      {medication.quantityLeft && medication.quantity && (
        <View style={styles.supplyContainer}>
          <Text style={styles.supplyTitle}>Medication Supply</Text>
          
          <View style={styles.supplyContent}>
            <ProgressCircle
              progress={(medication.quantityLeft / medication.quantity) * 100}
              size={100}
              strokeWidth={10}
              label="Remaining"
            />
            
            <View style={styles.supplyDetails}>
              <View style={styles.supplyItem}>
                <Text style={styles.supplyValue}>{medication.quantityLeft}</Text>
                <Text style={styles.supplyLabel}>Remaining</Text>
              </View>
              
              <View style={styles.supplyDivider} />
              
              <View style={styles.supplyItem}>
                <Text style={styles.supplyValue}>{medication.quantity}</Text>
                <Text style={styles.supplyLabel}>Total</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Refill button */}
      {/* <Button
        title="Mark as Refilled"
        onPress={() => Alert.alert("Refill", "This feature is coming soon!")}
        style={styles.refillButton}
      /> */}
    </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    content: {
      padding: spacing.md,
    },
    notFoundContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.md,
    },
    notFoundText: {
      fontSize: 18,
      color: Colors[colorScheme].text,
      marginBottom: spacing.md,
    },
    goBackButton: {
      minWidth: 200,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: spacing.sm,
      elevation: 2,
    },
    iconContainer: {
      width: sizes.lg,
      height: sizes.lg,
      borderRadius: sizes.lg / 2,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    iconText: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].foreground,
    },
    headerContent: {
      flex: 1,
    },
    medicationName: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: 4,
    },
    medicationDosage: {
      fontSize: 18,
      color: Colors[colorScheme].tint,
      fontWeight: "600",
    },
    actionButtons: {
      flexDirection: "row",
      marginBottom: 24,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 16,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
      marginLeft: 8,
    },
    deleteButtonText: {
      color: Colors[colorScheme].tint,
    },
    reminderContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    reminderLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].text,
      marginRight: 8,
    },
    detailsContainer: {
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    detailContent: {
      flex: 1,
      marginLeft: 16,
    },
    detailLabel: {
      fontSize: 14,
      color: Colors[colorScheme].tint,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      color: Colors[colorScheme].text,
      fontWeight: "500",
    },
    warningsContainer: {
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    warningItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    warningText: {
      fontSize: 16,
      color: Colors[colorScheme].icon,
      fontWeight: "500",
      marginLeft: 12,
    },
    supplyContainer: {
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    supplyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: 16,
    },
    supplyContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    supplyDetails: {
      flex: 1,
      flexDirection: "row",
      marginLeft: 16,
      height: 80,
      alignItems: "center",
      justifyContent: "space-around",
    },
    supplyItem: {
      alignItems: "center",
    },
    supplyValue: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].text,
    },
    supplyLabel: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginTop: 4,
    },
    supplyDivider: {
      width: 1,
      height: "50%",
      backgroundColor: Colors[colorScheme].icon,
    },
    refillButton: {
      marginBottom: 24,
    },
  });
}