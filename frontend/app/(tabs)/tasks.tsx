import React, { useContext, useState } from "react";
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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";

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
  const [sections, setSections] = useState(TASK_SECTIONS);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("work");

  const toggleTaskStatus = (sectionId: string, taskId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          tasks: section.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const isDone = task.status === "Done";
            return {
              ...task,
              status: isDone ? "Pending" : "Done",
            };
          }),
        };
      })
    );
  };

  const deleteTask = (sectionId: string, taskId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          tasks: section.tasks.filter((t) => t.id !== taskId),
        };
      })
    );
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;

    setSections((prev) =>
      prev.map((section) => {
        if (section.id === selectedSectionId) {
          const newTask = {
            id: Date.now().toString(),
            title: newTaskText,
            status: "Pending",
            due: "Soon",
          };
          return { ...section, tasks: [newTask, ...section.tasks] };
        }
        return section;
      })
    );

    setModalVisible(false);
    setNewTaskText("");
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Tasks</Text>
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
                {section.tasks.map((task, index) => (
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
                          <IconSymbol name="checkmark" size={12} color="#FFF" />
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
                        <Text style={styles.taskDue}>Due {task.due}</Text>
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
                          <IconSymbol name="xmark" size={12} color="#B2BEC3" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          ))}
        </View>
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
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Section</Text>
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
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What needs to be done?"
                value={newTaskText}
                onChangeText={setNewTaskText}
                autoFocus
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={addTask}>
              <Text style={styles.saveButtonText}>Add Task</Text>
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
});
