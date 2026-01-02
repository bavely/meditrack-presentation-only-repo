import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

interface RecordingIndicatorProps {
  active: boolean;
  size?: number;
}

export default function RecordingIndicator({ active, size = 12 }: RecordingIndicatorProps) {
  const colorScheme = useColorScheme() ?? "light";
  const scale = useRef(new Animated.Value(1)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      animation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.current.start();
    } else {
      animation.current?.stop();
      scale.setValue(1);
    }

    return () => {
      animation.current?.stop();
    };
  }, [active, scale]);

  const styles = createStyles(colorScheme, size);

  return <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />;
}

function createStyles(colorScheme: "light" | "dark", size: number) {
  return StyleSheet.create({
    dot: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: Colors[colorScheme].tint,
    },
  });
}
