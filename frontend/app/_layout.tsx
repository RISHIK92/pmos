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
import { useEffect, useState } from "react";
import { PermissionsAndroid, Platform, AppState } from "react-native";
import { AlarmManager, AlarmLaunchDetails } from "@/utils/AlarmManager";
import { AlarmRingView } from "@/components/AlarmRingView";

export default function RootLayout() {
  const [alarmDetails, setAlarmDetails] = useState<AlarmLaunchDetails | null>(
    null,
  );

  useEffect(() => {
    // Check if app was launched by alarm
    const checkAlarm = async () => {
      console.log("RootLayout: Checking for alarm launch details...");
      const details = await AlarmManager.getLaunchDetails();
      if (details?.isCriticalAlarm) {
        console.log("RootLayout: CRITICAL ALARM DETECTED!", details);
        setAlarmDetails(details);
      } else {
        console.log("RootLayout: No critical alarm details found.");
      }
    };

    checkAlarm();

    // Also listen for app state changes in case it comes to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkAlarm();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDismissAlarm = () => {
    setAlarmDetails(null);
    AlarmManager.stopAlarm();
  };

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS !== "android") return;

      // 1. Notification Permission (Android 13+)
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
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
          },
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
      {alarmDetails && (
        <AlarmRingView
          title={alarmDetails.title}
          onDismiss={handleDismissAlarm}
        />
      )}
    </View>
  );
}
