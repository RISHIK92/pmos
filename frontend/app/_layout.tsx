import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";

export const unstable_settings = {
  // Ensure the app starts at the overlay
  initialRouteName: "index",
};

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            presentation: "transparentModal",
          }}
        />

        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar backgroundColor="transparent" />
    </View>
  );
}
