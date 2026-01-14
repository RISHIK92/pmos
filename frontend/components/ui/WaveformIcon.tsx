import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

export const WaveformIcon = ({
  isListening,
  color = "#4285F4",
}: {
  isListening: boolean;
  color?: string;
}) => {
  const bar1Scale = useSharedValue(0.4);
  const bar2Scale = useSharedValue(0.4);
  const bar3Scale = useSharedValue(0.4);

  useEffect(() => {
    if (isListening) {
      // Randomize animations for a natural waveform look
      bar1Scale.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      );
      bar2Scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.4, { duration: 500 })
        ),
        -1,
        true
      );
      bar3Scale.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 450 }),
          withTiming(0.3, { duration: 450 })
        ),
        -1,
        true
      );
    } else {
      bar1Scale.value = withTiming(0.4);
      bar2Scale.value = withTiming(0.4);
      bar3Scale.value = withTiming(0.4);
    }
  }, [isListening]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    height: `${bar1Scale.value * 100}%`,
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    height: `${bar2Scale.value * 100}%`,
  }));
  const animatedStyle3 = useAnimatedStyle(() => ({
    height: `${bar3Scale.value * 100}%`,
  }));

  return (
    <View style={styles.waveformContainer}>
      <Animated.View
        style={[styles.waveformBar, { backgroundColor: color }, animatedStyle1]}
      />
      <Animated.View
        style={[styles.waveformBar, { backgroundColor: color }, animatedStyle2]}
      />
      <Animated.View
        style={[styles.waveformBar, { backgroundColor: color }, animatedStyle3]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 24,
    width: 24,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
});
