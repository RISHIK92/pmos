import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  BackHandler,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeOutDown,
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
  withSequence,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { WaveformIcon } from "./ui/WaveformIcon";

const { width } = Dimensions.get("window");

export default function AssistantOverlay() {
  const [visible, setVisible] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();

  // Animation Values
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const backAction = () => {
      handleDismiss();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isListening]);

  const handleOpenApp = () => {
    setVisible(false);
    router.replace("/(tabs)/home");
  };

  const handleVoice = () => {
    setIsListening(!isListening);
    // TODO: Implement actual voice recording logic here
  };

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      setVisible(false);
      router.replace({
        pathname: "/(tabs)/home",
        params: { query: inputText },
      });
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => BackHandler.exitApp(), 100);
  };

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.dismissArea} />
      </TouchableWithoutFeedback>

      <Animated.View style={styles.barWrapper}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={30} tint="light" style={styles.glassContainer}>
            <OverlayContent
              handleOpenApp={handleOpenApp}
              inputText={inputText}
              setInputText={setInputText}
              handleTextSubmit={handleTextSubmit}
              handleVoice={handleVoice}
              animatedMicStyle={animatedMicStyle}
              isListening={isListening}
            />
          </BlurView>
        ) : (
          <View style={[styles.glassContainer, styles.androidGlass]}>
            <OverlayContent
              handleOpenApp={handleOpenApp}
              inputText={inputText}
              setInputText={setInputText}
              handleTextSubmit={handleTextSubmit}
              handleVoice={handleVoice}
              animatedMicStyle={animatedMicStyle}
              isListening={isListening}
            />
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// WaveformIcon removed, imported from components/ui/WaveformIcon

const OverlayContent = ({
  handleOpenApp,
  inputText,
  setInputText,
  handleTextSubmit,
  handleVoice,
  animatedMicStyle, // We might not need this anymore if we use WaveformIcon entirely
  isListening,
}: any) => {
  const showSend = inputText.length > 0;

  return (
    <View style={styles.contentContainer}>
      {/* Top Row: Open App Chip */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleOpenApp} style={styles.openAppChip}>
          <Ionicons name="apps" size={16} color="#4A4A4A" />
          <Text style={styles.openAppText}>Open PMOS</Text>
        </TouchableOpacity>
      </View>

      {/* Main Row: Input + Voice/Send */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a request..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleTextSubmit}
          returnKeyType="search"
        />

        {showSend ? (
          <TouchableOpacity onPress={handleTextSubmit} activeOpacity={0.7}>
            <View style={[styles.micButton, styles.sendButton]}>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleVoice} activeOpacity={0.7}>
            {/* If listening: Show Waveform. If not: Show Mic */}
            {isListening ? (
              <View style={[styles.micButton, styles.waveformButton]}>
                <WaveformIcon isListening={isListening} />
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.micButton,
                  // isListening && styles.micActive, // Removed red active state
                  animatedMicStyle, // Apply pulse here
                ]}
              >
                <Ionicons
                  name="mic"
                  size={24}
                  color="#4285F4" // Google Blue
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  barWrapper: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  glassContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)", // High opacity for clean minimalist look
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(0, 184, 148, 0.25)", // Premium minimal green
  },
  androidGlass: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "rgba(0, 184, 148, 0.25)",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  topRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  openAppChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  openAppText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F1F3F4", // Light gray input background
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 50,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8EAED",
  },
  micActive: {
    backgroundColor: "#FFF", // Keep it white, but maybe add border or shadow?
    borderColor: "#E8EAED",
  },
  sendButton: {
    backgroundColor: "#4285F4", // Blue send button
    borderColor: "#4285F4",
  },
  waveformButton: {
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
});
