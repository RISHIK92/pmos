import React, { useContext, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";

// Mock Data
const INITIAL_MEMORIES = [
  {
    id: "1",
    title: "Doctor's Notes",
    subtitle: "Cardiology Appt • Jan 12",
    icon: "heart.fill",
    color: "#FF6B6B",
    content:
      "Take 1 pill every morning. Follow up in 3 months. Avoid caffeine before noon. Blood pressure was slightly elevated (130/85), need to monitor weekly.",
    tags: ["Health", "Urgent"],
  },
  {
    id: "2",
    title: "Mom's Special Sauce",
    subtitle: "Cooking • Jan 10",
    icon: "sparkles",
    color: "#FFD93D",
    content:
      "Add a pinch of sugar to the tomato sauce to cut the acidity. Don't forget to call on Sunday! She also mentioned the secret ingredient is a dash of cinnamon.",
    tags: ["Family", "Recipes"],
  },
  {
    id: "3",
    title: "Project Idea: Animation",
    subtitle: "Work • Yesterday",
    icon: "mic.fill",
    color: "#6C5CE7",
    content:
      "Remember to check the new React Native Reanimated documentation for shared element transitions. It could really improve the gallery view experience.",
    tags: ["Dev", "Idea"],
  },
  {
    id: "4",
    title: "Tax Reminder",
    subtitle: "Finance • Jan 05",
    icon: "banknote",
    color: "#2ECC71",
    content:
      "Submit quarterly tax documents by the 15th. Check with accountant about home office deductions for the new renovation.",
    tags: ["Finance", "Deadline"],
  },
];

export default function MemoryScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [memories, setMemories] = useState(INITIAL_MEMORIES);
  const [searchText, setSearchText] = useState("");

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("");

  const contentFiltered = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(searchText.toLowerCase()) ||
      m.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const addMemory = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const newMemory = {
      id: Date.now().toString(),
      title: newTitle,
      subtitle: "Just Now",
      icon: "brain.head.profile" as any, // Fallback icon
      color: "#0984E3",
      content: newContent,
      tags: newTag ? [newTag] : ["General"],
    };

    setMemories([newMemory, ...memories]);
    setModalVisible(false);
    setNewTitle("");
    setNewContent("");
    setNewTag("");
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100)
          .springify()
          .damping(30)
          .stiffness(200)}
        layout={Layout.springify().damping(30).stiffness(200)}
        style={styles.memoryItem}
      >
        <View style={styles.iconColumn}>
          <View
            style={[styles.iconCircle, { backgroundColor: item.color + "15" }]}
          >
            <IconSymbol name={item.icon} size={18} color={item.color} />
          </View>
        </View>
        <View style={styles.contentColumn}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.memoryTitle}>{item.title}</Text>
              <Text style={styles.memoryMeta}>{item.subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={() => deleteMemory(item.id)}
              style={{ padding: 4 }}
            >
              <IconSymbol name="xmark" size={14} color="#B2BEC3" />
            </TouchableOpacity>
          </View>

          <Text style={styles.memoryContent}>{item.content}</Text>

          <View style={styles.tagsRow}>
            {item.tags.map((tag: string, i: number) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    );
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

      <FlatList
        data={contentFiltered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.pageIntro}>
            <Text style={styles.pageTitle}>Knowledge Base</Text>
            <Text style={styles.pageSubtitle}>
              {memories.length} stored memories
            </Text>
          </View>
        }
      />

      {/* Floating Search Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputOuterContainer}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Search memories..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              selectionColor="#00B894"
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Add Memory Modal */}
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
              <Text style={styles.modalTitle}>New Memory</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color="#B2BEC3"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Grandma's Recipe"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Type details here..."
                value={newContent}
                onChangeText={setNewContent}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tag</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Family"
                value={newTag}
                onChangeText={setNewTag}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={addMemory}>
              <Text style={styles.saveButtonText}>Save Memory</Text>
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
  listContent: {
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
  memoryItem: {
    flexDirection: "row",
    marginBottom: 40,
    gap: 16,
  },
  iconColumn: {
    width: 40,
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contentColumn: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  memoryMeta: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B2BEC3",
    marginBottom: 8,
  },
  memoryContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#2D3436",
    fontWeight: "400",
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tagChip: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#636E72",
  },
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
  // Modal
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
    height: "90%", // Almost full screen
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
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 8,
    minHeight: 40,
  },
  textArea: {
    flex: 1,
    textAlignVertical: "top",
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
});
