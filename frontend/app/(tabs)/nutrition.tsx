import React, { useState, useContext, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
} from "react-native-reanimated";
import { SidebarContext } from "./_layout";
import { auth } from "../../lib/firebase";
// import Svg, { Circle } from "react-native-svg";

// Types
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
type MealItem = {
  id: string;
  name: string;
  kcal: number;
  time: string;
};
type DailyLog = {
  date: string; // Display date "15"
  day: string; // "M", "T", etc.
  fullDate: Date;
  isoDate: string; // "YYYY-MM-DD" (Backend Key)
  meals: Record<MealType, MealItem[]>;
  goal: number;
};

// Mock Data
// Initial Empty History
const INITIAL_HISTORY: DailyLog[] = [];

// Components
// const CircularProgress = ({
//   current,
//   total,
//   size = 180,
//   strokeWidth = 12,
// }: {
//   current: number;
//   total: number;
//   size?: number;
//   strokeWidth?: number;
// }) => {
//   const radius = (size - strokeWidth) / 2;
//   const circumference = radius * 2 * Math.PI;
//   const progress = Math.min(current / total, 1);
//   const strokeDashoffset = circumference - progress * circumference;

//   return (
//     <View
//       style={{
//         width: size,
//         height: size,
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <Svg width={size} height={size}>
//         <Circle
//           stroke="#F1F2F6"
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           strokeWidth={strokeWidth}
//           fill="none"
//         />
//         <Circle
//           stroke={progress > 1 ? "#FF7675" : "#000"}
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           strokeWidth={strokeWidth}
//           fill="none"
//           strokeDasharray={circumference}
//           strokeDashoffset={strokeDashoffset}
//           strokeLinecap="round"
//           rotation="-90"
//           origin={`${size / 2}, ${size / 2}`}
//         />
//       </Svg>
//       <View style={styles.ringContent}>
//         <Text style={styles.ringValue}>{Math.round(total - current)}</Text>
//         <Text style={styles.ringLabel}>kcal remaining</Text>
//       </View>
//     </View>
//   );
// };

