import React, { useEffect, useState } from "react";
import { useShareIntent } from "expo-share-intent";
import {
  Alert,
  Platform,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from "react-native";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

export default function ShareRequestHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  // Helper to wait for auth restoration
  const waitForAuthToken = (): Promise<string | null> => {
    return new Promise((resolve) => {
      // Check if already loaded
      if (auth.currentUser) {
        auth.currentUser
          .getIdToken()
          .then(resolve)
          .catch(() => resolve(null));
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const token = await user.getIdToken();
            resolve(token);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  };

  const backendUrl =
    Platform.OS === "android"
      ? "http://10.7.19.2:8000"
      : "http://localhost:8000";

  useEffect(() => {
    const handleShare = async () => {
      if (hasShareIntent && shareIntent) {
        console.log("📲 Application opened via Share Menu!", shareIntent);

        // Wait for auth to initialize
        const token = await waitForAuthToken();

        if (shareIntent.type === "text" || shareIntent.type === "weburl") {
          const content = shareIntent.webUrl || shareIntent.text || "";
          const isUrl =
            content.startsWith("http://") || content.startsWith("https://");

          try {
            if (!token) {
              console.log("No auth token available for share handler");
              setStatus("error");
              setModalVisible(true);
              return;
            }

            // Helper to extract platform from URL
            const getPlatformFromUrl = (
              url: string,
            ): { platform: string; isSocial: boolean; isVideo: boolean } => {
              const lowerUrl = url.toLowerCase();
              if (lowerUrl.includes("twitter") || lowerUrl.includes("x.com"))
                return { platform: "X", isSocial: true, isVideo: false };
              if (lowerUrl.includes("instagram"))
                return {
                  platform: "Instagram",
                  isSocial: true,
                  isVideo: false,
                };
              if (lowerUrl.includes("linkedin"))
                return { platform: "LinkedIn", isSocial: true, isVideo: false };
              if (lowerUrl.includes("reddit"))
                return { platform: "Reddit", isSocial: true, isVideo: false };

              // Video platforms -> Continue Watching
              if (lowerUrl.includes("youtube") || lowerUrl.includes("youtu.be"))
                return { platform: "YouTube", isSocial: false, isVideo: true };
              if (lowerUrl.includes("netflix"))
                return { platform: "Netflix", isSocial: false, isVideo: true };
              if (lowerUrl.includes("hulu"))
                return { platform: "Hulu", isSocial: false, isVideo: true };
              if (
                lowerUrl.includes("primevideo") ||
                lowerUrl.includes("amazon.com/gp/video")
              )
                return {
                  platform: "Prime Video",
                  isSocial: false,
                  isVideo: true,
                };
              if (
                lowerUrl.includes("hotstar") ||
                lowerUrl.includes("disneyplus")
              )
                return { platform: "Hotstar", isSocial: false, isVideo: true };
              if (lowerUrl.includes("vimeo"))
                return { platform: "Vimeo", isSocial: false, isVideo: true };

              try {
                let domain = url.replace(/^(https?:\/\/)?(www\.)?/, "");
                domain = domain.split("/")[0];
                domain = domain.split(".")[0];
                if (domain && domain.length > 0) {
                  return {
                    platform: domain.charAt(0).toUpperCase() + domain.slice(1),
                    isSocial: false,
                    isVideo: false,
                  };
                }
              } catch (e) {}
              return { platform: "Web", isSocial: false, isVideo: false };
            };

            const { platform, isSocial, isVideo } = getPlatformFromUrl(content);

            const payload = {
              type: isVideo ? "WATCH" : isSocial ? "SOCIAL" : "READ",
              title: isUrl
                ? `Saved from ${platform}`
                : content.substring(0, 50) || "Shared Text",
              subtitle: isVideo ? "To Watch" : platform,
              platform: platform,
              url: isUrl ? content : "",
            };

            const res = await fetch(`${backendUrl}/content`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });

            if (res.ok) {
              // Success! Minimize the app immediately (skip modal for faster UX)
              resetShareIntent();
              BackHandler.exitApp(); // Minimizes on Android
              return;
            } else {
              setStatus("error");
              setModalVisible(true);
            }
          } catch (e) {
            console.error(e);
            setStatus("error");
            setModalVisible(true);
          } finally {
            resetShareIntent();
          }
        } else {
          // Unsupported types
          resetShareIntent();
        }
      }
    };

    handleShare();
  }, [hasShareIntent, shareIntent, resetShareIntent, backendUrl]);

  const handleClose = () => {
    setModalVisible(false);
    if (status === "success") {
      // Navigate to content tab to trigger refetch
      router.push("/(tabs)/content");
    }
  };

  if (!modalVisible) return null;

  return (
    <Modal transparent visible={modalVisible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.springify()} style={styles.card}>
          <View
            style={[
              styles.iconContainer,
              status === "error" && styles.iconError,
            ]}
          >
            <IconSymbol
              name={
                status === "success"
                  ? "checkmark"
                  : "exclamationmark.triangle.fill"
              }
              size={32}
              color={status === "success" ? "#00B894" : "#FF7675"}
            />
          </View>
          <Text style={styles.title}>
            {status === "success"
              ? "Saved Successfully"
              : "Something Went Wrong"}
          </Text>
          <Text style={styles.subtitle}>
            {status === "success"
              ? "Content has been added to your hub."
              : "Please check your connection and try again."}
          </Text>

          <TouchableOpacity
            style={[styles.button, status === "error" && styles.buttonError]}
            onPress={handleClose}
          >
            <Text
              style={[
                styles.buttonText,
                status === "error" && styles.textError,
              ]}
            >
              {status === "success" ? "View Content" : "Close"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconError: {
    backgroundColor: "rgba(255, 118, 117, 0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#636E72",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#00B894",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonError: {
    backgroundColor: "#FCEAEA",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  textError: {
    color: "#FF7675",
  },
});
