import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import dayjs from "dayjs";
import * as Notifications from "expo-notifications";
import { useRouter } from 'expo-router';
import {
  BedDouble,
  Bell,
  Clock,
  Coffee,
  Dumbbell,
  HelpCircle,
  LogOut,
  Moon,
  Shield,
  Utensils,
  UtensilsCrossed,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TimePickerModal } from "react-native-paper-dates";
import { sizes, spacing } from "../../constants/Theme";
import {
  registerForPushAsync,
  unregisterForPushAsync,
} from "../../hooks/useNotifications";
import { updateUserPreferences as updateUserPreferencesService } from "../../services/userService";
import { useAuthStore } from "../../store/auth-store";

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const {
    user,
    logout,
    updateUserPreferences: setUserPreferences,
  } = useAuthStore();
  const router = useRouter();

  const [bedTime, setBedTime] = React.useState<string | null>(
    user?.bedTime ?? null
  );
  const [breakfastTime, setBreakfastTime] = React.useState<string | null>(
    user?.breakfastTime ?? null
  );
  const [lunchTime, setLunchTime] = React.useState<string | null>(
    user?.lunchTime ?? null
  );
  const [dinnerTime, setDinnerTime] = React.useState<string | null>(
    user?.dinnerTime ?? null
  );
  const [exerciseTime, setExerciseTime] = React.useState<string | null>(
    user?.exerciseTime ?? null
  );

  type PrefKey =
    | "bedTime"
    | "breakfastTime"
    | "lunchTime"
    | "dinnerTime"
    | "exerciseTime";
  const [pickerField, setPickerField] = React.useState<PrefKey | null>(null);
  const [pickerDate, setPickerDate] = React.useState(new Date());
  React.useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) =>
      setNotificationsEnabled(status === "granted")
    );
  }, []);

  React.useEffect(() => {
    setBedTime(user?.bedTime ?? null);
    setBreakfastTime(user?.breakfastTime ?? null);
    setLunchTime(user?.lunchTime ?? null);
    setDinnerTime(user?.dinnerTime ?? null);
    setExerciseTime(user?.exerciseTime ?? null);
  }, [
    user?.bedTime,
    user?.breakfastTime,
    user?.lunchTime,
    user?.dinnerTime,
    user?.exerciseTime,
  ]);

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      await registerForPushAsync();
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === "granted");
    } else {
      await unregisterForPushAsync();
      setNotificationsEnabled(false);
    }
  };
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            // Navigate to login screen
            router.push("/(auth)/login");
          },
        },
      ]
    );
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.name) return "?";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  };

  const formatTime = (t: string | null) => {
    if (!t) return "Set";
    return dayjs(t).format("h:mm A");
  };

  const openPicker = (field: PrefKey) => {
    const map: Record<PrefKey, string | null> = {
      bedTime,
      breakfastTime,
      lunchTime,
      dinnerTime,
      exerciseTime,
    };
    const value = map[field];
    if (value) {
      const d = new Date(value);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      console.log("Opening picker for", field, "with time", hours, minutes);
      setPickerDate(d);
    } else {
      setPickerDate(new Date());
    }
    setPickerField(field);
  };

  const onDismissPicker = () => setPickerField(null);

  const onConfirmPicker = async ({ hours, minutes }: { hours: number; minutes: number }) => {
    if (!pickerField) return;
    console.log("Picked time", { hours, minutes });
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    // Convert to ISO string on a fixed date to avoid timezone issues
    const value = dayjs(now).toISOString();
    setPickerField(null);
    console.log("Prefrance", {
        [pickerField]: value,
      });
    try {
      const res = await updateUserPreferencesService({
        [pickerField]: value,
      } as any);
      if (res?.success) {
        console.log("Updated preference", res);
        setUserPreferences({ [pickerField]: value } as any);
        switch (pickerField) {
          case "bedTime":
            setBedTime(value);
            break;
          case "breakfastTime":
            setBreakfastTime(value);
            break;
          case "lunchTime":
            setLunchTime(value);
            break;
          case "dinnerTime":
            setDinnerTime(value);
            break;
          case "exerciseTime":
            setExerciseTime(value);
            break;
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update preference");
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getUserInitials()}</Text>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.email || "User"}</Text>
          <Text style={styles.profileEmail}>{user?.email || ""}</Text>
        </View>
      </View>
      
      {/* Settings sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Bell size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive reminders for your medications
            </Text>
          </View>
          
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{
              false: Colors[colorScheme].tint,
              true: Colors[colorScheme].text,
            }}
            thumbColor={Colors[colorScheme].foreground}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Clock size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Reminder Time</Text>
            <Text style={styles.settingDescription}>
              Set default reminder times
            </Text>
          </View>
          
          <TouchableOpacity>
            <Text style={styles.settingAction}>Configure</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Moon size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Switch between light and dark theme
            </Text>
          </View>
          
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: Colors[colorScheme].tint, true: Colors[colorScheme].text }}
            thumbColor={Colors[colorScheme].foreground}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <BedDouble size={20} color={Colors[colorScheme].tint} />
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Bedtime</Text>
            <Text style={styles.settingDescription}>Preferred sleep time</Text>
          </View>

          <TouchableOpacity onPress={() => openPicker("bedTime")}>
            <Text style={styles.settingAction}>{formatTime(bedTime)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Coffee size={20} color={Colors[colorScheme].tint} />
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Breakfast Time</Text>
            <Text style={styles.settingDescription}>Start of your day</Text>
          </View>

          <TouchableOpacity onPress={() => openPicker("breakfastTime")}>
            <Text style={styles.settingAction}>{formatTime(breakfastTime)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Utensils size={20} color={Colors[colorScheme].tint} />
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Lunch Time</Text>
            <Text style={styles.settingDescription}>Midday meal</Text>
          </View>

          <TouchableOpacity onPress={() => openPicker("lunchTime")}>
            <Text style={styles.settingAction}>{formatTime(lunchTime)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <UtensilsCrossed size={20} color={Colors[colorScheme].tint} />
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Dinner Time</Text>
            <Text style={styles.settingDescription}>Evening meal</Text>
          </View>

          <TouchableOpacity onPress={() => openPicker("dinnerTime")}>
            <Text style={styles.settingAction}>{formatTime(dinnerTime)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Dumbbell size={20} color={Colors[colorScheme].tint} />
          </View>

          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Exercise Time</Text>
            <Text style={styles.settingDescription}>Preferred workout time</Text>
          </View>

          <TouchableOpacity onPress={() => openPicker("exerciseTime")}>
            <Text style={styles.settingAction}>{formatTime(exerciseTime)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <HelpCircle size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Help & Support</Text>
            <Text style={styles.settingDescription}>
              Get help with using the app
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Shield size={20} color={Colors[colorScheme].tint} />
          </View>
          
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>
              Read our privacy policy
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={Colors[colorScheme].tint} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
    <TimePickerModal
      visible={pickerField !== null}
      onDismiss={onDismissPicker}
      onConfirm={onConfirmPicker}
      hours={pickerDate.getHours()}
      minutes={pickerDate.getMinutes()}
    />
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
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors[colorScheme].icon,
      borderRadius: spacing.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: spacing.sm,
      elevation: 2,
    },
    avatarContainer: {
      width: sizes.lg,
      height: sizes.lg,
      borderRadius: sizes.lg / 2,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].foreground,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: spacing.xs,
    },
    profileEmail: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    section: {
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: spacing.sm,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors[colorScheme].text,
      marginBottom: spacing.md,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].icon,
    },
    settingIconContainer: {
      width: sizes.md,
      height: sizes.md,
      borderRadius: sizes.md / 2,
      backgroundColor: `${Colors[colorScheme].tint}20`,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: Colors[colorScheme].text,
    },
    settingAction: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors[colorScheme].surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors[colorScheme].tint,
      marginLeft: spacing.sm,
    },
    versionText: {
      textAlign: "center",
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginBottom: spacing.lg,
    },
  });
}
