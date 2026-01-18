import React, { useContext, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Switch,
  Image,
  Linking,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import Animated, { FadeInUp } from "react-native-reanimated";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

const { width } = Dimensions.get("window");

// Base Data
const INTEGRATIONS_BASE = [
  {
    id: "1",
    name: "GitHub",
    icon: "github",
    color: "#000000",
    bg: "#F5F5F5",
    connected: false,
    desc: "Not Connected",
  },
  {
    id: "2",
    name: "Google",
    icon: "google",
    color: "#DB4437",
    bg: "#FEF2F1",
    connected: false,
    desc: "Not Connected",
  },
  {
    id: "3",
    name: "Slack",
    icon: "pencil",
    color: "#000000",
    bg: "#FFF",
    connected: false,
    desc: "Sync workspace",
  },
];

const PERMISSIONS_BASE = [
  {
    id: "sms",
    name: "SMS Access",
    icon: "message.fill",
    permission: PermissionsAndroid.PERMISSIONS.READ_SMS,
    enabled: false,
  },
  {
    id: "mic",
    name: "Microphone",
    icon: "mic.fill",
    permission: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    enabled: false,
  },
];

export default function ConfigScreen() {
  const { toggleSidebar } = useContext(SidebarContext);
  const [integrations, setIntegrations] = useState(INTEGRATIONS_BASE);
  const [permissions, setPermissions] = useState(PERMISSIONS_BASE);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 1. Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      updateIntegrations(currentUser);
    });

    // 2. Check Permissions
    checkPermissions();

    return () => unsubscribe();
  }, []);

  const updateIntegrations = (currentUser: User | null) => {
    if (!currentUser) return;

    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.name === "Google") {
          const isGoogle = currentUser.providerData.some(
            (p) => p.providerId === "google.com"
          );
          return {
            ...item,
            connected: isGoogle,
            desc: isGoogle ? currentUser.email || "Connected" : "Not Connected",
          };
        }
        return item; // GitHub/Slack logic to be added
      })
    );
  };

  const checkPermissions = async () => {
    if (Platform.OS !== "android") return;

    const newPermissions = await Promise.all(
      permissions.map(async (p) => {
        const granted = await PermissionsAndroid.check(p.permission);
        return { ...p, enabled: granted };
      })
    );
    setPermissions(newPermissions);
  };

  const togglePermission = async (id: string) => {
    if (Platform.OS !== "android") {
      Linking.openSettings();
      return;
    }

    const perm = permissions.find((p) => p.id === id);

    if (perm?.enabled) {
      Alert.alert(
        "Permission Granted",
        "This permission is managed by your system settings. Go to Settings to disable it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      // Request Permission directly or Open Settings if blocked
      try {
        if (perm) {
          const granted = await PermissionsAndroid.request(perm.permission);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            checkPermissions();
          } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            Alert.alert(
              "Permission Denied",
              "You previously denied this permission. Please enable it in Settings.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
          }
        }
      } catch (err) {
        console.warn(err);
        Linking.openSettings();
      }
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
              onPress={() => Linking.openSettings()}
            >
              <Ionicons name="settings-outline" size={22} color="#2D3436" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100)} style={styles.pageIntro}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Preferences & Control</Text>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={styles.profileSection}
        >
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#636E72" }]}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0) || "U"}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.onlineBadge,
                { backgroundColor: user ? "#00B894" : "#B2BEC3" },
              ]}
            />
          </View>
          <Text style={styles.profileName}>
            {user?.displayName || "Guest User"}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || "Not signed in"}
          </Text>

          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Integrations */}
        <Animated.View
          entering={FadeInUp.delay(300)}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionHeader}>Integrations</Text>
          <View style={styles.settingsGroup}>
            {integrations.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.settingItem,
                  index === integrations.length - 1 && styles.settingItemLast,
                ]}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[styles.iconCircle, { backgroundColor: "#F8F9FA" }]}
                  >
                    <FontAwesome
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>{item.name}</Text>
                    <Text style={styles.settingDesc}>
                      {item.connected ? item.desc : "Not Connected"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.connectBtn,
                    item.connected
                      ? styles.connectedBtn
                      : styles.disconnectedBtn,
                  ]}
                  disabled={true}
                >
                  <Text
                    style={[
                      styles.connectBtnText,
                      item.connected
                        ? styles.connectedBtnText
                        : styles.disconnectedBtnText,
                    ]}
                  >
                    {item.connected ? "Connected" : "Connect"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Permissions */}
        <Animated.View
          entering={FadeInUp.delay(400)}
          style={styles.sectionContainer}
        >
          <Text style={styles.sectionHeader}>System Permissions</Text>
          <View style={styles.settingsGroup}>
            {permissions.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.settingItem,
                  index === permissions.length - 1 && styles.settingItemLast,
                ]}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[styles.iconCircle, { backgroundColor: "#F8F9FA" }]}
                  >
                    <IconSymbol
                      name={item.icon as any}
                      size={20}
                      color={item.enabled ? "#000" : "#B2BEC3"}
                    />
                  </View>
                  <Text style={styles.settingTitle}>{item.name}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => togglePermission(item.id)}
                  trackColor={{ false: "#F1F2F6", true: "#000" }}
                  thumbColor="#FFF"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PMOS v1.0.0 (Alpha)</Text>
          <Text style={styles.footerText}>Designed by Deepmind</Text>
        </View>
      </ScrollView>
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
    paddingVertical: 24,
    paddingBottom: 40,
  },
  pageIntro: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 4,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#B2BEC3",
    fontWeight: "500",
  },

  // Profile Section
  profileSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2D3436",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "700",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00B894",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: "#B2BEC3",
    marginBottom: 20,
    fontWeight: "500",
  },
  editProfileBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E2E6",
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },

  // Sections
  sectionContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B2BEC3",
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E6",
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1, // Allow text to take up space
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E1E2E6",
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
  },
  settingDesc: {
    fontSize: 12,
    color: "#B2BEC3",
    marginTop: 2,
  },
  connectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  connectedBtn: {
    backgroundColor: "#FFF",
    borderColor: "#E1E2E6",
  },
  disconnectedBtn: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  connectedBtnText: {
    color: "#636E72",
  },
  disconnectedBtnText: {
    color: "#FFF",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 20,
    gap: 4,
  },
  footerText: {
    color: "#DFE6E9",
    fontSize: 12,
    fontWeight: "500",
  },
});
