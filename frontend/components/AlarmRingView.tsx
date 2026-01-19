import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Animated, {
  FadeIn,
  FadeOut,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

interface AlarmRingViewProps {
  title: string;
  onDismiss: () => void;
}

export const AlarmRingView = ({ title, onDismiss }: AlarmRingViewProps) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const ringScale = useSharedValue(1);

  async function playSound() {
    // Load and play a default sound (or custom alarm sound if available)
    // For now, we'll assume a local asset or system sound isn't easily accessible without bundling.
    // We will try to load a default expo asset or just rely on the Android vibration/noise from notification if implemented.
    // Since native alarm might not play sound unless we used RingtoneManager in Java.
    // Let's implement sound playing in Java ideally, but here using expo-av for simplicity if asset exists.
    // For this MVP, we will visualize the alarm strongly.
  }

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      true,
    );

    return () => {
      sound?.unloadAsync();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]}>
        <View style={styles.iconContainer}>
          <IconSymbol name="alarm.fill" size={64} color="#FFF" />
        </View>
      </Animated.View>

      <Text style={styles.title}>CRITICAL MEMORY</Text>
      <Text style={styles.subtitle}>{title}</Text>

      <TouchableOpacity style={styles.button} onPress={onDismiss}>
        <Text style={styles.buttonText}>I REMEMBER</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "#D63031", // Red background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: 32,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 64,
  },
  button: {
    backgroundColor: "#FFF",
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 32,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D63031",
    letterSpacing: 1,
  },
});
