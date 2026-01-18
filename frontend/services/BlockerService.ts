import { NativeModules } from "react-native";

const { PMOSBlocker } = NativeModules;

export const lockSession = () => {
  // Only works on Android
  if (PMOSBlocker && PMOSBlocker.lockApp) {
    console.log("🔒 Locking App to Screen (Screen Pinning)...");
    PMOSBlocker.lockApp();
  } else {
    console.log("⚠️ PMOSBlocker native module not found or not supported.");
  }
};

export const unlockSession = () => {
  if (PMOSBlocker && PMOSBlocker.unlockApp) {
    console.log("🔓 Unlocking App...");
    PMOSBlocker.unlockApp();
  }
};
