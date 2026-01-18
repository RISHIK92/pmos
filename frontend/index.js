import { AppRegistry } from "react-native";
import "expo-router/entry";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Helper to get Token in Headless environment
const waitForAuthToken = () => {
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

const SmsHeadlessTask = async (taskData) => {
  console.log("⚡ Headless SMS Task Triggered:", taskData);

  const { message, sender } = taskData;
  if (!message || !sender) {
    console.log("❌ No message body found in task data.");
    return;
  }

  try {
    const token = await waitForAuthToken();
    if (!token) {
      console.log("❌ No Auth Token active in background.");
      return;
    }

    // Basic Filter
    if (
      !sender.match(/[A-Z]{2}-[A-Z0-9]{6}/) &&
      !sender.match(/^\d+$/) &&
      !message.toLowerCase().includes("spent") &&
      !message.toLowerCase().includes("debited") &&
      !message.toLowerCase().includes("credited")
    ) {
      console.log("Values ignored based on filter.");
      return;
    }

    const backendUrl = "http://10.141.28.129:8000"; // Hardcoded for now based on context
    const response = await fetch(`${backendUrl}/finance/parse-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sender: sender,
        body: message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log("✅ SMS sent to backend successfully from Headless Task.");
    } else {
      console.log("⚠️ Backend rejected SMS:", response.status);
    }
  } catch (error) {
    console.error("❌ Failed to process SMS in Headless Task", error);
  }
};

AppRegistry.registerHeadlessTask("SmsHeadlessTask", () => SmsHeadlessTask);
