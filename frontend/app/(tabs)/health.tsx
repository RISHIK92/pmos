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
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";

// Types
type Period = "Daily" | "Weekly" | "Monthly";

// Mock Data
const HEALTH_METRICS = [
  {
    id: "steps",
    label: "Steps",
    value: "8,432",
    subValue: "/ 10,000",
    icon: "figure.walk",
    color: "#000",
    bg: "transparent",
  },
  {
    id: "hr",
    label: "Heart Rate",
    value: "72",
    subValue: "bpm",
    icon: "heart.fill",
    color: "#000",
    bg: "transparent",
  },
  {
    id: "sleep",
    label: "Sleep",
    value: "7h 12m",
    subValue: "Avg",
    icon: "moon.fill",
    color: "#000",
    bg: "transparent",
  },
];

const ALL_METRICS_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  steps: {
    label: "Steps",
    icon: "figure.walk",
    color: "#000",
    bg: "transparent",
  },
  hr: {
    label: "Heart Rate",
    icon: "heart.fill",
    color: "#000",
    bg: "transparent",
  },
  sleep: {
    label: "Sleep",
    icon: "moon.fill",
    color: "#000",
    bg: "transparent",
  },
  activity: {
    label: "Activity",
    icon: "flame.fill",
    color: "#000",
    bg: "transparent",
  },
  hydration: {
    label: "Hydration",
    icon: "drop.fill",
    color: "#000",
    bg: "transparent",
  },
};

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
  activity: {
    Daily: {
      labels: ["6am", "12pm", "6pm", "10pm"],
      values: [0.2, 0.6, 0.8, 0.3],
    },
    Weekly: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      values: [0.4, 0.7, 0.5, 0.9, 0.8, 0.6, 0.5],
    },
    Monthly: {
      labels: ["W1", "W2", "W3", "W4"],
      values: [0.6, 0.75, 0.8, 0.7],
    },
  },
  hydration: {
    Daily: {
      labels: ["8am", "12", "4pm", "8pm"],
      values: [0.2, 0.5, 0.7, 0.9],
    },
    Weekly: {
      labels: ["M", "T", "W", "T", "F", "S", "S"],
      values: [0.8, 0.6, 0.9, 0.7, 0.85, 0.6, 0.7],
    },
    Monthly: {
      labels: ["W1", "W2", "W3", "W4"],
      values: [0.75, 0.8, 0.7, 0.85],
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
  const router = useRouter();
  const { toggleSidebar } = useContext(SidebarContext);
  const [waterCount, setWaterCount] = useState(4);
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
    if (metricId === "activity") return ["500", "400", "300", "200", "100"]; // Calories
    if (metricId === "hydration") return ["2.5L", "2L", "1.5L", "1L", "0.5L"];
    return ["100", "80", "60", "40", "20"];
  };

  const renderDetailModal = () => {
    if (!selectedStat) return null;
    const metric = ALL_METRICS_CONFIG[selectedStat];
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
                    size={24}
                    color={metric.color}
                  />
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hydration Tracker */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Hydration</Text>
            <TouchableOpacity
              onPress={() => openDetail("hydration")}
              style={styles.expandBtn}
            >
              <IconSymbol name="chevron.right" size={20} color="#B2BEC3" />
            </TouchableOpacity>
          </View>
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
                style={styles.waterBtn}
                onPress={() => setWaterCount(waterCount + 1)}
              >
                <IconSymbol name="plus" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nutrition Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Nutrition</Text>
            <TouchableOpacity
              onPress={() => router.push("/nutrition")}
              style={styles.expandBtn}
            >
              <IconSymbol name="chevron.right" size={20} color="#B2BEC3" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.nutritionCard}
            onPress={() => router.push("/nutrition")}
          >
            <View style={styles.nutritionInfo}>
              <View style={styles.nutritionRow}>
                <IconSymbol name="flame.fill" size={24} color="#FF7675" />
                <Text style={styles.nutritionValue}>1,350</Text>
                <Text style={styles.nutritionSub}>/ 2,000 kcal</Text>
              </View>
              <View style={styles.nutritionBarBg}>
                <View style={[styles.nutritionBarFill, { width: "67%" }]} />
              </View>
              <Text style={styles.nutritionFooter}>3 meals logged today</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Weekly Insights */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Activity Trend</Text>
            <TouchableOpacity
              onPress={() => openDetail("activity")}
              style={styles.expandBtn}
            >
              <IconSymbol name="chevron.right" size={20} color="#B2BEC3" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openDetail("activity")}
          >
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
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerRight: { flex: 1, alignItems: "flex-end" },
  menuButton: {
    padding: 8,
    paddingTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  pageIntro: {
    marginBottom: 40,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#B2BEC3",
    fontWeight: "500",
  },

  // Minimal Metrics
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 48,
  },
  metricCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    marginTop: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Sections
  sectionContainer: {
    marginBottom: 48,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  expandBtn: {
    padding: 4,
  },

  // Minimal Hydration
  hydrationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hydrationInfo: {
    gap: 4,
  },
  waterValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0984E3",
  },
  waterLabel: {
    fontSize: 13,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  waterBtn: {
    padding: 8,
  },
  dropletsObj: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
  },
  cupCount: {
    fontSize: 18,
    color: "#000",
    fontWeight: "700",
  },

  // Minimal Nutrition
  nutritionCard: {
    gap: 16,
  },
  nutritionInfo: {
    gap: 12, // Fixed: Added nutritionInfo style which was missing
  },
  nutritionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
  },
  nutritionSub: {
    fontSize: 14,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  nutritionBarBg: {
    height: 4,
    backgroundColor: "#F1F2F6",
    borderRadius: 2,
    width: "100%",
  },
  nutritionBarFill: {
    height: "100%",
    backgroundColor: "#000",
    borderRadius: 2,
  },
  nutritionFooter: {
    marginTop: 8,
    fontSize: 13,
    color: "#636E72",
    fontWeight: "500",
  },

  // Minimal Trends
  trendCard: {
    padding: 0,
  },
  graphContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    marginBottom: 16,
  },
  barGroup: {
    alignItems: "center",
    gap: 8,
    width: 20,
  },
  barObj: {
    width: 4, // Thinner bars
    borderRadius: 2,
    backgroundColor: "#000",
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DFE6E9",
  },
  trendSummary: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 48,
    minHeight: "50%",
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
    fontWeight: "700",
    color: "#000",
  },
  closeBtn: {
    backgroundColor: "#F5F6FA",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  periodSelector: {
    flexDirection: "row",
    marginBottom: 32,
    gap: 16,
    paddingLeft: 24,
  },
  periodTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  periodTabActive: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  periodTextActive: {
    color: "#FFF",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 32,
  },
  alertText: {
    flex: 1,
    color: "#D63031",
    fontSize: 14,
    fontWeight: "600",
  },
  chartWrapper: {
    marginTop: 10,
  },
  yAxisContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 20,
    justifyContent: "space-between",
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#B2BEC3",
  },
  chartContainer: {
    marginLeft: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 200,
    alignItems: "flex-end",
  },
  chartBarGroup: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  chartBarWrapper: {
    height: "100%",
    justifyContent: "flex-end",
    width: 6,
    backgroundColor: "#F5F6FA",
    borderRadius: 3,
  },
  chartBar: {
    width: "100%",
    borderRadius: 3,
  },
  chartLabel: {
    fontSize: 10,
    color: "#B2BEC3",
    fontWeight: "600",
  },
});
