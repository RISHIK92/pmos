import { NativeModules, PermissionsAndroid, Platform } from "react-native";

const { SmsModule } = NativeModules;

interface SmsManagerType {
  send: (phoneNumber: string, message: string) => Promise<string>;
}

const SmsManager: SmsManagerType = {
  send: async (phoneNumber: string, message: string): Promise<string> => {
    if (Platform.OS !== "android") {
      throw new Error("SMS sending is only available on Android");
    }

    try {
      // Request SMS permission at runtime
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: "SMS Permission",
          message: "This app needs permission to send SMS messages",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Permission granted, send SMS
        const result = await SmsModule.sendDirectSMS(phoneNumber, message);
        return result;
      } else {
        throw new Error("SMS permission denied");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  },
};

export default SmsManager;
