import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";

export const FCMManager = {
  checkPermission: async () => {
    const enabled = await messaging().hasPermission();
    return (
      enabled === messaging.AuthorizationStatus.AUTHORIZED ||
      enabled === messaging.AuthorizationStatus.PROVISIONAL
    );
  },

  requestPermission: async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("Authorization status:", authStatus);
      }
      return enabled;
    } catch (error) {
      console.error("Permission request rejected", error);
      return false;
    }
  },

  getToken: async () => {
    try {
      if (Platform.OS === "ios") {
        const apnsToken = await messaging().getAPNSToken();
        if (!apnsToken) {
          console.log("No APNS token yet");
          // Retrying or waiting might be needed on iOS sometimes, but usually getFCMToken handles it if APNS is ready
        }
      }

      const token = await messaging().getToken();
      console.log("FCM Token:", token);
      return token;
    } catch (error) {
      console.error("Failed to get FCM token:", error);
      return null;
    }
  },

  onTokenRefresh: (callback: (token: string) => void) => {
    return messaging().onTokenRefresh((token) => {
      console.log("FCM Token Refreshed:", token);
      callback(token);
    });
  },
};
