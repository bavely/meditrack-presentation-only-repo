import DoseCard from "@/components/DoseCard";
import { useColorScheme } from "@/hooks/useColorScheme";
import dayjs from "dayjs";
import { useGlobalSearchParams, useRouter } from "expo-router";
import * as Notifications from 'expo-notifications';
import { Bell, Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarProvider, WeekCalendar } from "react-native-calendars";
import { Avatar, Button } from "react-native-paper";
import EmptyState from "../../components/EmptyState";
import ProgressCircle from "../../components/ProgressCircle";
import { Colors } from "../../constants/Colors";
import { borderRadius, sizes, spacing } from "../../constants/Theme";
import { getDoseTimesByDate } from '../../services/scheduleService';
import { useAuthStore } from "../../store/auth-store";
import { useMedicationStore } from "../../store/medication-store";


 type Dose = {
    id: string;
    dosageQty: number;
    dosageUnit: string;
    scheduleId: string;
    scheduledAt: string;
    time: string;
    doseActions: any[];
    // Add other properties as needed, e.g. time, medication, etc.
    [key: string]: any;
  };

export default function DashboardScreen() {
const params = useGlobalSearchParams();
 const colorScheme = useColorScheme() ?? "light";
 const styles = createStyles(colorScheme);
  const router = useRouter();
  const { user } = useAuthStore();
  const { medications, markDoseAsTaken, markDoseAsSkipped } =
    useMedicationStore();
  const [todaysTakenCount, setTodaysTakenCount] = useState(0);
  const [todaysTotalCount, setTodaysTotalCount] = useState(0);
  const [adherenceRate, setAdherenceRate] = useState(0);
   const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [dosesForSelectedDate, setDosesForSelectedDate] = useState<Dose[]>([]);
 const textcolor = Colors[colorScheme].text;

  const scrollViewRef = useRef<ScrollView>(null);
  const itemPositions = useRef<Record<string, number>>({});

  console.log('Dashboard params:', params);
  const handleAddMedication = () => {
    router.push("/medication/add");
  };
  

    const getUserInitials = () => {
    if (!user || !user.name) return "?";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  };

  useEffect(() => {
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
  }, []);

  useEffect(() => {
    if (params?.scheduledTime) {

    }
  }, [params]);

  const filterActiveReminderDoses = useCallback(
    (doses: Dose[]) => {
      if (!Array.isArray(doses)) {
        return [];
      }

      return doses.filter((dose) => {
        const medicationId = dose?.doseActions?.[0]?.medicationId;
        if (!medicationId) {
          return false;
        }

        const medication = medications.find((med) => med.id === medicationId);
        if (!medication) {
          return false;
        }

        return (
          medication.isArchived !== true && medication.isReminderOn !== false
        );
      });
    },
    [medications]
  );

  useEffect(() => {
    if (params?.medicationId && params?.doseTimeId && params?.scheduledTime) {
      const dateParam = Array.isArray(params.scheduledTime)
        ? params.scheduledTime[0]
        : params.scheduledTime;
      const doseTimeId = Array.isArray(params.doseTimeId)
        ? params.doseTimeId[0]
        : params.doseTimeId;

      setSelectedDate(dateParam);
      setDosesForSelectedDate((prev) =>
        filterActiveReminderDoses(
          prev.map((dose) =>
            dose.id === doseTimeId
              ? { ...dose, notification: true }
              : dose
          )
        )
      );
    }
  }, [params, filterActiveReminderDoses]);

  useEffect(() => {
    const id = Array.isArray(params.doseTimeId)
      ? params.doseTimeId?.[0]
      : params.doseTimeId;
    if (id && dosesForSelectedDate.length > 0) {
      const position = itemPositions.current[id];
      if (position !== undefined) {
        scrollViewRef.current?.scrollTo({ y: position, animated: true });
      }
    }
  }, [params.doseTimeId, dosesForSelectedDate]);

  const fetchDoseTimes = useCallback(async () => {
    const doseTimes = await getDoseTimesByDate(selectedDate);
    const filteredDoses = filterActiveReminderDoses(doseTimes?.data ?? []);
    setDosesForSelectedDate(filteredDoses);
    console.log(filteredDoses);
  }, [selectedDate, filterActiveReminderDoses]);

  useEffect(() => {
    setDosesForSelectedDate((prev) => {
      const filtered = filterActiveReminderDoses(prev);
      if (filtered.length === prev.length) {
        const hasSameItems = filtered.every((dose, index) => dose === prev[index]);
        if (hasSameItems) {
          return prev;
        }
      }

      return filtered;
    });
  }, [filterActiveReminderDoses]);

  useEffect(() => {
    fetchDoseTimes();
  }, [fetchDoseTimes]);

  // Add listener for notification action responses to refresh data
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      if (action === 'TAKEN' || action === 'SKIP' || action === 'SNOOZE_5' || action === 'SNOOZE_15') {
        // Refresh data after a notification action
        console.log('[Dashboard] Refreshing data after notification action:', action);
        fetchDoseTimes();
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(subscription);
    };
  }, [fetchDoseTimes]);

  // Add app state listener to refresh data when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[Dashboard] App became active, refreshing data');
        fetchDoseTimes();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [fetchDoseTimes]);
  useEffect(() => {
    const filteredDoses = filterActiveReminderDoses(dosesForSelectedDate);
    const total = filteredDoses.length;
    const taken = filteredDoses.filter(
      (d) => d.doseActions?.[0]?.actionType?.toLowerCase() === "taken"
    ).length;
    setTodaysTotalCount(total);
    setTodaysTakenCount(taken);
    setAdherenceRate(total > 0 ? (taken / total) * 100 : 0);
  }, [dosesForSelectedDate, filterActiveReminderDoses]);

  const handleTake = useCallback(
    (doseId: string) => {
      markDoseAsTaken(doseId);
      setDosesForSelectedDate((prev) => {
        const updatedDoses = prev.map((d) =>
          d.id === doseId
            ? {
                ...d,
                doseActions: [{ ...d.doseActions?.[0], actionType: "TAKEN" }],
              }
            : d
        );

        return filterActiveReminderDoses(updatedDoses);
      });
    },
    [markDoseAsTaken, filterActiveReminderDoses]
  );

  const handleSkip = useCallback(
    (doseId: string) => {
      markDoseAsSkipped(doseId);
      setDosesForSelectedDate((prev) => {
        const updatedDoses = prev.map((d) =>
          d.id === doseId
            ? {
                ...d,
                doseActions: [{ ...d.doseActions?.[0], actionType: "SKIPPED" }],
              }
            : d
        );

        return filterActiveReminderDoses(updatedDoses);
      });
    },
    [markDoseAsSkipped, filterActiveReminderDoses]
  );
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CalendarProvider
        date={selectedDate}
        onDateChanged={(date) => setSelectedDate(date)}
      >
        <WeekCalendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{ [selectedDate]: { selected: true } }}
          style={{ marginBottom: spacing.md }}
          theme={{
            backgroundColor: Colors[colorScheme].background,
            calendarBackground: Colors[colorScheme].background,
            textSectionTitleColor: Colors[colorScheme].text,
            selectedDayBackgroundColor: Colors[colorScheme].tint,
            selectedDayTextColor: Colors[colorScheme].foreground,
            todayTextColor: Colors[colorScheme].tint,
            dayTextColor: Colors[colorScheme].text,
            monthTextColor: Colors[colorScheme].text,
            arrowColor: Colors[colorScheme].tint,
          }}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.content}
        >
          <View style={styles.statsContainer}>
            <Avatar.Text
              size={24}
              label={getUserInitials()}
              style={[styles.statLabel, { marginRight: 10 }]}
              labelStyle={{ color: textcolor }}
            />
            <Text style={[styles.statLabel, { color: textcolor }]}> Welcome {user?.name}</Text>
          </View>
          {/* Header with adherence stats */}
          <View style={styles.statsContainer}>
            <ProgressCircle
              progress={adherenceRate}
              size={100}
              strokeWidth={10}
              label="Adherence"
            />

            <View style={styles.statsDetails}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textcolor }]}>
                  {todaysTakenCount}
                </Text>
                <Text style={[styles.statLabel, { color: textcolor }]}>Taken</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textcolor }]}>
                  {todaysTotalCount}
                </Text>
                <Text style={[styles.statLabel, { color: textcolor }]}>Total</Text>
              </View>
            </View>
          </View>
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text
            style={[
              styles.statLabel,
              { color: textcolor },
            ]}
          >
            {dayjs(selectedDate).format("dddd, MMMM D")}
          </Text>

          <Button mode="outlined" onPress={() => setSelectedDate(dayjs().format("YYYY-MM-DD"))} style={{ alignSelf: 'flex-end' }}>
            Display Today
          </Button>
