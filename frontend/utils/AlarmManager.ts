import { NativeModules, Platform } from "react-native";

const { AlarmModule } = NativeModules;

export interface AlarmLaunchDetails {
  isCriticalAlarm: boolean;
  title: string;
}

export const AlarmManager = {
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
