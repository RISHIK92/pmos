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
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Layout,
  FadeIn,
} from "react-native-reanimated";
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
        text: "I've analyzed the request. Based on current system parameters, this configuration is optimal. Would you like me to deploy these changes to the staging environment?",
        sender: "system",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sources: ["Config Log", "System Health"],
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#2D3436" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>New Thread</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.menuButton}>
              <IconSymbol name="plus" size={20} color="#2D3436" />
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
            <TouchableOpacity
              onPress={inputText.length > 0 ? sendMessage : () => {}}
              style={[
                styles.sendButton,
                inputText.length > 0 && styles.sendButtonActive,
              ]}
            >
              <IconSymbol
                name={inputText.length > 0 ? "arrow.up.right" : "mic.fill"}
                size={18}
                color={inputText.length > 0 ? "#FFFFFF" : "#636E72"}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerNote}>
            PMOS can make mistakes. Verify important info.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
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
});
