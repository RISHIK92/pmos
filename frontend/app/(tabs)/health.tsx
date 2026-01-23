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
import { HealthManager } from "@/utils/HealthManager";
import { SleepManager } from "@/utils/SleepManager"; // Import SleepManager
import DateTimePicker from "@react-native-community/datetimepicker"; // Import DatePicker

// Helper to format date as YYYY-MM-DD using local time
const formatLocalYYYYMMDD = (date?: Date) => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Types
type Period = "Daily" | "Weekly" | "Monthly";

const HEALTH_METRICS_INITIAL = [
  {
    id: "steps",
    label: "Steps",
    value: "0",
    subValue: "/ 10,000",
    icon: "figure.walk",
    color: "#000",
    bg: "transparent",
  },
  {
    id: "sleep",
    label: "Sleep",
    value: "0h 0m",
    subValue: "/ 8h",
    icon: "moon.fill",
    color: "#000",
    bg: "transparent",
  },
  {
    id: "hydration",
    label: "Hydration",
    value: "0ml",
    subValue: "/ 2000ml",
    icon: "drop.fill",
    color: "#000",
    bg: "transparent",
  },
  {
    id: "calories",
    label: "Calories",
    value: "0",
    subValue: "/ 2000 kcal",
    icon: "flame.fill",
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
  sleep: {
    label: "Sleep",
    icon: "moon.fill",
    color: "#000",
    bg: "transparent",
  },
  hydration: {
    label: "Hydration",
    icon: "drop.fill",
    color: "#0984E3",
    bg: "transparent",
  },
  calories: {
    label: "Calories",
    icon: "flame.fill",
    color: "#D35400",
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
  const router = useRouter();
  const { toggleSidebar } = useContext(SidebarContext);
  const [period, setPeriod] = useState<Period>("Daily");
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  // Period Tracking State
  const [waterCount, setWaterCount] = useState(4);
  const [steps, setSteps] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [periodData, setPeriodData] = useState<any>(null);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodDate, setPeriodDate] = useState(new Date());

  const [chartData, setChartData] = useState<{
    labels: string[];
    values: number[];
  }>({ labels: [], values: [] });

  // Sleep State
  const [sleepDate, setSleepDate] = useState(new Date());
  const [sleepLogs, setSleepLogs] = useState<any[]>([]);

  // Hydration State
  const [hydrationDate, setHydrationDate] = useState(new Date());
  const [hydrationHistory, setHydrationHistory] = useState<any[]>([]);
  const [selectedDayHydration, setSelectedDayHydration] = useState(0);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [metrics, setMetrics] = useState(HEALTH_METRICS_INITIAL);

  const fetchDashboard = async () => {
    const today = formatLocalYYYYMMDD(new Date());
    const basicGoals = await HealthManager.getDashboardData(today);

    if (basicGoals && basicGoals.length > 0) {
      const newMetrics = [...HEALTH_METRICS_INITIAL];

      basicGoals.forEach((goal: any) => {
        const currentVal = goal.current || 0;

        if (goal.title === "Daily Steps") {
          const idx = newMetrics.findIndex((m) => m.id === "steps");
          if (idx !== -1) {
            newMetrics[idx].value = currentVal.toString();
            newMetrics[idx].subValue = `/ ${goal.target}`;
          }
        } else if (goal.title === "Sleep") {
          const idx = newMetrics.findIndex((m) => m.id === "sleep");
          if (idx !== -1) {
            const hours = Math.floor(currentVal / 60);
            const mins = currentVal % 60;
            newMetrics[idx].value = `${hours}h ${mins}m`;
            newMetrics[idx].subValue = `/ ${Math.floor(goal.target / 60)}h`;
          }
        } else if (goal.title === "Hydration") {
          const idx = newMetrics.findIndex((m) => m.id === "hydration");
          if (idx !== -1) {
            newMetrics[idx].value = `${currentVal}`;
            newMetrics[idx].subValue = `/ ${goal.target}ml`;

            // Update local waterCount for the tracker UI
            setWaterCount(currentVal / 250);
          }
        } else if (goal.title === "Calories") {
          const idx = newMetrics.findIndex((m) => m.id === "calories");
          if (idx !== -1) {
            newMetrics[idx].value = `${currentVal}`;
            newMetrics[idx].subValue = `/ ${goal.target} kcal`;
          }
        }
      });

      setMetrics(newMetrics);
    }
  };

  // Fetch Sleep Data when selectedStat is 'sleep' and date changes
  React.useEffect(() => {
    if (selectedStat === "sleep") {
      fetchSleepData(sleepDate);
    }
  }, [selectedStat, sleepDate]);

  const fetchSleepData = async (date: Date) => {
    const dateStr = formatLocalYYYYMMDD(date);
    const logs = await SleepManager.getDailySleep(dateStr);
    setSleepLogs(logs);
  };

  const fetchHydrationHistory = async (date: Date) => {
    // Fetch 7 days leading up to date + the date itself? Or surrounding?
    // User requested "past 7 day trend".
    const end = new Date(date);
    const start = new Date(date);
    start.setDate(start.getDate() - 6); // 7 days total

    const history = await HealthManager.getHistory(
      formatLocalYYYYMMDD(start),
      formatLocalYYYYMMDD(end),
    );
    setHydrationHistory(history);

    // Find selected day in history or fetch specific if missing?
    // API returns what exists.
    const dateStr = formatLocalYYYYMMDD(date);
    const log = history.find((h: any) => h.date.startsWith(dateStr));
    setSelectedDayHydration(log?.waterIntake || 0);
  };

  React.useEffect(() => {
    if (selectedStat === "hydration") {
      fetchHydrationHistory(hydrationDate);
    }
  }, [selectedStat, hydrationDate]);

  const fetchPeriodData = async () => {
    const data = await HealthManager.getPeriodData();
    if (data) {
      setGender(data.gender);
      setPeriodData(data);
    }
  };

  React.useEffect(() => {
    fetchPeriodData();
  }, []);

  const handleUpdateGender = async (selected: string) => {
    const success = await HealthManager.updateGender(selected);
    if (success) {
      setGender(selected);
      setShowGenderModal(false);
      fetchPeriodData();
    }
  };

  const handleLogPeriod = async () => {
    const dateStr = formatLocalYYYYMMDD(periodDate);
    const success = await HealthManager.logPeriod(dateStr);
    if (success) {
      setShowPeriodModal(false);
      fetchPeriodData();
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (selectedStat === "sleep") {
        setSleepDate(selectedDate);
      } else if (selectedStat === "hydration") {
        setHydrationDate(selectedDate);
      }
    }
  };

  const changeDate = (days: number) => {
    if (selectedStat === "sleep") {
      const newDate = new Date(sleepDate);
      newDate.setDate(newDate.getDate() + days);
      setSleepDate(newDate);
    } else if (selectedStat === "hydration") {
      const newDate = new Date(hydrationDate);
      newDate.setDate(newDate.getDate() + days);
      setHydrationDate(newDate);
    }
  };

  React.useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedStat) return;

      let labels: string[] = [];
      let values: number[] = [];

      if (period === "Daily") {
        if (selectedStat === "steps") {
          const hourlyLog = await HealthManager.getHourlyLog();
          const timeSlots = ["6am", "9am", "12pm", "3pm", "6pm", "9pm"];
          labels = timeSlots;

          // Map existing keys to values, normalize
          const keys = Object.keys(hourlyLog).sort();
          if (keys.length > 0) {
            // Simplified visualization for daily steps
            // Just show representative points if available, else placeholder logic was existing
            // Let's use the logic that was there but cleaner
            labels = keys.filter((_, i) => i % 2 === 0);
            const rawVals = keys.map((k) => hourlyLog[k]);
            const max = Math.max(...rawVals, 1000);
            values = keys
              .map((k) => hourlyLog[k] / max)
              .filter((_, i) => i % 2 === 0);
          } else {
            // Fallback if no hourly log
            values = timeSlots.map(() => 0);
          }
        }
        // Daily charts for others (Sleep/Hydration) not supported yet (no hourly data)
      } else if (period === "Weekly" || period === "Monthly") {
        const end = new Date();
        const start = new Date();
        const days = period === "Weekly" ? 7 : 30;
        start.setDate(end.getDate() - days + 1);

        const history = await HealthManager.getHistory(
          formatLocalYYYYMMDD(start),
          formatLocalYYYYMMDD(end),
        );

        // Map field based on stat
        const getValue = (h: any) => {
          if (selectedStat === "steps") return Number(h.steps || 0);
          if (selectedStat === "sleep") return Number(h.sleepDuration || 0);
          if (selectedStat === "hydration") return Number(h.waterIntake || 0);
          if (selectedStat === "calories") return Number(h.calories || 0);
          return 0;
        };

        const getTarget = () => {
          if (selectedStat === "steps") return 10000;
          if (selectedStat === "sleep") return 480; // 8h
          if (selectedStat === "hydration") return 2000;
          if (selectedStat === "calories") return 2000;
          return 100;
        };

        // Zero-fill logic
        const dateMap = new Map<string, number>(
          history.map((h: any) => [h.date.split("T")[0], getValue(h)]),
        );

        const filledData: {
          date: string;
          val: number;
          day: number;
        }[] = [];

        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dateStr = formatLocalYYYYMMDD(d);
          const val = dateMap.get(dateStr) || 0;

          filledData.push({
            date: dateStr,
            val,
            day: d.getDay(),
          });
        }

        if (period === "Weekly") {
          labels = filledData.map(
            (d) => ["S", "M", "T", "W", "T", "F", "S"][d.day],
          );
          const rawVals = filledData.map((d) => d.val);
          const max = Math.max(...rawVals, getTarget());
          values = rawVals.map((v) => v / max);
        } else {
          // Monthly: Aggregate into 4 weeks
          const weeklyBuckets = [0, 0, 0, 0];
          const weeklyLabels = ["W1", "W2", "W3", "W4"];

          filledData.forEach((d, index) => {
            const bucketIndex = Math.min(Math.floor(index / 7), 3);
            weeklyBuckets[bucketIndex] += d.val;
          });

          // Average per day for that week
          const averagedBuckets = weeklyBuckets.map((total, idx) => {
            const count = idx === 3 ? days - 21 : 7;
            return total / count;
          });

          labels = weeklyLabels;
          const max = Math.max(...averagedBuckets, getTarget());
          values = averagedBuckets.map((v) => v / max);
        }
      }

      if (labels.length > 0) {
        setChartData({ labels, values });
      } else {
        setChartData({ labels: [], values: [] });
      }
    };

    fetchChartData();
  }, [selectedStat, period]);

  React.useEffect(() => {
    let interval: any;

    const startTracking = async () => {
      const initialized = await HealthManager.init();
      if (initialized) {
        // Fetch Steps
        const count = await HealthManager.getDailySteps();
        setSteps(count);

        // Fetch Hydration
        const today = formatLocalYYYYMMDD(new Date());
        const history = await HealthManager.getHistory(today, today);
        if (history && history.length > 0) {
          const log = history[0];
          if (log.waterIntake) {
            setWaterCount(Math.floor(log.waterIntake / 250));
          }
        }

        // Poll every 5 seconds for updates
        interval = setInterval(async () => {
          const newCount = await HealthManager.getDailySteps();
          setSteps(newCount);
        }, 5000);
      }
    };

    startTracking();
    fetchDashboard();

    return () => {
      if (interval) clearInterval(interval);
      HealthManager.stop();
    };
  }, []);

  const updateWaterCount = (newCount: number) => {
    const count = Math.max(0, newCount);
    setWaterCount(count);
    // Debounce or just fire? Fire for now.
    HealthManager.updateHydration(count * 250);
  };

  const openDetail = (id: string) => {
    setSelectedStat(id);
    setPeriod("Daily");
    // Refresh hydration if opened
    if (id === "hydration") {
      fetchHydrationHistory(hydrationDate);
    }
  };
  const closeDetail = () => setSelectedStat(null);

  const getYAxisLabels = (metricId: string) => {
    if (metricId === "steps") return ["10k", "8k", "6k", "4k", "2k"];
    if (metricId === "sleep") return ["10h", "8h", "6h", "4h", "2h"];
    if (metricId === "activity") return ["500", "400", "300", "200", "100"]; // Calories
    if (metricId === "hydration") return ["2.5L", "2L", "1.5L", "1L", "0.5L"];
    return ["100", "80", "60", "40", "20"];
  };

  const renderDetailModal = () => {
    if (!selectedStat) return null;
    const metric = ALL_METRICS_CONFIG[selectedStat];
    if (!metric) return null;

    // Use real data for steps, mock for others
    const data =
      selectedStat === "steps" && chartData.labels.length > 0
        ? {
            ...DETAIL_DATA[selectedStat][period],
            labels: chartData.labels,
            values: chartData.values,
          }
        : DETAIL_DATA[selectedStat][period];

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

  const renderSleepDetail = () => {
    if (selectedStat !== "sleep") return null;

    // Calculate total duration from logs
    // Logs are in DESC order, usually.
    // Display each session? Or summary?
    // Let's display timeline cards.

    return (
      <Modal animationType="slide" transparent={true} visible={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: ALL_METRICS_CONFIG.sleep.bg },
                  ]}
                >
                  <IconSymbol
                    name="moon.fill"
                    size={20}
                    color={ALL_METRICS_CONFIG.sleep.color}
                  />
                </View>
                <Text style={styles.modalTitle}>Sleep</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 12, paddingTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.closeBtn}
                >
                  <IconSymbol name="calendar" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                  <IconSymbol
                    name="plus"
                    size={24}
                    color="#1A1A1A"
                    style={{ transform: [{ rotate: "45deg" }] }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Strip / Carousel Effect */}
            <View style={styles.dateStripContainer}>
              <TouchableOpacity
                onPress={() => changeDate(-1)}
                style={styles.dateNavBtn}
              >
                <View style={[styles.miniDayCard, { opacity: 0.5 }]}>
                  <Text style={styles.miniDayText}>
                    {new Date(sleepDate.getTime() - 86400000).getDate()}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Animated.View
                  entering={FadeInUp.springify()}
                  style={styles.selectedDayCard}
                >
                  <Text style={styles.selectedDayText}>
                    {sleepDate.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => changeDate(1)}
                style={styles.dateNavBtn}
              >
                <View style={[styles.miniDayCard, { opacity: 0.5 }]}>
                  <Text style={styles.miniDayText}>
                    {new Date(sleepDate.getTime() + 86400000).getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={sleepDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Sleep Timeline */}
            <ScrollView
              style={{ marginTop: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {sleepLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No sleep data recorded.</Text>
                </View>
              ) : (
                sleepLogs.map((log, index) => {
                  const start = new Date(log.startTime); // UTC -> Local
                  const end = log.endTime ? new Date(log.endTime) : null;

                  return (
                    <Animated.View
                      key={log.id}
                      entering={FadeInDown.delay(index * 100).springify()}
                      style={styles.sleepSessionCard}
                    >
                      <View style={styles.timelineLine} />

                      {/* Bed Time */}
                      <View style={styles.timeRow}>
                        <IconSymbol
                          name="bed.double.fill"
                          size={18}
                          color="#B2BEC3"
                        />
                        <View>
                          <Text style={styles.timeLabel}>Bedtime</Text>
                          <Text style={styles.timeValue}>
                            {start.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>

                      {/* Duration Bar */}
                      <View style={styles.durationContainer}>
                        <View style={styles.durationLine} />
                        <Text style={styles.durationText}>
                          {log.duration
                            ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m`
                            : "Sleeping..."}
                        </Text>
                      </View>

                      {/* Wake Time */}
                      <View style={styles.timeRow}>
                        <IconSymbol
                          name="sun.max.fill"
                          size={18}
                          color="#FDCB6E"
                        />
                        <View>
                          <Text style={styles.timeLabel}>Woke Up</Text>
                          <Text style={styles.timeValue}>
                            {end
                              ? end.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Now"}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHydrationDetail = () => {
    if (selectedStat !== "hydration") return null;

    // Config
    // We can find the current metric to get the real target
    // The metric in 'metrics' state has 'subValue' like '/ ml'
    const liveMetric = metrics.find((m) => m.id === "hydration");
    const metric = liveMetric || ALL_METRICS_CONFIG.hydration;

    // Parse target from subValue if possible, e.g. "/ 2500ml" -> 2500
    let targetInt = 2000;
    if (liveMetric && liveMetric.subValue) {
      const match = liveMetric.subValue.match(/(\d+)/);
      if (match) targetInt = parseInt(match[0], 10);
    }

    return (
      <Modal animationType="slide" transparent={true} visible={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
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
              <View style={{ flexDirection: "row", gap: 12, paddingTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.closeBtn}
                >
                  <IconSymbol name="calendar" size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                  <IconSymbol
                    name="plus"
                    size={24}
                    color="#1A1A1A"
                    style={{ transform: [{ rotate: "45deg" }] }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Strip */}
            <View style={styles.dateStripContainer}>
              <TouchableOpacity
                onPress={() => changeDate(-1)}
                style={styles.dateNavBtn}
              >
                <View style={[styles.miniDayCard, { opacity: 0.5 }]}>
                  <Text style={styles.miniDayText}>
                    {new Date(hydrationDate.getTime() - 86400000).getDate()}
                  </Text>
                </View>
              </TouchableOpacity>

              <Animated.View
                entering={FadeInUp.springify()}
                style={styles.selectedDayCard}
              >
                <Text style={styles.selectedDayText}>
                  {hydrationDate.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </Animated.View>

              <TouchableOpacity
                onPress={() => changeDate(1)}
                style={styles.dateNavBtn}
              >
                <View style={[styles.miniDayCard, { opacity: 0.5 }]}>
                  <Text style={styles.miniDayText}>
                    {new Date(hydrationDate.getTime() + 86400000).getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={hydrationDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Main Hydration Display */}
            <View style={{ alignItems: "center", marginVertical: 24 }}>
              <Text
                style={{ fontSize: 48, fontWeight: "800", color: "#0984E3" }}
              >
                {selectedDayHydration}
                <Text style={{ fontSize: 24, color: "#B2BEC3" }}>ml</Text>
              </Text>
              <Text
                style={{ fontSize: 16, color: "#B2BEC3", fontWeight: "500" }}
              >
                Daily Goal:{" "}
                {liveMetric && liveMetric.subValue
                  ? liveMetric.subValue.replace("/", "").trim()
                  : "2000ml"}
              </Text>
            </View>

            {/* Trend Graph */}
            <View style={{ marginTop: 10 }}>
              <Text
                style={{ fontSize: 18, fontWeight: "600", marginBottom: 40 }}
              >
                Last 7 Days
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  height: 120,
                }}
              >
                {hydrationHistory.map((log, index) => {
                  const height = Math.min(
                    (log.waterIntake / targetInt) * 100,
                    100,
                  );
                  const isToday = log.date.startsWith(
                    formatLocalYYYYMMDD(hydrationDate),
                  );

                  return (
                    <View
                      key={index}
                      style={{ alignItems: "center", gap: 8, width: 30 }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: "100%",
                          backgroundColor: "#F0F2F5",
                          borderRadius: 4,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Animated.View
                          entering={FadeInDown.delay(index * 50).springify()}
                          style={{
                            width: "100%",
                            height: `${height}%`,
                            backgroundColor: isToday ? "#0984E3" : "#74B9FF",
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      <Text style={{ fontSize: 12, color: "#B2BEC3" }}>
                        {new Date(log.date).getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const [showPeriodHistory, setShowPeriodHistory] = useState(false);

  const renderPeriodHistoryModal = () => (
    <Modal
      visible={showPeriodHistory}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPeriodHistory(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cycle History</Text>
            <TouchableOpacity onPress={() => setShowPeriodHistory(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>

          {periodData?.history && periodData.history.length > 0 ? (
            <ScrollView style={{ maxHeight: 300 }}>
              {periodData.history.map((cycle: any, idx: number) => {
                const startDate = new Date(cycle.startDate);
                const daysAgo = Math.floor(
                  (new Date().getTime() - startDate.getTime()) /
                    (1000 * 3600 * 24),
                );
                return (
                  <View
                    key={cycle.id || idx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth:
                        idx < periodData.history.length - 1 ? 1 : 0,
                      borderBottomColor: "#F0F0F0",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#FF69B4",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#000",
                        }}
                      >
                        {cycle.startDate}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: "#999" }}>
                      {daysAgo} days ago
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={{ textAlign: "center", color: "#999", marginTop: 20 }}>
              No cycle history yet
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderPeriodSection = () => {
    if (gender !== "female") return null;

    const lastPeriod = periodData?.lastPeriodDate;
    const nextPeriod = periodData?.nextPeriodDate;
    const daysLate = periodData?.daysLate || 0;
    const isLate = periodData?.isLate;

    // Calculate days ago
    let daysAgo = 0;
    if (lastPeriod) {
      const lp = new Date(lastPeriod);
      const today = new Date();
      const diff = today.getTime() - lp.getTime();
      daysAgo = Math.floor(diff / (1000 * 3600 * 24));
    }

    return (
      <>
        {/* History Button */}
        <TouchableOpacity
          onPress={() => setShowPeriodHistory(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            marginBottom: 8,
            gap: 6,
          }}
        >
          <IconSymbol name="calendar" size={16} color="#FF69B4" />
          <Text style={{ fontSize: 13, color: "#FF69B4", fontWeight: "500" }}>
            View History
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.chartCard,
            { marginTop: 2, borderColor: "#FFC0CB", borderWidth: 1 },
          ]}
        >
          <View style={[styles.chartHeader, { marginBottom: 15 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#FFF0F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="heart.fill" size={18} color="#FF69B4" />
              </View>
              <Text style={styles.chartTitle}>Cycle Tracking</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowPeriodModal(true)}
              style={{
                backgroundColor: "#FF69B4",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 15,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Log Period
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: "#666" }}>Last Period</Text>
              {lastPeriod ? (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#000",
                    marginTop: 4,
                  }}
                >
                  {lastPeriod}{" "}
                  <Text
                    style={{ fontSize: 12, color: "#999", fontWeight: "400" }}
                  >
                    {" "}
                    ({daysAgo} days ago)
                  </Text>
                </Text>
              ) : (
                <Text style={{ fontSize: 14, color: "#999", marginTop: 4 }}>
                  No data yet
                </Text>
              )}
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
                Next Expected
              </Text>
              {nextPeriod ? (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#000",
                    marginTop: 4,
                    textAlign: "right",
                  }}
                >
                  {nextPeriod}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#999",
                    marginTop: 4,
                    textAlign: "right",
                  }}
                >
                  -
                </Text>
              )}
            </View>
          </View>

          {isLate && (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: "#FFF0F5",
                borderRadius: 10,
                borderLeftWidth: 3,
                borderLeftColor: "#FF1493",
              }}
            >
              <Text
                style={{ color: "#C71585", fontWeight: "600", fontSize: 13 }}
              >
                {daysAgo > 40
                  ? "Cycle might be missed"
                  : "Period is likely late"}
              </Text>
              <Text style={{ color: "#C71585", fontSize: 12, marginTop: 2 }}>
                {daysAgo > 40
                  ? `It's been ${daysAgo} days since your last period. Have you missed it?`
                  : `You are ${daysLate} days past your expected date.`}
              </Text>
            </View>
          )}
        </View>
        {renderPeriodHistoryModal()}
      </>
    );
  };

  const [showPeriodDatePicker, setShowPeriodDatePicker] = useState(false);

  const renderPeriodModal = () => (
    <Modal
      visible={showPeriodModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPeriodModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Period Start</Text>
            <TouchableOpacity onPress={() => setShowPeriodModal(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
            Select the date your period started:
          </Text>

          {/* Date Selection Button */}
          <TouchableOpacity
            onPress={() => setShowPeriodDatePicker(true)}
            style={{
              backgroundColor: "#F8F9FA",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#000" }}>
              {formatLocalYYYYMMDD(periodDate)}
            </Text>
            <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              Tap to change
            </Text>
          </TouchableOpacity>

          {showPeriodDatePicker && (
            <DateTimePicker
              value={periodDate}
              mode="date"
              display={Platform.OS === "android" ? "default" : "spinner"}
              onChange={(e, d) => {
                // Always dismiss on Android (both OK and Cancel trigger this)
                if (Platform.OS === "android") {
                  setShowPeriodDatePicker(false);
                }
                // Only update date if user selected one (not cancelled)
                if (d) setPeriodDate(d);
              }}
              maximumDate={new Date()}
            />
          )}

          <TouchableOpacity
            onPress={handleLogPeriod}
            style={[
              styles.actionButton,
              { backgroundColor: "#FF69B4", marginTop: 20 },
            ]}
          >
            <Text style={styles.actionButtonText}>Save Log</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderGenderModal = () => (
    <Modal
      visible={showGenderModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowGenderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: "100%" }]}>
          <Text style={[styles.modalTitle, { textAlign: "center" }]}>
            Health Profile
          </Text>
          <Text
            style={{ textAlign: "center", color: "#666", marginBottom: 20 }}
          >
            To enable cycle tracking, please confirm your gender. This is
            private and only used for health features.
          </Text>

          <TouchableOpacity
            onPress={() => handleUpdateGender("female")}
            style={[
              styles.actionButton,
              { backgroundColor: "#FF69B4", marginBottom: 10 },
            ]}
          >
            <Text style={styles.actionButtonText}>Female</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleUpdateGender("male")}
            style={[styles.actionButton, { backgroundColor: "#444" }]}
          >
            <Text style={styles.actionButtonText}>Male</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Conditional Detail Modals */}
      {selectedStat === "sleep" && renderSleepDetail()}
      {selectedStat === "hydration" && renderHydrationDetail()}
      {selectedStat &&
        selectedStat !== "sleep" &&
        selectedStat !== "hydration" &&
        renderDetailModal()}

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#2D3436" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setShowGenderModal(true)}
              style={styles.menuButton}
            >
              <IconSymbol
                name="person.crop.circle"
                size={24}
                color={gender === "female" ? "#FF69B4" : "#2D3436"}
              />
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
          {metrics
            .filter((metric) => metric.id === "steps" || metric.id === "sleep")
            .map((metric, index) => (
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
                    <Text style={styles.metricValue}>
                      {metric.id === "steps"
                        ? steps.toLocaleString()
                        : metric.value}
                    </Text>
                    <Text style={styles.metricSubValue}>{metric.subValue}</Text>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            ))}
        </View>

        {renderPeriodSection()}

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
              <Text style={styles.waterLabel}>
                Daily Goal:{" "}
                {metrics
                  .find((m) => m.id === "hydration")
                  ?.subValue?.replace("/", "")
                  .trim() || "2000ml"}
              </Text>
            </View>
            <View style={styles.waterControls}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => updateWaterCount(waterCount - 1)}
              >
                <IconSymbol name="minus" size={20} color="#636E72" />
              </TouchableOpacity>
              <View style={styles.dropletsObj}>
                <IconSymbol name="drop.fill" size={24} color="#0984E3" />
                <Text style={styles.cupCount}>{waterCount}</Text>
              </View>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => updateWaterCount(waterCount + 1)}
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
                <Text style={styles.nutritionValue}>
                  {(() => {
                    const cVal =
                      metrics.find((m) => m.id === "calories")?.value || "0";
                    return Number(cVal).toLocaleString();
                  })()}
                </Text>
                <Text style={styles.nutritionSub}>
                  {metrics.find((m) => m.id === "calories")?.subValue ||
                    "/ 2,000 kcal"}
                </Text>
              </View>
              <View style={styles.nutritionBarBg}>
                <View
                  style={[
                    styles.nutritionBarFill,
                    {
                      width: (() => {
                        const m = metrics.find((x) => x.id === "calories");
                        const val = parseFloat(m?.value || "0");
                        let target = 2000;
                        if (m?.subValue) {
                          const match = m.subValue.match(/(\d+)/);
                          if (match) target = parseInt(match[0], 10);
                        }
                        const pct = Math.min((val / target) * 100, 100);
                        return `${pct}%`;
                      })(),
                    },
                  ]}
                />
              </View>
              <Text style={styles.nutritionFooter}>Keep it up!</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderGenderModal()}
      {renderPeriodModal()}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  metricSubValue: {
    fontSize: 14,
    fontWeight: "600",
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
    padding: 8,
  },

  // Date Strip
  dateStripContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
  },
  dateNavBtn: {
    padding: 10,
  },
  miniDayCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.9 }],
  },
  miniDayText: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "600",
  },
  selectedDayCard: {
    backgroundColor: "#2D3436",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDayText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  // Sleep Session
  sleepSessionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    gap: 24,
    marginHorizontal: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#B2BEC3",
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: "#B2BEC3",
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 9, // Align with icons
    height: 40,
  },
  durationLine: {
    width: 2,
    height: "100%",
    backgroundColor: "#DFE6E9",
    borderRadius: 1,
  },
  durationText: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "500",
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timelineLine: {
    // connecting line visual if needed
  },

  // Existing Chart Styles
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16, // Reduced from 24
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
  },
  periodTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B2BEC3",
  },
  periodTextActive: {
    color: "#000",
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEAEA",
    padding: 12,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  alertText: {
    fontSize: 13,
    color: "#D63031",
    fontWeight: "600",
    flex: 1,
  },
  chartWrapper: {
    flexDirection: "row",
    height: 180, // Reduced from 200
  },
  yAxisContainer: {
    justifyContent: "space-between",
    paddingRight: 12,
    paddingBottom: 24, // Align with dates
    width: 30, // Fixed width for Y labels
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#B2BEC3",
    fontWeight: "500",
    textAlign: "right",
  },
  chartContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 4,
  },

  // Period Section Styles
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  chartBarGroup: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  chartBarWrapper: {
    height: "100%",
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  chartBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: "#B2BEC3",
    fontWeight: "600",
  },
});
