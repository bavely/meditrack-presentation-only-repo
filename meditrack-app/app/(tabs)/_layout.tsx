// app/(tabs)/_layout.tsx
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs, useRouter } from "expo-router";
import { ClipboardCheck, Home, MessageSquare, User } from "lucide-react-native";
import { Platform, SafeAreaView } from "react-native";
import { Colors } from "../../constants/Colors";

import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sizes } from "../../constants/Theme";
import "../../global.css";

import { registerForPushAsync, useNotifications } from "@/hooks/useNotifications";
import { useEffect } from "react";
import { initNotificationHandlers } from "../../services/notificationHandlers";
import { scheduleUpcomingDoseAlarms } from "../../services/notificationScheduler";
import { registerPushToken } from "../../services/notificationService";
import { initNotifications } from "../../services/setupNotifications";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const appVersion = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null;
  const alarmModal = useNotifications((data) => {
    const path = data?.url || data?.screen;
    if (typeof path === "string") {
      router.push(path as any);
    }
  });

  useEffect(() => {
    (async () => {
      // Schedule upcoming dose alarms on app start
      await scheduleUpcomingDoseAlarms();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // Initialize notification system
      await initNotifications();
      initNotificationHandlers();

      const expoToken = await registerForPushAsync();
      console.log("Expo Push Token:", expoToken);
      if (expoToken && appVersion) {
        await registerPushToken({
          token: expoToken,
          platform: Platform.OS,
          appVersion: appVersion,
        });
      }
      
    })();
  }, [appVersion]);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarInactiveTintColor: Colors[colorScheme].text,
          tabBarStyle: {
            backgroundColor: Colors[colorScheme].background,
            borderTopWidth: 1,
            borderTopColor: Colors[colorScheme].tint,
            elevation: 0,
            height: sizes.lg + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerShadowVisible: true,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 24,
          },
          headerTitleAlign: "center",
          headerTintColor: Colors[colorScheme].text,

        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarLabel: "Manage",
          tabBarIcon: ({ color }) => <ClipboardCheck size={24} color={color} />,
        }}
      />

      {/* <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      /> */}
      
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
          headerShown: false,
        }}
        
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      </Tabs>
      {alarmModal}
    </SafeAreaView>
  );
}
