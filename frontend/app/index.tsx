import React from "react";
import { View } from "react-native";
import AssistantOverlay from "@/components/AssistantOverlay";

export default function Index() {
  return (
    // This outer View ensures the transparency from the Native layer is preserved
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <AssistantOverlay />
    </View>
  );
}
