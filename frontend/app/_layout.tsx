import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

export const unstable_settings = {
  // Ensure the app starts at the overlay
  initialRouteName: "index",
};

import ShareRequestHandler from "../components/ShareRequestHandler";

import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { auth } from "../lib/firebase";
import { preFilterSms } from "../utils/smsParser";

// @ts-ignore
import SmsListener from "react-native-android-sms-listener";

export default function RootLayout() {
  useEffect(() => {
    const requestSmsPermission = async () => {
      if (Platform.OS !== "android") return;

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
          startSmsListener();
        } else {
          console.log("SMS Permission Denied");
        }
      } catch (err) {
        console.warn(err);
      }
    };

    const startSmsListener = () => {
      const subscription = SmsListener.addListener(async (message: any) => {
        console.log("SMS Received:", message);

        // Quick pre-filter check
        if (!preFilterSms(message.body)) {
          console.log("SMS pre-filter: Not a transaction");
          return;
        }

        console.log("SMS pre-filter passed, sending to backend...");

        try {
          const user = auth.currentUser;
          if (!user) {
            console.log("No authenticated user, skipping SMS parsing");
            return;
          }
          const token = await user.getIdToken();

          // Config - ideally from env
          const backendUrl = "http://10.141.28.129:8000";

          // Send raw SMS to backend for Gemini parsing
          const response = await fetch(`${backendUrl}/finance/parse-sms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              body: message.body,
              sender: message.originatingAddress,
            }),
          });

          const result = await response.json();

          if (result.success) {
            console.log("✅ SMS Transaction Saved:", result.message);
          } else {
            console.log("ℹ️ SMS not a transaction:", result.message);
          }
        } catch (error) {
          console.log("Failed to parse SMS transaction", error);
        }
      });

      return () => subscription.remove();
    };

    requestSmsPermission();
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
