import { NativeModules, Platform } from "react-native";
// Removed IntentLauncher import

const { AlarmModule } = NativeModules;

export interface AlarmLaunchDetails {
  isCriticalAlarm: boolean;
  title: string;
}

export const AlarmManager = {
  async parseAndSet(
    text: string,
  ): Promise<{ success: boolean; time?: string; message: string }> {
    if (Platform.OS !== "android") {
      return {
        success: false,
        message: "Alarm setting is only supported on Android.",
      };
    }

    const lowerText = text.toLowerCase();

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
  },

  /**
   * Fires the native Android Intent to set an alarm.
   * Uses SKIP_UI extra to attempt background setting, but behavior varies by OS/OEM.
   */
  /**
   * Fires the native Android Intent to set an alarm.
   */
  async setAlarm(hour: number, minute: number) {
    if (Platform.OS !== "android") return;
    // Call native module directly
    AlarmModule.setAlarm(hour, minute);
  },
  /**
   * Parses text command to extract duration and set a timer.
   * Supported patterns:
   * "set timer for 10 minutes"
   * "set timer for 1 hour 30 minutes"
   */
  async parseAndSetTimer(
    text: string,
  ): Promise<{ success: boolean; message: string }> {
    if (Platform.OS !== "android") {
      return {
        success: false,
        message: "Timer setting is only supported on Android.",
      };
    }

    const lowerText = text.toLowerCase();

    // Regex for: "set timer for [X] hours [Y] minutes"
    // Supports: hours, hrs, hr, h
    // Supports: minutes, mins, min, mn, m
    const timerRegex =
      /set\s+timer\s+for\s+(?:(\d+)\s*(?:hours?|hrs?|hr|h))?\s*(?:(\d+)\s*(?:minutes?|mins?|min|mn|m))?/i;
    const match = lowerText.match(timerRegex);

    if (!match) {
      return { success: false, message: "Could not understand the duration." };
    }

    const hoursStr = match[1];
    const minutesStr = match[2];

    if (!hoursStr && !minutesStr) {
      return { success: false, message: "Please specify a duration." };
    }

    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

    const totalSeconds = hours * 3600 + minutes * 60;

    if (totalSeconds <= 0) {
      return { success: false, message: "Duration must be greater than zero." };
    }

    let timeMessage = "";
    if (hours > 0) timeMessage += `${hours} hour${hours > 1 ? "s" : ""} `;
    if (minutes > 0)
      timeMessage += `${minutes} minute${minutes > 1 ? "s" : ""}`;

    try {
      await this.setTimer(totalSeconds);
      return {
        success: true,
        message: `Setting timer for ${timeMessage.trim()}...`,
      };
    } catch (e) {
      console.error("[AlarmManager] Error setting timer", e);
      return { success: false, message: "Failed to open clock app." };
    }
  },

  /**
   * Fires the native Android Intent to set a timer.
   */
  /**
   * Fires the native Android Intent to set a timer.
   */
  async setTimer(seconds: number) {
    if (Platform.OS !== "android") return;
    // Call native module directly
    AlarmModule.setTimer(seconds);
  },
  scheduleCriticalAlarm: (title: string, timestamp: number) => {
    if (Platform.OS === "android") {
      AlarmModule.scheduleCriticalAlarm(title, timestamp);
    }
  },

  getLaunchDetails: async (): Promise<AlarmLaunchDetails | null> => {
    if (Platform.OS === "android") {
      return await AlarmModule.getLaunchDetails();
    }
    return null;
  },

  stopAlarm: () => {
    if (Platform.OS === "android") {
      AlarmModule.stopAlarm();
    }
  },
};
