import React, { useContext, useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Mock Data
const BLOCKED_APPS = [
  {
    id: "1",
    name: "Instagram",
    icon: "camera.fill",
    color: "#E1306C",
    isBlocked: true,
  },
  {
    id: "2",
    name: "TikTok",
    icon: "music.note",
    color: "#000000",
    isBlocked: true,
  },
  {
    id: "3",
    name: "X / Twitter",
    icon: "bubble.left.fill",
    color: "#1DA1F2",
    isBlocked: true,
  },
  {
    id: "4",
    name: "Snapchat",
    icon: "paperplane.fill",
    color: "#FFFC00",
    isBlocked: false,
  },
  {
    id: "5",
    name: "YouTube",
    icon: "play.tv.fill",
    color: "#FF0000",
    isBlocked: true,
  },
];

const FOCUS_MODES = [
  {
    id: "work",
    label: "Deep Work",
    icon: "briefcase.fill",
    color: "#2D3436",
    quote: "Focus on being productive instead of busy.",
  },
  {
    id: "study",
    label: "Study",
    icon: "book.fill",
    color: "#0984E3",
    quote: "Learning never exhausts the mind.",
  },
  {
    id: "sleep",
    label: "Sleep",
    icon: "moon.fill",
    color: "#636E72",
    quote: "Rest is the best meditation.",
  },
  {
    id: "detox",
    label: "Detox",
    icon: "leaf.fill",
    color: "#00B894",
    quote: "Disconnect to reconnect.",
  },
];

type Session = {
  id: string;
  modeId: string;
  duration: number; // minutes
  timeSpent?: number; // minutes
  date: Date;
  completed: boolean;
  reason?: string;
};

export default function RestrictorScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [apps, setApps] = useState(BLOCKED_APPS);
  const [activeContext, setActiveContext] = useState<string>("work");

  // Manual Time Input State
  const [durationInput, setDurationInput] = useState("30");

  // Active Timer State
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [giveUpProgress, setGiveUpProgress] = useState(0);

  // History & Feedback State
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showExitSurvey, setShowExitSurvey] = useState(false);
  const [exitReason, setExitReason] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const giveUpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentMode =
    FOCUS_MODES.find((m) => m.id === activeContext) || FOCUS_MODES[0];
  const activeBlocks = apps.filter((a) => a.isBlocked).length;

  const toggleApp = (id: string) => {
    setApps(
      apps.map((app) =>
        app.id === id ? { ...app, isBlocked: !app.isBlocked } : app
      )
    );
  };

  const startFocus = () => {
    const minutes = parseInt(durationInput);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert(
        "Invalid Duration",
        "Please enter a valid number of minutes."
      );
      return;
    }
    setTimeLeft(minutes * 60);
    setIsFocusActive(true);
    setShowExitSurvey(false);
    setExitReason("");
    setCurrentSessionId(Date.now().toString());
  };

  const endSession = (completed: boolean, reason?: string) => {
    setIsFocusActive(false);
    setShowExitSurvey(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentSessionId) {
      const totalDuration = parseInt(durationInput);
      const spentTime = completed
        ? totalDuration
        : Math.max(0, Math.floor(totalDuration - timeLeft / 60));

      const newSession: Session = {
        id: currentSessionId,
        modeId: activeContext,
        duration: totalDuration,
        timeSpent: spentTime,
        date: new Date(),
        completed,
        reason,
      };
      setSessionHistory((prev) => [newSession, ...prev].slice(0, 10)); // Keep last 10
    }

    if (completed) {
      Alert.alert("Session Complete", "Great job staying focused!");
    }
  };

  // Timer Logic
  useEffect(() => {
    if (isFocusActive && timeLeft > 0 && !showExitSurvey) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isFocusActive && !showExitSurvey) {
      endSession(true);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFocusActive, timeLeft, showExitSurvey]);

  // Format Time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Long Press Logic
  const handlePressIn = () => {
    setGiveUpProgress(0);
    giveUpTimerRef.current = setInterval(() => {
      setGiveUpProgress((prev) => {
        if (prev >= 100) {
          if (giveUpTimerRef.current) clearInterval(giveUpTimerRef.current);
          // Do NOT end session immediately, show survey
          setShowExitSurvey(true);
          return 0;
        }
        return prev + 5;
      });
    }, 50);
  };

  const handlePressOut = () => {
    if (giveUpTimerRef.current) clearInterval(giveUpTimerRef.current);
    setGiveUpProgress(0);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={
          isFocusActive || showHistory ? "light-content" : "dark-content"
        }
        backgroundColor={isFocusActive || showHistory ? "#1A1A1A" : "#FFFFFF"}
      />

      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <SafeAreaView style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Minimal Hero Section */}
          <View style={styles.minimalHero}>
            <View
              style={[
                styles.modeIndicator,
                { backgroundColor: currentMode.color + "15" },
              ]}
            >
              <IconSymbol
                name={currentMode.icon as any}
                size={16}
                color={currentMode.color}
              />
              <Text
                style={[styles.modeIndicatorText, { color: currentMode.color }]}
              >
                {currentMode.label}
              </Text>
            </View>

            <View style={styles.timeInputWrapper}>
              <TextInput
                style={styles.timeInput}
                value={durationInput}
                onChangeText={setDurationInput}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="30"
                placeholderTextColor="#E0E0E0"
              />
              <Text style={styles.timeUnit}>min</Text>
            </View>

            {/* Mode Selector - Minimal */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeScrollContent}
              style={styles.modeSelector}
            >
              {FOCUS_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeChip,
                    activeContext === mode.id && {
                      borderColor: mode.color,
                      backgroundColor: mode.color + "10",
                    },
                  ]}
                  onPress={() => setActiveContext(mode.id)}
                >
                  <IconSymbol
                    name={mode.icon as any}
                    size={14}
                    color={activeContext === mode.id ? mode.color : "#B2BEC3"}
                  />
                  <Text
                    style={[
                      styles.modeChipText,
                      activeContext === mode.id
                        ? { color: mode.color }
                        : { color: "#B2BEC3" },
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* History Link */}
          <TouchableOpacity
            style={styles.historyLink}
            onPress={() => setShowHistory(true)}
          >
            <IconSymbol
              name="clock.arrow.circlepath"
              size={16}
              color="#636E72"
            />
            <Text style={styles.historyLinkText}>Last Sessions</Text>
          </TouchableOpacity>

          {/* Start Button - High Contrast Black */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={styles.actionSection}
          >
            <TouchableOpacity style={styles.startButton} onPress={startFocus}>
              <Text style={styles.startButtonText}>Start Session</Text>
              <View style={styles.arrowCircle}>
                <IconSymbol name="arrow.right" size={16} color="#000" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* App List - Clean */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Blocked Apps</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{activeBlocks}</Text>
              </View>
            </View>

            <View style={styles.appList}>
              {apps.map((app, index) => (
                <Animated.View
                  key={app.id}
                  entering={FadeInDown.delay(300 + index * 50)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    style={styles.appRow}
                    onPress={() => toggleApp(app.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appInfo}>
                      <View
                        style={[
                          styles.appIconBox,
                          { backgroundColor: "#F8F9FA" },
                        ]}
                      >
                        <IconSymbol
                          name={app.icon as any}
                          size={20}
                          color={app.color}
                        />
                      </View>
                      <Text style={styles.appName}>{app.name}</Text>
                    </View>
                    <Switch
                      value={app.isBlocked}
                      onValueChange={() => toggleApp(app.id)}
                      trackColor={{ false: "#F1F2F6", true: "#000" }}
                      thumbColor="#FFF"
                      style={{ transform: [{ scale: 0.8 }] }}
                    />
                  </TouchableOpacity>
                  {index < apps.length - 1 && <View style={styles.divider} />}
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Active Focus Overlay - Minimal Dark */}
      <Modal animationType="fade" transparent={false} visible={isFocusActive}>
        <View style={[styles.activeContainer, { backgroundColor: "#111" }]}>
          <StatusBar barStyle="light-content" backgroundColor="#111" />

          {showExitSurvey ? (
            // Exit Survey View
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.surveyContent}
            >
              <Text style={styles.surveyTitle}>Why stop now?</Text>
              <Text style={styles.surveySubtitle}>
                Understanding your triggers helps you improve.
              </Text>

              <TextInput
                style={styles.surveyInput}
                placeholder="I need to check..."
                placeholderTextColor="#555"
                value={exitReason}
                onChangeText={setExitReason}
                multiline
                autoFocus
              />

              <View style={styles.surveyActions}>
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={() => setShowExitSurvey(false)}
                >
                  <Text style={styles.resumeButtonText}>Resume Timer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.endButton}
                  onPress={() => endSession(false, exitReason)}
                >
                  <Text style={styles.endButtonText}>End Session</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            // Active Timer View
            <>
              <View style={styles.activeContent}>
                <View
                  style={[
                    styles.activeStatus,
                    { borderColor: currentMode.color },
                  ]}
                >
                  <IconSymbol
                    name={currentMode.icon as any}
                    size={16}
                    color={currentMode.color}
                  />
                  <Text
                    style={[
                      styles.activeStatusText,
                      { color: currentMode.color },
                    ]}
                  >
                    {currentMode.label} Mode
                  </Text>
                </View>

                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

                <View style={styles.quoteContainer}>
                  <Text style={styles.quoteText}>{currentMode.quote}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.giveUpButton}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.giveUpProgress,
                    { width: `${giveUpProgress}%` },
                  ]}
                />
                <Text style={styles.giveUpText}>
                  {giveUpProgress > 0 ? "Hold to Stop..." : "Stop Session"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.longPressHint}>Long press to exit</Text>
            </>
          )}
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHistory}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.historyModalContainer}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Session History</Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                style={styles.closeBtn}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.historyList}>
              {sessionHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No sessions yet.</Text>
                </View>
              ) : (
                sessionHistory.map((session, index) => {
                  const mode =
                    FOCUS_MODES.find((m) => m.id === session.modeId) ||
                    FOCUS_MODES[0];
                  return (
                    <View key={session.id} style={styles.historyItem}>
                      <View
                        style={[
                          styles.historyIconBox,
                          { backgroundColor: mode.color + "15" },
                        ]}
                      >
                        <IconSymbol
                          name={mode.icon as any}
                          size={20}
                          color={mode.color}
                        />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyMode}>
                          {mode.label} •{" "}
                          {session.completed
                            ? `${session.duration}m`
                            : `${session.timeSpent || 0}/${session.duration}m`}
                        </Text>
                        <Text style={styles.historyDate}>
                          {session.date.toLocaleDateString()}{" "}
                          {session.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                        {!session.completed && session.reason && (
                          <Text style={styles.historyReason}>
                            "{session.reason}"
                          </Text>
                        )}
                      </View>
                      <View style={styles.historyStatus}>
                        {session.completed ? (
                          <IconSymbol
                            name="checkmark.circle.fill"
                            size={20}
                            color="#00B894"
                          />
                        ) : (
                          <Text style={styles.earlyText}>Early</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
    paddingTop: 30,
    borderRadius: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Minimal Hero
  minimalHero: {
    alignItems: "center",
    paddingVertical: 40,
    marginBottom: 0,
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  modeIndicatorText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 32,
  },
  timeInput: {
    fontSize: 80,
    fontWeight: "200",
    color: "#000",
    textAlign: "center",
    minWidth: 120,
    fontVariant: ["tabular-nums"],
  },
  timeUnit: {
    fontSize: 24,
    fontWeight: "400",
    color: "#B2BEC3",
    marginLeft: 4,
  },
  modeSelector: {
    maxHeight: 40,
    width: "100%",
  },
  modeScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
    justifyContent: "center",
    minWidth: "100%",
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#F8F9FA",
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },

  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
    padding: 10,
    alignSelf: "center",
  },
  historyLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636E72",
  },

  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  countBadge: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#636E72",
  },
  appList: {
    //
  },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F2F6",
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  appIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3436",
  },

  // Active Mode Styles
  activeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  activeContent: {
    alignItems: "center",
    marginBottom: 80,
  },
  activeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  activeStatusText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timerText: {
    fontSize: 96,
    fontWeight: "100",
    color: "#FFF",
    fontVariant: ["tabular-nums"],
    marginBottom: 40,
    letterSpacing: -2,
  },
  quoteContainer: {
    paddingHorizontal: 40,
  },
  quoteText: {
    fontSize: 16,
    color: "#636E72",
    textAlign: "center",
    lineHeight: 24,
  },
  giveUpButton: {
    width: width - 60,
    height: 56,
    backgroundColor: "#222",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  giveUpText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    zIndex: 2,
  },
  giveUpProgress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#E74C3C",
    zIndex: 1,
  },
  longPressHint: {
    color: "#444",
    fontSize: 12,
    marginTop: 20,
  },

  // Survey Styles
  surveyContent: {
    width: "100%",
    alignItems: "center",
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  surveySubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 32,
    textAlign: "center",
  },
  surveyInput: {
    width: "100%",
    backgroundColor: "#222",
    color: "#FFF",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  surveyActions: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  resumeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#333",
    alignItems: "center",
  },
  resumeButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  endButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#E74C3C",
    alignItems: "center",
  },
  endButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },

  // History Modal Styles
  historyModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  historyModalContent: {
    backgroundColor: "#FFF",
    height: "80%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3436",
  },
  closeBtn: {
    padding: 4,
  },
  historyList: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyStateText: {
    color: "#B2BEC3",
    fontSize: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyMode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "#B2BEC3",
    marginBottom: 4,
  },
  historyReason: {
    fontSize: 14,
    color: "#636E72",
    fontStyle: "italic",
    marginTop: 2,
  },
  historyStatus: {
    marginLeft: 12,
    justifyContent: "center",
    height: 40,
  },
  earlyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E74C3C",
  },
});
