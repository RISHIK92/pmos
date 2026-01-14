import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import GoogleLogin from "@/components/GoogleLogin";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

interface ChatEmptyStateProps {
  loggedIn: boolean;
  onLoginSuccess?: () => void;
}

export default function ChatEmptyState({
  loggedIn,
  onLoginSuccess,
}: ChatEmptyStateProps) {
  // Pulse animation for the main icon
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (loggedIn) {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.centerContent}
        >
          <IconSymbol name="sparkles" size={48} color="#020202ff" />

          <Text style={styles.heroTitle}>Hey PMOS</Text>
          <Text style={styles.heroSubtitle}>Your Second Brain, 24/7.</Text>
        </Animated.View>

        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="mic.fill"
            title="Voice Activated"
            desc="Just say 'Hey'"
            delay={200}
            color="#0984E3"
          />
          <FeatureCard
            icon="brain.head.profile"
            title="Deep Memory"
            desc="Remembers all context"
            delay={300}
            color="#6C5CE7"
          />
          <FeatureCard
            icon="infinity"
            title="Always On"
            desc="Ready when you are"
            delay={400}
            color="#FD79A8"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={styles.centerContent}
      >
        <IconSymbol name="lock.fill" size={42} color="#090909ff" />

        <Text style={styles.heroTitle}>Unlock Intelligence</Text>
        <Text style={styles.heroSubtitle}>
          Sign in to activate your personal AI workspace.
        </Text>
      </Animated.View>

      <View style={styles.valueProps}>
        <ValueProp delay={200} icon="bolt.fill" text="Instant Answers" />
        <ValueProp delay={300} icon="shield.fill" text="Private & Secure" />
        <ValueProp delay={400} icon="waveform.path.ecg" text="Data Insights" />
      </View>

      <Animated.View
        entering={FadeInUp.delay(500).springify()}
        style={styles.actionArea}
      >
        <GoogleLogin onLoginSuccess={onLoginSuccess} />
        <Text style={styles.termsText}>
          By continuing, you acknowledge you are using an AI assistant.
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureCard({ icon, title, desc, delay, color }: any) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.featureCard}
    >
      <View style={[styles.miniIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </Animated.View>
  );
}

function ValueProp({ delay, icon, text }: any) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.valuePropRow}
    >
      <IconSymbol name="checkmark.circle.fill" size={18} color="#00B894" />
      <Text style={styles.valuePropText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  centerContent: {
    alignItems: "center",
    marginBottom: 50,
    width: "100%",
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    zIndex: -1,
  },
  pulseRingAuth: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    zIndex: -1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D3436",
    marginTop: 12,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#636E72",
    textAlign: "center",
    maxWidth: "80%",
    lineHeight: 26,
    fontWeight: "500",
  },
  featuresGrid: {
    width: "100%",
    gap: 12,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    gap: 16,
  },
  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  valueProps: {
    width: "100%",
    alignItems: "center", // Center the value props
    gap: 12,
    marginBottom: 40,
  },
  valuePropRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#F1F2F6",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  valuePropText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3436",
  },
  actionArea: {
    width: "100%",
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#B2BEC3",
    textAlign: "center",
    maxWidth: "80%",
  },
});
