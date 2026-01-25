import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

const { width, height } = Dimensions.get("window");
const SIDEBAR_WIDTH = 280;

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive?: boolean;
  onPress: () => void;
};

const MenuItem = ({ icon, label, isActive, onPress }: MenuItemProps) => (
  <TouchableOpacity
    style={[styles.menuItem, isActive && styles.menuItemActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? "#FFFFFF" : "#636E72"} // Use premium gray
    />
    <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      overlayOpacity.value = withTiming(0.5, { duration: 300 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      overlayOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isOpen]);

  const sidebarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
      pointerEvents: isOpen ? "auto" : "none",
    };
  });

  const navigateTo = (route: string) => {
    router.replace(route as any);
    onClose();
  };

  return (
    <View style={styles.container}>
      {/* Main Content Area */}
      <View style={styles.content}>{children}</View>

      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, sidebarStyle]}>
        <SafeAreaView style={styles.sidebarSafe}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.logo}>PMOS</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v2.0</Text>
            </View>
          </View>

          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Main</Text>
            <MenuItem
              icon={
                pathname === "/" || pathname.includes("index")
                  ? "home"
                  : "home-outline"
              }
              label="Home"
              isActive={
                pathname === "/" ||
                pathname === "/(tabs)/index" ||
                pathname === "/index"
              }
              onPress={() => navigateTo("/")}
            />
            <MenuItem
              icon={
                pathname.includes("memory")
                  ? "hardware-chip"
                  : "hardware-chip-outline"
              }
              label="Memory"
              isActive={pathname === "/memory" || pathname === "/(tabs)/memory"}
              onPress={() => navigateTo("/(tabs)/memory")}
            />
            <MenuItem
              icon={
                pathname.includes("tasks") ? "checkbox" : "checkbox-outline"
              }
              label="Tasks"
              isActive={pathname === "/tasks" || pathname === "/(tabs)/tasks"}
              onPress={() => navigateTo("/(tabs)/tasks")}
            />

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Life</Text>
            <MenuItem
              icon={pathname.includes("health") ? "heart" : "heart-outline"}
              label="Health"
              isActive={pathname === "/health" || pathname === "/(tabs)/health"}
              onPress={() => navigateTo("/(tabs)/health")}
            />
            <MenuItem
              icon={
                pathname.includes("nutrition")
                  ? "nutrition"
                  : "nutrition-outline"
              }
              label="Diet"
              isActive={pathname === "/nutrition"}
              onPress={() => navigateTo("/nutrition")} // Navigates to the stacked nutrition page
            />
            <MenuItem
              icon={pathname.includes("finance") ? "wallet" : "wallet-outline"}
              label="Finance"
              isActive={
                pathname === "/finance" || pathname === "/(tabs)/finance"
              }
              onPress={() => navigateTo("/(tabs)/finance")}
            />
            <MenuItem
              icon={
                pathname.includes("content") ? "library" : "library-outline"
              }
              label="Content"
              isActive={
                pathname === "/content" || pathname === "/(tabs)/content"
              }
              onPress={() => navigateTo("/(tabs)/content")}
            />
            {/* <MenuItem
              icon={pathname.includes("journal") ? "book" : "book-outline"}
              label="Journal"
              isActive={
                pathname === "/journal" || pathname === "/(tabs)/journal"
              }
              onPress={() => navigateTo("/(tabs)/journal")}
            /> */}

            <View style={styles.divider} />

            <MenuItem
              icon={
                pathname.includes("restrictor")
                  ? "lock-closed"
                  : "lock-closed-outline"
              }
              label="Restrictor"
              isActive={
                pathname === "/restrictor" || pathname === "/(tabs)/restrictor"
              }
              onPress={() => navigateTo("/(tabs)/restrictor")}
            />
            <MenuItem
              icon={
                pathname.includes("config") ? "settings" : "settings-outline"
              }
              label="Config"
              isActive={pathname === "/config" || pathname === "/(tabs)/config"}
              onPress={() => navigateTo("/(tabs)/config")}
            />
            <MenuItem
              icon={
                pathname.includes("dev") ? "code-slash" : "code-slash-outline"
              }
              label="Dev"
              isActive={pathname === "/dev" || pathname === "/(tabs)/dev"}
              onPress={() => navigateTo("/(tabs)/dev")}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.userProfile}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>RK</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Rishik K.</Text>
                <Text style={styles.userRole}>Pro User</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#B2BEC3" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)", // Darker overlay
    zIndex: 100,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    zIndex: 101,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  sidebarSafe: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 48,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  versionBadge: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#636E72",
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B2BEC3",
    marginLeft: 16,
    marginBottom: 10,
    opacity: 1,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12, // Floating pill shape
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: "#000", // Stark black for active
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2D3436",
    marginLeft: 14,
    letterSpacing: -0.3,
  },
  menuLabelActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F2F6",
    marginVertical: 14,
    marginHorizontal: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3436",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },
  userRole: {
    fontSize: 12,
    color: "#636E72",
  },
});
