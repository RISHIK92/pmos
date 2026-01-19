import { NativeModules, Platform, Linking } from "react-native";

const { WhatsAppModule } = NativeModules;

class WhatsAppManager {
  /**
   * Auto-sends a message on WhatsApp.
   * requires 'AutomationService' to be enabled in Accessibility Settings.
   */
  send(phone: string, text: string) {
    if (Platform.OS !== "android") {
      // Fallback for iOS or non-native
      const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(
        text
      )}`;
      Linking.openURL(url);
      return { success: true, message: "Opening WhatsApp..." };
    }

    try {
      WhatsAppModule.sendWhatsApp(phone, text);
      return { success: true, message: `Sending to ${phone}...` };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Failed to Open WhatsApp." };
    }
  }
}

export default new WhatsAppManager();
