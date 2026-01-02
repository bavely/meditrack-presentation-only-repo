// app/(auth)/index.tsx
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { spacing } from "../constants/Theme";
export default function Index() {
  const colorScheme = useColorScheme();
  const bgcolor =
    colorScheme === "light" ? Colors.light.background : Colors.dark.background;
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/smiling-doctor.jpg")}
        style={styles.image}
      >
        {/* absolutely-positioned gradient overlay */}
        <LinearGradient
          colors={[bgcolor, "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradient}
        />

        {/* your content on top */}
        <View style={styles.content}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
          />
          <View>
          <Text
            style={styles.logintext}
            variant="titleMedium"
            onPress={() => router.push("/(auth)/login")}
          >
            Already have an account? Log in
          </Text>
          <Button
            style={styles.button}
            labelStyle={{ color: "rgba(8, 145, 178, 1)" }}
            mode="contained"
            onPress={() => router.push("/(auth)/signup")}
          >
            START NOW
          </Button>
          <Text
            style={styles.logintext}
            variant="bodyMedium"

          >
            It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.
          </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "flex-end", // so content sits above bottom-gradient
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,

    width: "100%",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    padding: spacing.lg,
    // paddingTop: 200,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "stretch",
    zIndex: 1,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: "#ECEDEE",

  },
  logintext: {
    alignSelf: "center",
    justifyContent: "center",
    textAlign: "center",
    marginTop: 26,
    marginBottom: 50,
    fontWeight: "bold",
    color: "#fff",
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 30,
    marginTop: 50,
  },
});
