import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
  Dimensions,
  TextInput,
} from "react-native";
import { SidebarContext } from "./_layout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth } from "../../lib/firebase";
import Animated, { FadeInUp } from "react-native-reanimated";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

const { width } = Dimensions.get("window");

const TerminalText = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => <Text style={[styles.terminalText, style]}>{children}</Text>;

const backendUrl =
  Platform.OS === "android"
    ? "http://10.243.161.129:8000"
    : "http://localhost:8000";

interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  url: string;
  updated_at: string;
}

interface DeepWorkMetrics {
  focus_hours_percentage: number;
  context_switching_score: string;
  night_owl_percentage: number;
  active_days_streak: number;
}

interface InboxItem {
  id: number;
  title: string;
  url: string;
  type: string;
  status: string;
  repo_name: string;
  created_at: string;
  author: string;
}

interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

interface DevProfile {
  username: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  top_repos: Repo[];
  top_languages: string[];
  total_stars: number;
  deep_work: DeepWorkMetrics;
  inbox: InboxItem[];
  skill_stack: LanguageStat[];
}

const DonutChart = ({ data }: { data: LanguageStat[] }) => {
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let startAngle = -90;

  return (
    <View style={{ alignItems: "center" }}>
      <Svg height={size} width={size}>
        <G rotation={0} origin={`${center}, ${center}`}>
          {data.map((item, index) => {
            const strokeDashoffset =
              circumference - (circumference * item.percentage) / 100;
            const angle = (item.percentage / 100) * 360;
            const currentStartAngle = startAngle;
            startAngle += angle;

            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation={currentStartAngle + 90}
                origin={`${center}, ${center}`}
                fill="transparent"
              />
            );
          })}
          {/* Inner Text */}
          <SvgText
            fill="#58A6FF"
            fontSize="24"
            fontWeight="bold"
            x={center}
            y={center + 8}
            textAnchor="middle"
          >
            {data.length > 0 ? "SKILLS" : "N/A"}
          </SvgText>
        </G>
      </Svg>
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <TerminalText style={styles.legendText}>
              {item.name} ({item.percentage}%)
            </TerminalText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function DevScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [profile, setProfile] = useState<DevProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dev Journal State
  const [devJournalContent, setDevJournalContent] = useState("");
  const [devJournalId, setDevJournalId] = useState<string | null>(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const date = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchProfile();
    fetchDevJournal();
  }, []);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `${backendUrl}/journal/history?type=DEV&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchDevJournal = async () => {
    if (!auth.currentUser) return;
    setJournalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `${backendUrl}/journal/today?date=${date}&type=DEV`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setDevJournalContent(data.content);
          setDevJournalId(data.id);
        }
      }
    } catch (e) {
      console.log("Failed to fetch dev journal", e);
    } finally {
      setJournalLoading(false);
    }
  };

  const handleSaveDevJournal = async () => {
    if (!auth.currentUser) return;
    setJournalSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${backendUrl}/journal/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date,
          content: devJournalContent,
          type: "DEV",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDevJournalId(data.id);
        // Optional: Toast or simple visual feedback?
      }
    } catch (e) {
      console.error("Failed to save dev journal", e);
    } finally {
      setJournalSaving(false);
    }
  };

  const fetchProfile = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      setError("NOT_AUTHENTICATED");
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      // Get timezone offset in minutes (e.g., -330 for India which is UTC+5:30)
      const offset = new Date().getTimezoneOffset();
      const res = await fetch(
        `${backendUrl}/dev/profile?timezone_offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to fetch profile");
      }
      const data = await res.json();
      setProfile(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00FF00" />
        <TerminalText style={{ marginTop: 20 }}>
          Initialising Uplink...
        </TerminalText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <IconSymbol name="line.3.horizontal" size={24} color="#00FF00" />
          </TouchableOpacity>
          <TerminalText style={styles.headerTitle}>
            ~/dev/dashboard
          </TerminalText>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>ERR: {error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
              <Text style={styles.retryText}>./retry.sh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <Animated.View
              entering={FadeInUp.delay(100)}
              style={styles.section}
            >
              <View style={styles.asciiArt}>
                <Text style={styles.asciiText}>
                  {`
  ╭───╮
  │◕ ◕│  ${profile?.username || "user"}@github
  ╰─┬─╯  
    │    Stats loaded successfully.
`}
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>REPOS</Text>
                  <Text style={styles.statValue}>{profile?.public_repos}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>STARS</Text>
                  <Text style={styles.statValue}>{profile?.total_stars}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>FOLLOWERS</Text>
                  <Text style={styles.statValue}>{profile?.followers}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Dev Log */}
            <Animated.View
              entering={FadeInUp.delay(150)}
              style={styles.section}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <TerminalText
                  style={{ ...styles.sectionTitle, marginBottom: 0 }}
                >
                  $ vim dev_log.md
                </TerminalText>
                <TouchableOpacity
                  onPress={() =>
                    showHistory ? setShowHistory(false) : fetchHistory()
                  }
                >
                  <TerminalText style={{ fontSize: 12, color: "#8B949E" }}>
                    {showHistory ? "./close_history.sh" : "$ history"}
                  </TerminalText>
                </TouchableOpacity>
              </View>

              {showHistory && (
                <View style={styles.historyContainer}>
                  {historyLoading ? (
                    <ActivityIndicator color="#58A6FF" />
                  ) : history.length > 0 ? (
                    history.map((entry, i) => (
                      <View key={i} style={styles.historyItem}>
                        <Text style={styles.historyDate}>
                          -- {entry.date} --
                        </Text>
                        <Text style={styles.historyContent}>
                          {entry.content}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.terminalText}>No history found.</Text>
                  )}
                </View>
              )}

              <View style={styles.journalContainer}>
                <TextInput
                  style={styles.journalInput}
                  multiline
                  placeholder="// Write your dev log here..."
                  placeholderTextColor="#484F58"
                  value={devJournalContent}
                  onChangeText={setDevJournalContent}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={styles.journalSaveBtn}
                  onPress={handleSaveDevJournal}
                  disabled={journalSaving}
                >
                  {journalSaving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.journalSaveText}>:wq</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Deep Work Heatmap */}
            <Animated.View
              entering={FadeInUp.delay(200)}
              style={styles.section}
            >
              <TerminalText style={styles.sectionTitle}>
                $ ./check_deep_work.sh
              </TerminalText>
              <View style={styles.metricsContainer}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>FOCUS HOURS (10-14)</Text>
                  <Text style={styles.metricValue}>
                    {profile?.deep_work?.focus_hours_percentage}%
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${profile?.deep_work?.focus_hours_percentage || 0}%`,
                          backgroundColor: "#4CAF50",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>NIGHT OWL (22-04)</Text>
                  <Text style={styles.metricValue}>
                    {profile?.deep_work?.night_owl_percentage}%
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${profile?.deep_work?.night_owl_percentage || 0}%`,
                          backgroundColor: "#9C27B0",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>CONTEXT SWITCHING</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color:
                          profile?.deep_work?.context_switching_score === "High"
                            ? "#FF5252"
                            : "#4CAF50",
                      },
                    ]}
                  >
                    {profile?.deep_work?.context_switching_score}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Unified Inbox */}
            <Animated.View
              entering={FadeInUp.delay(300)}
              style={styles.section}
            >
              <TerminalText style={styles.sectionTitle}>
                $ cat inbox.log | grep URGENT
              </TerminalText>
              {profile?.inbox && profile.inbox.length > 0 ? (
                profile.inbox.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.inboxItem}
                    onPress={() => Linking.openURL(item.url)}
                  >
                    <View style={styles.inboxHeader}>
                      <Text
                        style={[
                          styles.inboxType,
                          {
                            color:
                              item.type === "PR_BLOCKED"
                                ? "#FF5252"
                                : item.type === "MENTION"
                                  ? "#E040FB"
                                  : "#2196F3",
                          },
                        ]}
                      >
                        [{item.type}]
                      </Text>
                      <Text style={styles.inboxDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.inboxRepo}>{item.repo_name}</Text>
                    <Text style={styles.inboxTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.inboxStatus}>
                      Status: {item.status}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.terminalText}>
                  No urgent items. Inbox zero!
                </Text>
              )}
            </Animated.View>

            {/* Skill Stack */}
            <Animated.View
              entering={FadeInUp.delay(400)}
              style={styles.section}
            >
              <TerminalText style={styles.sectionTitle}>
                $ analyze_skills --visual
              </TerminalText>
              <View style={styles.chartContainer}>
                {profile?.skill_stack && (
                  <DonutChart data={profile.skill_stack} />
                )}
              </View>
            </Animated.View>

            {/* Languages */}
            <Animated.View
              entering={FadeInUp.delay(500)}
              style={styles.section}
            >
              <TerminalText style={styles.sectionTitle}>
                $ cat top_languages.txt
              </TerminalText>
              <View style={styles.tagContainer}>
                {profile?.top_languages.map((lang, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Repos List */}
            <Animated.View
              entering={FadeInUp.delay(600)}
              style={styles.section}
            >
              <TerminalText style={styles.sectionTitle}>
                $ ls -la ./top_repos
              </TerminalText>
              {profile?.top_repos.map((repo, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.repoItem}
                  onPress={() => Linking.openURL(repo.url)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.repoName}>{repo.name}</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <View
                        style={[
                          styles.circle,
                          { backgroundColor: getLangColor(repo.language) },
                        ]}
                      />
                      <Text style={styles.repoLang}>
                        {repo.language || "txt"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.repoDesc} numberOfLines={2}>
                    {repo.description || "No description provided."}
                  </Text>
                  <View style={styles.repoMeta}>
                    <Text style={styles.metaText}>★ {repo.stars}</Text>
                    <Text style={styles.metaText}>⑂ {repo.forks}</Text>
                    <Text style={styles.metaText}>
                      updated {new Date(repo.updated_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getLangColor(lang: string | null) {
  switch (lang) {
    case "Python":
      return "#3572A5";
    case "TypeScript":
      return "#2b7489";
    case "JavaScript":
      return "#f1e05a";
    case "Go":
      return "#00ADD8";
    default:
      return "#555555";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1117", // GitHub Dark Dimmed / Terminal Black
  },
  headerContainer: {
    backgroundColor: "#161B22",
    borderBottomWidth: 1,
    borderBottomColor: "#30363D",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 8,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#58A6FF",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  terminalText: {
    color: "#C9D1D9",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  errorText: {
    color: "#FF7B72",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 20,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: "#58A6FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryText: {
    color: "#58A6FF",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  section: {
    marginBottom: 30,
  },
  asciiArt: {
    alignItems: "center",
    marginBottom: 20,
  },
  asciiText: {
    color: "#00FF00",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#161B22",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#30363D",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#8B949E",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  statValue: {
    color: "#C9D1D9",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  sectionTitle: {
    color: "#58A6FF",
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    backgroundColor: "#161B22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#30363D",
  },
  tagText: {
    color: "#C9D1D9",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
  },
  repoItem: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: "#161B22",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#238636", // GitHub Green
  },
  repoName: {
    color: "#58A6FF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  repoLang: {
    color: "#8B949E",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  repoDesc: {
    color: "#8B949E",
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  repoMeta: {
    flexDirection: "row",
    gap: 15,
  },
  metaText: {
    color: "#8B949E",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  // Deep Work Styles
  metricsContainer: {
    flexDirection: "column", // Changed to column for mobile
    gap: 12,
  },
  metricCard: {
    backgroundColor: "#161B22",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#30363D",
  },
  metricLabel: {
    color: "#8B949E",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  metricValue: {
    color: "#C9D1D9",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#30363D",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  // Inbox Styles
  inboxItem: {
    backgroundColor: "#161B22",
    marginBottom: 8,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#58A6FF",
  },
  inboxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  inboxType: {
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inboxDate: {
    color: "#8B949E",
    fontSize: 10,
  },
  inboxRepo: {
    color: "#C9D1D9",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 2,
  },
  inboxTitle: {
    color: "#58A6FF",
    fontSize: 13,
    marginBottom: 4,
  },
  inboxStatus: {
    color: "#8B949E",
    fontSize: 10,
    fontStyle: "italic",
  },
  // Chart Styles
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: "#C9D1D9",
  },
  // Journal Styles
  journalContainer: {
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#30363D",
    borderRadius: 6,
    overflow: "hidden",
  },
  journalInput: {
    color: "#C9D1D9",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    padding: 12,
    minHeight: 100,
    backgroundColor: "#0D1117",
  },
  journalSaveBtn: {
    backgroundColor: "#30363D",
    padding: 8,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#30363D",
  },
  journalSaveText: {
    color: "#58A6FF",
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
  },
  // History Styles
  historyContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#0D1117",
    borderWidth: 1,
    borderColor: "#30363D",
    borderRadius: 6,
    maxHeight: 200, // Scrollable if needed, or just limited height
  },
  historyItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#21262D",
    paddingBottom: 8,
  },
  historyDate: {
    color: "#8B949E",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  historyContent: {
    color: "#C9D1D9",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
