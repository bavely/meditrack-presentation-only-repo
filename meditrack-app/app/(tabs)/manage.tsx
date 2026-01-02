import { Colors } from '@/constants/Colors';
import { useColorScheme } from "@/hooks/useColorScheme";
import { useMedicationStore } from "@/store/medication-store";
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, PillBottle } from 'lucide-react-native';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { borderRadius, spacing } from "../../constants/Theme";

const ManageScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const router = useRouter();
  const { medications,  } = useMedicationStore();
  const [screensList, setScreensList] = React.useState<any[]>([]);

  type ScreenItem = {
    id: string;
    name: string;
    path: string;
    icon: React.ReactNode;
    description: string;
    count: string;
  };

  React.useEffect(() => {
    const list: ScreenItem[] = [
      { 
        id: '1', 
        name: 'Medications',
        path: "/medication/medications",
        icon: <PillBottle size={28} color={Colors[colorScheme].tint} />,
        description: 'Manage your medications list.',
        count: `${medications.filter(med => !med.isArchived).length} active`
      },
      { 
        id: '2', 
        name: 'Calendar',
        path: "/medication/calendar",
        icon: <Calendar size={28} color={Colors[colorScheme].tint} />,
        description: 'View full medication schedule',
        count: ''
      },
    ];
    setScreensList(list);
  }, [colorScheme, medications]);


  const renderItem = ({
    item: { id, name, path, icon, description, count },
    index,
  }: {
    item: ScreenItem;
    index: number;
  }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={() => {
        // Navigate to item.path
        router.push(path as any);
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
          <Text style={styles.cardCount}>{count}</Text>
        </View>
        
        <ChevronRight 
          size={20} 
          color={Colors[colorScheme].icon} 
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      

      {/* Main Content */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <FlatList
        data={screensList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#CED0CE" }} />}
      />

 
    </View>
  );
};

export default ManageScreen;

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    
    // Header Styles
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '700',
      color: Colors[colorScheme].text,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      fontSize: 16,
      color: Colors[colorScheme].tabIconDefault,
      opacity: 0.8,
    },

    // Stats Card Styles
    statsCard: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      backgroundColor: colorScheme === 'dark' 
        ? "rgba(56, 189, 248, 0.1)" 
        : "rgba(224, 242, 254, 0.8)",
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: colorScheme === 'dark' ? 1 : 0,
      borderColor: colorScheme === 'dark' ? "rgba(56, 189, 248, 0.2)" : "transparent",
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme].text,
      marginLeft: spacing.sm,
    },
    statsContent: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].tint,
      marginBottom: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: Colors[colorScheme].tabIconDefault,
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: Colors[colorScheme].icon,
      opacity: 0.3,
    },

    // Section Header
    sectionHeader: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: Colors[colorScheme].text,
    },

    // List Container
    listContainer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100, // Space for FAB
    },

    // Card Styles
    card: {
      backgroundColor: colorScheme === 'dark' 
        ? "rgba(255, 255, 255, 0.05)" 
        : "rgba(255, 255, 255, 0.9)",
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: colorScheme === 'dark' ? 1 : 0,
      borderColor: colorScheme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "transparent",
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.8,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colorScheme === 'dark' 
        ? "rgba(56, 189, 248, 0.2)" 
        : "rgba(56, 189, 248, 0.1)",
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: Colors[colorScheme].text,
      marginBottom: spacing.xs,
    },
    cardDescription: {
      fontSize: 14,
      color: Colors[colorScheme].tabIconDefault,
      marginBottom: spacing.xs,
    },
    cardCount: {
      fontSize: 12,
      color: Colors[colorScheme].tint,
      fontWeight: '500',
    },
    chevron: {
      marginLeft: spacing.sm,
    },

    // FAB Styles
    fab: {
      position: "absolute",
      bottom: spacing.xl,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: Colors[colorScheme].tint,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  });
}