</View>
          {dosesForSelectedDate.length > 0 ? (
            dosesForSelectedDate.map((dose) => (
              <View
                key={dose.id}
                onLayout={(event) => {
                  itemPositions.current[dose.id] = event.nativeEvent.layout.y;
                }}
              >
                <DoseCard
                  dose={dose}
                  highlight={dose.notification}
                  onTake={handleTake}
                  onSkip={handleSkip}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon={<Bell size={48} color={Colors[colorScheme].text} />}
              title="No Pending Doses"
              description="You have no pending doses for today. Great job staying on track!"
            />
          )}

          {/* Medications section */}
          {/* <SectionHeader
        title="My Medications"
        onSeeAll={() => router.push("/calendar")}
      /> */}
        </ScrollView>

        {/* Add medication button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMedication}
          activeOpacity={0.8}
        >
          <Plus size={sizes.sm} color={Colors[colorScheme].foreground} />
        </TouchableOpacity>
      </CalendarProvider>
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
      paddingBottom: 100, // Extra padding at bottom for FAB
    },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: colorScheme === 'dark' 
        ? "rgba(56, 189, 248, 0.1)" 
        : "rgba(224, 242, 254, 0.5)",
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      alignItems: "center",
      // elevation: 2,
      
    },
    statsDetails: {
      flex: 1,
      flexDirection: "row",
      marginLeft: 16,
      height: 80,
      alignItems: "center",
      justifyContent: "space-around",
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
    },
    statLabel: {
      fontSize: 14,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: "50%",
      backgroundColor: Colors[colorScheme].icon,
    },
    addButton: {
      position: "absolute",
      bottom: spacing.lg,
      right: spacing.lg,
      width: sizes.lg,
      height: sizes.lg,
      borderRadius: borderRadius.xl,
      backgroundColor: "#eab308",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#eab308",
      shadowOffset: { width: 0, height: spacing.xs },
      shadowOpacity: 0.3,
      shadowRadius: spacing.sm,
      elevation: 5,
      zIndex: 1000,
    },
  });
}