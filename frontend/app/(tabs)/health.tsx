import React, { useContext, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
} from "react-native-reanimated";

// Types
type Period = "Daily" | "Weekly" | "Monthly";
type StatType = "steps" | "hr" | "sleep";

// Mock Data
const HEALTH_METRICS = [
  {
    id: "steps",
    label: "Steps",
    value: "8,432",
    subValue: "/ 10,000",
    icon: "figure.walk",
    color: "#0984E3",
    bg: "#E1F5FE",
  },
  {
    id: "hr",
    label: "Heart Rate",
    value: "72",
    subValue: "bpm",
    icon: "heart.fill",
    color: "#FF5252",
    bg: "#FFEBEE",
  },
  {
    id: "sleep",
    label: "Sleep",
    value: "7h 12m",
    subValue: "Avg",
    icon: "moon.fill",
    color: "#6C5CE7",
    bg: "#F1F2F6",
  },
];

const DETAIL_DATA: Record<
  string,
  Record<Period, { labels: string[]; values: number[]; alert?: string }>
> = {
  steps: {
    Daily: {
      labels: ["9am", "12", "3pm", "6pm", "9pm"],
      values: [0.3, 0.8, 0.5, 0.9, 0.2],
    },
    Weekly: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      values: [0.6, 0.8, 0.5, 0.7, 0.8, 0.4, 0.7],
    },
    Monthly: {
      labels: ["W1", "W2", "W3", "W4"],
      values: [0.7, 0.8, 0.6, 0.9],
    },
  },
  hr: {
    Daily: {
      labels: ["10am", "12", "2pm", "4pm", "6pm"],
      values: [0.4, 0.45, 0.95, 0.42, 0.4],
      alert: "High heart rate (110 bpm) detected at 2pm during inactivity.",
    },
    Weekly: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      values: [0.5, 0.6, 0.55, 0.5, 0.6, 0.55, 0.5],
    },
    Monthly: {
      labels: ["W1", "W2", "W3", "W4"],
      values: [0.55, 0.52, 0.58, 0.54],
    },
  },
  sleep: {
    Daily: {
      labels: ["Deep", "Core", "REM"],
      values: [0.3, 0.5, 0.2], // Proportions
    },
    Weekly: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      values: [0.8, 0.9, 0.6, 0.95, 1.0, 0.7, 0.5],
    },
    Monthly: {
      labels: ["W1", "W2", "W3", "W4"],
      values: [0.85, 0.9, 0.8, 0.85],
    },
  },
};

const WEEKLY_TRENDS = [
  { day: "M", val: 0.8 },
  { day: "T", val: 0.6 },
  { day: "W", val: 0.9 },
  { day: "T", val: 0.7 },
  { day: "F", val: 0.85 },
  { day: "S", val: 0.5 },
  { day: "S", val: 0.7 },
];

