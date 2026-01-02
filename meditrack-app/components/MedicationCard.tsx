import { Colors } from "@/constants/Colors";
import { borderRadius } from "@/constants/Theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Medication } from "@/types/medication";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AlertCircle, Calendar, Clock, Syringe } from "lucide-react-native";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
interface MedicationCardProps {
  medication: Medication;
  onPress: (medication: Medication) => void;
  onDelete?: (id: string) => void;
}

export default function MedicationCard({
  medication,
  onPress,
  onDelete,
}: MedicationCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const isLowStock =
    typeof medication.quantityLeft === "number" &&
    medication.quantityLeft <= 7;

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
  const dosageUnit = medication.schedule.doseTimes[0]?.dosageUnit || "";
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(medication)}
      onLongPress={() =>
        onDelete &&
        Alert.alert(
          "Delete Medication",
          `Are you sure you want to delete ${medication.name}?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => onDelete(medication.id),
            },
          ]
        )
      }
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: medication.color }]}>
        {/* <Pill size={24} color={Colors[colorScheme].foreground} /> */}
      { dosageUnit.toLowerCase() === "capsules" || dosageUnit.toLowerCase() === "capsule"  ? <FontAwesome6 name={('capsules').toLowerCase()} size={24} color={Colors[colorScheme].foreground} /> : 
      dosageUnit.toLowerCase() === "tablets" || dosageUnit.toLowerCase() === "tablet"  ? <FontAwesome6 name={('tablets').toLowerCase()} size={24} color={Colors[colorScheme].foreground} /> : 
        dosageUnit.toLowerCase() === "shots" || dosageUnit.toLowerCase() === "shot" ? <Syringe  size={24} color={Colors[colorScheme].foreground} /> :
        <MaterialIcons  name="medication" size={24} color={Colors[colorScheme].foreground} />
      }
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{medication.name}</Text>
            <Text style={styles.dosage}>{medication.strength}</Text>
          </View>
          
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Clock size={16} color={Colors[colorScheme].tint} />
            <Text style={styles.detailText}>{medication.schedule.frequency} time{medication.schedule.frequency  &&  Number(medication.schedule.frequency) > 1 ? `s` : ""} every {medication.schedule.interval} {medication?.schedule?.interval && medication?.schedule?.interval > 1 ? `${intervalUnit}s` : intervalUnit}</Text>
          </View>

          {medication.refillDate && (
            <View style={styles.detailItem}>
              <Calendar size={16} color={Colors[colorScheme].tint} />
              <Text style={styles.detailText}>
                Refill: {new Date(medication.refillDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {isLowStock && (
            <View style={styles.warningContainer}>
              <AlertCircle size={16} color={Colors[colorScheme].tint} />
              <Text style={styles.warningText}>
                Low stock: {medication.remainingDoses} doses left
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}



function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: borderRadius.lg,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    contentContainer: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginBottom: 8,
    },
    titleContainer: {
      flexDirection: "column",
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    dosage: {
      fontSize: 16,
      fontWeight: "500",
      color: Colors[colorScheme].text,
    },
    details: {
      gap: 8,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    warningContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    warningText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      fontWeight: "500",
    },
  });

}
