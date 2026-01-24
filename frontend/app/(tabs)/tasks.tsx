import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import { auth } from "../../lib/firebase";

// Mock Data for "Task Force"
const TASK_SECTIONS = [
  {
    id: "work",
    title: "Work",
    icon: "briefcase.fill",
    color: "#0984E3",
    tasks: [
      { id: "t1", title: "Q4 Report", status: "In Progress", due: "Today" },
      { id: "t2", title: "Client Meeting", status: "Pending", due: "Fri" },
    ],
  },
  {
    id: "code",
    title: "Code",
    icon: "chevron.left.forwardslash.chevron.right",
    color: "#6C5CE7",
    tasks: [
      { id: "t3", title: "Refactor API", status: "Done", due: "Yesterday" },
      { id: "t4", title: "Fix Auth Bug", status: "In Progress", due: "ASAP" },
      { id: "t5", title: "Deploy V2", status: "Pending", due: "Next Week" },
    ],
  },
  {
    id: "deadlines",
    title: "Deadlines",
    icon: "alarm.fill",
    color: "#D63031",
    tasks: [
      { id: "t6", title: "Submit Taxes", status: "Critical", due: "Jan 15" },
      { id: "t7", title: "Renew Domain", status: "Critical", due: "Jan 20" },
    ],
  },
];

