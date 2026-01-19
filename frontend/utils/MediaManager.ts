import { NativeModules, Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";

const { MediaControl } = NativeModules;

class MediaManager {
  /**
   * Plays specific music by query using Android Intent.
   * "Play Blinding Lights" -> Opens Spotify/YouTube searching/playing it.
   */
  async playSong(query: string, appPreference?: string) {
    if (Platform.OS !== "android") {
      return { success: false, message: "Media control is Android only." };
    }

    try {
      // android.media.action.MEDIA_PLAY_FROM_SEARCH
      await IntentLauncher.startActivityAsync(
        "android.media.action.MEDIA_PLAY_FROM_SEARCH",
        {
          extra: {
            // android.app.SearchManager.QUERY
            query: query,
            "android.intent.extra.user_query_complex": query,
            "android.intent.extra.focus": "vnd.android.cursor.item/audio",
          },
        }
      );
      return {
        success: true,
        message: `Playing "${query}"...`,
      };
    } catch (e) {
      console.error("[MediaManager] Failed to start music app", e);
      // Fallback: Try without package name if specific failure?
      // Or just fail gracefully.
      return {
        success: false,
        message: "Failed to open music app. Is it installed?",
      };
    }
  }

  /**
   * Controls playing media (Pause, Next, Previous).
   * Uses Native Module to inject Media Keys.
   */
  async control(action: "pause" | "next" | "previous" | "play_pause") {
    if (Platform.OS !== "android") {
      return { success: false, message: "Media control is Android only." };
    }

    try {
      let eventType = "PLAY_PAUSE"; // Default
      if (action === "pause") eventType = "PAUSE";
      if (action === "next") eventType = "NEXT";
      if (action === "previous") eventType = "PREVIOUS";

      MediaControl.sendMediaEvent(eventType);
      return { success: true, message: `Sending ${action} command...` };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Failed to send media command." };
    }
  }
}

export default new MediaManager();