export default function HealthScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [waterCount, setWaterCount] = useState(4);
  const [inputText, setInputText] = useState("");
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("Daily");

  const openDetail = (id: string) => {
    setSelectedStat(id);
    setPeriod("Daily");
  };
  const closeDetail = () => setSelectedStat(null);

  const getYAxisLabels = (metricId: string) => {
    if (metricId === "steps") return ["10k", "8k", "6k", "4k", "2k"];
    if (metricId === "hr") return ["150", "120", "90", "60", "40"];
    if (metricId === "sleep") return ["10h", "8h", "6h", "4h", "2h"];
    return ["100", "80", "60", "40", "20"];
  };

  const renderDetailModal = () => {
    if (!selectedStat) return null;
    const metric = HEALTH_METRICS.find((m) => m.id === selectedStat);
    if (!metric) return null;
    const data = DETAIL_DATA[selectedStat][period];
    const yLabels = getYAxisLabels(selectedStat);

    return (
      <Modal animationType="slide" transparent={true} visible={!!selectedStat}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View
                  style={[styles.iconCircle, { backgroundColor: metric.bg }]}
                >
                  <IconSymbol
                    name={metric.icon as any}
                    size={20}
                    color={metric.color}
                  />
                </View>
                <Text style={styles.modalTitle}>{metric.label}</Text>
              </View>
              <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                <IconSymbol
                  name="plus"
                  size={24}
                  color="#1A1A1A"
                  style={{ transform: [{ rotate: "45deg" }] }}
                />
              </TouchableOpacity>
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {(["Daily", "Weekly", "Monthly"] as Period[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodTab,
                    period === p && styles.periodTabActive,
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === p && styles.periodTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Alert Box - Only for HR Critical or specific custom alerts */}
            {data.alert && (
              <Animated.View
                entering={FadeInUp.springify()}
                style={styles.alertBox}
              >
                <IconSymbol name="alarm.fill" size={20} color="#D63031" />
                <Text style={styles.alertText}>{data.alert}</Text>
              </Animated.View>
            )}

            {/* Chart Wrapper */}
            <View style={styles.chartWrapper}>
              {/* Y Axis */}
              <View style={styles.yAxisContainer}>
                {yLabels.map((label, i) => (
                  <Text key={i} style={styles.yAxisLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              {/* Chart Bars */}
              <View style={styles.chartContainer}>
                {data.values.map((val, idx) => (
                  <View key={idx} style={styles.chartBarGroup}>
                    <View style={styles.chartBarWrapper}>
                      <Animated.View
                        entering={FadeInDown.delay(idx * 50).springify()}
                        style={[
                          styles.chartBar,
                          {
                            height: `${val * 100}%`,
                            backgroundColor: metric.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{data.labels[idx]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderDetailModal()}

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#2D3436" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Health</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.menuButton}>
              <IconSymbol name="plus" size={20} color="#2D3436" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>Daily Vitals</Text>
          <Text style={styles.pageSubtitle}>You're doing great today.</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {HEALTH_METRICS.map((metric, index) => (
            <TouchableOpacity
              key={metric.id}
              onPress={() => openDetail(metric.id)}
              activeOpacity={0.7}
              style={{ flex: 1 }}
            >
              <Animated.View
                entering={FadeInUp.delay(index * 100).springify()}
                style={styles.metricCard}
              >
                <View
                  style={[styles.iconCircle, { backgroundColor: metric.bg }]}
                >
                  <IconSymbol
                    name={metric.icon as any}
                    size={18}
                    color={metric.color}
                  />
                </View>
                <View>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hydration Tracker */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hydration</Text>
          <View style={styles.hydrationCard}>
            <View style={styles.hydrationInfo}>
              <Text style={styles.waterValue}>{waterCount * 250}ml</Text>
              <Text style={styles.waterLabel}>Daily Goal: 2000ml</Text>
            </View>
            <View style={styles.waterControls}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setWaterCount(Math.max(0, waterCount - 1))}
              >
                <IconSymbol name="minus" size={20} color="#636E72" />
              </TouchableOpacity>
              <View style={styles.dropletsObj}>
                <IconSymbol name="drop.fill" size={24} color="#0984E3" />
                <Text style={styles.cupCount}>{waterCount}</Text>
              </View>
              <TouchableOpacity
                style={[styles.waterBtn, styles.waterBtnAdd]}
                onPress={() => setWaterCount(waterCount + 1)}
              >
                <IconSymbol name="plus" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weekly Insights */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Activity Trend</Text>
          <View style={styles.trendCard}>
            <View style={styles.graphContainer}>
              {WEEKLY_TRENDS.map((day, index) => (
                <View key={index} style={styles.barGroup}>
                  <View style={[styles.barObj, { height: 100 * day.val }]} />
                  <Text style={styles.dayLabel}>{day.day}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.trendSummary}>
              You've been{" "}
              <Text style={{ fontWeight: "700", color: "#00B894" }}>12%</Text>{" "}
              more active this week.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* AI Health Assistant Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputOuterContainer}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <IconSymbol
              name="sparkles"
              size={20}
              color="#6C5CE7"
              style={{ marginLeft: 4 }}
            />
            <TextInput
              style={styles.input}
              placeholder="Log a meal or ask AI..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              selectionColor="#6C5CE7"
            />
            <TouchableOpacity style={styles.micBtn}>
              <IconSymbol name="mic.fill" size={18} color="#636E72" />
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  pageIntro: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 8,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 40,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    gap: 12,
    minHeight: 120, // Ensure tap target is big enough
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 16,
  },
  hydrationCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hydrationInfo: {
    gap: 4,
  },
  waterValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0984E3",
  },
  waterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  waterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  waterBtnAdd: {
    backgroundColor: "#0984E3",
    borderColor: "#0984E3",
  },
  dropletsObj: {
    alignItems: "center",
  },
  cupCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0984E3",
    marginTop: -2,
  },
  trendCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 0,
  },
  graphContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginBottom: 16,
  },
  barGroup: {
    alignItems: "center",
    gap: 8,
  },
  barObj: {
    width: 8,
    borderRadius: 4,
    backgroundColor: "#00B894",
    opacity: 0.8,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  trendSummary: {
    fontSize: 14,
    color: "#636E72",
    textAlign: "center",
    fontStyle: "italic",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    minHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2D3436",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F6FA",
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 14,
  },
  periodTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  periodTextActive: {
    color: "#2D3436",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 44,
  },
  alertText: {
    flex: 1,
    color: "#D63031",
    fontSize: 14,
    fontWeight: "600",
  },
  chartWrapper: {
    flexDirection: "row",
    height: 220,
    alignItems: "flex-end",
  },
  yAxisContainer: {
    justifyContent: "space-between",
    height: 200, // Match chart bar height max + some padding if needed
    paddingBottom: 24, // Align bottom label with bottom of chart axis
    paddingRight: 12,
    marginRight: 4,
  },
  yAxisLabel: {
    fontSize: 11,
    color: "#B2BEC3",
    fontWeight: "600",
    textAlign: "right",
  },
  chartContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 220,
  },
  chartBarGroup: {
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  chartBarWrapper: {
    width: 16,
    height: 200,
    backgroundColor: "transparent", // Remove background to let bars float or keep if guided
    justifyContent: "flex-end",
    overflow: "visible", // Changed to visible for better shadow? No, hidden for bar rounding.
  },
  chartBar: {
    width: "100%",
    borderRadius: 8,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B2BEC3",
  },

  // Input
  inputOuterContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 32,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3436",
    fontWeight: "500",
  },
  micBtn: {
    padding: 4,
  },
});
