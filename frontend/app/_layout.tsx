import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

export const unstable_settings = {
  // Ensure the app starts at the overlay
  initialRouteName: "index",
};

import { startPMOSService } from "../services/BackgroundService";
import ShareRequestHandler from "../components/ShareRequestHandler";
import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== "android") return;

      // 1. Notification Permission (Android 13+)
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("🔔 Notification Permission Granted");
          } else {
            console.log("🔕 Notification Permission Denied");
          }
        } catch (err) {
          console.warn(err);
        }
      }

      // 2. SMS Permission
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: "SMS Permission",
            message:
              "App needs access to your SMS to track financial transactions.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("SMS Permission Granted");
          startPMOSService();
        } else {
          console.log("SMS Permission Denied");
        }
      } catch (err) {
        console.warn(err);
      }
    };

    requestPermissions();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ShareRequestHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            presentation: "transparentModal",
          }}
        />

        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar backgroundColor="transparent" />
    </View>
  );
}
