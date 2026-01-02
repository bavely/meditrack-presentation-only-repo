import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useMedicationStore } from "@/store/medication-store";
import dayjs from "dayjs";
// import dayjs from "@/utils/dayjs";
import { Bell, BellOff, Check, X } from "lucide-react-native";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Chip } from 'react-native-paper';
import { updateDoseAction } from "../services/doseActionService";
import { getMedication } from "../services/medicationService";
import { getDoseTimesByDate } from "../services/scheduleService";

// interface DoseCardProps {
//   dose: MedicationDose;
//   onTake: (doseId: string) => void;
//   onSkip: (doseId: string) => void;
// }

function DoseCard({ dose, onTake, onSkip, highlight }: any) {
  const { medications } = useMedicationStore();
  const colorScheme = useColorScheme() ?? "light";
  const notification = dose.notification || false;
  const baseBackground = notification ? Colors[colorScheme].surface : Colors[colorScheme].background;
  const flashAnim = useRef(new Animated.Value(0));
  const action = dose.doseActions?.[0];
  const actionType = action?.actionType ? action.actionType.toLowerCase() : undefined;
  const medicationId = action?.medicationId;
  const snoozeCount = action?.snoozeCount ?? 0;
  const snoozedUntil = action?.snoozedUntil;
  const isPending = !actionType || actionType === "pending";
  const isTaken = actionType === "taken";
  const isSkipped = actionType === "skipped";
  const isMissed = actionType === "missed";
  const isSnoozed = !!(snoozedUntil && dayjs(snoozedUntil).isAfter(dayjs()));
  
  const styles = createStyles(colorScheme, {isPending, isTaken, isSkipped, isMissed, isSnoozed }, baseBackground);
  const [medication, setMedication] = useState<any>(null);

  // Check if this dose has an upcoming alarm
  const hasUpcomingAlarm = isPending && dayjs(snoozedUntil ?? dose.scheduledAt).isAfter(dayjs());
  const isOverdue = isPending && dayjs(snoozedUntil ?? dose.scheduledAt).isBefore(dayjs());
  
  // Format time (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    return dayjs(time).format("h:mm A");
  };

  const getMedicationById = useCallback((id: string) => {
    if (medications.length > 0 && medications.some((med: any) => med.id === id)) {
      setMedication(medications.find((med: any) => med.id === id));
    } else {
      getMedication(id).then((res) => {
        setMedication(res.data);
      });
    }
  }, [medications]);

  useEffect(() => {
    if (medicationId) {
      getMedicationById(medicationId);
    }
  }, [getMedicationById, medicationId]);
  // console.log(medication);

  const reloadDose = async () => {
    try {
      const doses = await getDoseTimesByDate(
        dayjs(dose.scheduledAt).format('YYYY-MM-DD')
      );
      const latest = doses.data?.find((d: any) => d.id === dose.id);
      const status = latest?.doseActions?.[0]?.actionType
        ? latest.doseActions[0].actionType.toLowerCase()
        : undefined;
      if (status === 'taken') {
        onTake(dose.id);
      } else if (status === 'skipped') {
        onSkip(dose.id);
      }
    } catch (err) {
      console.error('Failed to reload dose', err);
    }
  };

  const handleTake = async () => {
    onTake(dose.id);
    if (!action?.id) {
      console.warn('No dose action available to update for take action');
      await reloadDose();
      return;
    }
    try {
      await updateDoseAction({
        id: action.id,
        actionType: 'TAKEN',
        actionTime: new Date().toISOString(),
        snoozeCount,
      });
    } catch (error) {
      console.error('Failed to update dose action', error);
      await reloadDose();
    }
  };

  const handleSkip = () => {
    Alert.alert('Skip Dose', 'Are you sure you want to skip this dose?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        style: 'destructive',
        onPress: async () => {
          onSkip(dose.id);
          if (!action?.id) {
            console.warn('No dose action available to update for skip action');
            await reloadDose();
            return;
          }
          try {
            await updateDoseAction({
              id: action.id,
              actionType: 'SKIPPED',
              actionTime: new Date().toISOString(),
              snoozeCount,
            });
          } catch (error) {
            console.error('Failed to update dose action', error);
            await reloadDose();
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (highlight) {
      Animated.sequence([
        Animated.timing(flashAnim.current, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim.current, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [highlight]);

  const animatedStyle = {
    backgroundColor: flashAnim.current.interpolate({
      inputRange: [0, 1],
      outputRange: [baseBackground, Colors[colorScheme].tint],
    }),
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.colorIndicator, { backgroundColor: medication?.color }]} />

      <View style={styles.contentContainer}>
        <Text className="text-sm text-gray-500 bg-purple-100 border border-purple-200 rounded-xl  justify-center content-center text-center flex flex-row">{dayjs(dose.scheduledAt).format("M/D/YYYY")}</Text>
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(dose.scheduledAt)}</Text>
            {/* Notification Status Indicator */}
            <View style={styles.notificationStatus}>
              {isSnoozed ? (
                <Bell size={14} color="#3b82f6" />
              ) : hasUpcomingAlarm ? (
                <Bell size={14} color={Colors[colorScheme].tint} />
              ) : isOverdue ? (
                <Bell size={14} color="#ef4444" />
              ) : !isPending ? (
                <BellOff size={14} color={Colors[colorScheme].icon} />
              ) : null}
            </View>
          </View>
          <Chip style={styles.chip}>
            <Text style={styles.status}>
              {isTaken ? "Taken" : isSkipped ? "Skipped" : isMissed ? "Missed" : isSnoozed ? "Snoozed" : isOverdue ? "Overdue" : "Pending"}
            </Text>
          </Chip>
        </View>

        <Text style={styles.name}>{medication?.name}</Text>
        <Text style={styles.dosage}>Take {dose.dosageQty} {dose.dosageUnit}</Text>
        <Text className="text-sm text-orange-600">
          {medication?.instructions}
        </Text>
        
        {/* Snooze Info */}
        {isSnoozed && snoozedUntil && (
          <Text style={styles.snoozeInfo}>
            Snoozed until {formatTime(snoozedUntil)} ({snoozeCount} snooze{snoozeCount > 1 ? 's' : ''})
          </Text>
        )}
        
        {/* Overdue Warning */}
        {isOverdue && (
          <Text style={styles.overdueWarning}>
            Overdue by {dayjs().diff(dayjs(snoozedUntil ?? dose.scheduledAt), 'minute')} minutes
          </Text>
        )}
      </View>

      {isPending && !isSnoozed && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.takeButton]}
            onPress={handleTake}
          >
            <Check size={20} color={Colors[colorScheme].foreground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.skipButton]}
            onPress={handleSkip}
          >
            <X size={20} color={Colors[colorScheme].foreground} />
          </TouchableOpacity>
        </View>
      )}

      {(isTaken || isSkipped) && (
        <View style={styles.statusIndicator}>
          {isTaken ? (
            <View style={[styles.statusDot, styles.takenDot]}>
              <Check size={12} color={Colors[colorScheme].foreground} />
            </View>
          ) : (
            <View style={[styles.statusDot, styles.skippedDot]}>
              <X size={12} color={Colors[colorScheme].foreground} />
            </View>
          )}
        </View>
      )}
      
      {isSnoozed && (
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, styles.snoozedDot]}>
            <Bell size={12} color={Colors[colorScheme].foreground} />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

export default memo(
  DoseCard,
  (prev, next) =>
    prev.dose?.id === next.dose?.id &&
    prev.dose?.status === next.dose?.status &&
    prev.dose?.scheduledAt === next.dose?.scheduledAt &&
    prev.dose?.doseActions?.[0]?.actionType === next.dose?.doseActions?.[0]?.actionType &&
    prev.dose?.doseActions?.[0]?.snoozeCount === next.dose?.doseActions?.[0]?.snoozeCount &&
    prev.dose?.doseActions?.[0]?.snoozedUntil === next.dose?.doseActions?.[0]?.snoozedUntil &&
    prev.highlight === next.highlight
);

function createStyles(
  colorScheme: 'light' | 'dark',
  state: {isPending: boolean, isTaken: boolean, isSkipped: boolean, isMissed: boolean, isSnoozed: boolean},
  baseBackground: string
) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: baseBackground,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
      overflow: "hidden",
      borderWidth: state.isSnoozed ? 2 : 0,
      borderColor: state.isSnoozed ? Colors[colorScheme].tint : 'transparent',
    },
    colorIndicator: {
      width: 6,
      height: "100%",
    },
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    time: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
    },
    notificationStatus: {
      opacity: 0.7,
    },
    status: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    name: {
      fontSize: 18,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      marginBottom: 4,
    },
    dosage: {
      fontSize: 16,
      color: Colors[colorScheme].text,
      backgroundColor: "rgba(245, 158, 11, 0.7)",
      alignSelf: "flex-start",
      borderRadius: 8,
      marginBottom: 4,
      padding: 4,
    },
    snoozeInfo: {
      fontSize: 12,
      color: Colors[colorScheme].tint,
      fontStyle: 'italic',
      marginTop: 4,
    },
    overdueWarning: {
      fontSize: 12,
      color: '#ef4444',
      fontWeight: '500',
      marginTop: 4,
    },
    actionsContainer: {
      flexDirection: "column",
      justifyContent: "center",
      gap: 8,
      padding: 12,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    takeButton: {
      backgroundColor: Colors[colorScheme].tint,
    },
    skipButton: {
      backgroundColor: Colors[colorScheme].tint,
    },
    statusIndicator: {
      justifyContent: "center",
      alignItems: "center",
      paddingRight: 16,
    },
    statusDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    takenDot: {
      backgroundColor: Colors[colorScheme].tint,
    },
    skippedDot: {
      backgroundColor: Colors[colorScheme].tint,
    },
    snoozedDot: {
      backgroundColor: Colors[colorScheme].tint,
      opacity: 0.7,
    },
    chip: {
      backgroundColor: state.isPending ? 
        (state.isSnoozed ? '#3b82f6' : 'orange') : 
        state.isTaken ? 'green' : 
        state.isSkipped ? 'red' : 
        'gray',
      borderRadius: 16,
      marginTop: 4,
    },
  });

}
