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
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Layout,
  FadeIn,
  withRepeat,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import { shareAsync } from "expo-sharing";
import { TypingIndicator } from "@/components/ui/TypingIndicator";

const { width } = Dimensions.get("window");

// Mock Data
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

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    text: "What is the status of the new rendering engine?",
    sender: "user",
    timestamp: "10:00",
  },
  {
    id: "2",
    text: "The rendering engine is currently in Phase 2 of testing. Performance benchmarks show a 40% improvement in frame rates on mobile devices. We are targeting a full release by Q3 2026.",
    sender: "system",
    timestamp: "10:01",
    sources: ["Jira #402", "Tech Spec v2.1"],
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { toggleSidebar } = useContext(SidebarContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isRecording, setIsRecording] = useState(false);

  // Shared value MUST be defined before useAnimatedStyle
  const recordingScale = useSharedValue(1);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const recordingIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingScale.value }],
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
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(recording);
        setIsRecording(true);

        recordingScale.value = withRepeat(
          withSpring(1.2, { duration: 1000 }),
          -1,
          true
        );
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
          ]
        );
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    recordingScale.value = withSpring(1);

    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await shareAsync(uri);
        // Still mock the text response for chat flow continuity
        // setInputText("Show me the memory usage trends for this week.");
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

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
    setInputText("");
    setIsTyping(true);

    // Simulate system response with typing delay
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've pulled the memory usage data. Average daily usage is down by 15% following the 'Garbage Collection' optimization run yesterday. Peak usage remains under 2GB.",
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sources: ["Memory Log", "Performance Monitor"],
      };
      setMessages((prev) => [...prev, response]);
    }, 2000);
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isSystem = item.sender === "system";

    if (isSystem) {
      return (
        <Animated.View
          entering={FadeInUp.delay(index * 50)
            .springify()
            .damping(30)
            .stiffness(200)}
          layout={Layout.springify().damping(30).stiffness(200)}
          style={styles.systemContainer}
        >
          {/* Sources Row */}
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

          {/* Answer Content */}
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
        entering={FadeInUp.delay(index * 50)
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
    <View style={styles.container}>
      {/* ... (Header and FlatList) */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#2D3436" />
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
        contentContainerStyle={styles.listContent}
        style={styles.list}
        showsVerticalScrollIndicator={false}
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

      {/* Perplexity-style Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={styles.inputOuterContainer}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            {isRecording ? (
              <View
                style={[
                  styles.input,
                  { flexDirection: "row", alignItems: "center", gap: 12 },
                ]}
              >
                <Animated.View
                  style={[
                    {
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#FF7675",
                    },
                    recordingIndicatorStyle,
                  ]}
                />
                <Text style={{ color: "#636E72", fontWeight: "500" }}>
                  Listening...
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
                if (inputText.length > 0) {
                  sendMessage();
                } else {
                  if (isRecording) stopRecording();
                  else startRecording();
                }
              }}
              style={[
                styles.sendButton,
                (inputText.length > 0 || isRecording) &&
                  styles.sendButtonActive,
                isRecording && { backgroundColor: "#FF7675" },
              ]}
            >
              <IconSymbol
                name={
                  inputText.length > 0
                    ? "arrow.up.right"
                    : isRecording
                    ? "xmark"
                    : "mic.fill"
                }
                size={18}
                color={
                  inputText.length > 0 || isRecording ? "#FFFFFF" : "#636E72"
                }
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerNote}>
            PMOS can make mistakes. Verify important info.
          </Text>
        </View>
      </KeyboardAvoidingView>

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
            activeOpacity={1}
          />
          <Animated.View style={styles.notificationModal}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close-circle" size={24} color="#B2BEC3" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notifList}
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
                      { backgroundColor: item.color + "15" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
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
    </View>
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
    paddingBottom: 40,
  },
  // User Prompt Styles
  userContainer: {
    marginBottom: 32,
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
  // System Answer Styles
  systemContainer: {
    marginBottom: 40,
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
    gap: 16,
    marginLeft: 0,
    marginBottom: 20,
  },
  thinkingText: {
    fontSize: 14,
    color: "#636E72",
    fontStyle: "italic",
  },
  // Input Styles
  inputOuterContainer: {
    backgroundColor: "#FFFFFF",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 16,
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
    fontSize: 12,
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
    marginTop: 8,
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
  // Notification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    paddingTop: 60, // below header roughly
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
});
