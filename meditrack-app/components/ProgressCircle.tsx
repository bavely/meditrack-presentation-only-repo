import { Colors } from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ProgressCircleProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressCircle({
  progress,
  size = 120,
  strokeWidth = 12,
  label,
  showPercentage = true,
}: ProgressCircleProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  // Ensure progress is between 0 and 100
  const validProgress = Math.min(Math.max(progress, 0), 100);
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (validProgress / 100) * circumference;
  
  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors[colorScheme].tint}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors[colorScheme].tint}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      
      <View style={[styles.textContainer, { width: size, height: size }]}>
        {showPercentage && (
          <Text style={styles.percentageText}>{Math.round(validProgress)}%</Text>
        )}
        {label && <Text style={styles.labelText}>{label}</Text>}
      </View>
    </View>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    textContainer: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    percentageText: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors[colorScheme].text,
    },
    labelText: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      marginTop: 4,
    },
  });
}
