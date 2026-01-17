import React, { useEffect, useState, useRef } from "react";
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
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import Animated, {
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
import { Audio } from "expo-av";

const { width } = Dimensions.get("window");

// --- Noise Gate Thresholds ---
const MIN_DURATION = 1200; // 1.2 second minimum
const MIN_VOLUME = -50; // dB threshold (below this is background noise)
const INITIAL_SILENCE_TIMEOUT = 4000; // 4 seconds before user speaks
const SPEECH_SILENCE_TIMEOUT = 2000; // 2 seconds after user started speaking

export default function AssistantOverlay() {
  const [visible, setVisible] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState(0);
  const router = useRouter();

  // Animation Values
  const pulseScale = useSharedValue(1);

  // Recording state - using ref to avoid async state issues
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTime = useRef<number>(0);
  const maxVolumeRef = useRef<number>(-160);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false); // Ref to avoid stale closure
  const hasSpokenRef = useRef<boolean>(false); // Track if user has started speaking

  // Back handler
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

  // Auto-start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      // Cleanup on unmount
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    };
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

  const startRecording = async () => {
    // Guard: Don't start if already recording
    if (isListeningRef.current || recordingRef.current) {
      console.log("⚠️ Recording already in progress, skipping startRecording");
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Microphone access is needed.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Reset stats
      recordingStartTime.current = Date.now();
      maxVolumeRef.current = -160;
      lastSoundTimeRef.current = Date.now();
      hasSpokenRef.current = false; // Reset speech detection

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Track loudness via metering
          if (status.metering !== undefined) {
            if (status.metering > maxVolumeRef.current) {
              maxVolumeRef.current = status.metering;
            }
            // If sound is above threshold, update last sound time and mark as spoken
            if (status.metering > MIN_VOLUME) {
              lastSoundTimeRef.current = Date.now();
              if (!hasSpokenRef.current) {
                console.log("🎙️ User started speaking!");
                hasSpokenRef.current = true;
              }
            }
          }
        },
        100 // Check every 100ms
      );

      recordingRef.current = newRecording;
      setIsListening(true);
      isListeningRef.current = true; // Update ref for interval check

      // Start silence detection timer
      silenceTimerRef.current = setInterval(() => {
        const timeSinceSound = Date.now() - lastSoundTimeRef.current;

        // Use different timeout based on whether user has spoken
        const timeout = hasSpokenRef.current
          ? SPEECH_SILENCE_TIMEOUT
          : INITIAL_SILENCE_TIMEOUT;
        const status = hasSpokenRef.current ? "AFTER_SPEECH" : "WAITING";

        // Log dB every 500ms for debugging
        console.log(
          `🔊 [${status}] Volume: ${maxVolumeRef.current}dB | Silence: ${timeSinceSound}ms / ${timeout}ms`
        );

        if (timeSinceSound > timeout && isListeningRef.current) {
          console.log(
            `🔇 Auto-stopping: Silence detected for ${timeSinceSound}ms (${status})`
          );
          stopRecording();
        }
      }, 500);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsListening(false);
    isListeningRef.current = false; // Update ref

    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      // --- 🛡️ THE NOISE GATE FILTER ---
      const duration = Date.now() - recordingStartTime.current;

      console.log(
        `🎤 Stats -> Duration: ${duration}ms | Max Volume: ${maxVolumeRef.current}dB`
      );

      // Duration check
      if (duration < MIN_DURATION) {
        console.log("❌ Ignored: Recording too short (Accidental tap?)");
        recordingRef.current = null;
        return;
      }

      // Volume check
      if (maxVolumeRef.current < MIN_VOLUME) {
        console.log("❌ Ignored: Voice too low (Background noise only)");
        recordingRef.current = null;
        return;
      }

      // --- ✅ PASSED CHECKS: PROCEED TO UPLOAD ---
      recordingRef.current = null;

      if (uri) {
        setIsProcessingVoice(true);

        const formData = new FormData();
        formData.append("file", {
          uri: uri,
          name: "recording.m4a",
          type: "audio/m4a",
        } as any);

        const backendUrl =
          Platform.OS === "android"
            ? "http://10.141.28.129:8000"
            : "http://localhost:8000";

        try {
          const response = await fetch(`${backendUrl}/query/voice`, {
            method: "POST",
            body: formData,
            headers: {},
          });
          const result = await response.json();

          setIsProcessingVoice(false);

          if (result) {
            // Show transcribed text in input box instead of routing
            console.log("📝 Transcribed:", result);
            setInputText(result);
          }
        } catch (error) {
          console.error("Failed to process voice", error);
          setIsProcessingVoice(false);
        }
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const handleOpenApp = () => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    setVisible(false);
    router.replace("/(tabs)/home");
  };

  const handleVoice = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;

    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }

    const currentRequest = requestCount + 1;
    setRequestCount(currentRequest);

    // Always handle in overlay, replacing previous response
    setIsProcessingText(true);
    const query = inputText;
    setInputText(""); // Clear input while processing

    const backendUrl =
      Platform.OS === "android"
        ? "http://10.141.28.129:8000"
        : "http://localhost:8000";

    try {
      const res = await fetch(`${backendUrl}/query/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
      });
      const data = await res.json();

      setIsProcessingText(false);

      if (data && data.response) {
        setResponse(data.response);
      } else if (data) {
        setResponse(JSON.stringify(data));
      }
    } catch (error) {
      console.error("Failed to process query", error);
      setIsProcessingText(false);
      setResponse("Failed to get response. Please try again.");
    }
  };

  const handleDismiss = () => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
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
              isProcessingVoice={isProcessingVoice}
              isProcessingText={isProcessingText}
              response={response}
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
              isProcessingVoice={isProcessingVoice}
              isProcessingText={isProcessingText}
              response={response}
            />
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const OverlayContent = ({
  handleOpenApp,
  inputText,
  setInputText,
  handleTextSubmit,
  handleVoice,
  animatedMicStyle,
  isListening,
  isProcessingVoice,
  isProcessingText,
  response,
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

      {/* Response Display */}
      {(isProcessingText || response) && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <View style={styles.responseIcon}>
              <Ionicons
                name={isProcessingText ? "sparkles" : "chatbubble-ellipses"}
                size={16}
                color="#4285F4"
              />
            </View>
          </View>
          {!isProcessingText && response && (
            <Text style={styles.responseText}>{response}</Text>
          )}
          {isProcessingText && (
            <View style={styles.dotsContainer}>
              <Text style={styles.dots}>• • •</Text>
            </View>
          )}
        </View>
      )}

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
          <TouchableOpacity
            onPress={handleVoice}
            activeOpacity={0.7}
            disabled={isProcessingVoice}
          >
            {isProcessingVoice ? (
              <View style={[styles.micButton, styles.waveformButton]}>
                <ActivityIndicator size="small" color="#636E72" />
              </View>
            ) : isListening ? (
              <View style={[styles.micButton, styles.waveformButton]}>
                <WaveformIcon isListening={isListening} />
              </View>
            ) : (
              <Animated.View style={[styles.micButton, animatedMicStyle]}>
                <Ionicons name="mic" size={24} color="#4285F4" />
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(0, 184, 148, 0.25)",
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
    marginBottom: 12,
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
  statusText: {
    textAlign: "center",
    fontSize: 14,
    color: "#636E72",
    marginBottom: 12,
    fontWeight: "500",
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
    backgroundColor: "#F1F3F4",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 50,
  },
  micButton: {
    width: 40,
    height: 40,
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
  sendButton: {
    backgroundColor: "#4285F4",
    borderColor: "#4285F4",
  },
  waveformButton: {
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  processingButton: {
    backgroundColor: "#B2BEC3",
    borderColor: "#B2BEC3",
  },
  responseContainer: {
    backgroundColor: "rgba(241, 243, 244, 0.6)", // Semi-transparent background
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)", // Subtle border
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  responseIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(66, 133, 244, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#636E72",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  processingText: {
    fontSize: 14,
    color: "#636E72",
    fontStyle: "italic",
  },
  responseText: {
    fontSize: 15,
    color: "#2D3436",
    lineHeight: 22,
    fontWeight: "400",
    marginLeft: 6,
  },
  dotsContainer: {
    marginTop: 4,
  },
  dots: {
    fontSize: 18,
    color: "#4285F4",
    letterSpacing: 4,
  },
});