export default function TasksScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [sections, setSections] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // New Section State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const backendUrl =
    Platform.OS === "android"
      ? "http://10.243.161.129:8000"
      : "http://localhost:8000";

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/tasks/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
        if (data.length > 0 && !selectedSectionId) {
          setSelectedSectionId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch sections", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const toggleTaskStatus = async (sectionId: string, taskId: string) => {
    // Optimistic Update
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          tasks: sec.tasks.map((t: any) =>
            t.id === taskId
              ? { ...t, status: t.status === "Done" ? "Pending" : "Done" }
              : t,
          ),
        };
      }),
    );

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const section = sections.find((s) => s.id === sectionId);
      const task = section?.tasks.find((t: any) => t.id === taskId);
      const newStatus = task?.status === "Done" ? "Pending" : "Done"; // Logic inverted because we optimistic updated

      await fetch(`${backendUrl}/tasks/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update task", error);
      fetchSections(); // Revert on error
    }
  };

  const deleteTask = async (sectionId: string, taskId: string) => {
    // Optimistic Update
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          tasks: sec.tasks.filter((t: any) => t.id !== taskId),
        };
      }),
    );

    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await fetch(`${backendUrl}/tasks/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Failed to delete task", error);
      fetchSections();
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowTimePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const handleAdd = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      let targetSectionId = selectedSectionId;

      // 1. If Adding Section, Create it first
      if (isAddingSection) {
        if (!newSectionTitle.trim()) return;

        const res = await fetch(`${backendUrl}/tasks/sections`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newSectionTitle,
            icon: "list.bullet",
            color: "#0984E3",
          }),
        });

        if (res.ok) {
          const newSection = await res.json();
          targetSectionId = newSection.id;
        } else {
          console.error("Failed to create section");
          return;
        }
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;
      // 2. Create Task (Only if we have a title)
      if (newTaskText.trim() && targetSectionId) {
        const res = await fetch(`${backendUrl}/tasks/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sectionId: targetSectionId,
            title: newTaskText,
            status: "Pending",
            due: "Soon",
            dueDate: formattedDate,
            dueTime: date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }),
        });

        if (res.ok) {
          setModalVisible(false);
          setNewTaskText("");
          // Reset date? maybe keep it as today
          setNewSectionTitle("");
          setIsAddingSection(false);
          fetchSections();
        }
      } else if (isAddingSection && targetSectionId) {
        // Case: Only created a section, no task title provided
        setModalVisible(false);
        setNewSectionTitle("");
        setIsAddingSection(false);
        fetchSections();
      }
    } catch (error) {
      console.error("Failed to add", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
              style={styles.menuButton}
              onPress={() => setModalVisible(true)}
            >
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
          <Text style={styles.pageTitle}>Command Center</Text>
          <Text style={styles.pageSubtitle}>Track your progress</Text>
        </View>

        {sections.length > 0 ? (
          <View style={styles.sectionsContainer}>
            {sections.map((section, sectionIndex) => (
              <View key={section.id} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <IconSymbol
                    name={section.icon as any}
                    size={16}
                    color={section.color}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{section.tasks.length}</Text>
                  </View>
                </View>

                <View style={styles.taskList}>
                  {section.tasks.map((task: any, index: number) => (
                    <Animated.View
                      key={task.id}
                      entering={FadeInUp.delay((sectionIndex * 2 + index) * 50)
                        .springify()
                        .damping(30)
                        .stiffness(200)}
                      layout={Layout.springify().damping(30).stiffness(200)}
                    >
                      <TouchableOpacity
                        style={styles.taskItem}
                        activeOpacity={0.7}
                        onPress={() => toggleTaskStatus(section.id, task.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            task.status === "Done" && styles.checkboxChecked,
                          ]}
                        >
                          {task.status === "Done" && (
                            <IconSymbol
                              name="checkmark"
                              size={12}
                              color="#FFF"
                            />
                          )}
                        </View>

                        <View style={styles.taskContent}>
                          <Text
                            style={[
                              styles.taskTitle,
                              task.status === "Done" && styles.taskTitleDone,
                            ]}
                          >
                            {task.title}
                          </Text>
                          <Text style={styles.taskDue}>
                            {task.dueDate
                              ? `Due ${task.dueDate}${
                                  task.dueTime ? " at " + task.dueTime : ""
                                }`
                              : `Due ${task.due}`}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <View
                            style={[
                              styles.statusTag,
                              {
                                backgroundColor:
                                  task.status === "Critical"
                                    ? "#FFEAA7"
                                    : "#dfe6e9",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color:
                                    task.status === "Critical"
                                      ? "#D63031"
                                      : "#636E72",
                                },
                              ]}
                            >
                              {task.status}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => deleteTask(section.id, task.id)}
                            style={{ padding: 4 }}
                          >
                            <IconSymbol
                              name="xmark"
                              size={12}
                              color="#B2BEC3"
                            />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              name="list.bullet.rectangle"
              size={48}
              color="#D1D8E0"
            />
            <Text style={styles.emptyStateText}>No tasks found</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal for New Task */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isAddingSection ? "New Section" : "New Task"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setIsAddingSection(false);
                }}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#B2BEC3",
                    textTransform: "uppercase",
                  }}
                >
                  Section
                </Text>
                {isAddingSection && (
                  <TouchableOpacity onPress={() => setIsAddingSection(false)}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#0984E3",
                        fontWeight: "600",
                      }}
                    >
                      Select Existing
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isAddingSection ? (
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Section Name (e.g. Shopping)"
                  value={newSectionTitle}
                  onChangeText={setNewSectionTitle}
                  autoFocus
                />
              ) : (
                <View style={styles.sectionSelector}>
                  {sections.map((sec) => (
                    <TouchableOpacity
                      key={sec.id}
                      style={[
                        styles.sectionChip,
                        selectedSectionId === sec.id && {
                          backgroundColor: sec.color,
                          borderColor: sec.color,
                        },
                      ]}
                      onPress={() => setSelectedSectionId(sec.id)}
                    >
                      <Text
                        style={[
                          styles.sectionChipText,
                          selectedSectionId === sec.id && { color: "#FFF" },
                        ]}
                      >
                        {sec.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.sectionChip, { borderStyle: "dashed" }]}
                    onPress={() => setIsAddingSection(true)}
                  >
                    <IconSymbol name="plus" size={14} color="#636E72" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What needs to be done?"
                value={newTaskText}
                onChangeText={setNewTaskText}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Due Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString()}
                  </Text>
                  <IconSymbol name="calendar" size={16} color="#636E72" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Due Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <IconSymbol name="clock.fill" size={16} color="#636E72" />
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onChangeDate}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="time"
                is24Hour={false} // 12h format
                display="default"
                onChange={onChangeTime}
              />
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>
                {isAddingSection ? "Create & Add Task" : "Add Task"}
              </Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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
  sectionsContainer: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3436",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#636E72",
  },
  taskList: {
    gap: 16,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#DFE6E9",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#00B894",
    borderColor: "#00B894",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 2,
  },
  taskTitleDone: {
    color: "#B2BEC3",
    textDecorationLine: "line-through",
  },
  taskDue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B2BEC3",
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B2BEC3",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  modalInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
    height: 40,
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSelector: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F2F6",
  },
  sectionChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636E72",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#B2BEC3",
    fontWeight: "600",
  },
  emptyStateAction: {
    fontSize: 14,
    color: "#0984E3",
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
    height: 40,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
});