export default function NutritionScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const [history, setHistory] = useState<DailyLog[]>(INITIAL_HISTORY);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealKcal, setNewMealKcal] = useState("");
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("Breakfast");
  const [activeMenuItemId, setActiveMenuItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);

  const backendUrl =
    Platform.OS === "android"
      ? "http://10.141.28.129:8000"
      : "http://localhost:8000";

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/nutrition/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        const formattedHistory = data.map((d: any) => {
          const mealsRecord: Record<MealType, MealItem[]> = {
            Breakfast: [],
            Lunch: [],
            Dinner: [],
            Snack: [],
          };

          d.meals.forEach((m: any) => {
            if (mealsRecord[m.type as MealType]) {
              mealsRecord[m.type as MealType].push(m);
            }
          });

          return {
            ...d,
            date: d.displayDate, // "15"
            isoDate: d.date, // "2026-01-15"
            fullDate: new Date(d.fullDate),
            meals: mealsRecord,
          };
        });

        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  const currentDayLog = history[selectedDayIndex] || {
    meals: { Breakfast: [], Lunch: [], Dinner: [], Snack: [] },
    goal: 2200,
  };
  const currentKcal = Object.values(currentDayLog.meals)
    .flat()
    .reduce((sum, item) => sum + item.kcal, 0);

  const handleSaveMeal = async () => {
    if (!newMealName) return;
    const kcal = parseInt(newMealKcal) || 0;

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const dateStr = currentDayLog.isoDate;

      let res;
      if (editingItem) {
        res = await fetch(`${backendUrl}/nutrition/meals/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newMealName,
            kcal,
            // time, type remain same unless we add fields
          }),
        });
      } else {
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        res = await fetch(`${backendUrl}/nutrition/meals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: dateStr,
            name: newMealName,
            kcal,
            time: timeStr,
            type: selectedMealType,
          }),
        });
      }

      if (res.ok) {
        await fetchHistory();
        resetModal();
      }
    } catch (error) {
      console.error("Failed to save meal", error);
    }
  };

  const deleteMeal = async (itemId: string, type: MealType) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/nutrition/meals/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await fetchHistory();
        setActiveMenuItemId(null);
      }
    } catch (error) {
      console.error("Failed to delete meal", error);
    }
  };

  const openEditModal = (item: MealItem, type: MealType) => {
    setNewMealName(item.name);
    setNewMealKcal(item.kcal.toString());
    setSelectedMealType(type);
    setEditingItem(item);
    setActiveMenuItemId(null);
    setShowAddModal(true);
  };

  const resetModal = () => {
    setNewMealName("");
    setNewMealKcal("");
    setEditingItem(null);
    setShowAddModal(false);
  };

  return (
    <TouchableWithoutFeedback onPress={() => setActiveMenuItemId(null)}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Modern Header */}
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.headerBtn}>
              <IconSymbol name="line.3.horizontal" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            {/* <Text style={styles.headerTitle}>Nutrition</Text> */}
          </View>
        </SafeAreaView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Compact Week Strip */}
          <View style={styles.weekStripContainer}>
            {history.map((log, index) => {
              const isSelected = index === selectedDayIndex;
              const isToday = index === 6;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayItem,
                    isSelected && styles.dayItemActive,
                    isToday && !isSelected && styles.dayItemToday,
                  ]}
                  onPress={() => setSelectedDayIndex(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.dayText, isSelected && styles.dayTextActive]}
                  >
                    {log.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      isSelected && styles.dateTextActive,
                    ]}
                  >
                    {log.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dashboard Card */}
          <View style={styles.dashboardCard}>
            {/* <CircularProgress current={currentKcal} total={currentDayLog.goal} /> */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Eaten</Text>
                <Text style={styles.statValue}>{currentKcal}</Text>
              </View>
              <View style={[styles.statItem, styles.statBorder]}>
                <Text style={styles.statLabel}>Goal</Text>
                <Text style={styles.statValue}>{currentDayLog.goal}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Burned</Text>
                <Text style={styles.statValue}>420</Text>
              </View>
            </View>
          </View>

          {/* Meal Sections */}
          <View style={styles.mealsContainer}>
            {(["Breakfast", "Lunch", "Snack", "Dinner"] as MealType[]).map(
              (type, index) => (
                <View key={type} style={styles.mealSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{type}</Text>
                    <TouchableOpacity
                      style={styles.addBtnSmall}
                      onPress={() => {
                        setSelectedMealType(type);
                        setShowAddModal(true);
                      }}
                    >
                      <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  {currentDayLog.meals[type].length > 0 ? (
                    currentDayLog.meals[type].map((item, i) => (
                      <Animated.View
                        key={item.id}
                        entering={FadeInDown.delay(
                          index * 100 + i * 50
                        ).springify()}
                        style={styles.mealCard}
                      >
                        <View style={styles.mealRow}>
                          <View style={styles.mealContent}>
                            <Text style={styles.mealName}>{item.name}</Text>
                            <Text style={styles.mealTime}>{item.time}</Text>
                          </View>
                          <View style={styles.kcalBadge}>
                            <Text style={styles.kcalText}>
                              {item.kcal} kcal
                            </Text>
                          </View>

                          <View style={{ position: "relative", marginLeft: 8 }}>
                            <TouchableOpacity
                              onPress={() =>
                                setActiveMenuItemId(
                                  activeMenuItemId === item.id ? null : item.id
                                )
                              }
                              style={styles.moreBtn}
                            >
                              <Ionicons
                                name="ellipsis-vertical"
                                size={16}
                                color="#B2BEC3"
                              />
                            </TouchableOpacity>

                            {activeMenuItemId === item.id && (
                              <View style={styles.menuPopup}>
                                <TouchableOpacity
                                  style={styles.menuItem}
                                  onPress={() => openEditModal(item, type)}
                                >
                                  <Ionicons
                                    name="pencil-outline"
                                    size={16}
                                    color="#2D3436"
                                  />
                                  {/* <Text style={styles.menuText}>Edit</Text> */}
                                </TouchableOpacity>
                                <View style={styles.menuDivider} />
                                <TouchableOpacity
                                  style={styles.menuItem}
                                  onPress={() => deleteMeal(item.id, type)}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color="#FF7675"
                                  />
                                  {/* <Text style={[styles.menuText, { color: '#FF7675' }]}>Delete</Text> */}
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      </Animated.View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No meals logged</Text>
                    </View>
                  )}
                </View>
              )
            )}
          </View>
        </ScrollView>

        <Modal visible={showAddModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {editingItem ? "Edit Meal" : `Add to ${selectedMealType}`}
                </Text>
                <TouchableOpacity
                  onPress={resetModal}
                  style={styles.closeModalBtn}
                >
                  <Ionicons name="close" size={24} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Meal Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Avocado Toast"
                  value={newMealName}
                  onChangeText={setNewMealName}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 450"
                  value={newMealKcal}
                  onChangeText={setNewMealKcal}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveMeal}
              >
                <Text style={styles.saveButtonText}>
                  {editingItem ? "Save Changes" : "Add Meal"}
                </Text>
                <IconSymbol name="arrow.right" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Light grey bg
  },
  safeArea: {
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerBtn: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F2F6",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  weekStripContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 8,
  },
  dayItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  dayItemActive: {
    backgroundColor: "#000",
  },
  dayItemToday: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  dayText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B2BEC3",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dayTextActive: {
    color: "rgba(255,255,255,0.7)",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3436",
  },
  dateTextActive: {
    color: "#FFF",
  },

  // Dashboard
  dashboardCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
    marginBottom: 32,
  },
  ringContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -1,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#F5F6FA",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Meals
  mealsContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  mealSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  addBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F2F6",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  emptyText: {
    color: "#B2BEC3",
    fontSize: 14,
    fontWeight: "500",
  },
  mealCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  mealRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealContent: {
    flex: 1,
    gap: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
  },
  mealTime: {
    fontSize: 12,
    color: "#B2BEC3",
    fontWeight: "500",
  },
  kcalBadge: {
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  kcalText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: platformBodyPadding(),
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  closeModalBtn: {
    padding: 8,
    backgroundColor: "#F5F6FA",
    borderRadius: 50,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#636E72",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  modalInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 12,
  },
  saveButton: {
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 24,
    gap: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  moreBtn: {
    padding: 4,
  },
  menuPopup: {
    position: "absolute",
    right: 20,
    top: -10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  menuItem: {
    padding: 8,
    // flexDirection: 'row',
    // alignItems: 'center',
    // gap: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },
  menuDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#F1F2F6",
  },
});

function platformBodyPadding() {
  return Platform.OS === "ios" ? 48 : 32;
}
