import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SidebarContext } from "./_layout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth } from "../../lib/firebase";

const backendUrl =
  Platform.OS === "android"
    ? "https://backend.pmos.rishik.codes"
    : "http://localhost:8000";

export default function JournalScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [journalId, setJournalId] = useState<string | null>(null);

  useEffect(() => {
    fetchJournal();
  }, [date]);

  const fetchJournal = async () => {
    setLoading(true);
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `${backendUrl}/journal/today?date=${date}&type=PERSONAL`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setContent(data.content);
          setJournalId(data.id);
        } else {
          setContent("");
          setJournalId(null);
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to fetch journal");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${backendUrl}/journal/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date,
          content: content,
          type: "PERSONAL",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setJournalId(data.id);
      Alert.alert("Success", "Journal saved successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to save journal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!journalId || !user) return;
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            const token = await user.getIdToken();
            const res = await fetch(`${backendUrl}/journal/${journalId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              setContent("");
              setJournalId(null);
              Alert.alert("Success", "Journal deleted");
            }
          } catch (e) {
            Alert.alert("Error", "Failed to delete");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <IconSymbol name="line.3.horizontal" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Journal</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Today: {date}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <TextInput
            style={styles.input}
            multiline
            placeholder="Write your summary for today..."
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        )}

        <View style={styles.actions}>
          {journalId && (
            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn]}
              onPress={handleDelete}
              disabled={saving}
            >
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, styles.saveBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Journal</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  headerContainer: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
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
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btn: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    minWidth: 120,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
});
