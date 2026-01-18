import React, { useEffect, useState, useRef } from "react";
import AppLauncher from "../utils/AppLauncher";
import ContactManager from "../utils/ContactManager";
import AlarmManager from "../utils/AlarmManager";
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
  withTiming,
  useAnimatedStyle,
  Easing,
  withSequence,
  withRepeat,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { WaveformIcon } from "./ui/WaveformIcon";
import { Audio } from "expo-av";
//@ts-ignore
import RNImmediatePhoneCall from "react-native-immediate-phone-call";

const { width } = Dimensions.get("window");

// --- Noise Gate Thresholds ---
const MIN_DURATION = 1200; // 1.2 second minimum
const MIN_VOLUME = -20; // dB threshold (below this is background noise)
const INITIAL_SILENCE_TIMEOUT = 4000; // 4 seconds before user speaks
const SPEECH_SILENCE_TIMEOUT = 1500; // 1.5 seconds after user started speaking

export default function AssistantOverlay() {
  const [visible, setVisible] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [lastUserQuery, setLastUserQuery] = useState<string | null>(null);
  const router = useRouter();
  const pulseScale = useSharedValue(1);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTime = useRef<number>(0);
  const maxVolumeRef = useRef<number>(-160);
  const silenceTimerRef = useRef<any>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);
  const hasSpokenRef = useRef<boolean>(false);
  const hasAutoStartedRef = useRef<boolean>(false);

  // Auto-start recording on mount
  useEffect(() => {
    // Preload apps and contacts
    AppLauncher.preloadApps();
    ContactManager.preloadContacts();

    if (!hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        startRecording();
      }, 300);
    }

    // Cleanup on unmount
    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  // Pulse animation for mic
  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  // Process Query Logic
  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    setLastUserQuery(queryText);
    setInputText("");
    setResponse(null);
    setIsProcessingText(true);

    const backendUrl =
      Platform.OS === "android"
        ? "http://10.141.28.129:8000"
        : "http://localhost:8000";

    try {
      const res = await fetch(`${backendUrl}/query/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
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

  // Central handling for Voice & Text results
  const handleUserIntent = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    console.log("Processing Intent:", cleanText);

    const digitOnly = cleanText.replace(/[^0-9]/g, "");

    const isNumberFormat = /^[\d\s\-\(\)\+]+$/.test(cleanText);

    if (digitOnly.length === 10 && isNumberFormat) {
      console.log("📞 Direct number detected:", digitOnly);
      setLastUserQuery(cleanText);
      setResponse(`Calling ${digitOnly}...`);
      // Linking.openURL(`tel:${digitOnly}`);
      RNImmediatePhoneCall.immediatePhoneCall(digitOnly);
      setTimeout(() => handleDismiss(), 2000);
      return;
    }

    // 2. Alarm Check
    if (cleanText.toLowerCase().includes("alarm")) {
      console.log("⏰ Alarm command detected");
      setLastUserQuery(cleanText);
      setIsProcessingText(true);

      const { success, message, time } = await AlarmManager.parseAndSet(
        cleanText
      );
      setResponse(message);
      setIsProcessingText(false);

      if (success) {
        setTimeout(() => handleDismiss(), 2000);
      }
      return;
    }

    // 3. Regex Check (Open/Launch/Call/Phone)
    const match = cleanText.match(/^(open|launch|call|phone)\s+(.+)/i);

    if (match) {
      const command = match[1].toLowerCase();
      const targetName = match[2].trim();
      console.log(`🚀 Command: ${command}, Target: ${targetName}`);

      setLastUserQuery(cleanText);
      setIsProcessingText(true);

      if (command === "call" || command === "phone") {
        // Check if target is a number first
        const targetDigits = targetName.replace(/[^0-9]/g, "");
        if (
          targetDigits.length === 10 &&
          /^[\d\s\-\(\)\+]+$/.test(targetName)
        ) {
          setIsProcessingText(false);
          setResponse(`Calling ${targetDigits}...`);
          // Linking.openURL(`tel:${targetDigits}`);
          RNImmediatePhoneCall.immediatePhoneCall(targetDigits);
          setTimeout(() => handleDismiss(), 2000);
          return;
        }

        const { success, message } = await ContactManager.findAndCall(
          targetName
        );
        setResponse(message);
        setIsProcessingText(false);

        if (success) {
          setTimeout(() => handleDismiss(), 2000);
        }
        return;
      } else {
        // App Launch
        const launched = await AppLauncher.findAndOpen(targetName);

        if (launched) {
          setIsProcessingText(false);
          setResponse(`Opening ${targetName}...`);
          setTimeout(() => handleDismiss(), 2000);
          return;
        } else {
          console.log("⚠️ App not found, blocking fallback");
          setIsProcessingText(false);
          setResponse(`App "${targetName}" not found locally.`);
          return;
        }
      }
    }

    // 3. AI Fallback
    processQuery(cleanText);
  };

  const handleTextSubmit = async () => {
    if (inputText.trim()) {
      setInputText("");
      handleUserIntent(inputText);
    }
  };

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
      hasSpokenRef.current = false;

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering !== undefined) {
            if (status.metering > maxVolumeRef.current) {
              maxVolumeRef.current = status.metering;
            }
            if (status.metering > MIN_VOLUME) {
              lastSoundTimeRef.current = Date.now();
              if (!hasSpokenRef.current) {
                console.log("🎙️ User started speaking!");
                hasSpokenRef.current = true;
              }
            }
          }
        },
        100
      );

      recordingRef.current = newRecording;
      setIsListening(true);
      isListeningRef.current = true;

      // Start silence detection timer
      silenceTimerRef.current = setInterval(() => {
        const timeSinceSound = Date.now() - lastSoundTimeRef.current;
        const timeout = hasSpokenRef.current
          ? SPEECH_SILENCE_TIMEOUT
          : INITIAL_SILENCE_TIMEOUT;
        const status = hasSpokenRef.current ? "AFTER_SPEECH" : "WAITING";

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
      Alert.alert(
        "Recording Error",
        "Failed to start recording. Please try again."
      );
    }
  };

  const stopRecording = async () => {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsListening(false);
    isListeningRef.current = false;

    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      const duration = Date.now() - recordingStartTime.current;
      if (duration < MIN_DURATION || maxVolumeRef.current < MIN_VOLUME) {
        console.log("❌ Ignored: Too short or too quiet.");
        recordingRef.current = null;
        return;
      }

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
            console.log("📝 Transcribed:", result);
            handleUserIntent(result);
          }
        } catch (error) {
          console.error("Failed to process voice", error);
          setIsProcessingVoice(false);
          Alert.alert("Processing Error", "Failed to process voice input.");
        }
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const handleOpenApp = () => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(console.error);
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

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleDismiss = () => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(console.error);
      recordingRef.current = null;
    }
    setVisible(false);
    setTimeout(() => BackHandler.exitApp(), 100);
  };

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
        <View
          style={[
            styles.glassContainer,
            Platform.OS === "android" && styles.androidGlass,
          ]}
        >
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
            lastUserQuery={lastUserQuery}
          />
        </View>
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
  lastUserQuery,
}: any) => {
  const showSend = inputText.length > 0;

  return (
    <View style={styles.contentContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleOpenApp} style={styles.openAppChip}>
          <Ionicons name="apps" size={16} color="#4A4A4A" />
          <Text style={styles.openAppText}>Open PMOS</Text>
        </TouchableOpacity>
      </View>

      {/* CHAT UI AREA */}
      <View style={styles.chatArea}>
        {/* User Query (Right) */}
        {lastUserQuery && (
          <View style={styles.userBubbleContainer}>
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{lastUserQuery}</Text>
            </View>
          </View>
        )}

        {/* AI Response (Left) */}
        {(isProcessingText || response) && (
          <View style={styles.aiBubbleContainer}>
            <View style={styles.aiIcon}>
              <Ionicons
                name={isProcessingText ? "sparkles" : "radio-button-on"}
                size={14}
                color="#FFF"
              />
            </View>
            <View style={styles.aiBubble}>
              {isProcessingText ? (
                <Text style={styles.processingDot}>• • •</Text>
              ) : (
                <Text style={styles.aiText}>{response}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask anything..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleTextSubmit}
          returnKeyType="send"
        />

        {showSend ? (
          <TouchableOpacity onPress={handleTextSubmit} activeOpacity={0.7}>
            <View style={[styles.micButton, styles.sendButton]}>
              <Ionicons name="arrow-up" size={24} color="#FFF" />
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
                <ActivityIndicator size="small" color="#000" />
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
  chatArea: {
    marginBottom: 20,
    gap: 16,
    minHeight: 100,
    justifyContent: "flex-end",
  },
  userBubbleContainer: {
    alignItems: "flex-end",
    marginLeft: 40,
  },
  userBubble: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: "100%",
  },
  userText: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  aiBubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginRight: 20,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#636E72",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  aiBubble: {
    backgroundColor: "#F1F3F4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    flex: 1,
  },
  aiText: {
    fontSize: 15,
    color: "#2D3436",
    lineHeight: 22,
  },
  processingDot: {
    fontSize: 24,
    color: "#B2BEC3",
    lineHeight: 24,
    marginTop: -8,
    letterSpacing: 2,
  },
});
