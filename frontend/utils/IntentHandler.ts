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
    if (cleanText.toLowerCase().includes("alarm")) {
      console.log("⏰ Alarm command detected");
      const { success, message } = await AlarmManager.parseAndSet(cleanText);
      return {
        success,
        message,
        shouldDismiss: success,
        type: "alarm",
      };
    }

    // 3. Timer Check
    if (cleanText.toLowerCase().includes("timer")) {
      console.log("⏳ Timer command detected");
      const { success, message } =
        await AlarmManager.parseAndSetTimer(cleanText);
      return {
        success,
        message,
        shouldDismiss: success,
        type: "timer",
      };
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

    // 10. AI Fallback (Not handled here, return distinct result)
    return {
      success: false,
      message: "",
      shouldDismiss: false,
      type: "ai",
    };
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
