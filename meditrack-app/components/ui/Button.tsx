import { Colors } from "@/constants/Colors";
import { borderRadius } from "@/constants/Theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const getContainerStyle = () => {
    const variantStyle = {
      primary: styles.primaryContainer,
      secondary: styles.secondaryContainer,
      outline: styles.outlineContainer,
      ghost: styles.ghostContainer,
    }[variant];
    
    const sizeStyle = {
      small: styles.smallContainer,
      medium: styles.mediumContainer,
      large: styles.largeContainer,
    }[size];
    
    return [
      styles.container,
      variantStyle,
      sizeStyle,
      disabled && styles.disabledContainer,
      style,
    ];
  };
  
  const getTextStyle = () => {
    const variantTextStyle = {
      primary: styles.primaryText,
      secondary: styles.secondaryText,
      outline: styles.outlineText,
      ghost: styles.ghostText,
    }[variant];
    
    const sizeTextStyle = {
      small: styles.smallText,
      medium: styles.mediumText,
      large: styles.largeText,
    }[size];
    
    return [
      styles.text,
      variantTextStyle,
      sizeTextStyle,
      disabled && styles.disabledText,
      textStyle,
    ];
  };
  
  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? Colors[colorScheme].foreground
              : Colors[colorScheme].tint
          }
          size="small"
        />
      ) : (
        <>
          {icon && icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}


function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.md,
      gap: 8,
    },
    primaryContainer: {
      backgroundColor: Colors[colorScheme].tint,
    },
    secondaryContainer: {
      backgroundColor: Colors[colorScheme].surface,
    },
    outlineContainer: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: Colors[colorScheme].tint,
    },
    ghostContainer: {
      backgroundColor: "transparent",
    },
    smallContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    mediumContainer: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    largeContainer: {
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
    disabledContainer: {
      opacity: 0.5,
    },
    text: {
      fontWeight: "600",
      textAlign: "center",
    },
    primaryText: {
      color: Colors[colorScheme].foreground,
    },
    secondaryText: {
      color: Colors[colorScheme].text,
    },
    outlineText: {
      color: Colors[colorScheme].tint,
    },
    ghostText: {
      color: Colors[colorScheme].tint,
    },
    smallText: {
      fontSize: 14,
    },
    mediumText: {
      fontSize: 16,
    },
    largeText: {
      fontSize: 18,
    },
    disabledText: {
      opacity: 0.7,
    },
  });

}
