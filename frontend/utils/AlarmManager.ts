import { NativeModules, Platform } from "react-native";

const { AlarmModule } = NativeModules;

export interface AlarmLaunchDetails {
  isCriticalAlarm: boolean;
  title: string;
}

const DAYS = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7,
};

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
      const fallbackMatch = lowerText.match(
        /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
      );
      if (!fallbackMatch) {
        return { success: false, message: "Could not understand the time." };
      }
      return this._processAlarmLogic(fallbackMatch, lowerText);
    }

    return this._processAlarmLogic(match, lowerText);
  },

  async _processAlarmLogic(match: RegExpMatchArray, originalText: string) {
    let hour = parseInt(match[1], 10);
    const minuteStr = match[2];
    const minute = minuteStr ? parseInt(minuteStr, 10) : 0;
    const period = match[3]; // am or pm

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return { success: false, message: "Invalid time format." };
    }

    if (period) {
      if (period === "pm" && hour < 12) {
        hour += 12;
      } else if (period === "am" && hour === 12) {
        hour = 0;
      }
    }

    const days = this.parseDays(originalText);

    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    let repeatMsg = "";
    if (days.length === 7) repeatMsg = " (Daily)";
    else if (days.length === 5 && !days.includes(1) && !days.includes(7))
      repeatMsg = " (Weekdays)";
    else if (days.length > 0) repeatMsg = " (Repeating)";

    try {
      // 3. Call Native Module
      await this.setAlarm(hour, minute, days);

      return {
        success: true,
        time: timeString,
        message: `Setting alarm for ${timeString}${repeatMsg}...`,
      };
    } catch (e) {
      console.error("[AlarmManager] Error setting alarm", e);
      return { success: false, message: "Failed to open clock app." };
    }
  },

  parseDays(text: string): number[] {
    if (
      text.includes("daily") ||
      text.includes("every day") ||
      text.includes("everyday")
    ) {
      return [1, 2, 3, 4, 5, 6, 7]; // All days
    }

    // B. Weekdays (Mon-Fri)
    if (text.includes("weekdays") || text.includes("every weekday")) {
      return [2, 3, 4, 5, 6];
    }

    // C. Weekends (Sat-Sun)
    if (text.includes("weekends") || text.includes("every weekend")) {
      return [1, 7];
    }

    // D. Specific Days (e.g., "Every Monday and Wednesday")
    const days: number[] = [];
    // Only check specific days if "every" or "on" is present to avoid false positives
    if (text.includes("every") || text.includes("on")) {
      if (text.includes("sun")) days.push(DAYS.SUNDAY);
      if (text.includes("mon")) days.push(DAYS.MONDAY);
      if (text.includes("tue")) days.push(DAYS.TUESDAY);
      if (text.includes("wed")) days.push(DAYS.WEDNESDAY);
      if (text.includes("thu")) days.push(DAYS.THURSDAY);
      if (text.includes("fri")) days.push(DAYS.FRIDAY);
      if (text.includes("sat")) days.push(DAYS.SATURDAY);
    }

    // Remove duplicates and sort
    return [...new Set(days)].sort((a, b) => a - b);
  },

  async setAlarm(hour: number, minute: number, days: number[] = []) {
    if (Platform.OS !== "android") return;
    AlarmModule.setAlarm(hour, minute, days);
  },

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

  async setTimer(seconds: number) {
    if (Platform.OS !== "android") return;
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
