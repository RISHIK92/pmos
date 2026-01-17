import React, { useEffect } from "react";
import { Text, View, StyleProp, TextStyle, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  withSpring,
} from "react-native-reanimated";

interface AutoScrollTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<any>; // Using any to avoid importing ViewStyle for brevity
  threshold?: number;
  duration?: number;
}

export function AutoScrollText({
  text,
  style,
  containerStyle,
  threshold = 15,
  duration = 0,
}: AutoScrollTextProps) {
  const shouldScroll = text.length > threshold;
  const offset = useSharedValue(0);

  useEffect(() => {
    if (!shouldScroll) {
      offset.value = 0;
      return;
    }

    // Estimate scroll distance (approx 6px per char for typical font size, plus buffer)
    // A more accurate way would be measuring onLayout, but for simple "left-right" ticker:
    const estimatedDistance = Math.min((text.length - threshold) * 8 + 20, 200);
    const cycleDuration = duration || text.length * 150 + 2000;

    offset.value = withRepeat(
      withSequence(
        withDelay(
          1500,
          withTiming(-estimatedDistance, {
            duration: cycleDuration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        withDelay(
          1500,
          withTiming(0, {
            duration: cycleDuration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        )
      ),
      -1,
      false
    );

    return () => cancelAnimation(offset);
  }, [text, shouldScroll, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (!shouldScroll) {
    return (
      <Text style={style} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.Text
        style={[style, animatedStyle]}
        numberOfLines={1}
        ellipsizeMode="clip"
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    width: "80%",
    // Need to ensure parent constrains width, otherwise View checks flex.
    // Assuming usage in a restricted width container (like existing flex:1 or fixed width columns)
  },
});
