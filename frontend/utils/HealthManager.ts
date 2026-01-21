import { NativeModules, PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../lib/firebase";

const { HealthModule } = NativeModules;

// Keys for AsyncStorage
const STEPS_OFFSET_KEY = "PMOS_STEPS_OFFSET";
const LAST_DATE_KEY = "PMOS_LAST_STEP_DATE";
const HOURLY_LOG_KEY = "PMOS_HOURLY_LOG";
const BACKEND_URL = "http://10.141.28.129:8000";

export const HealthManager = {
  /**
   * Initialize step tracking.
   * Requests permission and starts the sensor.
   */
  init: async (): Promise<boolean> => {
    if (Platform.OS !== "android") return false;

    try {
      // 1. Request Permission (Android 10+)
      if (Platform.Version >= 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("❌ Activity Recognition Permission Denied");
          return false;
        }
      }

      // 2. Start Tracking
      const started = await HealthModule.startStepTracking();
      return started;
    } catch (error) {
      console.error("Error initializing HealthManager:", error);
      return false;
    }
  },

  /**
   * Get the current daily steps.
   * Handles converting "steps since reboot" to "steps today".
   */
  getDailySteps: async (): Promise<number> => {
    if (Platform.OS !== "android") return 0;

    try {
      // 1. Get raw steps from sensor (Total since reboot)
      const rawSteps = await HealthModule.getStepCount();

      // 2. Get stored offset and date
      const storedOffset = await AsyncStorage.getItem(STEPS_OFFSET_KEY);
      const storedDate = await AsyncStorage.getItem(LAST_DATE_KEY);

      const offset = storedOffset ? parseInt(storedOffset, 10) : 0;
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // 3. Check for Date Change (New Day)
      if (storedDate !== today) {
        // New day! Set offset to current raw steps (start counting from 0 for today)
        await AsyncStorage.setItem(STEPS_OFFSET_KEY, rawSteps.toString());
        await AsyncStorage.setItem(LAST_DATE_KEY, today);
        return 0;
      }

      // 4. Check for Reboot (Raw steps < Offset)
      // If the sensor value is LESS than our offset, the device must have rebooted.
      // We reset offset to 0 so we count ALL steps since reboot as today's steps.
      // (Simplified logic: we might lose steps *before* the reboot today, but correct for *after*)
      if (rawSteps < offset) {
        // Reboot detected during the day
        await AsyncStorage.setItem(STEPS_OFFSET_KEY, "0");
        // Steps today = total steps since reboot
        return rawSteps;
      }

      // 5. Calculate Steps
      return rawSteps - offset;
    } catch (error) {
      console.error("Error getting steps:", error);
      return 0;
    }
  },

  /**
   * Called periodically.
   * Updates hourly log and syncs to backend.
   */
  trackHourlySteps: async () => {
    try {
      const stepsToday = await HealthManager.getDailySteps();
      const currentHour = new Date().getHours();
      const hourKey = `${currentHour < 10 ? "0" : ""}${currentHour}:00`;

      // Get existing hourly log
      const storedLog = await AsyncStorage.getItem(HOURLY_LOG_KEY);
      let hourlyData: Record<string, number> = storedLog
        ? JSON.parse(storedLog)
        : {};

      // Store cumulative steps for this hour
      hourlyData[hourKey] = stepsToday;

      await AsyncStorage.setItem(HOURLY_LOG_KEY, JSON.stringify(hourlyData));
      console.log(
        `[HealthManager] Updated hourly log for ${hourKey}: ${stepsToday}`,
      );

      // Attempt Sync
      await HealthManager.syncToBackend(stepsToday, hourlyData);
    } catch (e) {
      console.error("[HealthManager] Error tracking hourly steps", e);
    }
  },

  syncToBackend: async (steps: number, hourlyData: Record<string, number>) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Refresh token to be safe, or just getIdToken(false)
      const token = await user.getIdToken();
      const date = new Date().toISOString().split("T")[0];

      const response = await fetch(`${BACKEND_URL}/health/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          steps,
          hourlyData,
        }),
      });

      const res = await response.json();
      if (res.success) {
        console.log("[HealthManager] Synced steps to backend");
      }
    } catch (e) {
      console.error("[HealthManager] Sync failed", e);
    }
  },

  updateHydration: async (amount: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const date = new Date().toISOString().split("T")[0];

      await fetch(`${BACKEND_URL}/health/hydration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          amount,
        }),
      });
      console.log(`[HealthManager] Updated hydration: ${amount}ml`);
    } catch (e) {
      console.error("[HealthManager] Hydration update failed", e);
    }
  },

  getHistory: async (startDate: string, endDate: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      const token = await user.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/health/history?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const res = await response.json();
      return res.success ? res.data : [];
    } catch (e) {
      console.error("[HealthManager] Failed to fetch history", e);
      return [];
    }
  },

  getHourlyLog: async () => {
    try {
      const storedLog = await AsyncStorage.getItem(HOURLY_LOG_KEY);
      return storedLog ? JSON.parse(storedLog) : {};
    } catch (e) {
      return {};
    }
  },

  getDashboardData: async (date: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      const token = await user.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/health/dashboard?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const res = await response.json();
      return res.success ? res.data : [];
    } catch (e) {
      console.error("[HealthManager] Failed to fetch dashboard", e);
      return [];
    }
  },

  getGoalsDetails: async (goalIds: string[], includeLogs: boolean = true) => {
    try {
      const user = auth.currentUser;
      if (!user) return [];
      const token = await user.getIdToken();

      const response = await fetch(`${BACKEND_URL}/health/goals/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalIds,
          includeLogs,
        }),
      });

      const res = await response.json();
      return res.success ? res.data : [];
    } catch (e) {
      console.error("[HealthManager] Failed to fetch goal details", e);
      return [];
    }
  },

  stop: () => {
    if (Platform.OS === "android") {
      HealthModule.stopStepTracking();
    }
  },
};
