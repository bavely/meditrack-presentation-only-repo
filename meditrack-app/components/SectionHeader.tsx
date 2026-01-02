import { Colors } from "@/constants/Colors";
import { ChevronRight } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {onSeeAll && (
        <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={16} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors[colorScheme].text,
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors[colorScheme].tint,
    },
  });
}
