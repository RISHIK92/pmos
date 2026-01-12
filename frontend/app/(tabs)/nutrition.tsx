import React, { useState, useContext } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { SidebarContext } from "./_layout";

// Types
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
type MealItem = {
  id: string;
  name: string;
  kcal: number;
  time: string;
};
type DailyLog = {
  date: string;
  day: string; // "M", "T", etc.
  meals: Record<MealType, MealItem[]>;
  goal: number;
};

// Mock Data
const MOCK_HISTORY: DailyLog[] = Array.from({ length: 7 }).map((_, i) => {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = ["12", "13", "14", "15", "16", "17", "18"];
  return {
    date: dates[i],
    day: days[i],
    goal: 2000,
    meals: {
      Breakfast: [
        { id: "1", name: "Oatmeal & Berries", kcal: 350, time: "8:00 AM" },
        { id: "2", name: "Black Coffee", kcal: 5, time: "8:15 AM" },
      ],
      Lunch: [
        { id: "3", name: "Grilled Chicken Salad", kcal: 450, time: "1:00 PM" },
      ],
      Dinner: [],
      Snack: [{ id: "4", name: "Almonds", kcal: 120, time: "4:30 PM" }],
    },
  };
});

// Helper Components
const CalorieMinimalDisplay = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const remaining = Math.round(total - current);
  return (
    <View style={styles.minimalCalorieContainer}>
      <View style={styles.calTextContainer}>
        <Text style={styles.calBigNumber}>{remaining}</Text>
        <Text style={styles.calLabel}>kcal left</Text>
      </View>
      <View style={styles.minimalProgressBarBg}>
        <View
          style={[
            styles.minimalProgressBarFill,
            { width: `${Math.min(current / total, 1) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
};

export default function NutritionScreen() {
  const router = useRouter();
  const { toggleSidebar } = useContext(SidebarContext);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6); // Default to today (last item)
  const [history, setHistory] = useState<DailyLog[]>(MOCK_HISTORY);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealKcal, setNewMealKcal] = useState("");
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("Breakfast");

  const currentDayLog = history[selectedDayIndex];

  const currentKcal = Object.values(currentDayLog.meals)
    .flat()
    .reduce((sum, item) => sum + item.kcal, 0);

  const addMeal = () => {
    if (!newMealName) return;

    const kcal = parseInt(newMealKcal) || 0;
    const newItem: MealItem = {
      id: Date.now().toString(),
      name: newMealName,
      kcal,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const newHistory = [...history];
    newHistory[selectedDayIndex].meals[selectedMealType].push(newItem);
    setHistory(newHistory);

    setNewMealName("");
    setNewMealKcal("");
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Nutrition</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.menuButton}>
              <IconSymbol name="calendar" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Week Strip - Minimal */}
        <View style={styles.weekStrip}>
          {history.map((log, index) => {
            const isSelected = index === selectedDayIndex;
            return (
              <TouchableOpacity
                key={index}
                style={styles.dayItem}
                onPress={() => setSelectedDayIndex(index)}
              >
                <Text
                  style={[styles.dayLabel, isSelected && styles.dayLabelActive]}
                >
                  {log.day}
                </Text>
                <Text
                  style={[
                    styles.dateLabel,
                    isSelected && styles.dateLabelActive,
                  ]}
                >
                  {log.date}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calorie Display - Minimal */}
        <View style={styles.calorieSection}>
          <CalorieMinimalDisplay
            current={currentKcal}
            total={currentDayLog.goal}
          />
        </View>

        {/* Meals List - Minimal */}
        <View style={styles.mealsContainer}>
          {(["Breakfast", "Lunch", "Dinner", "Snack"] as MealType[]).map(
            (type, sectionIdx) => (
              <View key={type} style={styles.mealSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{type}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedMealType(type);
                      setShowAddModal(true);
                    }}
                  >
                    <Ionicons name="add" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                {currentDayLog.meals[type].length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyDash} />
                  </View>
                ) : (
                  currentDayLog.meals[type].map((item, idx) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.delay(
                        idx * 100 + sectionIdx * 50
                      ).springify()}
                      style={styles.mealItem}
                    >
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{item.name}</Text>
                        <Text style={styles.mealTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.mealKcal}>{item.kcal}</Text>
                    </Animated.View>
                  ))
                )}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Add Meal Modal - Kept Functional */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="What did you eat?"
                placeholderTextColor="#999"
                value={newMealName}
                onChangeText={setNewMealName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="Calories"
                placeholderTextColor="#999"
                value={newMealKcal}
                onChangeText={setNewMealKcal}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={addMeal}>
              <Text style={styles.submitBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  headerCenter: { flex: 1, alignItems: "center" },
  headerRight: { flex: 1, alignItems: "flex-end" },
  menuButton: {
    padding: 8,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
  },
  dayItem: {
    alignItems: "center",
    width: 30, // Narrower, simpler
    gap: 8,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B2BEC3",
  },
  dayLabelActive: {
    color: "#000",
    fontWeight: "600",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#2D3436",
  },
  dateLabelActive: {
    fontWeight: "700",
    color: "#000",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000",
    marginTop: 4,
  },

  // Minimal Calorie Display
  calorieSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
    marginTop: 10,
  },
  minimalCalorieContainer: {
    alignItems: "center",
    gap: 16,
  },
  calTextContainer: {
    alignItems: "center",
  },
  calBigNumber: {
    fontSize: 56,
    fontWeight: "800", // Heavy font
    color: "#000",
    letterSpacing: -1,
    lineHeight: 64,
  },
  calLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#636E72",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  minimalProgressBarBg: {
    width: "60%", // Narrower than full width
    height: 4,
    backgroundColor: "#F1F2F6",
    borderRadius: 2,
    overflow: "hidden",
  },
  minimalProgressBarFill: {
    height: "100%",
    backgroundColor: "#000", // Black loading bar
    borderRadius: 2,
  },

  mealsContainer: {
    paddingHorizontal: 24,
    gap: 32,
  },
  mealSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "400", // Lighter weight title
    color: "#000",
    letterSpacing: -0.5,
  },
  emptyContainer: {
    paddingVertical: 8,
  },
  emptyDash: {
    width: 20,
    height: 2,
    backgroundColor: "#EEE",
    borderRadius: 1,
  },

  // List Items
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F6FA", // Very subtle separator
  },
  mealInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  mealTime: {
    fontSize: 13,
    color: "#B2BEC3",
    fontWeight: "500",
    width: 60, // Fixed width for alignment
  },
  mealName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3436",
  },
  mealKcal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  // Modal Minimal
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  closeBtn: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 16,
    fontSize: 18,
    color: "#000",
  },
  submitBtn: {
    backgroundColor: "#000",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
