import BackgroundService from "react-native-background-actions";
// @ts-ignore
import SmsListener from "react-native-android-sms-listener";
import { preFilterSms } from "../utils/smsParser";
import { HealthManager } from "../utils/HealthManager"; // Import HealthManager
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Platform } from "react-native";

const options = {
  taskName: "PMOS_Listener",
  taskTitle: "PMOS Active",
  taskDesc: "Monitoring Financial Transactions in Background",
  taskIcon: {
    name: "ic_launcher",
    type: "mipmap",
  },
  color: "#00B894",
  linkingURI: "pmos://",
  parameters: {
    delay: 5000,
  },
};

const waitForAuthToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
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

const backgroundTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;
  console.log("✅ PMOS Background Service Started");

  const subscription = SmsListener.addListener(async (message: any) => {
    console.log("📩 Background SMS:", message.body);

    if (!preFilterSms(message.body)) {
      console.log("SMS pre-filter: Not a transaction");
      return;
    }

    console.log("SMS pre-filter passed, sending to backend...");

    try {
      const token = await waitForAuthToken();
      if (!token) {
        console.log("No authenticated user in background, skipping");
        return;
      }

      const backendUrl = "http://10.243.161.129:8000";

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
        console.log("✅ SMS Transaction Saved (Background):", result.message);
      } else {
        console.log("ℹ️ SMS not a transaction (Background):", result.message);
      }
    } catch (error) {
      console.log("Failed to parse SMS in background", error);
    }
  });

  await new Promise<void>(async (resolve) => {
    let lastHealthSync = 0;
    const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

    while (BackgroundService.isRunning()) {
      const now = Date.now();
      if (now - lastHealthSync > SYNC_INTERVAL) {
        console.log("⏰ Triggering Health Sync...");
        await HealthManager.trackHourlySteps();
        lastHealthSync = now;
      }

      await new Promise((r) => setTimeout(r, delay));
    }
    subscription.remove();
    resolve();
  });
};

export const startPMOSService = async () => {
  if (!BackgroundService.isRunning()) {
    await BackgroundService.start(backgroundTask, options);
    console.log("🚀 Service Launched");
  }
};

export const stopPMOSService = async () => {
  await BackgroundService.stop();
};
