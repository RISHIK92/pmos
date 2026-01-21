import * as Brightness from "expo-brightness";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

class SystemManager {
  async handleAction(
    text: string,
  ): Promise<{ success: boolean; message: string }> {
    const cleanText = text.toLowerCase();

    // Matches: "set brightness to 50", "brightness 100%"
    if (cleanText.includes("brightness")) {
      const match = cleanText.match(/(\d+)/);
      if (match) {
        const level = parseInt(match[1], 10);
        return this.setBrightness(level);
      }
    }

    // Settings Navigation
    // Matches: "open wifi", "open bluetooth settings"
    if (cleanText.includes("open") || cleanText.includes("goto")) {
      if (cleanText.includes("wifi")) return this.openSettings("wifi");
      if (cleanText.includes("bluetooth"))
        return this.openSettings("bluetooth");
      if (cleanText.includes("battery")) return this.openSettings("battery");
      if (cleanText.includes("airplane")) return this.openSettings("airplane");
    }

    return { success: false, message: "Unknown system command." };
  }

  async setBrightness(level: number) {
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== "granted") {
        return { success: false, message: "Brightness permission denied." };
      }

      // Normalize 0-100 to 0.0-1.0
      const normalized = Math.max(0, Math.min(1, level / 100));
      await Brightness.setSystemBrightnessAsync(normalized);

      return { success: true, message: `Brightness set to ${level}%` };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Failed to set brightness." };
    }
  }

  async openSettings(setting: string) {
    if (Platform.OS !== "android")
      return { success: false, message: "Android only." };

    try {
      switch (setting) {
        case "wifi":
          await IntentLauncher.startActivityAsync(
            "android.settings.WIFI_SETTINGS",
          );
          break;
        case "bluetooth":
          await IntentLauncher.startActivityAsync(
            "android.settings.BLUETOOTH_SETTINGS",
          );
          break;
        case "battery":
          await IntentLauncher.startActivityAsync(
            "android.intent.action.POWER_USAGE_SUMMARY",
          );
          break;
        case "airplane":
          await IntentLauncher.startActivityAsync(
            "android.settings.AIRPLANE_MODE_SETTINGS",
          );
          break;
        default:
          return { success: false, message: "Setting not found." };
      }
      return { success: true, message: `Opening ${setting} settings...` };
    } catch (e) {
      return { success: false, message: "Failed to open settings." };
    }
  }
}

export default new SystemManager();
