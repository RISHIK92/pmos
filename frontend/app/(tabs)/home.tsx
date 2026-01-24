import React, { useState, useRef, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import GoogleLogin from "@/components/GoogleLogin";
import ChatEmptyState from "@/components/ChatEmptyState";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Layout,
  withRepeat,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import { shareAsync } from "expo-sharing";
import { WaveformIcon } from "@/components/ui/WaveformIcon";
import { FCMManager } from "../../utils/FCMManager";

const { width } = Dimensions.get("window");

type Message = {
  id: string;
  text: string;
  sender: "user" | "system";
  timestamp: string;
  sources?: string[];
};

const INITIAL_NOTIFICATIONS = [
  {
    id: "1",
    title: "System Update",
    message: "PMOS v2.1 is now available. Tap to install.",
    time: "2m ago",
    read: false,
    icon: "hardware-chip",
    color: "#00B894",
  },
  {
    id: "2",
    title: "New Task Assigned",
    message: "Project 'Alpha' needs your review.",
    time: "1h ago",
    read: false,
    icon: "checkbox",
    color: "#0984E3",
  },
  {
    id: "3",
    title: "Memory Optimized",
    message: "Freed up 1.2GB of space automatically.",
    time: "3h ago",
    read: true,
    icon: "flash",
    color: "#FDCB6E",
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { toggleSidebar } = useContext(SidebarContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // recordingScale removed
  const processingScale = useSharedValue(1);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);

      if (firebaseUser) {
        try {
          // 1. Get Auth Token
          const token = await firebaseUser.getIdToken();

          // 2. Get FCM Token (Request permission if needed)
          const hasPermission = await FCMManager.requestPermission();
          let fcmToken = null;
          if (hasPermission) {
            fcmToken = await FCMManager.getToken();
          }

          const backendUrl =
            Platform.OS === "android"
              ? "http://10.243.161.129:8000"
              : "http://localhost:8000";

          const data = await fetch(`${backendUrl}/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fcmToken }), // Pass FCM Token here
          });
          console.log("Auth Sync:", await data.json());
        } catch (err) {
          console.error("Backend sync failed", err);
        }
      }
    });

    return unsubscribe;
  }, [initializing]);

  const processingIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: processingScale.value }],
    opacity: processingScale.value > 1 ? 0.7 : 1,
  }));

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );

        setRecording(recording);
        setIsRecording(true);

        // recording animation handled by WaveformIcon component
      } else {
        Alert.alert(
          "Permission Required",
          "Microphone access is needed to record voice notes. Please enable it in settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    // recording animation reset handled by WaveformIcon component

    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        // Start processing animation
        setIsProcessingVoice(true);
        processingScale.value = withRepeat(
          withSpring(1.4, { duration: 600 }),
          -1,
          true,
        );

        const formData = new FormData();

        formData.append("file", {
          uri: uri,
          name: "recording.m4a",
          type: "audio/m4a",
        } as any);

        const backendUrl =
          Platform.OS === "android"
            ? "http://10.243.161.129:8000"
            : "http://localhost:8000";

        const response = await fetch(`${backendUrl}/query/voice`, {
          method: "POST",
          body: formData,
          headers: {},
        });
        const result = await response.json();

        // Stop processing animation
        setIsProcessingVoice(false);
        processingScale.value = withSpring(1);

        if (result) {
          setInputText(result);
        }
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      setIsProcessingVoice(false);
      processingScale.value = withSpring(1);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    const queryText = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      const token = await user.getIdToken();
      const backendUrl =
        Platform.OS === "android"
          ? "http://10.243.161.129:8000"
          : "http://localhost:8000";

      const apiResponse = await fetch(`${backendUrl}/query/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: queryText }),
      });

      const result = await apiResponse.json();
      setIsTyping(false);

      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response || "Sorry, I couldn't process your request.",
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sources: ["PMOS Intelligence"],
      };
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Failed to send message", error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error processing your request. Please try again.",
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const renderItem = ({ item, index }: { item: Message; index?: number }) => {
    const isSystem = item.sender === "system";
    const itemIndex = index ?? 0;

    if (isSystem) {
      return (
        <Animated.View
          entering={FadeInUp.delay(itemIndex * 50)
            .springify()
            .damping(30)
            .stiffness(200)}
          layout={Layout.springify().damping(30).stiffness(200)}
          style={styles.systemContainer}
        >
          {item.sources && (
            <View style={styles.sourcesContainer}>
              <View style={styles.sourcesHeader}>
                <IconSymbol name="sparkles" size={14} color="#636E72" />
                <Text style={styles.sourcesLabel}>SOURCES</Text>
              </View>
              <View style={styles.sourcesList}>
                {item.sources.map((source, i) => (
                  <View key={i} style={styles.sourceChip}>
                    <Text style={styles.sourceText}>{source}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.answerRow}>
            <View style={styles.systemIcon}>
              <IconSymbol name="sparkles" size={20} color="#00B894" />
            </View>
            <View style={styles.answerContent}>
              <Text style={styles.systemName}>PMOS Intelligence</Text>
              <Text style={styles.systemText}>{item.text}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                  <IconSymbol name="doc.text.fill" size={14} color="#B2BEC3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <IconSymbol name="arrow.up.right" size={14} color="#B2BEC3" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={FadeInUp.delay(itemIndex * 50)
          .springify()
          .damping(30)
          .stiffness(200)}
        layout={Layout.springify().damping(30).stiffness(200)}
        style={styles.userContainer}
      >
        <Text style={styles.userText}>{item.text}</Text>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <SafeAreaView style={styles.headerContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={toggleSidebar}
                style={styles.menuButton}
              >
                <IconSymbol
                  name="line.3.horizontal"
                  size={24}
                  color="#2D3436"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowNotifications(true)}
              >
                <IconSymbol name="bell.fill" size={20} color="#000" />
                {notifications.some((n) => !n.read) && (
                  <View style={styles.badge} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 && { flex: 1, justifyContent: "center" },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <ChatEmptyState
              loggedIn={!!user}
              onLoginSuccess={() => setShowLoginModal(false)}
            />
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingWrapper}>
                <View style={styles.systemIcon}>
                  <IconSymbol name="sparkles" size={20} color="#00B894" />
                </View>
                <Text style={styles.thinkingText}>Thinking...</Text>
              </View>
            ) : (
              <View style={{ height: 20 }} />
            )
          }
        />

        <View style={styles.inputOuterContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              {isRecording ? (
                <View
                  style={[
                    styles.input,
                    { flexDirection: "row", alignItems: "center", gap: 12 },
                  ]}
                >
                  <WaveformIcon isListening={true} color="#4285F4" />
                  <Text style={{ color: "#636E72", fontWeight: "500" }}>
                    Listening...
                  </Text>
                </View>
              ) : isProcessingVoice ? (
                <View
                  style={[
                    styles.input,
                    { flexDirection: "row", alignItems: "center", gap: 12 },
                  ]}
                >
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Animated.View
                      style={[
                        {
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#0984E3",
                        },
                        processingIndicatorStyle,
                      ]}
                    />
                    <Animated.View
                      style={[
                        {
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#0984E3",
                        },
                        processingIndicatorStyle,
                      ]}
                    />
                    <Animated.View
                      style={[
                        {
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#0984E3",
                        },
                        processingIndicatorStyle,
                      ]}
                    />
                  </View>
                  <Text style={{ color: "#636E72", fontWeight: "500" }}>
                    Processing...
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.attachBtn}>
                    <IconSymbol name="plus" size={20} color="#636E72" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Ask anything..."
                    placeholderTextColor="#999"
                    selectionColor="#00B894"
                    multiline
                  />
                </>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (isProcessingVoice) return; // Disable while processing
                  if (inputText.length > 0) {
                    sendMessage();
                  } else {
                    if (isRecording) stopRecording();
                    else startRecording();
                  }
                }}
                disabled={isProcessingVoice}
                style={[
                  styles.sendButton,
                  (inputText.length > 0 || isRecording) &&
                    styles.sendButtonActive,
                  isRecording && { backgroundColor: "#4285F4" },
                  isProcessingVoice && { backgroundColor: "#B2BEC3" },
                ]}
              >
                <IconSymbol
                  name={
                    isProcessingVoice
                      ? "hourglass"
                      : inputText.length > 0
                        ? "arrow.up.right"
                        : isRecording
                          ? "checkmark"
                          : "mic.fill"
                  }
                  size={18}
                  color={
                    inputText.length > 0 || isRecording || isProcessingVoice
                      ? "#FFFFFF"
                      : "#636E72"
                  }
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.footerNote}>
              PMOS can make mistakes. Verify important info.
            </Text>
          </View>
        </View>

        {/* Notifications Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showNotifications}
          onRequestClose={() => setShowNotifications(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setShowNotifications(false)}
            />
            <Animated.View
              entering={FadeInUp.springify()}
              style={styles.notificationModal}
            >
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <IconSymbol name="xmark" size={20} color="#636E72" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={notifications}
                style={styles.notifList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.notifItem,
                      !item.read && styles.notifItemUnread,
                    ]}
                  >
                    <View
                      style={[
                        styles.notifIcon,
                        { backgroundColor: `${item.color}15` },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={item.color}
                      />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifTopRow}>
                        <Text style={styles.notifItemTitle}>{item.title}</Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>
                    {!item.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity style={styles.markReadBtn}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* Login Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showLoginModal}
          onRequestClose={() => setShowLoginModal(false)}
        >
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setShowLoginModal(false)}
            />
            <View style={styles.loginModalContent}>
              <View style={styles.loginHeader}>
                <IconSymbol name="lock.fill" size={24} color="#2D3436" />
                <Text style={styles.loginTitle}>Authentication Required</Text>
              </View>
              <Text style={styles.loginSubtitle}>
                Please sign in to continue your conversation.
              </Text>
              <View style={styles.loginActionContainer}>
                <GoogleLogin onLoginSuccess={() => setShowLoginModal(false)} />
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 8,
    paddingTop: 30,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  userContainer: {
    marginBottom: 24,
    alignItems: "flex-end",
  },
  userText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    lineHeight: 24,
    letterSpacing: -0.5,
    textAlign: "right",
    maxWidth: "90%",
  },
  systemContainer: {
    marginBottom: 32,
  },
  sourcesContainer: {
    marginBottom: 16,
  },
  sourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#636E72",
    letterSpacing: 0.5,
  },
  sourcesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  sourceText: {
    fontSize: 12,
    color: "#2D3436",
    fontWeight: "500",
  },
  answerRow: {
    flexDirection: "row",
    gap: 16,
  },
  systemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  answerContent: {
    flex: 1,
  },
  systemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  systemText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#2D3436",
    fontWeight: "400",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    padding: 4,
  },
  typingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 0,
    marginBottom: 20,
  },
  thinkingText: {
    fontSize: 14,
    color: "#636E72",
    fontStyle: "italic",
  },
  inputOuterContainer: {
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8, // Small padding for footer note
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 32,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 56,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  loginContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#2D3436",
    fontSize: 14,
    maxHeight: 120,
    marginRight: 12,
    fontWeight: "500",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#00B894",
  },
  footerNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#B2BEC3",
  },
  badge: {
    position: "absolute",
    top: 14,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7675",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  notificationModal: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
  },
  notifList: {
    padding: 0,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },
  notifItemUnread: {
    backgroundColor: "#F8F9FA",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    paddingTop: 30,
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },
  notifTime: {
    fontSize: 11,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  notifMessage: {
    fontSize: 13,
    color: "#636E72",
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0984E3",
    marginLeft: 8,
  },
  markReadBtn: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
  },
  markReadText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0984E3",
  },
  loginHeader: {
    marginBottom: 16,
    alignItems: "center",
    gap: 12,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#636E72",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  loginActionContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 14,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  loginModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
});
