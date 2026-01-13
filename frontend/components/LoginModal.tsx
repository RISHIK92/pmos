import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GoogleLogin from "./GoogleLogin";

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({
  visible,
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.modalContent}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={28} color="#00B894" />
            </View>
            <Text style={styles.title}>Login Required</Text>
            <Text style={styles.subtitle}>
              Please sign in to continue chatting with PMOS Intelligence.
            </Text>
          </View>

          <View style={styles.actionContainer}>
            <GoogleLogin
              onLoginSuccess={() => {
                onLoginSuccess();
                onClose();
              }}
            />

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E1E1E1",
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#636E72",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionContainer: {
    width: "100%",
    gap: 16,
    alignItems: "center",
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B2BEC3",
  },
});
