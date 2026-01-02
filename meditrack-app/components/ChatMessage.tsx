import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const colorScheme = useColorScheme() ?? "light";
  const styles = createStyles(colorScheme);
  const isUser = message.role === "user";

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
      </View>

      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

function createStyles(colorScheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
      maxWidth: "80%",
    },
    userContainer: {
      alignSelf: "flex-end",
    },
    assistantContainer: {
      alignSelf: "flex-start",
    },
    bubble: {
      borderRadius: 20,
      padding: 12,
      marginBottom: 4,
    },
    userBubble: {
      backgroundColor: Colors[colorScheme].tint,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: Colors[colorScheme].input,
      borderBottomLeftRadius: 4,
    },
    text: {
      fontSize: 16,
    },
    userText: {
      color: Colors[colorScheme].foreground,
    },
    assistantText: {
      color: Colors[colorScheme].text,
    },
    timestamp: {
      fontSize: 12,
      color: Colors[colorScheme].text,
      alignSelf: "flex-end",
    },
  });
}
