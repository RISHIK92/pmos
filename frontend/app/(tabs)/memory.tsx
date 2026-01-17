import React, { useContext, useState, useEffect } from "react";
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, { FadeInUp, Layout } from "react-native-reanimated";
import { auth } from "../../lib/firebase"; // Ensure this path is correct

type Memory = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  subtitle: string;
  icon: string;
  color: string;
};

const MEMORY_COLORS = [
  "#2D3436", // Charcoal (Minimal option)
  "#00B894", // Mint
  "#FF7675", // Pink
  "#6C5CE7", // Purple
  "#FAB1A0", // Orange
  "#FDCB6E", // Yellow
  "#E17055", // Terracotta(Warm)
  "#00CEC9", // Teal
];

const getMemoryColor = (tags: string[], id: string) => {
  if (tags && tags.some((t) => t.toLowerCase() === "general")) {
    return "#0984E3"; // Blue for General
  }
  // Deterministic color based on ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MEMORY_COLORS.length;
  return MEMORY_COLORS[index];
};

export default function MemoryScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const backendUrl =
    Platform.OS === "android"
      ? "http://10.141.28.129:8000"
      : "http://localhost:8000";

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/memory/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          tags: item.tags,
          createdAt: item.createdAt,
          subtitle: new Date(item.createdAt).toLocaleDateString(),
          icon: "brain.head.profile", // Default icon
          color: getMemoryColor(item.tags, item.id),
        }));
        setMemories(formattedData);
      }
    } catch (error) {
      console.error("Failed to fetch memories", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const contentFiltered = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(searchText.toLowerCase()) ||
      m.content.toLowerCase().includes(searchText.toLowerCase())
  );

  const addMemory = async () => {
    if (!newTitle.trim()) return;

    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to save memories.");
        return;
      }
      const token = await user.getIdToken();

      const payload = {
        title: newTitle,
        content: newContent || "",
        tags: newTag ? [newTag] : ["General"],
      };

      const res = await fetch(`${backendUrl}/memory/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalVisible(false);
        setNewTitle("");
        setNewContent("");
        setNewTag("");
        fetchMemories(); // Refresh list
      } else {
        Alert.alert("Error", "Failed to save memory");
      }
    } catch (error) {
      console.error("Failed to add memory", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const res = await fetch(`${backendUrl}/memory/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      } else {
        Alert.alert("Error", "Failed to delete memory");
      }
    } catch (error) {
      console.error("Failed to delete memory", error);
      Alert.alert("Error", "Network error occurred");
    }
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
        ListEmptyComponent={
          isLoading ? (
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#4285F4" />
              <Text style={{ marginTop: 12, color: "#B2BEC3" }}>
                Loading memories...
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <IconSymbol name="archivebox" size={48} color="#E1E1E1" />
              <Text style={{ marginTop: 12, color: "#B2BEC3" }}>
                No memories found
              </Text>
            </View>
          )
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
