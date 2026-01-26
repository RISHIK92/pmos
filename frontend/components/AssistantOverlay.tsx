import React, { useEffect, useState, useRef } from "react";
import AppLauncher from "../utils/AppLauncher";
import ContactManager from "../utils/ContactManager";
import { IntentHandler } from "../utils/IntentHandler";
import Markdown from "react-native-markdown-display";
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
  ScrollView,
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
import { CameraView } from "expo-camera";
import { auth } from "../lib/firebase";

const { width } = Dimensions.get("window");

// --- Noise Gate Thresholds ---
const MIN_DURATION = 1200; // 1.2 second minimum
const MIN_VOLUME = -30; // dB threshold (below this is background noise)
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
  const [isTorchOn, setIsTorchOn] = useState(false);
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
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  // Process Query Logic
  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Check if user is signed in
    const user = auth.currentUser;
    if (!user) {
      // Not signed in, redirect to home
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
        recordingRef.current = null;
      }
      setVisible(false);
      router.replace("/(tabs)/home");
      return;
    }

    setInputText("");
    setResponse(null);
    setIsProcessingText(true);

    const backendUrl =
      Platform.OS === "android"
        ? "http://10.138.197.129:8000"
        : "http://localhost:8000";

    try {
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/query/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: queryText }),
      });
      const data = await res.json();
      console.log("🔍 Query Response Data:", data);

      setIsProcessingText(false);

      if (data && data.response) {
        const responseText = data.response;
        // If response is long, redirect to home for better viewing
        if (responseText.length > 300) {
          if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
          if (recordingRef.current) {
            recordingRef.current.stopAndUnloadAsync().catch(console.error);
            recordingRef.current = null;
          }
          setVisible(false);
          router.replace("/(tabs)/home");
          return;
        }
        setResponse(responseText);

        // Play audio if available
        if (data.audio) {
          const audioUrl = `${backendUrl}${data.audio}`;
          console.log("🔊 Generating Audio URL:", audioUrl);

          try {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            });

            const { sound, status } = await Audio.Sound.createAsync(
              { uri: audioUrl },
              { shouldPlay: true },
            );

            console.log("🔊 Sound Loaded:", status.isLoaded);
            if (status.isLoaded) {
              console.log("🔊 Duration:", status.durationMillis);
              // Force play just in case
              await sound.playAsync();
            } else {
              console.error("🔊 Sound failed to load:", status);
            }
          } catch (e) {
            console.error("🔊 Failed to play audio exception:", e);
          }
        }
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

    // Show text immediately
    setLastUserQuery(cleanText);
    setResponse(null);
    setIsProcessingText(true);

    console.log("Processing Intent via IntentHandler:", cleanText);

    // 1. Delegate to IntentHandler
    const result = await IntentHandler.process(cleanText);
    console.log("🧠 Intent Result:", result);

    // 3. Handle Success
    if (result.success) {
      setIsProcessingText(false);
      setResponse(result.message);

      // Play audio if available in IntentResult
      if (result.audio) {
        const audioUrl = `http://10.138.197.129:8000${result.audio}`;
        console.log("🔊 Playing Intent Audio:", audioUrl);
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true },
          );
        } catch (e) {
          console.error("Failed to play intent audio", e);
        }
      }

      // Special case: If it was a system toggle, we might not want to dismiss immediately?
      // But IntentHandler says 'shouldDismiss'.
      if (result.shouldDismiss) {
        setTimeout(() => handleDismiss(), 2000);
      }
      return;
    }

    // 4. AI Fallback (if type is 'ai' or just failed specific handlers)
    if (result.type === "ai") {
      processQuery(cleanText);
    } else {
      // Failed but not AI (e.g. contact not found), show error
      setIsProcessingText(false);
      setResponse(result.message || "Command failed.");
    }
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
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
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
        100,
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
          `🔊 [${status}] Volume: ${maxVolumeRef.current}dB | Silence: ${timeSinceSound}ms / ${timeout}ms`,
        );

        if (timeSinceSound > timeout && isListeningRef.current) {
          console.log(
            `🔇 Auto-stopping: Silence detected for ${timeSinceSound}ms (${status})`,
          );
          stopRecording();
        }
      }, 500);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert(
        "Recording Error",
        "Failed to start recording. Please try again.",
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
            ? "http://10.138.197.129:8000"
            : "http://localhost:8000";

        try {
          const response = await fetch(`${backendUrl}/query/voice`, {
            method: "POST",
            body: formData,
            headers: {},
          });
          const result = await response.json();
          console.log("🎤 Voice Response:", result);
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

      {Platform.OS === "android" && (
        <CameraView
          style={{ width: 1, height: 1, position: "absolute", top: -100 }}
          enableTorch={isTorchOn}
        />
      )}
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
      <View style={{ maxHeight: Dimensions.get("window").height * 0.75 }}>
        <ScrollView
          contentContainerStyle={styles.chatArea}
          showsVerticalScrollIndicator={true}
        >
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
                  <Markdown style={markdownStyles}>{response}</Markdown>
                )}
              </View>
            </View>
          )}
        </ScrollView>
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

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontSize: 15,
    color: "#2D3436",
    lineHeight: 22,
  },
  heading1: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    marginVertical: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    marginVertical: 6,
  },
  paragraph: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  code_inline: {
    backgroundColor: "#E1E1E1",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    padding: 2,
    borderRadius: 4,
    fontSize: 13,
  },
  code_block: {
    backgroundColor: "#E1E1E1",
    padding: 8,
    borderRadius: 8,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    marginVertical: 6,
  },
  link: {
    color: "#0984E3",
    textDecorationLine: "underline",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    paddingBottom: 4,
    paddingHorizontal: 6,
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
    padding: 6,
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
    paddingVertical: 10,
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
    flexGrow: 1,
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
