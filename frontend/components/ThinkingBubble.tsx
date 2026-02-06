import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  Layout,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/ui/icon-symbol";

const DOT_SIZE = 4;
const DOT_SPACING = 4;

interface ThinkingBubbleProps {
  status: string;
}

export function ThinkingBubble({ status }: ThinkingBubbleProps) {
  // Shared values for the 3 dots
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  // Shared value for the icon "breathing"
  const scale = useSharedValue(1);

  useEffect(() => {
    // 1. Icon Breathing Animation (Subtle scale up/down)
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // 2. Dot Wave Animation (Staggered opacity)
    const animateDot = (dot: any, delay: number) => {
      dot.value = withSequence(
        withTiming(0.3, { duration: delay }), // Initial delay
        withRepeat(
          withSequence(
            withTiming(1, { duration: 600 }), // Fade in
            withTiming(0.3, { duration: 600 }), // Fade out
          ),
          -1,
          true,
        ),
      );
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Helper to create dot style
  const useDotStyle = (opacityValue: any) =>
    useAnimatedStyle(() => ({
      opacity: opacityValue.value,
      transform: [
        {
          translateY: interpolate(
            opacityValue.value,
            [0.3, 1],
            [0, -2], // Slight lift when bright
          ),
        },
      ],
    }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <LinearGradient
          colors={["#E3F2FD", "#BBDEFB"]} // Very subtle blueish gradient
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconSymbol name="sparkles" size={16} color="#2196F3" />
        </LinearGradient>
      </Animated.View>

      <View style={styles.contentContainer}>
        <Animated.Text
          key={status}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(200)}
          style={styles.text}
        >
          {status}
        </Animated.Text>

        {/* Dot Wave Indicator */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, useDotStyle(dot1)]} />
          <Animated.View style={[styles.dot, useDotStyle(dot2)]} />
          <Animated.View style={[styles.dot, useDotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)", // Very subtle border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 10,
  },
  gradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  text: {
    fontSize: 14,
    color: "#546E7A", // Blue-grey for "system" text
    fontWeight: "500",
    letterSpacing: 0.2,
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: DOT_SPACING,
    alignItems: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#2196F3", // Matching the icon color
  },
});
