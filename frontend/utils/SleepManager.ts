import { auth } from "@/lib/firebase";

// Hardcoded for now, should be env
const BACKEND_URL = "http://10.138.197.129:8000";

export const SleepManager = {
  async startSleep(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        return { success: false, message: "Authentication failed." };
      }

      console.log("[SleepManager] Starting sleep tracking...");
      const response = await fetch(`${BACKEND_URL}/health/sleep/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await response.json();
      if (res.success) {
        return { success: true, message: "Goodnight! Sleep tracking started." };
      }
      return {
        success: false,
        message: res.message || "Failed to start sleep.",
      };
    } catch (e) {
      console.error("[SleepManager] Error starting sleep", e);
      return { success: false, message: "Network error starting sleep." };
    }
  },

  async wakeUp(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        return { success: false, message: "Authentication failed." };
      }

      console.log("[SleepManager] Ending sleep tracking...");
      const response = await fetch(`${BACKEND_URL}/health/sleep/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await response.json();
      if (res.success) {
        return { success: true, message: res.message || "Welcome back!" };
      }
      return {
        success: false,
        message: res.message || "Failed to log wake up.",
      };
    } catch (e) {
      console.error("[SleepManager] Error ending sleep", e);
      return { success: false, message: "Network error waking up." };
    }
  },

  async getDailySleep(date: string): Promise<any[]> {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return [];

      const response = await fetch(
        `${BACKEND_URL}/health/sleep/daily?date=${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      console.error("[SleepManager] Error fetching sleep history", e);
      return [];
    }
  },
};
