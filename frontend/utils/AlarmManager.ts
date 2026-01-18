import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

class AlarmManager {
  /**
   * Parses text command to extract time and set an alarm.
   * Supported patterns:
   * "set alarm for 7:30 am"
   * "set alarm for 19:30"
   * "set alarm for 8 pm"
   */
  async parseAndSet(
    text: string
  ): Promise<{ success: boolean; time?: string; message: string }> {
    if (Platform.OS !== "android") {
      return {
        success: false,
        message: "Alarm setting is only supported on Android.",
      };
    }

    const lowerText = text.toLowerCase();

    // Regex for: "set alarm for [hour]:[minute] [am/pm]"
    // Matches:
    // "7:30 am", "7:30", "7 am"
    // Groups:
    // 1: Hour (1-2 digits)
    // 2: Minute (2 digits, optional)
    // 3: AM/PM (optional)
    const timeRegex = /set\s+alarm\s+for\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
    const match = lowerText.match(timeRegex);

    if (!match) {
      return { success: false, message: "Could not understand the time." };
    }

    let hour = parseInt(match[1], 10);
    const minuteStr = match[2];
    const minute = minuteStr ? parseInt(minuteStr, 10) : 0;
    const period = match[3]; // am or pm

    // Validate time
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { success: false, message: "Invalid time format." };
    }

    // Convert to 24-hour format if AM/PM is present
    if (period) {
      if (period === "pm" && hour < 12) {
        hour += 12;
      } else if (period === "am" && hour === 12) {
        hour = 0;
      }
    }

    // Construct nice time string for feedback
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    try {
      await this.setAlarm(hour, minute);
      return {
        success: true,
        time: timeString,
        message: `Setting alarm for ${timeString}...`,
      };
    } catch (e) {
      console.error("[AlarmManager] Error setting alarm", e);
      return { success: false, message: "Failed to open clock app." };
    }
  }

  /**
   * Fires the native Android Intent to set an alarm.
   * Uses SKIP_UI extra to attempt background setting, but behavior varies by OS/OEM.
   */
  async setAlarm(hour: number, minute: number) {
    if (Platform.OS !== "android") return;

    // android.intent.action.SET_ALARM
    await IntentLauncher.startActivityAsync("android.intent.action.SET_ALARM", {
      extra: {
        "android.intent.extra.alarm.HOUR": hour,
        "android.intent.extra.alarm.MINUTES": minute,
        "android.intent.extra.alarm.SKIP_UI": true,
        "android.intent.extra.alarm.MESSAGE": "Set by PMOS",
      },
    });
  }
}

export default new AlarmManager();
