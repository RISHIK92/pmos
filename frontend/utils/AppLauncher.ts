import { Platform } from "react-native";
import { InstalledApps, RNLauncherKitHelper } from "react-native-launcher-kit";

interface AppInfo {
  label: string;
  packageName: string;
  icon?: string;
}

class AppLauncher {
  private static instance: AppLauncher;
  private apps: AppInfo[] = [];

  private constructor() {}

  public static getInstance(): AppLauncher {
    if (!AppLauncher.instance) {
      AppLauncher.instance = new AppLauncher();
    }
    return AppLauncher.instance;
  }

  /**
   * Loads the list of installed apps into memory.
   * Call this on app startup.
   */
  public async preloadApps() {
    if (Platform.OS !== "android") return;

    try {
      const apps = await InstalledApps.getApps();
      console.log(apps);
      // Filter out system apps without launch intent if necessary,
      // but getApps() usually returns launchable apps.
      this.apps = apps;
      console.log(`[AppLauncher] Preloaded ${apps.length} apps.`);
    } catch (e) {
      console.error("[AppLauncher] Failed to preload apps", e);
    }
  }

  /**
   * Attempts to find and open an app matching the query.
   * @param query The name of the app to find (e.g., "instagram", "calc")
   * @returns true if an app was found and launch was attempted, false otherwise.
   */
  public async findAndOpen(query: string): Promise<boolean> {
    if (Platform.OS !== "android") return false;

    if (this.apps.length === 0) {
      await this.preloadApps();
    }

    const cleanQuery = query
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:]/g, "")
      .trim();
    if (!cleanQuery) return false;

    // 1. Exact match (case-insensitive)
    let match = this.apps.find((app) => app.label.toLowerCase() === cleanQuery);

    // 2. Starts with match
    if (!match) {
      match = this.apps.find((app) =>
        app.label.toLowerCase().startsWith(cleanQuery)
      );
    }

    // 3. Contains match (be careful with short strings)
    if (!match && cleanQuery.length > 2) {
      match = this.apps.find((app) =>
        app.label.toLowerCase().includes(cleanQuery)
      );
    }

    if (match) {
      console.log(
        `[AppLauncher] Found match: ${match.label} (${match.packageName})`
      );
      try {
        await RNLauncherKitHelper.launchApplication(match.packageName);
        return true;
      } catch (e) {
        console.error("[AppLauncher] Failed to launch app", e);
        return false;
      }
    }

    console.log(`[AppLauncher] No match found for: ${query}`);
    return false;
  }
}

export default AppLauncher.getInstance();
