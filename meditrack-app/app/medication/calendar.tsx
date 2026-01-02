import DoseCard from "@/components/DoseCard";
import EmptyState from "@/components/EmptyState";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  getDoseTimesByDate,
  getDoseTimesByDateRange,
} from "@/services/scheduleService";
import { useMedicationStore } from "@/store/medication-store";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { CalendarProvider, ExpandableCalendar, type DateData } from "react-native-calendars";
import { Button, SegmentedButtons } from "react-native-paper";
import { borderRadius, spacing } from "../../constants/Theme";

const DEBUG = __DEV__;

const STATUS_COLORS = {
  taken: "green",
  skipped: "red",
  missed: "gray",
  pending: "orange",
};

export default function CalendarScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [mounted, setMounted] = useState(false);                  // (2) mount guard

  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [dosesForSelectedDate, setDosesForSelectedDate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateIndicator, setDateIndicator] = useState<"month" | "day">("month");
  const { markDoseAsTaken, markDoseAsSkipped, medications } = useMedicationStore();
  const allowedMedicationIds = useMemo(() => {
    const allowed = new Set<string>();
    medications.forEach((med: any) => {
      if (!med?.id) return;
      if (med.isArchived === true) return;
      if (med.isReminderOn === false) return;
      allowed.add(med.id);
    });
    return allowed;
  }, [medications]);
  const filterDosesByAllowedMedications = useCallback(
    (doses: any[] = []) =>
      doses.filter((dose: any) => {
        const actions = Array.isArray(dose?.doseActions)
          ? dose.doseActions
          : [];

        if (actions.length === 0) {
          return true;
        }

        return actions.every((action: any) => {
          const medicationId = action?.medicationId;
          if (!medicationId) {
            return true;
          }

          return allowedMedicationIds.has(medicationId);
        });
      }),
    [allowedMedicationIds]
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "taken" | "skipped" | "pending" | "missed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Track if a day press triggered the next month change
  const dayPressRef = useRef(false);

  // Month/Week toggle
  const [isWeekView, setIsWeekView] = useState(false);
  const [calKey, setCalKey] = useState(0);
  const toggleView = () => { setIsWeekView(v => !v); setCalKey(k => k + 1); };
  const monthAnchorDate = useMemo(
    () => dayjs(selectedDate).startOf("month").format("YYYY-MM-DD"),
    [selectedDate]
  );

  const loadMonth = useCallback(
    async (
      date: string,
      fromDayPress = false,
      indicator: "month" | "day" = dateIndicator
    ) => {
      setIsLoading(true);
      // ⚠️ Don’t change selectedDate here; let the user’s selection drive it
      // setSelectedDate(date);

      const start = dayjs(date).startOf("month").format("YYYY-MM-DD");
      const end = dayjs(date).endOf("month").format("YYYY-MM-DD");

      try {
        const res = await getDoseTimesByDateRange(start, end);
        if (res?.success) {
          const filteredDoses = filterDosesByAllowedMedications(res.data ?? []);
          const dates: Record<string, any> = {};
          filteredDoses.forEach((dose: any) => {
            const d = dayjs(dose.scheduledAt).format("YYYY-MM-DD");
            const actionType = dose.doseActions?.[0]?.actionType?.toLowerCase() ?? "pending";
            const statusKey = (
              STATUS_COLORS[actionType as keyof typeof STATUS_COLORS]
                ? actionType
                : "pending"
            ) as keyof typeof STATUS_COLORS;
            if (!dates[d]) dates[d] = { dots: [] };
            if (!dates[d].dots.some((dot: any) => dot.key === statusKey)) {
              dates[d].dots.push({ key: statusKey, color: STATUS_COLORS[statusKey] });
            }
          });
          setMarkedDates(dates);
          if (indicator === "month" && !fromDayPress) {
            // show today’s list initially (optional)
            setDosesForSelectedDate(filteredDoses);
          }
        } else {
          setMarkedDates({});
          if (indicator === "month" && !fromDayPress) {
            setDosesForSelectedDate([]);
          }
        }
      } catch (e) {
        if (DEBUG) console.error("Error loading month:", JSON.stringify(e));
        setMarkedDates({});
        if (indicator === "month" && !fromDayPress) {
          setDosesForSelectedDate([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [dateIndicator, filterDosesByAllowedMedications]
  );

  const loadDosesForDate = useCallback(
    async (date: string) => {
      setIsLoading(true);
      try {
        const res = await getDoseTimesByDate(date);
        if (res?.success) {
          setDosesForSelectedDate(
            filterDosesByAllowedMedications(res.data ?? [])
          );
        } else {
          setDosesForSelectedDate([]);
        }
      } catch (e) {
        if (DEBUG) console.error("Error loading doses for date:", JSON.stringify(e));
        setDosesForSelectedDate([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filterDosesByAllowedMedications]
  );

  useEffect(() => { setMounted(true); }, []);                      // (2)
  useEffect(() => {
    void loadMonth(monthAnchorDate, false, dateIndicator);
  }, [loadMonth, monthAnchorDate, dateIndicator]);


  const onDayPress = useCallback((day: { dateString: string }) => {
    dayPressRef.current = true;
    setDateIndicator("day");
    setSelectedDate(day.dateString);
  }, []);
  useEffect(() => {
    // Load doses when selectedDate changes
    loadDosesForDate(selectedDate);
  }, [selectedDate, loadDosesForDate]);

  useEffect(() => {
    setDosesForSelectedDate((prev) => {
      const filtered = filterDosesByAllowedMedications(prev);
      if (filtered.length === prev.length) {
        const unchanged = filtered.every((dose, index) => dose === prev[index]);
        if (unchanged) {
          return prev;
        }
      }

      return filtered;
    });
  }, [filterDosesByAllowedMedications]);


  const marked = useMemo(() => ({
    ...markedDates,
    [selectedDate]: {
      ...(markedDates[selectedDate] || {}),
      selected: true,
    },
  }), [markedDates, selectedDate]);

  // (3) memoize theme
  const calendarTheme = useMemo(() => ({
    backgroundColor: Colors[colorScheme].background,
    calendarBackground: Colors[colorScheme].background,
    textSectionTitleColor: Colors[colorScheme].text,
    selectedDayBackgroundColor: Colors[colorScheme].tint,
    selectedDayTextColor: Colors[colorScheme].foreground,
    todayTextColor: Colors[colorScheme].tint,
    dayTextColor: Colors[colorScheme].text,
    monthTextColor: Colors[colorScheme].text,
    arrowColor: Colors[colorScheme].tint,
  }), [colorScheme]);

  const allowedDosesForSelectedDate = useMemo(
    () => filterDosesByAllowedMedications(dosesForSelectedDate),
    [dosesForSelectedDate, filterDosesByAllowedMedications]
  );

  const filteredDoses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return allowedDosesForSelectedDate.filter((dose: any) => {
      const doseStatus =
        dose.doseActions?.[0]?.actionType.toLowerCase() ?? "pending";
      if (statusFilter !== "all" && doseStatus !== statusFilter) return false;
      const medId = dose.doseActions?.[0]?.medicationId;
      const medName =
        medications.find((m: any) => m.id === medId)?.name?.toLowerCase() || "";
      if (search && !medName.includes(search)) return false;
      return true;
    });
  }, [statusFilter, allowedDosesForSelectedDate, searchTerm, medications]);

  const handleTake = useCallback(
    (doseId: string) => {
      markDoseAsTaken(doseId);
      setDosesForSelectedDate((prev) => {
        const updated = prev.map((d) =>
          d.id === doseId
            ? {
                ...d,
                doseActions: [{ ...d.doseActions?.[0], actionType: "TAKEN" }],
              }
            : d
        );
        setMarkedDates((prevMarked) => {
          const statuses = Array.from(
            new Set(
              updated.map(
                (d) => d.doseActions?.[0]?.actionType?.toLowerCase() ?? "pending"
              )
            )
          );
          const dots = statuses.map((key) => ({
            key,
            color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
          }));
          return {
            ...prevMarked,
            [selectedDate]: { ...(prevMarked[selectedDate] || {}), dots },
          };
        });
        return updated;
      });
    },
    [markDoseAsTaken, selectedDate]
  );

  const handleSkip = useCallback(
    (doseId: string) => {
      markDoseAsSkipped(doseId);
      setDosesForSelectedDate((prev) => {
        const updated = prev.map((d) =>
          d.id === doseId
            ? {
                ...d,
                doseActions: [{ ...d.doseActions?.[0], actionType: "SKIPPED" }],
              }
            : d
        );
        setMarkedDates((prevMarked) => {
          const statuses = Array.from(
            new Set(
              updated.map(
                (d) => d.doseActions?.[0]?.actionType?.toLowerCase() ?? "pending"
              )
            )
          );
          const dots = statuses.map((key) => ({
            key,
            color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
          }));
          return {
            ...prevMarked,
            [selectedDate]: { ...(prevMarked[selectedDate] || {}), dots },
          };
        });
        return updated;
      });
    },
    [markDoseAsSkipped, selectedDate]
  );

  const renderDose = useCallback(
    ({ item }: { item: any }) => (
      <DoseCard dose={item} onTake={handleTake} onSkip={handleSkip} />
    ),
    [handleTake, handleSkip]
  );

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: 116, offset: 116 * index, index }),
    []
  );

  const ListEmpty = useCallback(() => {
    if (isLoading) return <Text style={styles.selectedDateText}>Loading...</Text>;
    return <EmptyState title="No Doses Scheduled" description="You don't have any doses scheduled for this day." />;
  }, [isLoading, styles.selectedDateText]);

  return (
    <SafeAreaView style={styles.container}>
      <CalendarProvider date={selectedDate} onDateChanged={(d) => setSelectedDate(d)}>
        {/* (1) Pin the initial date so first render isn’t blank */}
        {mounted && (
          <ExpandableCalendar
            key={calKey}
            initialDate={selectedDate}
            initialPosition={
              isWeekView
                ? ExpandableCalendar.positions.CLOSED
                : ExpandableCalendar.positions.OPEN
            }
            onCalendarToggled={(open: boolean) => {
              setIsWeekView(!open);
              // setDateIndicator(open ? "month" : "day");
            }}
              onDayPress={onDayPress}
              onMonthChange={(m: DateData) => {
                if (dayPressRef.current) {
                  dayPressRef.current = false;
                  void loadMonth(m.dateString, true, "day");
                } else {
                  void loadMonth(m.dateString, false, dateIndicator);
                }
              }}
            markedDates={marked}
            markingType="multi-dot"
            displayLoadingIndicator={isLoading}
            theme={calendarTheme}
            disablePan={false}
            allowShadow={false}
          />
        )}

        <View style={styles.selectedDateHeader}>
          <View style={styles.headerRow}>
            <Text style={styles.selectedDateText}>
              {dateIndicator === "day"
                ? `${dayjs(selectedDate).format("ddd, MMMM D")} only Doses`
                : `${dayjs(selectedDate).format("MMMM YYYY")} All Doses`}
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={toggleView}
                style={styles.button}
              >
                {isWeekView ? "Month" : "Week"}
              </Button>

              {dateIndicator === "day" && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    setDateIndicator("month");
                    loadMonth(selectedDate, false, "month");
                  }}
                  style={styles.button}
                >
                  Show Month
                </Button>
              )}
            </View>
          </View>
          <SegmentedButtons
            value={statusFilter}
            onValueChange={setStatusFilter}
            buttons={[
              { value: "all", label: "All" },
              { value: "taken", label: "Taken" },
              { value: "skipped", label: "Skipped" },
              { value: "missed", label: "Missed" },
              { value: "pending", label: "Pending" },
            ]}
            style={styles.filterButtons}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications"
            placeholderTextColor={Colors[colorScheme].secondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <FlatList
          style={styles.dosesContainer}
          contentContainerStyle={styles.dosesContent}
          data={filteredDoses}
          keyExtractor={keyExtractor}
          renderItem={renderDose}
          ListEmptyComponent={ListEmpty}
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
          extraData={isLoading}
        />
      </CalendarProvider>
    </SafeAreaView>
  );
}
function createStyles(colorScheme: "light" | "dark") {
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: Colors[colorScheme].background,
      paddingBottom: spacing.lg
    },
    selectedDateHeader: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].tint,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    selectedDateText: {
      fontSize: 16,
      fontWeight: "300",
      color: Colors[colorScheme].text,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    button: {
      minWidth: 80,
    },
    filterButtons: {
      alignSelf: "stretch",
      marginTop: spacing.sm,
    },
    searchInput: {
      backgroundColor: Colors[colorScheme].input,
      color: Colors[colorScheme].text,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      marginTop: spacing.sm,
    },
    dosesContainer: {
      flex: 1
    },
    dosesContent: { 
      padding: spacing.md 
    },
  });
}