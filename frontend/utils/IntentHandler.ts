import { Platform } from "react-native";
import AppLauncher from "./AppLauncher";
import ContactManager from "./ContactManager";
import { AlarmManager } from "./AlarmManager";
import SystemManager from "./SystemManager";
import MediaManager from "./MediaManager";
import WhatsAppManager from "./WhatsAppManager";
import SmsManager from "./SmsManager";
import { SleepManager } from "./SleepManager";
// @ts-ignore
import RNImmediatePhoneCall from "react-native-immediate-phone-call";
import { auth } from "../lib/firebase";
import EventSource from "react-native-sse";

export interface IntentResult {
  success: boolean;
  message: string;
  shouldDismiss: boolean;
  type?:
    | "call"
    | "alarm"
    | "timer"
    | "media"
    | "system"
    | "whatsapp"
    | "sms"
    | "app"
    | "sleep"
    | "ai"
    | "flashlight_on"
    | "flashlight_off";
}

export const IntentHandler = {
  process: async (text: string): Promise<IntentResult> => {
    const cleanText = text.trim();
    if (!cleanText) {
      return { success: false, message: "", shouldDismiss: false };
    }

    console.log("IntentHandler: Processing Intent:", cleanText);

    const digitOnly = cleanText.replace(/[^0-9]/g, "");
    const isNumberFormat = /^[\d\s\-\(\)\+]+$/.test(cleanText);

    // 1. Direct Number Dialing
    if (digitOnly.length === 10 && isNumberFormat) {
      console.log("📞 Direct number detected:", digitOnly);
      RNImmediatePhoneCall.immediatePhoneCall(digitOnly);
      return {
        success: true,
        message: `Calling ${digitOnly}...`,
        shouldDismiss: true,
        type: "call",
      };
    }

    // 2. Alarm Check
    // 2. Alarm Check
    if (cleanText.toLowerCase().includes("alarm")) {
      console.log("⏰ Alarm command detected");
      const { success, message } = await AlarmManager.parseAndSet(cleanText);
      if (success) {
        return {
          success,
          message,
          shouldDismiss: success,
          type: "alarm",
        };
      }
      console.log("⏰ Local parsing failed, falling back to AI...");
    }

    // 3. Timer Check
    // 3. Timer Check
    if (cleanText.toLowerCase().includes("timer")) {
      console.log("⏳ Timer command detected");
      const { success, message } =
        await AlarmManager.parseAndSetTimer(cleanText);

      if (success) {
        return {
          success,
          message,
          shouldDismiss: success,
          type: "timer",
        };
      }
      console.log("⏳ Local timer parsing failed, falling back to AI...");
    }

    // 4. Media Controls
    if (
      cleanText.toLowerCase().match(/^(play|pause|stop|next|skip|prev|back)/i)
    ) {
      const mediaResult = await IntentHandler.handleMediaAction(cleanText);
      if (mediaResult.success) {
        console.log("🎵 Media command detected");
        return {
          success: true,
          message: mediaResult.message,
          shouldDismiss: true,
          type: "media",
        };
      }
    }

    // 5. WhatsApp Integration
    if (cleanText.toLowerCase().includes("whatsapp")) {
      const match = cleanText.match(/send whatsapp to (.+?) (.+)/i);
      if (match) {
        const contactName = match[1].trim();
        const messageBody = match[2].trim();

        // Resolve contact
        const { success: contactSuccess, phone } =
          await ContactManager.findContact(contactName);

        if (contactSuccess && phone) {
          WhatsAppManager.send(phone, messageBody);
          return {
            success: true,
            message: `Sending to ${contactName}...`,
            shouldDismiss: true,
            type: "whatsapp",
          };
        } else {
          return {
            success: false,
            message: "Contact not found.",
            shouldDismiss: false,
            type: "whatsapp",
          };
        }
      }
    }

    // 6. SMS Integration
    if (
      cleanText.toLowerCase().includes("sms") ||
      cleanText.toLowerCase().startsWith("text")
    ) {
      const smsMatch = cleanText.match(/(?:send sms to|text) (.+?) (.+)/i);
      if (smsMatch) {
        const contactName = smsMatch[1].trim();
        const messageBody = smsMatch[2].trim();

        try {
          const { success: contactSuccess, phone } =
            await ContactManager.findContact(contactName);

          if (contactSuccess && phone) {
            await SmsManager.send(phone, messageBody);
            return {
              success: true,
              message: `SMS sent to ${contactName}!`,
              shouldDismiss: true,
              type: "sms",
            };
          } else {
            return {
              success: false,
              message: "Contact not found.",
              shouldDismiss: false,
              type: "sms",
            };
          }
        } catch (error: any) {
          console.error("SMS Error:", error);
          return {
            success: false,
            message: error.message || "Failed to send SMS.",
            shouldDismiss: false,
            type: "sms",
          };
        }
      }
    }

    // 8. Open/Launch/Call/Phone
    const match = cleanText.match(/^(open|launch|call|phone)\s+(.+)/i);
    if (match) {
      const command = match[1].toLowerCase();
      const targetName = match[2].trim();
      console.log(`🚀 Command: ${command}, Target: ${targetName}`);

      if (command === "call" || command === "phone") {
        // Check number again just in case regex below didn't catch it earlier
        // (though likely handled by block 1 if pure digits)
        const targetDigits = targetName.replace(/[^0-9]/g, "");
        if (
          targetDigits.length === 10 &&
          /^[\d\s\-\(\)\+]+$/.test(targetName)
        ) {
          RNImmediatePhoneCall.immediatePhoneCall(targetDigits);
          return {
            success: true,
            message: `Calling ${targetDigits}...`,
            shouldDismiss: true,
            type: "call",
          };
        }

        const { success, message } =
          await ContactManager.findAndCall(targetName);
        return {
          success,
          message,
          shouldDismiss: success,
          type: "call",
        };
      } else {
        // App Launch
        const launched = await AppLauncher.findAndOpen(targetName);
        if (launched) {
          return {
            success: true,
            message: `Opening ${targetName}...`,
            shouldDismiss: true,
            type: "app",
          };
        } else {
          return {
            success: false,
            message: `App "${targetName}" not found locally.`,
            shouldDismiss: false,
            type: "app",
          };
        }
      }
    }

    // 9. Sleep Tracking
    if (
      cleanText.toLowerCase().includes("sleeping") ||
      cleanText.toLowerCase().includes("going to sleep")
    ) {
      console.log("🌙 Sleep command detected");
      const { success, message } = await SleepManager.startSleep();
      return {
        success,
        message,
        shouldDismiss: success,
        type: "sleep",
      };
    }

    if (
      cleanText.toLowerCase().includes("woke up") ||
      cleanText.toLowerCase().includes("awake")
    ) {
      console.log("☀️ Wake up command detected");
      const { success, message } = await SleepManager.wakeUp();
      return {
        success,
        message,
        shouldDismiss: success,
        type: "sleep",
      };
    }

    // 10. AI Fallback - Defer to Caller for Streaming
    console.log("🤖 Regex failed, defaulting to AI...");
    return {
      success: false,
      message: "",
      shouldDismiss: false,
      type: "ai",
    };
  },

  // Kept for reference or non-streaming usage
  askServerWithTools: async (text: string): Promise<IntentResult> => {
    const backendUrl =
      Platform.OS === "android"
        ? "http://10.7.19.2:8000"
        : "http://localhost:8000";

    return new Promise(async (resolve, reject) => {
      try {
        const user = auth.currentUser;
        let token = "";
        if (user) {
          token = await user.getIdToken();
        }

        // @ts-ignore
        const es = new EventSource(`${backendUrl}/query/query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: text,
            timestamp: new Date().toString(),
          }),
        });

        // @ts-ignore
        es.addEventListener("message", (event: any) => {
          if (!event.data) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === "CLIENT_ACTION") {
              console.log(
                "📱 Received CLIENT_ACTION via IntentHandler:",
                data.action,
              );
              es.close();
              // Execute and resolve
              IntentHandler.handleClientAction(data.action, data.data).then(
                resolve,
              );
            } else if (data.type === "response") {
              console.log("🤖 Received Final Response via IntentHandler");
              es.close();
              resolve({
                success: true,
                message: data.response,
                shouldDismiss: false,
                type: "ai",
              });
            }
            // Ignore status/tool events for this "hidden" handler usage,
            // or log them if needed.
          } catch (e) {
            console.error("Error parsing SSE in IntentHandler", e);
          }
        });

        // @ts-ignore
        es.addEventListener("error", (event: any) => {
          console.error("SSE Error in IntentHandler:", event);
          es.close();
          if (event.type === "error" || event.message) {
            resolve({
              success: false,
              message: "Connection failed.",
              shouldDismiss: false,
              type: "ai",
            });
          }
        });
      } catch (error) {
        console.error("Server request failed:", error);
        resolve({
          success: false,
          message: "Unable to reach server.",
          shouldDismiss: false,
          type: "ai",
        });
      }
    });
  },

  // Handle CLIENT_ACTION from server
  handleClientAction: async (
    action: string,
    data: Record<string, any>,
  ): Promise<IntentResult> => {
    console.log(`🎯 Executing client action: ${action}`, data);

    switch (action) {
      case "call_contact": {
        const { name } = data;
        const { success, message } = await ContactManager.findAndCall(name);
        return { success, message, shouldDismiss: success, type: "call" };
      }

      case "open_app": {
        const { app_name } = data;
        const launched = await AppLauncher.findAndOpen(app_name);
        return {
          success: launched,
          message: launched
            ? `Opening ${app_name}...`
            : `App "${app_name}" not found.`,
          shouldDismiss: launched,
          type: "app",
        };
      }

      case "set_alarm": {
        const { time, label } = data;
        const alarmText = label
          ? `set alarm for ${time} ${label}`
          : `set alarm for ${time}`;
        const { success, message } = await AlarmManager.parseAndSet(alarmText);
        return { success, message, shouldDismiss: success, type: "alarm" };
      }

      case "set_timer": {
        const { duration } = data;
        const { success, message } = await AlarmManager.parseAndSetTimer(
          `set timer for ${duration}`,
        );
        return { success, message, shouldDismiss: success, type: "timer" };
      }

      case "play_media": {
        const { action: mediaAction, song_name } = data;
        let result;
        if (mediaAction === "play" && song_name) {
          result = await MediaManager.playSong(song_name);
        } else {
          const controlAction =
            mediaAction === "previous"
              ? "previous"
              : mediaAction === "next"
                ? "next"
                : "play_pause";
          result = await MediaManager.control(controlAction);
        }
        return {
          success: result.success,
          message: result.message,
          shouldDismiss: true,
          type: "media",
        };
      }

      case "send_whatsapp": {
        const { contact_name, message } = data;
        const { success: contactSuccess, phone } =
          await ContactManager.findContact(contact_name);
        if (contactSuccess && phone) {
          WhatsAppManager.send(phone, message);
          return {
            success: true,
            message: `Sending WhatsApp to ${contact_name}...`,
            shouldDismiss: true,
            type: "whatsapp",
          };
        }
        return {
          success: false,
          message: `Contact "${contact_name}" not found.`,
          shouldDismiss: false,
          type: "whatsapp",
        };
      }

      case "send_sms": {
        const { contact_name, message } = data;
        try {
          const { success: contactSuccess, phone } =
            await ContactManager.findContact(contact_name);
          if (contactSuccess && phone) {
            await SmsManager.send(phone, message);
            return {
              success: true,
              message: `SMS sent to ${contact_name}!`,
              shouldDismiss: true,
              type: "sms",
            };
          }
          return {
            success: false,
            message: `Contact "${contact_name}" not found.`,
            shouldDismiss: false,
            type: "sms",
          };
        } catch (error: any) {
          return {
            success: false,
            message: error.message || "Failed to send SMS.",
            shouldDismiss: false,
            type: "sms",
          };
        }
      }

      case "sleep_tracking": {
        const { action: sleepAction } = data;
        if (sleepAction === "start") {
          const { success, message } = await SleepManager.startSleep();
          return { success, message, shouldDismiss: success, type: "sleep" };
        } else {
          const { success, message } = await SleepManager.wakeUp();
          return { success, message, shouldDismiss: success, type: "sleep" };
        }
      }

      case "schedule_critical_memory": {
        const { title, timestamp } = data;

        console.log(`⏰ Scheduling Critical Alarm: "${title}" at ${timestamp}`);

        // Use your existing logic to schedule the native alarm
        AlarmManager.scheduleCriticalAlarm(title, Number(timestamp));

        return {
          success: true,
          message: `Critical reminder set: ${title}`,
          shouldDismiss: true, // Close the assistant so the alarm can ring later
          type: "alarm",
        };
      }

      default:
        console.warn(`Unknown client action: ${action}`);
        return {
          success: false,
          message: `Unknown action: ${action}`,
          shouldDismiss: false,
          type: "ai",
        };
    }
  },

  handleMediaAction: async (text: string) => {
    const lower = text.toLowerCase();
    // 1. Play [Song]
    if (lower.startsWith("play")) {
      const songName = text.substring(4).trim();
      if (songName) {
        return MediaManager.playSong(songName);
      }
      // If just "play" -> resume
      return MediaManager.control("play_pause");
    }

    // 2. Controls
    if (lower.includes("pause") || lower.includes("stop music"))
      return MediaManager.control("pause");
    if (lower.includes("next") || lower.includes("skip"))
      return MediaManager.control("next");
    if (lower.includes("prev") || lower.includes("back"))
      return MediaManager.control("previous");

    return { success: false, message: "Unknown media command." };
  },
};
