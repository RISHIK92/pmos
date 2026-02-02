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
  Linking as RNLinking,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SidebarContext } from "./_layout";
import { onAuthStateChanged, User } from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import Animated, { FadeInUp } from "react-native-reanimated";
import { auth } from "@/lib/firebase";

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
    const handleDeepLink = (event: { url: string }) => {
      // Check if the URL matches our backend redirect
      if (event.url.includes("pmos://config")) {
        WebBrowser.dismissBrowser();

        // ⚡ REFETCH DATA IMMEDIATELY
        if (auth.currentUser) {
          updateIntegrations(auth.currentUser);
        }
      }
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

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

  const updateIntegrations = async (currentUser: User | null) => {
    if (!currentUser) return;

    // 1. Check Google (Firebase)
    const isGoogle = currentUser.providerData.some(
      (p) => p.providerId === "google.com",
    );

    // 2. Check GitHub & Slack (Backend)
    let githubUser = null;
    let slackTeam = null;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${backendUrl}/auth/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Empty body, we just want the profile
      });
      if (res.ok) {
        const data = await res.json();
        githubUser = data.githubUsername;
        slackTeam = data.slackTeamName;
      }
    } catch (e) {
      console.error("Failed to fetch integrations", e);
    }

    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.name === "Google") {
          return {
            ...item,
            connected: isGoogle,
            desc:
              isGoogle && currentUser
                ? currentUser.email || "Connected"
                : "Not Connected",
          };
        }
        if (item.name === "GitHub") {
          return {
            ...item,
            connected: !!githubUser,
            desc: githubUser || "Not Connected",
          };
        }
        if (item.name === "Slack") {
          return {
            ...item,
            connected: !!slackTeam,
            desc: slackTeam || "Sync workspace",
          };
        }
        return item;
      }),
    );
  };

  const backendUrl =
    Platform.OS === "android"
      ? "http://10.7.19.2:8000"
      : "http://localhost:8000";

  const handleGitHubConnect = async () => {
    try {
      if (!user?.email) {
        Alert.alert("Error", "You must be logged in to connect GitHub.");
        return;
      }
      await WebBrowser.openAuthSessionAsync(
        `${backendUrl}/auth/github/login?email=${encodeURIComponent(user.email)}`,
        "pmos://",
      );
    } catch (e) {
      Alert.alert("Error", "Failed to open browser");
    }
  };

  const handleSlackConnect = async () => {
    try {
      if (!user?.email) return;

      await WebBrowser.openAuthSessionAsync(
        `${backendUrl}/auth/slack/login?email=${encodeURIComponent(user.email)}`,
        "pmos://",
      );
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to connect Slack");
    }
  };

  useEffect(() => {
    updateIntegrations(user);
  }, [user]);

  const checkPermissions = async () => {
    if (Platform.OS !== "android") return;

    const newPermissions = await Promise.all(
      permissions.map(async (p) => {
        const granted = await PermissionsAndroid.check(p.permission);
        return { ...p, enabled: granted };
      }),
    );
    setPermissions(newPermissions);
  };

  const togglePermission = async (id: string) => {
    if (Platform.OS !== "android") {
      RNLinking.openSettings();
      return;
    }

    const perm = permissions.find((p) => p.id === id);

    if (perm?.enabled) {
      Alert.alert(
        "Permission Granted",
        "This permission is managed by your system settings. Go to Settings to disable it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => RNLinking.openSettings() },
        ],
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
                  onPress: () => RNLinking.openSettings(),
                },
              ],
            );
          }
        }
      } catch (err) {
        console.warn(err);
        RNLinking.openSettings();
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
              onPress={() => RNLinking.openSettings()}
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
                  onPress={() => {
                    if (item.name === "GitHub" && !item.connected) {
                      handleGitHubConnect();
                    }
                    if (item.name === "Slack" && !item.connected) {
                      handleSlackConnect();
                    }
                  }}
                  disabled={false}
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
