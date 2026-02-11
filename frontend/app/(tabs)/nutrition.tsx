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
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SidebarContext } from "./_layout";
import { auth } from "../../lib/firebase";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

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
  day: string;
  fullDate: Date;
  isoDate: string;
  meals: Record<MealType, MealItem[]>;
  goal: number;
};

const INITIAL_HISTORY: DailyLog[] = [];

export default function NutritionScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [selectedDayIndex, setSelectedDayIndex] = useState(6);
  const [history, setHistory] = useState<DailyLog[]>(INITIAL_HISTORY);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMealName, setNewMealName] = useState("");
  const [newMealKcal, setNewMealKcal] = useState("");
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("Breakfast");
  const [activeMenuItemId, setActiveMenuItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Img = "data:image/jpeg;base64," + result.assets[0].base64;
      setSelectedImage(base64Img);

      // Auto Analyze
      analyzeImage(base64Img);
    }
  };

  const analyzeImage = async (imgData: string) => {
    try {
      setAnalyzing(true);
      // Assuming we are logged in, but analyze endpoint might be open or protected.
      // Let's use the token if available.
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";

      const res = await fetch(`${backendUrl}/nutrition/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: imgData }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewMealName(data.name);
        setNewMealKcal(data.kcal.toString());
      }
    } catch (e) {
      console.error("Analysis failed", e);
      // Fallback or alert? Silent fail is safer for now.
    } finally {
      setAnalyzing(false);
    }
  };

  const backendUrl =
    Platform.OS === "android"
      ? "https://backend.pmos.rishik.codes"
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
            date: d.displayDate,
            isoDate: d.date,
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
          body: JSON.stringify({ name: newMealName, kcal }),
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

  const deleteMeal = async (itemId: string) => {
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
    setSelectedImage(null);
    setShowAddModal(false);
  };

  const remaining = currentDayLog.goal - currentKcal;
  const progress = Math.min((currentKcal / currentDayLog.goal) * 100, 100);

  return (
    <TouchableWithoutFeedback onPress={() => setActiveMenuItemId(null)}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <SafeAreaView style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <IconSymbol name="line.3.horizontal" size={24} color="#2D3436" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Page Intro */}
          <View style={styles.pageIntro}>
            <Text style={styles.pageTitle}>Nutrition</Text>
            <Text style={styles.pageSubtitle}>Track your daily intake</Text>
          </View>

          {/* Week Strip */}
          <View style={styles.weekStrip}>
            {history.map((log, index) => {
              const isSelected = index === selectedDayIndex;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayItem, isSelected && styles.dayItemActive]}
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

          {/* Meal Sections */}
          {(["Breakfast", "Lunch", "Snack", "Dinner"] as MealType[]).map(
            (type, sectionIndex) => (
              <View key={type} style={styles.mealSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{type}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      setSelectedMealType(type);
                      setShowAddModal(true);
                    }}
                  >
                    <IconSymbol name="plus" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {currentDayLog.meals[type].length > 0 ? (
                  currentDayLog.meals[type].map((item, i) => (
                    <Animated.View
                      key={item.id}
                      entering={FadeInDown.delay(
                        sectionIndex * 100 + i * 50,
                      ).springify()}
                      style={styles.mealCard}
                    >
                      <View style={styles.mealRow}>
                        <View style={styles.mealContent}>
                          <Text style={styles.mealName}>{item.name}</Text>
                          <Text style={styles.mealTime}>{item.time}</Text>
                        </View>
                        <View style={styles.kcalBadge}>
                          <Text style={styles.kcalText}>{item.kcal}</Text>
                          <Text style={styles.kcalUnit}>kcal</Text>
                        </View>

                        <View style={{ position: "relative", marginLeft: 8 }}>
                          <TouchableOpacity
                            onPress={() =>
                              setActiveMenuItemId(
                                activeMenuItemId === item.id ? null : item.id,
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
                              </TouchableOpacity>
                              <View style={styles.menuDivider} />
                              <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => deleteMeal(item.id)}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={16}
                                  color="#FF7675"
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </Animated.View>
                  ))
                ) : (
                  <TouchableOpacity
                    style={styles.emptyState}
                    onPress={() => {
                      setSelectedMealType(type);
                      setShowAddModal(true);
                    }}
                  >
                    <Text style={styles.emptyText}>
                      Tap to add {type.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ),
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? "Edit Meal" : `Add ${selectedMealType}`}
                </Text>
                <TouchableOpacity onPress={resetModal}>
                  <IconSymbol name="xmark.circle.fill" size={24} color="#ccc" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Avocado Toast"
                  placeholderTextColor="#B2BEC3"
                  value={newMealName}
                  onChangeText={setNewMealName}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 450"
                  placeholderTextColor="#B2BEC3"
                  value={newMealKcal}
                  onChangeText={setNewMealKcal}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickImage}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <IconSymbol name="camera.fill" size={20} color="#000" />
                )}
                <Text style={styles.photoButtonText}>
                  {analyzing
                    ? "Analyzing Food..."
                    : selectedImage
                      ? "Change Photo"
                      : "Take Photo"}
                </Text>
              </TouchableOpacity>

              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveMeal}
              >
                <Text style={styles.saveButtonText}>
                  {editingItem ? "Save Changes" : "Add Meal"}
                </Text>
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
  menuButton: {
    padding: 8,
    paddingTop: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pageIntro: {
    marginBottom: 30,
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

  // Week Strip
  weekStrip: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  dayItemActive: {
    backgroundColor: "#000",
  },
  dayText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B2BEC3",
    textTransform: "uppercase",
    marginBottom: 4,
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

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 12,
    marginBottom: 32,
  },
  summaryMain: {
    alignItems: "center",
    marginBottom: 20,
  },
  summaryCenter: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -2,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "500",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#000",
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E0E0E0",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  statLabel: {
    fontSize: 12,
    color: "#B2BEC3",
    fontWeight: "500",
  },

  // Meal Sections
  mealSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  mealCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealContent: {
    flex: 1,
    gap: 2,
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
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  kcalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  kcalUnit: {
    fontSize: 12,
    color: "#B2BEC3",
    fontWeight: "500",
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
  },
  menuDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#F1F2F6",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#DFE6E9",
  },
  emptyText: {
    color: "#B2BEC3",
    fontSize: 14,
    fontWeight: "500",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: Platform.OS === "ios" ? 48 : 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#636E72",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    marginBottom: 16,
    borderStyle: "dashed",
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
});
